from core.database import Base
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String


class Chefs(Base):
    __tablename__ = "chefs"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    name = Column(String(200), nullable=False)
    name_fa = Column(String(200), nullable=True)
    bio = Column(String(1000), nullable=True)
    bio_fa = Column(String(1000), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    city = Column(String(100), nullable=True)
    province = Column(String(100), nullable=True)
    cuisine_tags = Column(String(500), nullable=True)
    rating = Column(Float, nullable=True, default=0, server_default='0')
    total_reviews = Column(Integer, nullable=True, default=0, server_default='0')
    is_approved = Column(Boolean, nullable=True, default=False, server_default='false')
    is_active = Column(Boolean, nullable=True, default=True, server_default='true')
    delivery_options = Column(String(200), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)