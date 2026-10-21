import pytest
from sqlalchemy import select

from core.auth import create_access_token
from core.endpoint_access import ACCESS_CLASSES, iter_api_routes
from main import app
from models.chefs import Chefs
from models.orders import Orders
from tests.conftest import SessionLocal


def auth_header(user_id: str, role: str = "user") -> dict:
    token = create_access_token({"sub": user_id, "email": f"{user_id}@example.com", "role": role, "name": user_id})
    return {"Authorization": f"Bearer {token}"}


def test_every_route_has_an_explicit_access_class():
    seen = set()
    routes = list(iter_api_routes(app))
    assert len(routes) > 10
    for route in routes:
        assert getattr(route.endpoint, "__access_class__", None) in ACCESS_CLASSES
        for method in route.methods or []:
            if method in {"HEAD", "OPTIONS"}:
                continue
            seen.add((method, route.path, route.endpoint.__access_class__))
    assert ("POST", "/api/v1/entities/platform_settings", "admin-only") in seen
    assert ("POST", "/api/v1/admin/settings/update", "admin-only") in seen
    assert ("GET", "/api/v1/admin/settings/pilot-status", "public") in seen
    assert ("POST", "/api/v1/payment/webhook", "public") in seen
    assert ("GET", "/api/v1/cook/orders", "cook-owned") in seen


@pytest.mark.asyncio
async def test_settings_mutations_are_admin_only(client):
    unauthenticated = await client.post(
        "/api/v1/entities/platform_settings",
        json={"key": "platform_commission_rate", "value": "0.01"},
    )
    assert unauthenticated.status_code == 401

    customer = await client.post(
        "/api/v1/admin/settings/update",
        headers=auth_header("customer-1", "user"),
        json={"key": "platform_commission_rate", "value": "0.01", "reason": "nope"},
    )
    assert customer.status_code == 403

    cook = await client.post(
        "/api/v1/entities/platform_settings",
        headers=auth_header("cook-1", "user"),
        json={"key": "platform_commission_rate", "value": "0.01", "reason": "nope"},
    )
    assert cook.status_code == 403

    seller = await client.post(
        "/api/v1/admin/settings/update",
        headers=auth_header("cook-1", "user"),
        json={"key": "customer_service_fee_rate", "value": "0", "reason": "lower my fee"},
    )
    assert seller.status_code == 403


@pytest.mark.asyncio
async def test_cook_cannot_self_approve(client):
    response = await client.post(
        "/api/v1/entities/chefs",
        headers=auth_header("cook-1", "user"),
        json={"name": "Home Cook", "is_approved": True},
    )
    assert response.status_code == 403
    assert "approve" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_customer_cannot_read_another_customers_order(client):
    async with SessionLocal() as session:
        chef = Chefs(user_id="cook-1", name="Cook", is_approved=True, is_active=True)
        session.add(chef)
        await session.flush()
        order = Orders(user_id="customer-a", chef_id=chef.id, total_amount=10, payment_status="unpaid", status="pending_payment")
        session.add(order)
        await session.commit()
        order_id = order.id

    response = await client.get(f"/api/v1/entities/orders/{order_id}", headers=auth_header("customer-b", "user"))
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_cook_cannot_see_another_cooks_orders(client):
    async with SessionLocal() as session:
        cook_a = Chefs(user_id="cook-a", name="A", is_approved=True, is_active=True)
        cook_b = Chefs(user_id="cook-b", name="B", is_approved=True, is_active=True)
        session.add_all([cook_a, cook_b])
        await session.flush()
        order = Orders(
            user_id="customer-1",
            chef_id=cook_b.id,
            total_amount=10,
            payment_status="paid",
            status="awaiting_acceptance",
            customer_name="Hidden",
        )
        session.add(order)
        await session.commit()
        order_id = order.id

    listing = await client.get("/api/v1/cook/orders", headers=auth_header("cook-a", "user"))
    assert listing.status_code == 200
    assert listing.json()["items"] == []

    detail = await client.get(f"/api/v1/cook/orders/{order_id}", headers=auth_header("cook-a", "user"))
    assert detail.status_code == 404

    owner = await client.get(f"/api/v1/cook/orders/{order_id}", headers=auth_header("cook-b", "user"))
    assert owner.status_code == 200
    assert owner.json()["id"] == order_id


@pytest.mark.asyncio
async def test_unauthorized_user_cannot_refund(client):
    unauthenticated = await client.post("/api/v1/admin/orders/refund", json={"order_id": 1, "reason": "test"})
    assert unauthenticated.status_code == 401

    customer = await client.post(
        "/api/v1/admin/orders/refund",
        headers=auth_header("customer-1", "user"),
        json={"order_id": 1, "reason": "test"},
    )
    assert customer.status_code == 403

    cook = await client.post(
        "/api/v1/admin/orders/refund",
        headers=auth_header("cook-1", "user"),
        json={"order_id": 1, "reason": "test"},
    )
    assert cook.status_code == 403


@pytest.mark.asyncio
async def test_financial_setting_change_is_audited(client):
    created = await client.post(
        "/api/v1/admin/settings/update",
        headers=auth_header("admin-1", "admin"),
        json={"key": "platform_commission_rate", "value": "0.15", "reason": "confirm approved rate"},
    )
    assert created.status_code == 200, created.text

    missing_reason = await client.post(
        "/api/v1/admin/settings/update",
        headers=auth_header("admin-1", "admin"),
        json={"key": "platform_commission_rate", "value": "0.10"},
    )
    assert missing_reason.status_code == 400

    from models.commerce import SettingsAuditLog

    async with SessionLocal() as session:
        rows = (await session.execute(select(SettingsAuditLog))).scalars().all()
        assert len(rows) == 1
        assert rows[0].actor_id == "admin-1"
        assert rows[0].setting_key == "platform_commission_rate"
        assert rows[0].new_value == "0.15"
        assert rows[0].reason == "confirm approved rate"
