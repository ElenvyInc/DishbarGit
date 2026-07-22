from core.database import Base
from datetime import datetime
from sqlalchemy import Boolean, Column, Date, DateTime, Float, Integer, String


class Menu_items(Base):
    __tablename__ = "menu_items"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    chef_id = Column(Integer, nullable=False)
    title = Column(String(200), nullable=False)
    title_fa = Column(String(200), nullable=True)
    description = Column(String(1000), nullable=True)
    description_fa = Column(String(1000), nullable=True)
    price = Column(Float, nullable=False)
    image_url = Column(String(500), nullable=True)
    category = Column(String(100), nullable=True)
    dietary_tags = Column(String(300), nullable=True)
    is_available = Column(Boolean, nullable=True, default=True, server_default='true')
    available_date = Column(Date, nullable=True)
    max_orders = Column(Integer, nullable=True, default=20, server_default='20')
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)