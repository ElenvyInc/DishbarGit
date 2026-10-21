import hashlib
import hmac
import json
import time

import pytest
import stripe
from sqlalchemy import select

from core.auth import create_access_token
from models.chefs import Chefs
from models.menu_items import Menu_items
from models.orders import Orders
from models.platform_settings import Platform_settings
from tests.conftest import SessionLocal


def auth_header(user_id: str, role: str = "user", email: str = "person@example.com") -> dict:
    token = create_access_token({"sub": user_id, "email": email, "role": role, "name": "Test"})
    return {"Authorization": f"Bearer {token}"}


def sign_webhook(payload: bytes, secret: str = "whsec_test_only") -> str:
    timestamp = int(time.time())
    signed = f"{timestamp}.".encode() + payload
    digest = hmac.new(secret.encode(), signed, hashlib.sha256).hexdigest()
    return f"t={timestamp},v1={digest}"


async def seed_meal(price: float = 45.0, max_orders: int = 20):
    async with SessionLocal() as session:
        session.add(Platform_settings(key="pilot_mode", value="false", description="test"))
        session.add(Platform_settings(key="platform_open", value="true", description="test"))
        session.add(Platform_settings(key="auto_tax_enabled", value="false", description="test"))
        session.add(Platform_settings(key="tax_rate", value="0.13", description="legacy"))
        chef = Chefs(user_id="cook-1", name="Test Cook", is_approved=True, is_active=True, city="Toronto")
        session.add(chef)
        await session.flush()
        item = Menu_items(
            user_id="cook-1",
            chef_id=chef.id,
            title="Kebab",
            price=price,
            is_available=True,
            max_orders=max_orders,
            reserved_quantity=0,
        )
        session.add(item)
        await session.commit()
        return chef.id, item.id


