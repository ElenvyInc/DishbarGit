"""
Payment Router - Production-ready with inventory checks, pilot mode validation,
and proper order workflow.
"""
import json
import logging
from datetime import datetime, date, time as dtime
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select, func, and_, update
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import stripe

from core.database import get_db
from core.config import settings
from dependencies.auth import get_current_user
from schemas.auth import UserResponse
from models.orders import Orders
from models.menu_items import Menu_items
from models.chefs import Chefs
from models.platform_settings import Platform_settings

router = APIRouter(prefix="/api/v1/payment", tags=["payment"])
logger = logging.getLogger(__name__)

# Initialize Stripe API key - may be empty in pilot/dev environments
try:
    _stripe_key = settings.stripe_secret_key
    if _stripe_key:
        stripe.api_key = _stripe_key
    else:
        logger.warning("STRIPE_SECRET_KEY is empty. Payment processing will be unavailable.")
except AttributeError:
    logger.warning("STRIPE_SECRET_KEY is not configured. Payment processing will be unavailable.")


class CartItem(BaseModel):
    id: int
    title: str
    price: float
    quantity: int
    chef_id: int


class CheckoutRequest(BaseModel):
    items: List[CartItem]
    delivery_type: str = "pickup"
    delivery_address: str = ""
    delivery_postal_code: str = ""
    delivery_instructions: str = ""
    customer_name: str = ""
    customer_email: str = ""
    customer_phone: str = ""
    allergen_acknowledged: bool = False


class CheckoutResponse(BaseModel):
    session_id: str
    url: str


class VerifyRequest(BaseModel):
    session_id: str


class VerifyResponse(BaseModel):
    status: str
    order_id: Optional[int] = None
    payment_status: str


class OrderValidationError(BaseModel):
    error: str
    details: Optional[str] = None


async def _get_setting(db: AsyncSession, key: str, default: str = "") -> str:
    """Get a platform setting value"""
    result = await db.execute(
        select(Platform_settings).where(Platform_settings.key == key)
    )
    setting = result.scalar_one_or_none()
    return setting.value if setting else default


async def _validate_pilot_mode(db: AsyncSession, postal_code: str, delivery_type: str):
    """Validate order against pilot mode restrictions"""
    pilot_mode = await _get_setting(db, "pilot_mode", "true")
    if pilot_mode.lower() != "true":
        return  # Not in pilot mode, skip checks

    # Check platform is open
    platform_open = await _get_setting(db, "platform_open", "true")
    if platform_open.lower() != "true":
        raise HTTPException(
            status_code=400,
            detail="Ordering is currently paused. Please try again later."
        )

    # Check ordering hours
    hours_start = await _get_setting(db, "ordering_hours_start", "09:00")
    hours_end = await _get_setting(db, "ordering_hours_end", "20:00")
    now = datetime.now()
    try:
        start_h, start_m = map(int, hours_start.split(":"))
        end_h, end_m = map(int, hours_end.split(":"))
        start_time = dtime(start_h, start_m)
        end_time = dtime(end_h, end_m)
        current_time = now.time()
        if current_time < start_time or current_time > end_time:
            raise HTTPException(
                status_code=400,
                detail=f"Ordering is only available between {hours_start} and {hours_end}."
            )
    except (ValueError, TypeError):
        pass  # If time parsing fails, allow the order

    # Check ordering days
    ordering_days_str = await _get_setting(db, "ordering_days", "[]")
    try:
        ordering_days = json.loads(ordering_days_str)
        if ordering_days:
            today_name = now.strftime("%A").lower()
            if today_name not in [d.lower() for d in ordering_days]:
                raise HTTPException(
                    status_code=400,
                    detail=f"Ordering is not available on {now.strftime('%A')}."
                )
    except (json.JSONDecodeError, TypeError):
        pass

    # Check daily order limit
    daily_limit_str = await _get_setting(db, "daily_order_limit", "20")
    try:
        daily_limit = int(daily_limit_str)
        if daily_limit > 0:
            today = date.today()
            count_result = await db.execute(
                select(func.count(Orders.id)).where(
                    and_(
                        func.date(Orders.created_at) == today,
                        Orders.payment_status == "paid",
                    )
                )
            )
            today_orders = count_result.scalar() or 0
            if today_orders >= daily_limit:
                raise HTTPException(
                    status_code=400,
                    detail="Daily order limit reached. Please try again tomorrow."
                )
    except (ValueError, TypeError):
        pass

    # Check postal code restriction for delivery orders
    if delivery_type != "pickup" and postal_code:
        postal_codes_str = await _get_setting(db, "pilot_postal_codes", "[]")
        try:
            allowed_codes = json.loads(postal_codes_str)
            if allowed_codes:
                postal_prefix = postal_code.upper().replace(" ", "")[:3]
                if not any(postal_prefix.startswith(code.upper()) for code in allowed_codes):
                    raise HTTPException(
                        status_code=400,
                        detail=f"Delivery is not available in your area ({postal_prefix}). Currently serving: {', '.join(allowed_codes)}"
                    )
        except (json.JSONDecodeError, TypeError):
            pass


