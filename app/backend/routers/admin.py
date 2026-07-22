import json
import logging
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func, update, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_current_user
from schemas.auth import UserResponse
from models.chefs import Chefs
from models.orders import Orders
from models.reviews import Reviews
from models.coupons import Coupons
from models.notifications import Notifications

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

# Note: In production, add admin role check middleware.
# For MVP, any authenticated user accessing /admin routes is treated as admin.
# Real role-based access should be implemented via user metadata/roles.


class AdminStatsResponse(BaseModel):
    total_chefs: int
    pending_chefs: int
    active_chefs: int
    total_orders: int
    total_revenue: float
    total_commission: float
    total_reviews: int
    orders_today: int


class ChefApprovalRequest(BaseModel):
    chef_id: int
    action: str  # "approve" or "suspend"
    reason: Optional[str] = None


class RefundRequest(BaseModel):
    order_id: int
    amount: Optional[float] = None
    reason: str = ""


class SendNotificationRequest(BaseModel):
    user_id: Optional[str] = None  # null = broadcast
    title: str
    title_fa: str = ""
    message: str
    message_fa: str = ""
    type: str = "system"


class CouponCreateRequest(BaseModel):
    code: str
    discount_percent: Optional[float] = None
    discount_amount: Optional[float] = None
    min_order_amount: float = 0
    max_uses: int = 100
    is_active: bool = True
    expires_at: Optional[str] = None
    chef_id: Optional[int] = None


class CommissionUpdateRequest(BaseModel):
    rate: float  # e.g. 0.15 for 15%


# Global commission rate (in production, store in DB/config)
COMMISSION_RATE = 0.15


