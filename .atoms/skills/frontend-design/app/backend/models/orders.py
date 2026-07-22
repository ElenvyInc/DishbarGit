from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, Integer, String


class Orders(Base):
    __tablename__ = "orders"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    chef_id = Column(Integer, nullable=False)
    items_json = Column(String, nullable=True)
    total_amount = Column(Float, nullable=False)
    commission_amount = Column(Float, nullable=True)
    chef_amount = Column(Float, nullable=True)
    status = Column(String(50), nullable=True, default='pending', server_default='pending')
    delivery_type = Column(String(50), nullable=True)
    delivery_address = Column(String(500), nullable=True)
    customer_name = Column(String(200), nullable=True)
    customer_phone = Column(String(50), nullable=True)
    stripe_session_id = Column(String(300), nullable=True)
    payment_status = Column(String(50), nullable=True, default='unpaid', server_default='unpaid')
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)