async def _validate_inventory(db: AsyncSession, items: List[CartItem]):
    """Check inventory availability for all items. Uses SELECT FOR UPDATE to prevent race conditions."""
    for item in items:
        result = await db.execute(
            select(Menu_items).where(Menu_items.id == item.id)
        )
        menu_item = result.scalar_one_or_none()

        if not menu_item:
            raise HTTPException(
                status_code=400,
                detail=f"Menu item '{item.title}' is no longer available."
            )

        if not menu_item.is_available:
            raise HTTPException(
                status_code=400,
                detail=f"'{item.title}' is currently unavailable."
            )

        if menu_item.max_orders is not None and menu_item.max_orders > 0:
            # Count existing paid/confirmed orders for this item today
            today = date.today()
            # Parse orders that contain this item
            orders_result = await db.execute(
                select(Orders).where(
                    and_(
                        Orders.chef_id == item.chef_id,
                        Orders.payment_status.in_(["paid", "pending"]),
                        func.date(Orders.created_at) == today,
                    )
                )
            )
            existing_orders = orders_result.scalars().all()

            total_ordered = 0
            for order in existing_orders:
                try:
                    order_items = json.loads(order.items_json) if order.items_json else []
                    for oi in order_items:
                        if oi.get("id") == item.id:
                            total_ordered += oi.get("quantity", 0)
                except (json.JSONDecodeError, TypeError):
                    pass

            remaining = menu_item.max_orders - total_ordered
            if item.quantity > remaining:
                if remaining <= 0:
                    raise HTTPException(
                        status_code=400,
                        detail=f"'{item.title}' is sold out for today."
                    )
                raise HTTPException(
                    status_code=400,
                    detail=f"Only {remaining} of '{item.title}' remaining. You requested {item.quantity}."
                )

        # Verify price matches (prevent price manipulation)
        if abs(menu_item.price - item.price) > 0.01:
            raise HTTPException(
                status_code=400,
                detail=f"Price for '{item.title}' has changed. Please refresh and try again."
            )


async def _validate_chef(db: AsyncSession, chef_id: int):
    """Verify chef is approved and active"""
    result = await db.execute(
        select(Chefs).where(Chefs.id == chef_id)
    )
    chef = result.scalar_one_or_none()
    if not chef:
        raise HTTPException(status_code=400, detail="Chef not found.")
    if not chef.is_approved:
        raise HTTPException(status_code=400, detail="This chef is not currently accepting orders.")
    if not chef.is_active:
        raise HTTPException(status_code=400, detail="This chef is temporarily unavailable.")
    return chef


