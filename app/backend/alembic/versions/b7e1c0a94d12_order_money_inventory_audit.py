"""Add order fee snapshots, inventory holds, webhook idempotency, and setting audits.

Revision ID: b7e1c0a94d12
Revises: 97237934d4ed
Create Date: 2026-10-21

Upgrade only adds columns and tables. It does not delete or rewrite existing rows.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b7e1c0a94d12"
down_revision: Union[str, Sequence[str], None] = "97237934d4ed"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("food_subtotal_cents", sa.Integer(), nullable=True))
    op.add_column("orders", sa.Column("service_fee_cents", sa.Integer(), nullable=True))
    op.add_column("orders", sa.Column("commission_cents", sa.Integer(), nullable=True))
    op.add_column("orders", sa.Column("delivery_fee_cents", sa.Integer(), nullable=True))
    op.add_column("orders", sa.Column("tax_cents", sa.Integer(), nullable=True))
    op.add_column("orders", sa.Column("customer_total_cents", sa.Integer(), nullable=True))
    op.add_column("orders", sa.Column("cook_share_cents", sa.Integer(), nullable=True))
    op.add_column("orders", sa.Column("platform_gross_cents", sa.Integer(), nullable=True))
    op.add_column("orders", sa.Column("currency", sa.String(length=3), nullable=True))
    op.add_column("orders", sa.Column("fee_snapshot_json", sa.Text(), nullable=True))
    op.add_column("orders", sa.Column("stripe_amount_total", sa.Integer(), nullable=True))
    op.add_column("orders", sa.Column("stripe_payment_intent_id", sa.String(length=300), nullable=True))

    op.add_column(
        "menu_items",
        sa.Column("reserved_quantity", sa.Integer(), nullable=True, server_default="0"),
    )

    op.create_table(
        "inventory_reservations",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("menu_item_id", sa.Integer(), nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=True),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=30), server_default="reserved", nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_inventory_reservations_id", "inventory_reservations", ["id"])
    op.create_index("ix_inventory_reservations_menu_item_id", "inventory_reservations", ["menu_item_id"])
    op.create_index("ix_inventory_reservations_order_id", "inventory_reservations", ["order_id"])

    op.create_table(
        "stripe_webhook_events",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("event_id", sa.String(length=255), nullable=False),
        sa.Column("event_type", sa.String(length=120), nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=True),
        sa.Column("outcome", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("event_id"),
    )
    op.create_index("ix_stripe_webhook_events_id", "stripe_webhook_events", ["id"])
    op.create_index("ix_stripe_webhook_events_event_id", "stripe_webhook_events", ["event_id"])

    op.create_table(
        "settings_audit_log",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("actor_id", sa.String(length=200), nullable=False),
        sa.Column("actor_role", sa.String(length=50), nullable=False),
        sa.Column("setting_key", sa.String(length=100), nullable=False),
        sa.Column("old_value", sa.Text(), nullable=True),
        sa.Column("new_value", sa.Text(), nullable=True),
        sa.Column("reason", sa.String(length=500), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_settings_audit_log_id", "settings_audit_log", ["id"])


def downgrade() -> None:
    op.drop_index("ix_settings_audit_log_id", table_name="settings_audit_log")
    op.drop_table("settings_audit_log")
    op.drop_index("ix_stripe_webhook_events_event_id", table_name="stripe_webhook_events")
    op.drop_index("ix_stripe_webhook_events_id", table_name="stripe_webhook_events")
    op.drop_table("stripe_webhook_events")
    op.drop_index("ix_inventory_reservations_order_id", table_name="inventory_reservations")
    op.drop_index("ix_inventory_reservations_menu_item_id", table_name="inventory_reservations")
    op.drop_index("ix_inventory_reservations_id", table_name="inventory_reservations")
    op.drop_table("inventory_reservations")
    op.drop_column("menu_items", "reserved_quantity")
    for column in (
        "stripe_payment_intent_id",
        "stripe_amount_total",
        "fee_snapshot_json",
        "currency",
        "platform_gross_cents",
        "cook_share_cents",
        "customer_total_cents",
        "tax_cents",
        "delivery_fee_cents",
        "commission_cents",
        "service_fee_cents",
        "food_subtotal_cents",
    ):
        op.drop_column("orders", column)
