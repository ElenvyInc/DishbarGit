from decimal import Decimal

from services.pricing import calculate_order_money, cents_to_str, stripe_line_items


def test_cad_45_approved_breakdown_matches_stripe_charge():
    money = calculate_order_money(4500, {}, "pickup")

    assert cents_to_str(money.commission_cents) == "6.75"
    assert cents_to_str(money.service_fee_cents) == "1.35"
    assert cents_to_str(money.customer_total_cents) == "46.35"
    assert cents_to_str(money.cook_share_cents) == "38.25"
    assert cents_to_str(money.platform_gross_cents) == "8.10"
    assert money.tax_cents == 0
    assert money.auto_tax_enabled is False
    assert money.delivery_fee_cents == 0

    line_items = stripe_line_items(
        [{"name": "Meal", "unit_amount_cents": 4500, "quantity": 1}],
        money,
    )
    charged = sum(item["price_data"]["unit_amount"] * item["quantity"] for item in line_items)
    assert charged == 4635
    assert charged == money.customer_total_cents
    assert all(item["price_data"]["currency"] == "cad" for item in line_items)


def test_legacy_tax_rate_is_not_applied_and_fees_are_outside_tax():
    money = calculate_order_money(4500, {"tax_rate": "0.13"}, "pickup")
    assert money.tax_cents == 0
    assert money.customer_total_cents == 4635

    taxed = calculate_order_money(
        4500,
        {
            "auto_tax_enabled": "true",
            "tax_rules": '{"rules":[{"rate":"0.13","applies_to":"food_subtotal","enabled":true}]}',
        },
        "pickup",
    )
    assert taxed.tax_cents == 585
    assert taxed.customer_total_cents == 4500 + 135 + 585
    assert taxed.commission_cents == 675


def test_delivery_pricing_stays_off_by_default():
    money = calculate_order_money(
        4500,
        {"base_delivery_fee": "3.99", "tax_rate": "0.13"},
        "self_delivery",
    )
    assert money.delivery_fee_cents == 0
    assert money.delivery_fee_pending_policy is True
    assert money.customer_total_cents == 4635


def test_out_of_range_rate_falls_back_to_approved_defaults():
    money = calculate_order_money(
        4500,
        {"platform_commission_rate": "15", "customer_service_fee_rate": "-1"},
        "pickup",
    )
    assert money.commission_rate == Decimal("0.15")
    assert money.service_fee_rate == Decimal("0.03")
