"""
Credit model for tracking user credits and transactions.
"""

import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import BaseModel


class TransactionType(str, PyEnum):
    """Transaction type enumeration."""
    PURCHASE = "purchase"
    USAGE = "usage"
    BONUS = "bonus"
    REFUND = "refund"


class TransactionStatus(str, PyEnum):
    """Transaction status enumeration."""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Credit(BaseModel):
    """Credit model for tracking user's credit balance."""
    
    __tablename__ = "credits"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    balance = Column(Integer, default=0, nullable=False)
    lifetime_earned = Column(Integer, default=0, nullable=False)
    lifetime_used = Column(Integer, default=0, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="credits")
    transactions = relationship("CreditTransaction", back_populates="credit", cascade="all, delete-orphan")
    
    def add_credits(self, amount: int) -> None:
        """Add credits to balance."""
        self.balance += amount
        self.lifetime_earned += amount
    
    def deduct_credits(self, amount: int) -> bool:
        """Deduct credits from balance. Returns True if successful."""
        if self.balance >= amount:
            self.balance -= amount
            self.lifetime_used += amount
            return True
        return False
    
    def __repr__(self) -> str:
        return f"<Credit(user_id={self.user_id}, balance={self.balance})>"


class CreditTransaction(BaseModel):
    """Credit transaction model for tracking all credit movements."""
    
    __tablename__ = "credit_transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    credit_id = Column(UUID(as_uuid=True), ForeignKey("credits.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Transaction details
    amount = Column(Integer, nullable=False)  # Positive for credit, negative for debit
    type = Column(Enum(TransactionType), nullable=False)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.COMPLETED, nullable=False)
    
    # Usage tracking
    simulation_type = Column(String(50), nullable=True)  # "interview" or "presentation"
    simulation_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Purchase tracking
    payment_id = Column(UUID(as_uuid=True), ForeignKey("payments.id", ondelete="SET NULL"), nullable=True)
    package_name = Column(String(100), nullable=True)
    
    # Metadata
    description = Column(Text, nullable=True)
    metadata_json = Column(Text, nullable=True)  # JSON string for additional data
    
    # Relationships
    credit = relationship("Credit", back_populates="transactions")
    payment = relationship("Payment", back_populates="credit_transactions")
    
    def __repr__(self) -> str:
        return f"<CreditTransaction(id={self.id}, amount={self.amount}, type={self.type})>"
