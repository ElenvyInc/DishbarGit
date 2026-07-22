from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String


class Platform_settings(Base):
    __tablename__ = "platform_settings"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    key = Column(String(100), nullable=False)
    value = Column(String(2000), nullable=False)
    description = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)