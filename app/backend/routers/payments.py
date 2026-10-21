"""Checkout, quotes, signed Stripe webhooks, and payment verification.

A redirect back from Stripe is not payment. An order becomes paid only when the
Stripe session is payment_status=paid and the amount, currency, owner, and
session id match the server order.
"""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone
from typing import List, Optional

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.redirects import resolve_checkout_origin
from dependencies.auth import get_current_user
from models.commerce import StripeWebhookEvent
from models.orders import Orders
from schemas.auth import UserResponse
from services.cart_validation import cook_delivery_available, enforce_pilot_restrictions, resolve_cart
from services.inventory import (
    MAX_ITEM_QUANTITY,
    consume_order_reservations,
    release_expired_reservations,
    release_order_reservations,
    reservation_expiry,
    reserve_menu_item,
    InventoryError,
)
from services.pricing import OrderMoney, cents_to_decimal, live_checkout_block_reason, stripe_line_items

router = APIRouter(prefix="/api/v1/payment", tags=["payment"])
logger = logging.getLogger(__name__)

try:
    _stripe_key = os.getenv("STRIPE_SECRET_KEY", "")
    if _stripe_key:
        stripe.api_key = _stripe_key
    else:
        logger.warning("STRIPE_SECRET_KEY is empty. Payment processing will be unavailable.")
except Exception:
    logger.warning("STRIPE_SECRET_KEY is not configured. Payment processing will be unavailable.")