@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get admin dashboard statistics"""
    try:
        # Total chefs
        total_chefs_r = await db.execute(select(func.count(Chefs.id)))
        total_chefs = total_chefs_r.scalar() or 0

        # Pending chefs
        pending_r = await db.execute(
            select(func.count(Chefs.id)).where(Chefs.is_approved == False)
        )
        pending_chefs = pending_r.scalar() or 0

        # Active chefs
        active_r = await db.execute(
            select(func.count(Chefs.id)).where(
                and_(Chefs.is_approved == True, Chefs.is_active == True)
            )
        )
        active_chefs = active_r.scalar() or 0

        # Total orders
        total_orders_r = await db.execute(select(func.count(Orders.id)))
        total_orders = total_orders_r.scalar() or 0

        # Total revenue
        revenue_r = await db.execute(
            select(func.coalesce(func.sum(Orders.total_amount), 0)).where(
                Orders.payment_status == "paid"
            )
        )
        total_revenue = float(revenue_r.scalar() or 0)

        # Total commission
        commission_r = await db.execute(
            select(func.coalesce(func.sum(Orders.commission_amount), 0)).where(
                Orders.payment_status == "paid"
            )
        )
        total_commission = float(commission_r.scalar() or 0)

        # Total reviews
        reviews_r = await db.execute(select(func.count(Reviews.id)))
        total_reviews = reviews_r.scalar() or 0

        # Orders today
        from datetime import date
        today = date.today()
        today_r = await db.execute(
            select(func.count(Orders.id)).where(
                func.date(Orders.created_at) == today
            )
        )
        orders_today = today_r.scalar() or 0

        return AdminStatsResponse(
            total_chefs=total_chefs,
            pending_chefs=pending_chefs,
            active_chefs=active_chefs,
            total_orders=total_orders,
            total_revenue=total_revenue,
            total_commission=total_commission,
            total_reviews=total_reviews,
            orders_today=orders_today,
        )
    except Exception as e:
        logger.error(f"Admin stats error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chefs")
async def list_all_chefs(
    status: Optional[str] = Query(None, description="pending, approved, suspended"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all chefs with optional status filter"""
    try:
        query = select(Chefs)
        if status == "pending":
            query = query.where(Chefs.is_approved == False)
        elif status == "approved":
            query = query.where(Chefs.is_approved == True)
        elif status == "suspended":
            query = query.where(Chefs.is_active == False)

        count_q = select(func.count()).select_from(query.subquery())
        total_r = await db.execute(count_q)
        total = total_r.scalar() or 0

        query = query.order_by(Chefs.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        chefs = result.scalars().all()

        return {
            "items": [
                {
                    "id": c.id,
                    "user_id": c.user_id,
                    "name": c.name,
                    "name_fa": c.name_fa,
                    "city": c.city,
                    "province": c.province,
                    "cuisine_tags": c.cuisine_tags,
                    "rating": c.rating,
                    "total_reviews": c.total_reviews,
                    "is_approved": c.is_approved,
                    "is_active": c.is_active,
                    "created_at": c.created_at.isoformat() if c.created_at else None,
                }
                for c in chefs
            ],
            "total": total,
        }
    except Exception as e:
        logger.error(f"Admin list chefs error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chefs/approve")
async def approve_or_suspend_chef(
    data: ChefApprovalRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Approve or suspend a chef"""
    try:
        result = await db.execute(select(Chefs).where(Chefs.id == data.chef_id))
        chef = result.scalar_one_or_none()
        if not chef:
            raise HTTPException(status_code=404, detail="Chef not found")

        if data.action == "approve":
            chef.is_approved = True
            chef.is_active = True
        elif data.action == "suspend":
            chef.is_active = False
        else:
            raise HTTPException(status_code=400, detail="Invalid action")

        await db.commit()
        return {"message": f"Chef {data.action}d successfully", "chef_id": data.chef_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chef approval error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/orders")
async def list_all_orders(
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all orders with optional status filter"""
    try:
        query = select(Orders)
        if status:
            query = query.where(Orders.status == status)

        count_q = select(func.count()).select_from(query.subquery())
        total_r = await db.execute(count_q)
        total = total_r.scalar() or 0

        query = query.order_by(Orders.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        orders = result.scalars().all()

        return {
            "items": [
                {
                    "id": o.id,
                    "user_id": o.user_id,
                    "chef_id": o.chef_id,
                    "items_json": o.items_json,
                    "total_amount": o.total_amount,
                    "commission_amount": o.commission_amount,
                    "chef_amount": o.chef_amount,
                    "status": o.status,
                    "delivery_type": o.delivery_type,
                    "customer_name": o.customer_name,
                    "customer_phone": o.customer_phone,
                    "payment_status": o.payment_status,
                    "created_at": o.created_at.isoformat() if o.created_at else None,
                }
                for o in orders
            ],
            "total": total,
        }
    except Exception as e:
        logger.error(f"Admin list orders error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/orders/refund")
async def process_refund(
    data: RefundRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Process a refund for an order"""
    try:
        import stripe
        from core.config import settings
        stripe.api_key = settings.stripe_secret_key

        result = await db.execute(select(Orders).where(Orders.id == data.order_id))
        order = result.scalar_one_or_none()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        if order.payment_status != "paid":
            raise HTTPException(status_code=400, detail="Order is not paid")

        # Process Stripe refund
        if order.stripe_session_id:
            session = stripe.checkout.Session.retrieve(order.stripe_session_id)
            if session.payment_intent:
                refund_amount = int((data.amount or order.total_amount) * 100)
                stripe.Refund.create(
                    payment_intent=session.payment_intent,
                    amount=refund_amount,
                )

        order.payment_status = "refunded"
        order.status = "cancelled"
        await db.commit()

        return {"message": "Refund processed successfully", "order_id": data.order_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Refund error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reviews")
async def list_all_reviews(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all reviews for moderation"""
    try:
        query = select(Reviews).order_by(Reviews.created_at.desc())

        count_q = select(func.count()).select_from(query.subquery())
        total_r = await db.execute(count_q)
        total = total_r.scalar() or 0

        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        reviews = result.scalars().all()

        return {
            "items": [
                {
                    "id": r.id,
                    "user_id": r.user_id,
                    "chef_id": r.chef_id,
                    "rating": r.rating,
                    "comment": r.comment,
                    "comment_fa": r.comment_fa,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                }
                for r in reviews
            ],
            "total": total,
        }
    except Exception as e:
        logger.error(f"Admin list reviews error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/reviews/{review_id}")
async def delete_review(
    review_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a review (moderation)"""
    try:
        result = await db.execute(select(Reviews).where(Reviews.id == review_id))
        review = result.scalar_one_or_none()
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")

        await db.delete(review)
        await db.commit()
        return {"message": "Review deleted", "id": review_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete review error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/notifications/send")
async def send_notification(
    data: SendNotificationRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send notification to a user or broadcast"""
    try:
        notification = Notifications(
            user_id=data.user_id or "broadcast",
            title=data.title,
            title_fa=data.title_fa,
            message=data.message,
            message_fa=data.message_fa,
            type=data.type,
            is_read=False,
        )
        db.add(notification)
        await db.commit()
        return {"message": "Notification sent", "id": notification.id}
    except Exception as e:
        logger.error(f"Send notification error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/coupons")
async def create_coupon(
    data: CouponCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new coupon"""
    try:
        coupon = Coupons(
            code=data.code,
            discount_percent=data.discount_percent,
            discount_amount=data.discount_amount,
            min_order_amount=data.min_order_amount,
            max_uses=data.max_uses,
            is_active=data.is_active,
            expires_at=data.expires_at,
            chef_id=data.chef_id,
        )
        db.add(coupon)
        await db.commit()
        await db.refresh(coupon)
        return {"message": "Coupon created", "id": coupon.id, "code": coupon.code}
    except Exception as e:
        logger.error(f"Create coupon error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/coupons")
async def list_coupons(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all coupons"""
    try:
        result = await db.execute(select(Coupons).order_by(Coupons.id.desc()))
        coupons = result.scalars().all()
        return {
            "items": [
                {
                    "id": c.id,
                    "code": c.code,
                    "discount_percent": c.discount_percent,
                    "discount_amount": c.discount_amount,
                    "min_order_amount": c.min_order_amount,
                    "max_uses": c.max_uses,
                    "used_count": c.used_count,
                    "is_active": c.is_active,
                    "expires_at": c.expires_at,
                    "chef_id": c.chef_id,
                }
                for c in coupons
            ]
        }
    except Exception as e:
        logger.error(f"List coupons error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/coupons/{coupon_id}")
async def delete_coupon(
    coupon_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a coupon"""
    try:
        result = await db.execute(select(Coupons).where(Coupons.id == coupon_id))
        coupon = result.scalar_one_or_none()
        if not coupon:
            raise HTTPException(status_code=404, detail="Coupon not found")
        await db.delete(coupon)
        await db.commit()
        return {"message": "Coupon deleted", "id": coupon_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete coupon error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))