@pytest.mark.asyncio
async def test_checkout_charges_server_total_not_client_price(client, monkeypatch):
    _chef_id, item_id = await seed_meal()
    captured = {}

    def fake_create(**kwargs):
        captured.update(kwargs)

        class FakeSession:
            id = "cs_test_session"
            url = "https://checkout.stripe.test/pay/cs_test_session"

        return FakeSession()

    monkeypatch.setattr(stripe.checkout.Session, "create", fake_create)
    stripe.api_key = "sk_test_placeholder"

    response = await client.post(
        "/api/v1/payment/create_payment_session",
        headers=auth_header("customer-1"),
        json={
            "items": [{"id": item_id, "quantity": 1, "price": 0.01, "title": "tampered", "chef_id": 999}],
            "delivery_type": "pickup",
            "customer_name": "Customer One",
            "customer_phone": "4165550100",
            "allergen_acknowledged": True,
        },
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["customer_total_cents"] == 4635
    assert body["currency"] == "CAD"

    line_items = captured["line_items"]
    charged = sum(item["price_data"]["unit_amount"] * item["quantity"] for item in line_items)
    assert charged == 4635
    assert captured["success_url"].startswith("https://dishbar.ca/payment-success")

    async with SessionLocal() as session:
        order = (await session.execute(select(Orders))).scalar_one()
        assert order.commission_cents == 675
        assert order.service_fee_cents == 135
        assert order.customer_total_cents == 4635
        assert order.cook_share_cents == 3825
        assert order.platform_gross_cents == 810
        assert order.tax_cents == 0
        assert order.payment_status == "unpaid"
        assert order.stripe_session_id == "cs_test_session"
        snapshot = json.loads(order.fee_snapshot_json)
        assert snapshot["commission_rate"] == "0.15"
        assert snapshot["service_fee_rate"] == "0.03"
        assert snapshot["acceptance_policy"] == "not_configured"


@pytest.mark.asyncio
async def test_quote_matches_approved_example_and_ignores_client_price(client):
    _chef_id, item_id = await seed_meal()
    response = await client.post(
        "/api/v1/payment/quote",
        json={"items": [{"id": item_id, "quantity": 1, "price": 1}], "delivery_type": "pickup"},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["commission"] == "6.75"
    assert body["service_fee"] == "1.35"
    assert body["customer_total"] == "46.35"
    assert body["cook_share"] == "38.25"
    assert body["platform_gross"] == "8.10"
    assert body["tax_applied"] is False


@pytest.mark.asyncio
async def test_mixed_cook_cart_is_rejected(client):
    async with SessionLocal() as session:
        session.add(Platform_settings(key="pilot_mode", value="false", description="test"))
        first = Chefs(user_id="cook-a", name="A", is_approved=True, is_active=True)
        second = Chefs(user_id="cook-b", name="B", is_approved=True, is_active=True)
        session.add_all([first, second])
        await session.flush()
        meal_a = Menu_items(user_id="cook-a", chef_id=first.id, title="A", price=10, is_available=True, max_orders=5, reserved_quantity=0)
        meal_b = Menu_items(user_id="cook-b", chef_id=second.id, title="B", price=10, is_available=True, max_orders=5, reserved_quantity=0)
        session.add_all([meal_a, meal_b])
        await session.commit()
        ids = (meal_a.id, meal_b.id)

    response = await client.post(
        "/api/v1/payment/quote",
        json={"items": [{"id": ids[0], "quantity": 1}, {"id": ids[1], "quantity": 1}], "delivery_type": "pickup"},
    )
    assert response.status_code == 400
    assert "one cook" in response.json()["detail"]


@pytest.mark.asyncio
async def test_redirect_host_must_be_allowlisted(client, monkeypatch):
    _chef_id, item_id = await seed_meal()
    monkeypatch.setattr(stripe.checkout.Session, "create", lambda **kwargs: (_ for _ in ()).throw(AssertionError("stripe")))
    stripe.api_key = "sk_test_placeholder"
    response = await client.post(
        "/api/v1/payment/create_payment_session",
        headers={**auth_header("customer-1"), "App-Host": "https://evil.example"},
        json={
            "items": [{"id": item_id, "quantity": 1}],
            "delivery_type": "pickup",
            "customer_name": "Customer One",
            "customer_phone": "4165550100",
            "allergen_acknowledged": True,
        },
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Redirect host is not allowed"


@pytest.mark.asyncio
async def test_unapproved_cook_and_bad_quantity_are_rejected(client):
    async with SessionLocal() as session:
        session.add(Platform_settings(key="pilot_mode", value="false", description="test"))
        chef = Chefs(user_id="cook-1", name="Pending", is_approved=False, is_active=True)
        session.add(chef)
        await session.flush()
        item = Menu_items(
            user_id="cook-1",
            chef_id=chef.id,
            title="Soup",
            price=45,
            is_available=True,
            max_orders=5,
            reserved_quantity=0,
        )
        session.add(item)
        await session.commit()
        item_id = item.id

    pending = await client.post(
        "/api/v1/payment/quote",
        json={"items": [{"id": item_id, "quantity": 1}], "delivery_type": "pickup"},
    )
    assert pending.status_code == 400

    invalid = await client.post(
        "/api/v1/payment/quote",
        json={"items": [{"id": item_id, "quantity": 0}], "delivery_type": "pickup"},
    )
    assert invalid.status_code == 422


async def _order_for_webhook():
    async with SessionLocal() as session:
        chef = Chefs(user_id="cook-1", name="Cook", is_approved=True, is_active=True)
        session.add(chef)
        await session.flush()
        order = Orders(
            user_id="customer-1",
            chef_id=chef.id,
            total_amount=46.35,
            status="pending_payment",
            payment_status="unpaid",
            customer_total_cents=4635,
            currency="CAD",
            stripe_session_id="cs_test_session",
        )
        session.add(order)
        await session.commit()
        return order.id


def _event(event_id: str, event_type: str, payment_status: str, amount: int = 4635, order_id: int = 1):
    payload = {
        "id": event_id,
        "object": "event",
        "type": event_type,
        "data": {
            "object": {
                "id": "cs_test_session",
                "object": "checkout.session",
                "payment_status": payment_status,
                "status": "complete",
                "amount_total": amount,
                "currency": "cad",
                "metadata": {"order_id": str(order_id), "user_id": "customer-1"},
                "payment_intent": "pi_test",
            }
        },
    }
    body = json.dumps(payload).encode()
    return body, sign_webhook(body)


@pytest.mark.asyncio
async def test_webhook_requires_signature_and_paid_status_and_is_idempotent(client):
    order_id = await _order_for_webhook()

    unsigned = await client.post("/api/v1/payment/webhook", content=b"{}")
    assert unsigned.status_code == 400

    bad = await client.post(
        "/api/v1/payment/webhook",
        content=b"{}",
        headers={"Stripe-Signature": "t=1,v1=deadbeef"},
    )
    assert bad.status_code == 400

    not_paid, signature = _event("evt_not_paid", "checkout.session.completed", "unpaid", order_id=order_id)
    first = await client.post("/api/v1/payment/webhook", content=not_paid, headers={"Stripe-Signature": signature})
    assert first.status_code == 200, first.text
    async with SessionLocal() as session:
        order = await session.get(Orders, order_id)
        assert order.payment_status == "unpaid"

    paid, paid_signature = _event("evt_paid", "checkout.session.completed", "paid", order_id=order_id)
    paid_response = await client.post("/api/v1/payment/webhook", content=paid, headers={"Stripe-Signature": paid_signature})
    assert paid_response.status_code == 200, paid_response.text
    assert paid_response.json()["outcome"] == "paid"

    duplicate = await client.post("/api/v1/payment/webhook", content=paid, headers={"Stripe-Signature": paid_signature})
    assert duplicate.status_code == 200
    assert duplicate.json()["duplicate"] is True

    expired, expired_signature = _event("evt_expired", "checkout.session.expired", "unpaid", order_id=order_id)
    later = await client.post("/api/v1/payment/webhook", content=expired, headers={"Stripe-Signature": expired_signature})
    assert later.status_code == 200, later.text
    assert later.json()["outcome"] == "ignored_after_paid"

    async with SessionLocal() as session:
        order = await session.get(Orders, order_id)
        assert order.payment_status == "paid"
        assert order.status == "awaiting_acceptance"
        assert order.stripe_amount_total == 4635


@pytest.mark.asyncio
async def test_webhook_amount_mismatch_does_not_mark_paid(client):
    order_id = await _order_for_webhook()
    body, signature = _event("evt_wrong_amount", "checkout.session.completed", "paid", amount=100, order_id=order_id)
    response = await client.post("/api/v1/payment/webhook", content=body, headers={"Stripe-Signature": signature})
    assert response.status_code == 200, response.text
    assert response.json()["outcome"] == "amount_mismatch"
    async with SessionLocal() as session:
        order = await session.get(Orders, order_id)
        assert order.payment_status == "review_required"