class CheckoutLine(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: int
    quantity: int = Field(..., ge=1, le=MAX_ITEM_QUANTITY)


class CheckoutRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    items: List[CheckoutLine]
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
    order_id: int
    customer_total_cents: int
    currency: str


class VerifyRequest(BaseModel):
    session_id: str


class VerifyResponse(BaseModel):
    status: str
    order_id: Optional[int] = None
    payment_status: str


def _public_money(money: OrderMoney, lines, chef_id: int, settings: dict) -> dict:
    payload = money.public_dict()
    block_reason = live_checkout_block_reason(settings)
    payload["chef_id"] = chef_id
    payload["acceptance_policy"] = "not_configured"
    payload["checkout_allowed"] = block_reason is None
    payload["checkout_block_reason"] = block_reason or ""
    payload["cook_delivery_available"] = cook_delivery_available(settings)
    payload["third_party_delivery_available"] = False
    payload["items"] = [
        {
            "id": line.item.id,
            "title": line.item.title,
            "quantity": line.quantity,
            "unit_price": f"{cents_to_decimal(line.unit_cents):.2f}",
            "line_total": f"{cents_to_decimal(line.line_cents):.2f}",
        }
        for line in lines
    ]
    return payload


def _session_dict(session) -> dict:
    if isinstance(session, dict):
        metadata = session.get("metadata") or {}
        return {
            "id": session.get("id"),
            "payment_status": session.get("payment_status"),
            "status": session.get("status"),
            "amount_total": session.get("amount_total"),
            "currency": session.get("currency"),
            "metadata": dict(metadata),
            "payment_intent": session.get("payment_intent"),
        }
    metadata = session.metadata or {}
    if not isinstance(metadata, dict):
        metadata = dict(metadata)
    return {
        "id": session.id,
        "payment_status": session.payment_status,
        "status": getattr(session, "status", None),
        "amount_total": session.amount_total,
        "currency": session.currency,
        "metadata": metadata,
        "payment_intent": getattr(session, "payment_intent", None),
    }


def _payment_matches(session: dict, order: Orders) -> tuple[bool, str]:
    metadata = session.get("metadata") or {}
    if str(metadata.get("order_id", "")) != str(order.id):
        return False, "order_mismatch"
    if str(metadata.get("user_id", "")) != str(order.user_id):
        return False, "owner_mismatch"
    if (session.get("currency") or "").lower() != "cad":
        return False, "currency_mismatch"
    if order.customer_total_cents is None or int(session.get("amount_total") or -1) != int(order.customer_total_cents):
        return False, "amount_mismatch"
    if order.stripe_session_id and session.get("id") and session.get("id") != order.stripe_session_id:
        return False, "session_mismatch"
    return True, "ok"


async def _apply_paid(db: AsyncSession, order: Orders, session: dict) -> str:
    if order.payment_status == "paid":
        return "already_paid"
    if session.get("payment_status") != "paid":
        return "not_paid"
    matches, reason = _payment_matches(session, order)
    if not matches:
        order.payment_status = "review_required"
        logger.warning("Payment for order %s was not applied: %s", order.id, reason)
        return reason
    order.payment_status = "paid"
    order.status = "awaiting_acceptance"
    order.stripe_amount_total = int(session["amount_total"])
    if session.get("id") and not order.stripe_session_id:
        order.stripe_session_id = session["id"]
    if session.get("payment_intent"):
        order.stripe_payment_intent_id = str(session["payment_intent"])
    await consume_order_reservations(db, order.id)
    return "paid"


async def _apply_failed_or_expired(db: AsyncSession, order: Orders, outcome: str) -> str:
    if order.payment_status == "paid":
        return "ignored_after_paid"
    order.payment_status = outcome
    order.status = "cancelled"
    await release_order_reservations(db, order.id)
    return outcome


@router.post("/quote")
async def quote_cart(
    data: CheckoutRequest,
    db: AsyncSession = Depends(get_db),
):
    """Return the server price breakdown. Does not reserve stock or create an order."""
    try:
        _chef, lines, money, settings = await resolve_cart(db, data.items, data.delivery_type)
        return _public_money(money, lines, _chef.id, settings)
    except HTTPException:
        raise
    except Exception:
        logger.exception("Quote failed")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/create_payment_session", response_model=CheckoutResponse)
async def create_payment_session(
    data: CheckoutRequest,
    request: Request,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create an unpaid order from server prices and a Stripe Checkout session."""
    try:
        if not data.customer_name.strip():
            raise HTTPException(status_code=400, detail="Full name is required")
        if not data.customer_phone.strip():
            raise HTTPException(status_code=400, detail="Phone number is required")
        if data.delivery_type != "pickup" and not data.delivery_address.strip():
            raise HTTPException(status_code=400, detail="Delivery address is required")
        if not data.allergen_acknowledged:
            raise HTTPException(status_code=400, detail="You must acknowledge the allergen notice before ordering")

        origin = resolve_checkout_origin(request.headers.get("App-Host"))
        await release_expired_reservations(db)
        await db.commit()
        chef, lines, money, settings = await resolve_cart(db, data.items, data.delivery_type)
        block_reason = live_checkout_block_reason(settings)
        if block_reason:
            raise HTTPException(status_code=503, detail=block_reason)
        await enforce_pilot_restrictions(db, settings, data.delivery_postal_code, data.delivery_type)

        server_items = [
            {
                "id": line.item.id,
                "title": line.item.title,
                "unit_price_cents": line.unit_cents,
                "quantity": line.quantity,
                "chef_id": line.item.chef_id,
            }
            for line in lines
        ]
        snapshot = money.as_snapshot(settings.get("tax_rules"))
        snapshot["calculated_at"] = datetime.now(timezone.utc).isoformat()

        order = Orders(
            user_id=str(current_user.id),
            chef_id=chef.id,
            items_json=json.dumps(server_items),
            total_amount=float(cents_to_decimal(money.customer_total_cents)),
            commission_amount=float(cents_to_decimal(money.commission_cents)),
            chef_amount=float(cents_to_decimal(money.cook_share_cents)),
            status="pending_payment",
            delivery_type=data.delivery_type,
            delivery_address=data.delivery_address.strip(),
            customer_name=data.customer_name.strip(),
            customer_phone=data.customer_phone.strip(),
            payment_status="unpaid",
            food_subtotal_cents=money.food_subtotal_cents,
            service_fee_cents=money.service_fee_cents,
            commission_cents=money.commission_cents,
            delivery_fee_cents=money.delivery_fee_cents,
            tax_cents=money.tax_cents,
            customer_total_cents=money.customer_total_cents,
            cook_share_cents=money.cook_share_cents,
            platform_gross_cents=money.platform_gross_cents,
            currency="CAD",
            fee_snapshot_json=json.dumps(snapshot),
        )
        db.add(order)
        await db.flush()
        order_id = order.id
        line_items = stripe_line_items(
            [
                {"name": item["title"], "unit_amount_cents": item["unit_price_cents"], "quantity": item["quantity"]}
                for item in server_items
            ],
            money,
        )
        expires_at = reservation_expiry()
        for line in lines:
            await reserve_menu_item(db, line.item, line.quantity, order_id, expires_at)
        await db.commit()

        if not stripe.api_key:
            await release_order_reservations(db, order_id)
            stored = await db.get(Orders, order_id)
            if stored is not None:
                stored.payment_status = "payment_unavailable"
            await db.commit()
            raise HTTPException(
                status_code=503,
                detail="Online payment is temporarily unavailable. Please try again later or contact support.",
            )

        # Ignore a client Idempotency-Key. The key is bound to this order id only.
        idempotency_key = f"dishbar-order-{order_id}"

        stripe_params = {
            "payment_method_types": ["card"],
            "line_items": line_items,
            "mode": "payment",
            "success_url": f"{origin}/payment-success?session_id={{CHECKOUT_SESSION_ID}}",
            "cancel_url": f"{origin}/checkout",
            "metadata": {
                "order_id": str(order_id),
                "user_id": str(current_user.id),
                "customer_total_cents": str(money.customer_total_cents),
                "currency": "cad",
            },
        }
        if data.customer_email and data.customer_email.strip():
            stripe_params["customer_email"] = data.customer_email.strip()

        session = stripe.checkout.Session.create(idempotency_key=idempotency_key, **stripe_params)
        stored = await db.get(Orders, order_id)
        if stored is not None:
            stored.stripe_session_id = session.id
            await db.commit()

        return CheckoutResponse(
            session_id=session.id,
            url=session.url,
            order_id=order_id,
            customer_total_cents=money.customer_total_cents,
            currency="CAD",
        )
    except InventoryError as exc:
        await db.rollback()
        raise HTTPException(status_code=400, detail=exc.message)
    except stripe.error.StripeError:
        logger.exception("Stripe checkout session failed")
        raise HTTPException(status_code=502, detail="Payment service is temporarily unavailable. Please try again.")
    except HTTPException:
        raise
    except Exception:
        logger.exception("Payment session failed")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Process a signed Stripe event once. Later or duplicate events cannot un-pay an order."""
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")
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

    event_data = event.to_dict() if hasattr(event, "to_dict") else event
    event_id = event_data.get("id")
    event_type = event_data.get("type")
    if not event_id:
        raise HTTPException(status_code=400, detail="Stripe event id is required")

    existing = await db.execute(select(StripeWebhookEvent).where(StripeWebhookEvent.event_id == event_id))
    if existing.scalar_one_or_none() is not None:
        return {"received": True, "duplicate": True}

    record = StripeWebhookEvent(event_id=event_id, event_type=event_type or "unknown", outcome="received")
    db.add(record)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        return {"received": True, "duplicate": True}

    if event_type not in {
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
        "checkout.session.async_payment_failed",
        "checkout.session.expired",
    }:
        record.outcome = "ignored"
        await db.commit()
        return {"received": True, "handled": False}

    session = _session_dict(event_data["data"]["object"])
    order_id = (session.get("metadata") or {}).get("order_id")
    if not order_id:
        record.outcome = "no_order"
        await db.commit()
        return {"received": True, "handled": False}

    result = await db.execute(select(Orders).where(Orders.id == int(order_id)))
    order = result.scalar_one_or_none()
    if order is None:
        record.outcome = "order_missing"
        await db.commit()
        return {"received": True, "handled": False}

    record.order_id = order.id
    if event_type in {"checkout.session.completed", "checkout.session.async_payment_succeeded"}:
        record.outcome = await _apply_paid(db, order, session)
    elif event_type == "checkout.session.async_payment_failed":
        record.outcome = await _apply_failed_or_expired(db, order, "payment_failed")
    else:
        record.outcome = await _apply_failed_or_expired(db, order, "expired")

    await db.commit()
    return {"received": True, "handled": True, "duplicate": False, "outcome": record.outcome}


@router.post("/verify_payment", response_model=VerifyResponse)
async def verify_payment(
    data: VerifyRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Confirm payment with Stripe. Session status 'complete' alone is not paid."""
    try:
        session = _session_dict(stripe.checkout.Session.retrieve(data.session_id))
        order_id = (session.get("metadata") or {}).get("order_id")
        if not order_id:
            return VerifyResponse(status="pending", order_id=None, payment_status=session.get("payment_status") or "unpaid")

        result = await db.execute(select(Orders).where(Orders.id == int(order_id)))
        order = result.scalar_one_or_none()
        if order is None:
            raise HTTPException(status_code=404, detail="Order not found")
        if str(order.user_id) != str(current_user.id) and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="You do not have access to this payment session")

        if session.get("payment_status") == "paid":
            await _apply_paid(db, order, session)
        elif session.get("status") == "expired" and order.payment_status != "paid":
            await _apply_failed_or_expired(db, order, "expired")
        await db.commit()

        status = "paid" if order.payment_status == "paid" else "pending"
        return VerifyResponse(
            status=status,
            order_id=order.id,
            payment_status=order.payment_status or "unpaid",
        )
    except stripe.error.StripeError:
        logger.exception("Stripe verification failed")
        raise HTTPException(status_code=502, detail="Payment verification is temporarily unavailable")
    except HTTPException:
        raise
    except Exception:
        logger.exception("Payment verification failed")
        raise HTTPException(status_code=500, detail="Internal server error")
