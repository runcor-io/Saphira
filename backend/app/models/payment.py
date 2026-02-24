"""
Payment model for handling credit purchases.
"""

import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import BaseModel


class PaymentStatus(str, PyEnum):
    """Payment status enumeration."""
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCESS = "success"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"


class PaymentMethod(str, PyEnum):
    """Payment method enumeration."""
    CARD = "card"
    BANK_TRANSFER = "bank_transfer"
    USSD = "ussd"
    MOBILE_MONEY = "mobile_money"
    QR = "qr"


class Payment(BaseModel):
    """Payment transaction model."""
    
    __tablename__ = "payments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Payment details
    paystack_reference = Column(String(100), unique=True, nullable=False, index=True)
    paystack_transaction_id = Column(String(100), unique=True, nullable=True)
    
    # Amount (stored in kobo/smallest currency unit)
    amount_kobo = Column(Integer, nullable=False)
    currency = Column(String(3), default="NGN", nullable=False)
    
    # Package info
    package_name = Column(String(100), nullable=False)
    credits_purchased = Column(Integer, nullable=False)
    
    # Status
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    payment_method = Column(Enum(PaymentMethod), nullable=True)
    
    # Metadata
    customer_email = Column(String(255), nullable=False)
    customer_phone = Column(String(20), nullable=True)
    metadata_json = Column(JSONB, default=dict, nullable=True)
    
    # Timestamps
    paid_at = Column(DateTime(timezone=True), nullable=True)
    failed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Error tracking
    failure_message = Column(Text, nullable=True)
    gateway_response = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="payments")
    credit_transactions = relationship("CreditTransaction", back_populates="payment")
    
    @property
    def amount_naira(self) -> float:
        """Get amount in Naira."""
        return self.amount_kobo / 100
    
    def __repr__(self) -> str:
        return f"<Payment(id={self.id}, ref={self.paystack_reference}, amount={self.amount_kobo}, status={self.status})>"


class CreditPackage(BaseModel):
    """
    Credit package model for available purchase options.
    This is a reference table for available packages.
    """
    
    __tablename__ = "credit_packages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Package details
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Pricing (in kobo)
    price_kobo = Column(Integer, nullable=False)
    currency = Column(String(3), default="NGN", nullable=False)
    
    # Credits
    credits_amount = Column(Integer, nullable=False)
    bonus_credits = Column(Integer, default=0, nullable=False)
    
    # Features
    features = Column(JSONB, default=list, nullable=True)  # List of features included
    is_popular = Column(String(1), default="N", nullable=False)  # Mark as popular choice
    
    # Status
    is_active = Column(String(1), default="Y", nullable=False)
    display_order = Column(Integer, default=0, nullable=False)
    
    @property
    def price_naira(self) -> float:
        """Get price in Naira."""
        return self.price_kobo / 100
    
    @property
    def total_credits(self) -> int:
        """Get total credits including bonus."""
        return self.credits_amount + self.bonus_credits
    
    def __repr__(self) -> str:
        return f"<CreditPackage(name={self.name}, credits={self.total_credits}, price={self.price_kobo})>"