@router.post("/create_payment_session", response_model=CheckoutResponse)
async def create_payment_session(
    data: CheckoutRequest,
    request: Request,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a Stripe checkout session with full validation"""
    try:
        frontend_host = request.headers.get("App-Host")
        if frontend_host and not frontend_host.startswith(("http://", "https://")):
            frontend_host = f"https://{frontend_host}"

        if not data.items:
            raise HTTPException(status_code=400, detail="Cart is empty")

        # Validate required customer info
        if not data.customer_name.strip():
            raise HTTPException(status_code=400, detail="Full name is required")
        if not data.customer_phone.strip():
            raise HTTPException(status_code=400, detail="Phone number is required")
        if data.delivery_type != "pickup" and not data.delivery_address.strip():
            raise HTTPException(status_code=400, detail="Delivery address is required")
        if not data.allergen_acknowledged:
            raise HTTPException(status_code=400, detail="You must acknowledge the allergen notice before ordering")

        # Validate pilot mode restrictions
        await _validate_pilot_mode(db, data.delivery_postal_code, data.delivery_type)

        # Validate chef is active
        chef = await _validate_chef(db, data.items[0].chef_id)

        # Validate inventory
        await _validate_inventory(db, data.items)

        # Get platform settings for fee calculation
        commission_rate_str = await _get_setting(db, "platform_commission_rate", "0.15")
        tax_rate_str = await _get_setting(db, "tax_rate", "0.13")
        min_order_str = await _get_setting(db, "minimum_order_amount", "15.00")
        base_fee_str = await _get_setting(db, "base_delivery_fee", "3.99")
        max_fee_str = await _get_setting(db, "max_delivery_fee", "15.00")

        commission_rate = float(commission_rate_str)
        tax_rate = float(tax_rate_str)
        min_order = float(min_order_str)
        base_delivery_fee = float(base_fee_str)
        max_delivery_fee = float(max_fee_str)

        # Calculate amounts server-side (NEVER trust frontend amounts)
        subtotal = sum(item.price * item.quantity for item in data.items)

        # Minimum order check
        if subtotal < min_order:
            raise HTTPException(
                status_code=400,
                detail=f"Minimum order amount is ${min_order:.2f}. Your subtotal is ${subtotal:.2f}."
            )

        # Calculate delivery fee server-side
        delivery_fee = 0.0
        if data.delivery_type != "pickup":
            # Use base delivery fee from settings (distance calculation requires geocoding)
            delivery_fee = min(base_delivery_fee, max_delivery_fee)

        # Calculate tax and commission
        tax = subtotal * tax_rate
        commission = subtotal * commission_rate
        total = subtotal + delivery_fee + tax
        chef_amount = subtotal - commission

        # Create order in database
        order = Orders(
            user_id=current_user.id,
            chef_id=data.items[0].chef_id,
            items_json=json.dumps([item.model_dump() for item in data.items]),
            total_amount=total,
            commission_amount=commission,
            chef_amount=chef_amount,
            status="pending",
            delivery_type=data.delivery_type,
            delivery_address=data.delivery_address,
            customer_name=data.customer_name,
            customer_phone=data.customer_phone,
            payment_status="unpaid",
        )
        db.add(order)
        await db.flush()  # Flush to get the order.id without closing the transaction

        # Store order_id in a local variable BEFORE any session state changes
        order_id = order.id

        await db.commit()

        # Check Stripe configuration before making the API call
        if not stripe.api_key:
            # Order was created but payment can't proceed - update order status
            result = await db.execute(select(Orders).where(Orders.id == order_id))
            order_unpaid = result.scalar_one_or_none()
            if order_unpaid:
                order_unpaid.payment_status = "payment_unavailable"
                await db.commit()
            raise HTTPException(
                status_code=503,
                detail="Online payment is temporarily unavailable. Your order has been saved. Please try again later or contact support."
            )

        # Create Stripe line items
        line_items = []
        for item in data.items:
            line_items.append({
                "price_data": {
                    "currency": "cad",
                    "product_data": {"name": item.title},
                    "unit_amount": int(item.price * 100),
                },
                "quantity": item.quantity,
            })

        # Add tax as line item
        if tax > 0:
            line_items.append({
                "price_data": {
                    "currency": "cad",
                    "product_data": {"name": "HST (13%)"},
                    "unit_amount": int(tax * 100),
                },
                "quantity": 1,
            })

        # Add delivery fee if applicable
        if delivery_fee > 0:
            line_items.append({
                "price_data": {
                    "currency": "cad",
                    "product_data": {"name": "Delivery Fee"},
                    "unit_amount": int(delivery_fee * 100),
                },
                "quantity": 1,
            })

        # Create Stripe session
        stripe_params = {
            "payment_method_types": ["card"],
            "line_items": line_items,
            "mode": "payment",
            "success_url": f"{frontend_host}/payment-success?session_id={{CHECKOUT_SESSION_ID}}",
            "cancel_url": f"{frontend_host}/checkout",
            "metadata": {
                "order_id": str(order_id),
                "user_id": current_user.id,
            },
        }

        # Only add customer_email if valid
        if data.customer_email and data.customer_email.strip():
            stripe_params["customer_email"] = data.customer_email.strip()

        # Use a stable idempotency key so retries cannot create duplicate Stripe sessions.
        idempotency_key = request.headers.get("Idempotency-Key") or f"dishbar-order-{order_id}"
        if len(idempotency_key) > 255:
            raise HTTPException(status_code=400, detail="Idempotency-Key is too long")
        session = stripe.checkout.Session.create(
            idempotency_key=idempotency_key,
            **stripe_params,
        )

        # Save session ID to order
        result = await db.execute(select(Orders).where(Orders.id == order_id))
        order_fresh = result.scalar_one_or_none()
        if order_fresh:
            order_fresh.stripe_session_id = session.id
            await db.commit()

        return CheckoutResponse(session_id=session.id, url=session.url)

    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(
            status_code=502,
            detail="Payment service is temporarily unavailable. Please try again in a moment."
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Payment session error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create payment session: {str(e)}")


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Process signed Stripe checkout events idempotently."""
    webhook_secret = getattr(settings, "stripe_webhook_secret", "")
    if not webhook_secret:
        raise HTTPException(status_code=503, detail="Stripe webhook is not configured")

    payload = await request.body()
    signature = request.headers.get("Stripe-Signature")
    if not signature:
        raise HTTPException(status_code=400, detail="Stripe-Signature header is required")

    try:
        event = stripe.Webhook.construct_event(payload, signature, webhook_secret)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Stripe webhook payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid Stripe webhook signature")

    event_type = event["type"]
    if event_type not in {
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
        "checkout.session.async_payment_failed",
        "checkout.session.expired",
    }:
        return {"received": True, "handled": False}

    session = event["data"]["object"]
    metadata = session.get("metadata") or {}
    order_id = metadata.get("order_id")
    if not order_id:
        return {"received": True, "handled": False}

    result = await db.execute(select(Orders).where(Orders.id == int(order_id)))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if event_type in {"checkout.session.completed", "checkout.session.async_payment_succeeded"}:
        order.payment_status = "paid"
        order.status = "confirmed"
    elif event_type == "checkout.session.async_payment_failed":
        order.payment_status = "payment_failed"
    elif event_type == "checkout.session.expired" and order.payment_status != "paid":
        order.payment_status = "expired"
        order.status = "cancelled"

    if not order.stripe_session_id:
        order.stripe_session_id = session.get("id")
    await db.commit()

    return {"received": True, "handled": True, "order_id": order.id, "payment_status": order.payment_status}


@router.post("/verify_payment", response_model=VerifyResponse)
async def verify_payment(
    data: VerifyRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Verify payment status and update order"""
    try:
        session = stripe.checkout.Session.retrieve(data.session_id)
        order_id = session.metadata.get("order_id")

        if order_id:
            result = await db.execute(
                select(Orders).where(Orders.id == int(order_id))
            )
            order = result.scalar_one_or_none()

            if order and str(order.user_id) != str(current_user.id) and current_user.role != "admin":
                raise HTTPException(status_code=403, detail="You do not have access to this payment session")

            if order:
                status_mapping = {"complete": "paid", "open": "pending", "expired": "cancelled"}
                payment_status = status_mapping.get(session.status, "pending")

                # Only update if status actually changed (prevent duplicate processing)
                if order.payment_status != payment_status:
                    order.payment_status = payment_status
                    if payment_status == "paid":
                        order.status = "confirmed"
                    elif payment_status == "cancelled":
                        order.status = "cancelled"
                    await db.commit()

                return VerifyResponse(
                    status=payment_status,
                    order_id=int(order_id),
                    payment_status=session.payment_status or "unpaid",
                )

        return VerifyResponse(
            status="pending",
            order_id=int(order_id) if order_id else None,
            payment_status=session.payment_status or "unpaid",
        )

    except stripe.error.StripeError as e:
        logger.error(f"Stripe verification error: {e}")
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")
    except Exception as e:
        logger.error(f"Payment verification error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to verify payment: {str(e)}")