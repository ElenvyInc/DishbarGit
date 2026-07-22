from core.database import Base
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Integer, String


class Notifications(Base):
    __tablename__ = "notifications"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    title = Column(String(200), nullable=False)
    title_fa = Column(String(200), nullable=True)
    message = Column(String(1000), nullable=False)
    message_fa = Column(String(1000), nullable=True)
    type = Column(String(50), nullable=False)
    is_read = Column(Boolean, nullable=True, default=False, server_default='false')
    reference_id = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)