"""Server-side cart checks. Client prices, titles, and cook ids are ignored."""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import date, datetime, time as dtime

from fastapi import HTTPException
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.chefs import Chefs
from models.menu_items import Menu_items
from models.orders import Orders
from models.platform_settings import Platform_settings
from services.inventory import MAX_ITEM_QUANTITY
from services.pricing import OrderMoney, calculate_order_money, price_to_cents

ALLOWED_DELIVERY = {"pickup", "self_delivery", "third_party"}


@dataclass
class ResolvedLine:
    item: Menu_items
    quantity: int
    unit_cents: int

    @property
    def line_cents(self) -> int:
        return self.unit_cents * self.quantity


async def enforce_pilot_restrictions(
    db: AsyncSession,
    settings: dict[str, str],
    postal_code: str,
    delivery_type: str,
) -> None:
    """Keep the existing pilot window. Missing pilot_mode still means the window is on."""
    if str(settings.get("pilot_mode", "true")).lower() != "true":
        return
    if str(settings.get("platform_open", "true")).lower() != "true":
        raise HTTPException(status_code=400, detail="Ordering is currently paused. Please try again later.")

    now = datetime.now()
    hours_start = settings.get("ordering_hours_start", "09:00")
    hours_end = settings.get("ordering_hours_end", "20:00")
    try:
        start_h, start_m = (int(part) for part in hours_start.split(":"))
        end_h, end_m = (int(part) for part in hours_end.split(":"))
        current = now.time()
        if current < dtime(start_h, start_m) or current > dtime(end_h, end_m):
            raise HTTPException(
                status_code=400,
                detail=f"Ordering is only available between {hours_start} and {hours_end}.",
            )
    except HTTPException:
        raise
    except (TypeError, ValueError):
        pass

    try:
        ordering_days = json.loads(settings.get("ordering_days", "[]") or "[]")
        if ordering_days and now.strftime("%A").lower() not in {day.lower() for day in ordering_days}:
            raise HTTPException(status_code=400, detail=f"Ordering is not available on {now.strftime('%A')}.")
    except HTTPException:
        raise
    except (json.JSONDecodeError, TypeError):
        pass

    try:
        daily_limit = int(float(settings.get("daily_order_limit", "0") or "0"))
    except (TypeError, ValueError):
        daily_limit = 0
    if daily_limit > 0:
        count_result = await db.execute(
            select(func.count(Orders.id)).where(
                and_(func.date(Orders.created_at) == date.today(), Orders.payment_status == "paid")
            )
        )
        if (count_result.scalar() or 0) >= daily_limit:
            raise HTTPException(status_code=400, detail="Daily order limit reached. Please try again tomorrow.")

    if delivery_type != "pickup" and postal_code:
        try:
            allowed_codes = json.loads(settings.get("pilot_postal_codes", "[]") or "[]")
        except (json.JSONDecodeError, TypeError):
            allowed_codes = []
        if allowed_codes:
            postal_prefix = postal_code.upper().replace(" ", "")[:3]
            if not any(postal_prefix.startswith(str(code).upper()) for code in allowed_codes):
                raise HTTPException(status_code=400, detail="Delivery is not available in your area.")


def cook_delivery_available(settings: dict[str, str]) -> bool:
    approved = str(settings.get("cook_delivery_approved", "false")).strip().lower() == "true"
    priced = str(settings.get("delivery_pricing_enabled", "false")).strip().lower() == "true"
    return approved and priced


def _reject_unapproved_fulfilment(delivery_type: str, settings: dict[str, str]) -> None:
    if delivery_type == "pickup":
        return
    if delivery_type == "third_party":
        raise HTTPException(status_code=400, detail="Third-party delivery is not available yet. Choose pickup.")
    if delivery_type == "self_delivery" and not cook_delivery_available(settings):
        raise HTTPException(
            status_code=400,
            detail="Cook delivery is not available until it is approved and a delivery fee is configured. Choose pickup.",
        )


async def load_settings_map(db: AsyncSession) -> dict[str, str]:
    result = await db.execute(select(Platform_settings))
    return {row.key: row.value for row in result.scalars().all()}


async def resolve_cart(
    db: AsyncSession,
    lines: list,
    delivery_type: str,
) -> tuple[Chefs, list[ResolvedLine], OrderMoney, dict[str, str]]:
    if not lines:
        raise HTTPException(status_code=400, detail="Cart is empty")
    if delivery_type not in ALLOWED_DELIVERY:
        raise HTTPException(status_code=400, detail="Fulfilment method is not supported")

    ids = [line.id for line in lines]
    if len(ids) != len(set(ids)):
        raise HTTPException(status_code=400, detail="Each meal can appear only once. Combine the quantities.")

    for line in lines:
        if line.quantity < 1 or line.quantity > MAX_ITEM_QUANTITY:
            raise HTTPException(
                status_code=400,
                detail=f"Quantity must be between 1 and {MAX_ITEM_QUANTITY}",
            )

    result = await db.execute(select(Menu_items).where(Menu_items.id.in_(ids)))
    found = {item.id: item for item in result.scalars().all()}
    if len(found) != len(ids):
        raise HTTPException(status_code=400, detail="One or more meals are no longer available")

    chef_ids = {found[item_id].chef_id for item_id in ids}
    if len(chef_ids) != 1:
        raise HTTPException(
            status_code=400,
            detail="A checkout can include meals from only one cook. Keep the current cart or replace it.",
        )

    chef_id = next(iter(chef_ids))
    chef_result = await db.execute(select(Chefs).where(Chefs.id == chef_id))
    chef = chef_result.scalar_one_or_none()
    if chef is None or not chef.is_approved or not chef.is_active:
        raise HTTPException(status_code=400, detail="This cook is not currently accepting orders")

    resolved: list[ResolvedLine] = []
    for line in lines:
        item = found[line.id]
        if not item.is_available:
            raise HTTPException(status_code=400, detail=f"'{item.title}' is not available")
        if item.price is None or item.price <= 0:
            raise HTTPException(status_code=400, detail=f"'{item.title}' does not have a valid price")
        resolved.append(ResolvedLine(item=item, quantity=line.quantity, unit_cents=price_to_cents(item.price)))

    settings = await load_settings_map(db)
    _reject_unapproved_fulfilment(delivery_type, settings)
    food_subtotal = sum(line.line_cents for line in resolved)
    if str(settings.get("minimum_order_enforced", "false")).lower() == "true":
        minimum = price_to_cents(settings.get("minimum_order_amount", "0") or "0")
        if food_subtotal < minimum:
            raise HTTPException(
                status_code=400,
                detail=f"Minimum food subtotal is {minimum / 100:.2f} CAD",
            )

    money = calculate_order_money(food_subtotal, settings, delivery_type)
    return chef, resolved, money, settings
