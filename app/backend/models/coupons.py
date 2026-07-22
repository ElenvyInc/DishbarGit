from core.database import Base
from datetime import datetime
from sqlalchemy import Boolean, Column, Date, DateTime, Float, Integer, String


class Coupons(Base):
    __tablename__ = "coupons"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    code = Column(String(50), nullable=False)
    discount_percent = Column(Float, nullable=True)
    discount_amount = Column(Float, nullable=True)
    min_order_amount = Column(Float, nullable=True, default=0, server_default='0')
    max_uses = Column(Integer, nullable=True, default=100, server_default='100')
    used_count = Column(Integer, nullable=True, default=0, server_default='0')
    is_active = Column(Boolean, nullable=True, default=True, server_default='true')
    expires_at = Column(Date, nullable=True)
    chef_id = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)