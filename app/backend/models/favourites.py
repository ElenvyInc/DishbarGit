from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String


class Favourites(Base):
    __tablename__ = "favourites"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    chef_id = Column(Integer, nullable=False)
    menu_item_id = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)