"""Validation and audit records for platform settings.

Financial changes require a reason and are appended to settings_audit_log.
Nothing here decides tax, payout, or delivery policy; it only records what an
admin explicitly stored.
"""

from __future__ import annotations

import json
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from models.commerce import SettingsAuditLog

FINANCIAL_KEYS = frozenset(
    {
        "platform_commission_rate",
        "customer_service_fee_rate",
        "tax_rate",
        "tax_rules",
        "auto_tax_enabled",
        "tax_configuration_reviewed",
        "cook_delivery_approved",
        "minimum_order_amount",
        "minimum_order_enforced",
        "base_delivery_fee",
        "per_km_fee",
        "max_delivery_fee",
        "included_distance_km",
        "delivery_pricing_enabled",
        "free_pickup",
        "manual_payouts",
    }
)
RATE_KEYS = frozenset({"platform_commission_rate", "customer_service_fee_rate", "tax_rate"})
BOOL_KEYS = frozenset(
    {
        "auto_tax_enabled",
        "tax_configuration_reviewed",
        "cook_delivery_approved",
        "minimum_order_enforced",
        "delivery_pricing_enabled",
        "pilot_mode",
        "platform_open",
        "free_pickup",
        "manual_payouts",
    }
)


def is_financial_key(key: str) -> bool:
    return key in FINANCIAL_KEYS or key.startswith("refund_") or key.startswith("promo_")


def validate_setting_value(key: str, value: str) -> None:
    if key in RATE_KEYS:
        try:
            rate = Decimal(str(value))
        except Exception as exc:
            raise ValueError("Rate must be a decimal between 0 and 0.50") from exc
        if rate < 0 or rate > Decimal("0.50"):
            raise ValueError("Rate must be between 0 and 0.50")
    if key in BOOL_KEYS and str(value).strip().lower() not in {"true", "false"}:
        raise ValueError("Expected true or false")
    if key in {"minimum_order_amount", "base_delivery_fee", "per_km_fee", "max_delivery_fee"}:
        try:
            amount = Decimal(str(value))
        except Exception as exc:
            raise ValueError("Amount must be a decimal") from exc
        if amount < 0 or amount > Decimal("10000"):
            raise ValueError("Amount is out of range")
    if key == "tax_rules":
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError as exc:
            raise ValueError("tax_rules must be JSON") from exc
        if not isinstance(parsed, dict):
            raise ValueError("tax_rules must be a JSON object")


async def audit_setting_change(
    db: AsyncSession,
    *,
    actor_id: str,
    actor_role: str,
    key: str,
    old_value: str | None,
    new_value: str | None,
    reason: str | None,
) -> None:
    if new_value is not None:
        try:
            validate_setting_value(key, new_value)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not is_financial_key(key) or old_value == new_value:
        return

    if not reason or not str(reason).strip():
        raise HTTPException(status_code=400, detail="A reason is required when changing a financial setting")

    db.add(
        SettingsAuditLog(
            actor_id=str(actor_id),
            actor_role=str(actor_role or ""),
            setting_key=key,
            old_value=old_value,
            new_value=new_value,
            reason=str(reason).strip()[:500],
        )
    )
