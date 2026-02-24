"""
Payment Pydantic schemas.
"""

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.payment import PaymentMethod, PaymentStatus


# Credit Package Schemas
class CreditPackageCreate(BaseModel):
    """Schema for creating credit package (admin)."""
    name: str = Field(..., min_length=1, max_length=100)
    slug: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    price_kobo: int = Field(..., gt=0)
    currency: str = "NGN"
    credits_amount: int = Field(..., gt=0)
    bonus_credits: int = 0
    features: list[str] = Field(default_factory=list)
    is_popular: bool = False
    is_active: bool = True
    display_order: int = 0


class CreditPackageUpdate(BaseModel):
    """Schema for updating credit package (admin)."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    price_kobo: Optional[int] = Field(None, gt=0)
    credits_amount: Optional[int] = Field(None, gt=0)
    bonus_credits: Optional[int] = None
    features: Optional[list[str]] = None
    is_popular: Optional[bool] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


# Payment Initialize Schema
class PaymentInitializeRequest(BaseModel):
    """Schema for initializing payment."""
    package_slug: str
    email: Optional[str] = None  # Optional: override user's email
    callback_url: Optional[str] = None


class PaymentInitializeResponse(BaseModel):
    """Schema for payment initialization response."""
    authorization_url: str
    access_code: str
    reference: str


# Payment Response Schema
class PaymentResponse(BaseModel):
    """Schema for payment response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    paystack_reference: str
    amount_kobo: int
    amount_naira: float
    currency: str
    package_name: str
    credits_purchased: int
    status: PaymentStatus
    payment_method: Optional[PaymentMethod] = None
    paid_at: Optional[datetime] = None
    created_at: datetime


class PaymentDetailResponse(PaymentResponse):
    """Schema for detailed payment response."""
    paystack_transaction_id: Optional[str] = None
    customer_email: str
    customer_phone: Optional[str] = None
    gateway_response: Optional[str] = None
    failure_message: Optional[str] = None


# Payment List Schema
class PaymentListResponse(BaseModel):
    """Schema for payment list response."""
    payments: list[PaymentResponse]
    total_count: int
    page: int
    page_size: int


# Payment Verify Schema
class PaymentVerifyResponse(BaseModel):
    """Schema for payment verification response."""
    success: bool
    message: str
    payment: Optional[PaymentResponse] = None
    credits_added: int
    new_balance: int


# Paystack Webhook Schema
class PaystackWebhookPayload(BaseModel):
    """Schema for Paystack webhook payload."""
    event: str
    data: dict[str, Any]


# Transaction History Schema
class TransactionHistoryResponse(BaseModel):
    """Schema for transaction history response."""
    payments: list[PaymentResponse]
    total_spent_naira: float
    total_credits_purchased: int
