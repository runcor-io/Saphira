"""
Credit Pydantic schemas.
"""

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.credit import TransactionStatus, TransactionType


# Credit Balance Schema
class CreditBalance(BaseModel):
    """Schema for credit balance."""
    model_config = ConfigDict(from_attributes=True)
    
    balance: int
    lifetime_earned: int
    lifetime_used: int


# Credit Transaction Schema
class CreditTransactionResponse(BaseModel):
    """Schema for credit transaction response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    amount: int
    type: TransactionType
    status: TransactionStatus
    simulation_type: Optional[str] = None
    simulation_id: Optional[UUID] = None
    package_name: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime


# Credit Transaction Create Schema
class CreditTransactionCreate(BaseModel):
    """Schema for creating credit transaction."""
    amount: int
    type: TransactionType
    simulation_type: Optional[str] = None
    simulation_id: Optional[UUID] = None
    description: Optional[str] = None
    metadata_json: Optional[str] = None


# Credit Package Schema
class CreditPackageResponse(BaseModel):
    """Schema for credit package response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    name: str
    slug: str
    description: Optional[str] = None
    price_kobo: int
    price_naira: float
    currency: str
    credits_amount: int
    bonus_credits: int
    total_credits: int
    features: list[str]
    is_popular: bool
    is_active: bool
    display_order: int


# Credit Usage Request Schema
class CreditUsageRequest(BaseModel):
    """Schema for credit usage request."""
    simulation_type: str = Field(..., pattern="^(interview|presentation)$")
    simulation_id: Optional[UUID] = None
    credits_needed: int = Field(..., gt=0)


# Credit Purchase Response Schema
class CreditPurchaseResponse(BaseModel):
    """Schema for credit purchase response."""
    success: bool
    transaction_id: Optional[UUID] = None
    new_balance: Optional[int] = None
    message: str


# Credit History Response Schema
class CreditHistoryResponse(BaseModel):
    """Schema for credit history response."""
    transactions: list[CreditTransactionResponse]
    total_count: int
    page: int
    page_size: int


# Credit Summary Schema
class CreditSummary(BaseModel):
    """Schema for credit summary."""
    current_balance: int
    total_earned: int
    total_spent: int
    recent_transactions: list[CreditTransactionResponse]
    available_packages: list[CreditPackageResponse]
