"""Authoritative DishBar order money.

Approved defaults, used only when a setting is missing or out of range:
cook commission is 15% of the food subtotal and is deducted from the cook.
The customer service fee is 3% of the food subtotal and is added for the customer.
Fees are not calculated on tax. Amounts are integer cents (half-up).
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Mapping, Optional

APPROVED_COMMISSION_RATE = Decimal("0.15")
APPROVED_SERVICE_FEE_RATE = Decimal("0.03")
MAX_RATE = Decimal("0.50")
MAX_TAX_RATE = Decimal("0.25")
CURRENCY = "cad"


class PricingError(ValueError):
    """A cart or rate cannot be priced safely."""


def price_to_cents(price: Any) -> int:
    cents = (Decimal(str(price)) * Decimal("100")).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    return int(cents)


def cents_to_decimal(cents: int) -> Decimal:
    return (Decimal(int(cents)) / Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def cents_to_str(cents: int) -> str:
    return f"{cents_to_decimal(cents):.2f}"


def percent_of_cents(cents: int, rate: Decimal) -> int:
    if cents < 0:
        raise PricingError("Amount cannot be negative")
    amount = (Decimal(int(cents)) * rate).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    return int(amount)


def rate_label(rate: Decimal) -> str:
    percent = (rate * Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    text = format(percent, "f").rstrip("0").rstrip(".")
    return f"{text}%"


def bounded_rate(raw: Any, default: Decimal) -> Decimal:
    try:
        rate = Decimal(str(raw))
    except Exception:
        return default
    if rate < 0 or rate > MAX_RATE:
        return default
    return rate


@dataclass(frozen=True)
class OrderMoney:
    currency: str
    food_subtotal_cents: int
    commission_cents: int
    service_fee_cents: int
    delivery_fee_cents: int
    tax_cents: int
    customer_total_cents: int
    cook_share_cents: int
    platform_gross_cents: int
    commission_rate: Decimal
    service_fee_rate: Decimal
    auto_tax_enabled: bool
    tax_applied: bool
    delivery_pricing_enabled: bool
    delivery_fee_pending_policy: bool

    def as_snapshot(self, tax_rules: Any, acceptance_policy: str = "not_configured") -> dict:
        return {
            "currency": self.currency.upper(),
            "food_subtotal_cents": self.food_subtotal_cents,
            "commission_rate": format(self.commission_rate, "f"),
            "service_fee_rate": format(self.service_fee_rate, "f"),
            "commission_cents": self.commission_cents,
            "service_fee_cents": self.service_fee_cents,
            "delivery_fee_cents": self.delivery_fee_cents,
            "tax_cents": self.tax_cents,
            "customer_total_cents": self.customer_total_cents,
            "cook_share_cents": self.cook_share_cents,
            "platform_gross_cents": self.platform_gross_cents,
            "auto_tax_enabled": self.auto_tax_enabled,
            "tax_applied": self.tax_applied,
            "tax_rules": tax_rules,
            "delivery_pricing_enabled": self.delivery_pricing_enabled,
            "delivery_fee_pending_policy": self.delivery_fee_pending_policy,
            "fees_applied_to_tax": False,
            "acceptance_policy": acceptance_policy,
        }

    def public_dict(self) -> dict:
        return {
            "currency": self.currency.upper(),
            "food_subtotal_cents": self.food_subtotal_cents,
            "commission_cents": self.commission_cents,
            "service_fee_cents": self.service_fee_cents,
            "delivery_fee_cents": self.delivery_fee_cents,
            "tax_cents": self.tax_cents,
            "customer_total_cents": self.customer_total_cents,
            "cook_share_cents": self.cook_share_cents,
            "platform_gross_cents": self.platform_gross_cents,
            "food_subtotal": cents_to_str(self.food_subtotal_cents),
            "commission": cents_to_str(self.commission_cents),
            "service_fee": cents_to_str(self.service_fee_cents),
            "delivery_fee": cents_to_str(self.delivery_fee_cents),
            "tax": cents_to_str(self.tax_cents),
            "customer_total": cents_to_str(self.customer_total_cents),
            "cook_share": cents_to_str(self.cook_share_cents),
            "platform_gross": cents_to_str(self.platform_gross_cents),
            "commission_rate": format(self.commission_rate, "f"),
            "service_fee_rate": format(self.service_fee_rate, "f"),
            "service_fee_rate_label": rate_label(self.service_fee_rate),
            "commission_rate_label": rate_label(self.commission_rate),
            "auto_tax_enabled": self.auto_tax_enabled,
            "tax_applied": self.tax_applied,
            "delivery_pricing_enabled": self.delivery_pricing_enabled,
            "delivery_fee_pending_policy": self.delivery_fee_pending_policy,
        }


def live_checkout_block_reason(settings: Mapping[str, Any]) -> Optional[str]:
    """Live checkout stays closed until an admin records a reviewed tax rule.

    A missing flag, a legacy tax_rate, or a blank rule list does not open checkout.
    An explicit enabled rule, including a reviewed 0% rule, does.
    """
    reviewed = str(settings.get("tax_configuration_reviewed", "false")).strip().lower() == "true"
    if not reviewed:
        return "Live checkout is paused until tax configuration is reviewed."
    _cents, _enabled, applied = resolve_tax_cents(0, settings)
    if not applied:
        return "Live checkout needs an explicit reviewed tax rule. A blank rate or the legacy tax_rate value does not open checkout."
    return None


def resolve_tax_cents(food_subtotal_cents: int, settings: Mapping[str, Any]) -> tuple[int, bool, bool]:
    """Tax is not applied unless auto tax is explicitly enabled and a rule matches.

    The legacy tax_rate setting is ignored. Fees are not part of the tax base.
    """
    enabled = str(settings.get("auto_tax_enabled", "false")).strip().lower() == "true"
    if not enabled:
        return 0, False, False

    raw = settings.get("tax_rules") or "{}"
    try:
        parsed = json.loads(raw) if isinstance(raw, str) else raw
    except (json.JSONDecodeError, TypeError):
        return 0, True, False
    rules = parsed.get("rules") if isinstance(parsed, dict) else None
    if not isinstance(rules, list):
        return 0, True, False

    total = 0
    applied = False
    for rule in rules:
        if not isinstance(rule, dict) or not rule.get("enabled", True):
            continue
        if str(rule.get("applies_to", "food_subtotal")) != "food_subtotal":
            continue
        try:
            rate = Decimal(str(rule.get("rate", "0")))
        except Exception:
            continue
        if rate < 0 or rate > MAX_TAX_RATE:
            continue
        total += percent_of_cents(food_subtotal_cents, rate)
        applied = True
    return total, True, applied


def resolve_delivery_fee_cents(delivery_type: str, settings: Mapping[str, Any]) -> tuple[int, bool, bool]:
    """Distance estimates are not used.

    Delivery pricing stays off until delivery_pricing_enabled is true. When it is
    on, only the configured flat base fee is charged. That flag defaults off.
    """
    if delivery_type == "pickup":
        return 0, False, False
    enabled = str(settings.get("delivery_pricing_enabled", "false")).strip().lower() == "true"
    if not enabled:
        return 0, False, True
    try:
        cents = price_to_cents(settings.get("base_delivery_fee", "0"))
    except Exception:
        cents = 0
    if cents < 0:
        cents = 0
    return cents, True, False


def calculate_order_money(
    food_subtotal_cents: int,
    settings: Optional[Mapping[str, Any]] = None,
    delivery_type: str = "pickup",
) -> OrderMoney:
    settings = settings or {}
    if food_subtotal_cents < 0:
        raise PricingError("Food subtotal cannot be negative")

    commission_rate = bounded_rate(settings.get("platform_commission_rate", APPROVED_COMMISSION_RATE), APPROVED_COMMISSION_RATE)
    service_fee_rate = bounded_rate(
        settings.get("customer_service_fee_rate", APPROVED_SERVICE_FEE_RATE),
        APPROVED_SERVICE_FEE_RATE,
    )
    commission_cents = percent_of_cents(food_subtotal_cents, commission_rate)
    service_fee_cents = percent_of_cents(food_subtotal_cents, service_fee_rate)
    delivery_fee_cents, delivery_enabled, delivery_pending = resolve_delivery_fee_cents(delivery_type, settings)
    tax_cents, auto_tax_enabled, tax_applied = resolve_tax_cents(food_subtotal_cents, settings)

    customer_total = food_subtotal_cents + service_fee_cents + delivery_fee_cents + tax_cents
    cook_share = food_subtotal_cents - commission_cents
    platform_gross = commission_cents + service_fee_cents
    if cook_share < 0 or customer_total < 0:
        raise PricingError("Calculated totals are not valid")

    return OrderMoney(
        currency=CURRENCY,
        food_subtotal_cents=food_subtotal_cents,
        commission_cents=commission_cents,
        service_fee_cents=service_fee_cents,
        delivery_fee_cents=delivery_fee_cents,
        tax_cents=tax_cents,
        customer_total_cents=customer_total,
        cook_share_cents=cook_share,
        platform_gross_cents=platform_gross,
        commission_rate=commission_rate,
        service_fee_rate=service_fee_rate,
        auto_tax_enabled=auto_tax_enabled,
        tax_applied=tax_applied,
        delivery_pricing_enabled=delivery_enabled,
        delivery_fee_pending_policy=delivery_pending,
    )


def stripe_line_items(item_lines: list[dict], money: OrderMoney) -> list[dict]:
    """Build Stripe Checkout line items whose sum is the customer total.

    item_lines: {"name", "unit_amount_cents", "quantity"} using server prices.
    Commission is not a customer line. The service fee, delivery, and tax are.
    """
    line_items = []
    for line in item_lines:
        line_items.append(
            {
                "price_data": {
                    "currency": money.currency,
                    "product_data": {"name": line["name"]},
                    "unit_amount": int(line["unit_amount_cents"]),
                },
                "quantity": int(line["quantity"]),
            }
        )
    if money.service_fee_cents > 0:
        line_items.append(_single_line("Service fee", money.service_fee_cents, money.currency))
    if money.delivery_fee_cents > 0:
        line_items.append(_single_line("Delivery fee", money.delivery_fee_cents, money.currency))
    if money.tax_cents > 0:
        line_items.append(_single_line("Tax", money.tax_cents, money.currency))
    charged = sum(item["price_data"]["unit_amount"] * item["quantity"] for item in line_items)
    if charged != money.customer_total_cents:
        raise PricingError("Stripe line items do not match the customer total")
    return line_items


def _single_line(name: str, cents: int, currency: str) -> dict:
    return {
        "price_data": {
            "currency": currency,
            "product_data": {"name": name},
            "unit_amount": int(cents),
        },
        "quantity": 1,
    }
