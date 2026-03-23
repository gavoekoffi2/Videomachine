from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), default="")
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    plan = Column(String(50), default="free")
    videos_generated = Column(Integer, default=0)
    videos_limit = Column(Integer, default=3)
    # Per-user MoneyPrinterV2 config (stored as JSON)
    mp_config = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True))

    tasks = relationship("Task", back_populates="owner")
    payments = relationship("Payment", back_populates="user")
