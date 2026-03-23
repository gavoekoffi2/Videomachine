from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    transaction_id = Column(String(255), unique=True)
    fedapay_id = Column(String(255))
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="XOF")
    status = Column(String(50), default="pending")  # pending, completed, failed, refunded
    payment_method = Column(String(100))  # mobile_money, card, etc.
    plan = Column(String(50))
    description = Column(Text)
    metadata = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))

    user = relationship("User", back_populates="payments")
