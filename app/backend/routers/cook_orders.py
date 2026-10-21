"""Orders a cook is allowed to see: only orders for that cook's own profile."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_current_user
from models.chefs import Chefs
from models.orders import Orders
from schemas.auth import UserResponse
from services.pricing import cents_to_str

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/cook", tags=["cook-orders"])

FULFILMENT_STATUSES = {"accepted", "preparing", "ready", "completed", "cancelled"}


class CookStatusUpdate(BaseModel):
    status: str


def _money(cents, fallback) -> str | None:
    if cents is None:
        return None if fallback is None else f"{float(fallback):.2f}"
    return cents_to_str(int(cents))


def _serialize(order: Orders) -> dict:
    return {
        "id": order.id,
        "user_id": order.user_id,
        "chef_id": order.chef_id,
        "items_json": order.items_json,
        "status": order.status,
        "payment_status": order.payment_status,
        "delivery_type": order.delivery_type,
        "delivery_address": order.delivery_address,
        "customer_name": order.customer_name,
        "customer_phone": order.customer_phone,
        "currency": order.currency or "CAD",
        "total_amount": order.total_amount,
        "commission_amount": order.commission_amount,
        "chef_amount": order.chef_amount,
        "food_subtotal": _money(order.food_subtotal_cents, None),
        "service_fee": _money(order.service_fee_cents, None),
        "commission": _money(order.commission_cents, order.commission_amount),
        "cook_share": _money(order.cook_share_cents, order.chef_amount),
        "customer_total": _money(order.customer_total_cents, order.total_amount),
        "tax": _money(order.tax_cents, None),
        "delivery_fee": _money(order.delivery_fee_cents, None),
        "created_at": order.created_at.isoformat() if order.created_at else None,
    }


async def _owned_chef_ids(db: AsyncSession, user_id: str) -> list[int]:
    result = await db.execute(select(Chefs.id).where(Chefs.user_id == str(user_id)))
    return [row[0] for row in result.all()]


async def _owned_order(db: AsyncSession, user_id: str, order_id: int) -> Orders:
    chef_ids = await _owned_chef_ids(db, user_id)
    if not chef_ids:
        raise HTTPException(status_code=404, detail="Order not found")
    result = await db.execute(select(Orders).where(Orders.id == order_id, Orders.chef_id.in_(chef_ids)))
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.get("/orders")
async def list_cook_orders(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    chef_ids = await _owned_chef_ids(db, current_user.id)
    if not chef_ids:
        return {"items": []}
    result = await db.execute(
        select(Orders).where(Orders.chef_id.in_(chef_ids)).order_by(Orders.created_at.desc())
    )
    return {"items": [_serialize(order) for order in result.scalars().all()]}


@router.get("/orders/{order_id}")
async def get_cook_order(
    order_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    order = await _owned_order(db, current_user.id, order_id)
    return _serialize(order)


@router.post("/orders/{order_id}/status")
async def update_cook_order_status(
    order_id: int,
    data: CookStatusUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.status not in FULFILMENT_STATUSES:
        raise HTTPException(status_code=400, detail="That order status is not allowed")
    order = await _owned_order(db, current_user.id, order_id)
    if data.status != "cancelled" and order.payment_status != "paid":
        raise HTTPException(status_code=400, detail="Only a paid order can move into fulfilment")
    order.status = data.status
    await db.commit()
    logger.info("Cook updated order %s status", order.id)
    return _serialize(order)
