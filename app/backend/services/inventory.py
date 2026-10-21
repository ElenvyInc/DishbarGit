"""Atomic inventory reservation.

Stock moves in a single UPDATE ... WHERE remaining is sufficient, which holds on
SQLite and Postgres without a read-then-write gap. Postgres deployments should
still run this inside the order transaction. Expired unpaid holds are released
when a new checkout starts; there is no separate sweeper process yet.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import case, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from models.commerce import InventoryReservation
from models.menu_items import Menu_items
from models.orders import Orders

MAX_ITEM_QUANTITY = 50
RESERVATION_TTL = timedelta(minutes=30)


class InventoryError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


def reservation_expiry(now: datetime | None = None) -> datetime:
    base = now or datetime.now(timezone.utc)
    return base + RESERVATION_TTL


async def release_expired_reservations(db: AsyncSession, now: datetime | None = None) -> int:
    moment = now or datetime.now(timezone.utc)
    result = await db.execute(
        select(InventoryReservation).where(
            InventoryReservation.status == "reserved",
            InventoryReservation.expires_at.is_not(None),
            InventoryReservation.expires_at < moment,
        )
    )
    released = 0
    for row in result.scalars().all():
        if row.order_id is not None:
            order_result = await db.execute(select(Orders.payment_status).where(Orders.id == row.order_id))
            payment_status = order_result.scalar_one_or_none()
            if payment_status == "paid":
                row.status = "consumed"
                continue
        await _decrement(db, row.menu_item_id, row.quantity)
        row.status = "released"
        released += 1
    return released


async def reserve_menu_item(
    db: AsyncSession,
    menu_item: Menu_items,
    quantity: int,
    order_id: int | None,
    expires_at: datetime,
) -> InventoryReservation:
    if quantity < 1 or quantity > MAX_ITEM_QUANTITY:
        raise InventoryError(f"Quantity must be between 1 and {MAX_ITEM_QUANTITY}")
    if not menu_item.is_available:
        raise InventoryError(f"'{menu_item.title}' is not available")

    conditions = [
        Menu_items.id == menu_item.id,
        Menu_items.is_available.is_(True),
    ]
    if menu_item.max_orders is not None and menu_item.max_orders > 0:
        conditions.append(
            (func.coalesce(Menu_items.reserved_quantity, 0) + quantity) <= menu_item.max_orders
        )

    result = await db.execute(
        update(Menu_items)
        .where(*conditions)
        .values(reserved_quantity=func.coalesce(Menu_items.reserved_quantity, 0) + quantity)
    )
    if result.rowcount != 1:
        raise InventoryError(f"Not enough remaining portions of '{menu_item.title}'")

    reservation = InventoryReservation(
        menu_item_id=menu_item.id,
        order_id=order_id,
        quantity=quantity,
        status="reserved",
        expires_at=expires_at,
    )
    db.add(reservation)
    return reservation


async def release_order_reservations(db: AsyncSession, order_id: int) -> int:
    result = await db.execute(
        select(InventoryReservation).where(
            InventoryReservation.order_id == order_id,
            InventoryReservation.status == "reserved",
        )
    )
    released = 0
    for row in result.scalars().all():
        await _decrement(db, row.menu_item_id, row.quantity)
        row.status = "released"
        released += 1
    return released


async def consume_order_reservations(db: AsyncSession, order_id: int) -> None:
    result = await db.execute(
        select(InventoryReservation).where(
            InventoryReservation.order_id == order_id,
            InventoryReservation.status == "reserved",
        )
    )
    for row in result.scalars().all():
        row.status = "consumed"


async def _decrement(db: AsyncSession, menu_item_id: int, quantity: int) -> None:
    current = func.coalesce(Menu_items.reserved_quantity, 0)
    await db.execute(
        update(Menu_items)
        .where(Menu_items.id == menu_item_id)
        .values(
            reserved_quantity=case(
                (current < quantity, 0),
                else_=current - quantity,
            )
        )
    )
