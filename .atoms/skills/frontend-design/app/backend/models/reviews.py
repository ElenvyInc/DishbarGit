from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String


class Reviews(Base):
    __tablename__ = "reviews"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    chef_id = Column(Integer, nullable=False)
    order_id = Column(Integer, nullable=True)
    rating = Column(Integer, nullable=False)
    comment = Column(String(1000), nullable=True)
    comment_fa = Column(String(1000), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)