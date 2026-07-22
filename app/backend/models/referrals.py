from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, Integer, String


class Referrals(Base):
    __tablename__ = "referrals"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    referral_code = Column(String(20), nullable=False)
    referred_user_id = Column(String(100), nullable=True)
    reward_amount = Column(Float, nullable=True, default=5.0, server_default='5.0')
    status = Column(String(50), nullable=True, default='pending', server_default='pending')
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)