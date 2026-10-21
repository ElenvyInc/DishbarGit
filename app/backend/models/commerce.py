"""Tables added for fee snapshots, inventory holds, webhook idempotency, and setting audits."""

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text

from core.database import Base


class InventoryReservation(Base):
    __tablename__ = "inventory_reservations"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    menu_item_id = Column(Integer, nullable=False, index=True)
    order_id = Column(Integer, nullable=True, index=True)
    quantity = Column(Integer, nullable=False)
    status = Column(String(30), nullable=False, default="reserved", server_default="reserved")
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)


class StripeWebhookEvent(Base):
    __tablename__ = "stripe_webhook_events"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    event_id = Column(String(255), nullable=False, unique=True, index=True)
    event_type = Column(String(120), nullable=False)
    order_id = Column(Integer, nullable=True)
    outcome = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)


class SettingsAuditLog(Base):
    __tablename__ = "settings_audit_log"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    actor_id = Column(String(200), nullable=False)
    actor_role = Column(String(50), nullable=False)
    setting_key = Column(String(100), nullable=False)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    reason = Column(String(500), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
