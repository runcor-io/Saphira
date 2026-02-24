"""
Credit router for credit-related endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_async_db
from app.models.user import User
from app.schemas.credit import (
    CreditBalance,
    CreditHistoryResponse,
    CreditPackageResponse,
    CreditSummary,
    CreditTransactionResponse,
)
from app.services.credit_service import CreditService
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/credits", tags=["Credits"])


@router.get(
    "/balance",
    response_model=CreditBalance,
    summary="Get credit balance",
    description="Get the current credit balance for the authenticated user."
)
async def get_balance(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
) -> CreditBalance:
    """
    Get current user's credit balance.
    
    Returns the current balance, lifetime earned, and lifetime used credits.
    """
    credit_service = CreditService(db)
    credit = await credit_service.get_or_create_credit(current_user.id)
    
    return CreditBalance(
        balance=credit.balance,
        lifetime_earned=credit.lifetime_earned,
        lifetime_used=credit.lifetime_used,
    )


@router.get(
    "/packages",
    response_model=list[CreditPackageResponse],
    summary="Get credit packages",
    description="Get all available credit packages for purchase."
)
async def get_credit_packages(
    db: AsyncSession = Depends(get_async_db)
) -> list[CreditPackageResponse]:
    """
    Get all available credit packages.
    
    Returns a list of active credit packages sorted by display order.
    """
    payment_service = PaymentService(db)
    packages = await payment_service.get_all_credit_packages()
    
    return [
        CreditPackageResponse(
            id=pkg.id,
            name=pkg.name,
            slug=pkg.slug,
            description=pkg.description,
            price_kobo=pkg.price_kobo,
            price_naira=pkg.price_naira,
            currency=pkg.currency,
            credits_amount=pkg.credits_amount,
            bonus_credits=pkg.bonus_credits,
            total_credits=pkg.total_credits,
            features=pkg.features or [],
            is_popular=pkg.is_popular == "Y",
            is_active=pkg.is_active == "Y",
            display_order=pkg.display_order,
        )
        for pkg in packages
    ]


@router.get(
    "/history",
    response_model=CreditHistoryResponse,
    summary="Get transaction history",
    description="Get the credit transaction history for the authenticated user."
)
async def get_transaction_history(
    page: int = 1,
    page_size: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
) -> CreditHistoryResponse:
    """
    Get credit transaction history.
    
    - **page**: Page number (default: 1)
    - **page_size**: Number of transactions per page (default: 20)
    """
    credit_service = CreditService(db)
    transactions, total_count = await credit_service.get_transaction_history(
        user_id=current_user.id,
        page=page,
        page_size=page_size,
    )
    
    return CreditHistoryResponse(
        transactions=[
            CreditTransactionResponse.model_validate(t) for t in transactions
        ],
        total_count=total_count,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/summary",
    response_model=CreditSummary,
    summary="Get credit summary",
    description="Get a summary of credits including balance and recent transactions."
)
async def get_credit_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
) -> CreditSummary:
    """
    Get credit summary including:
    - Current balance
    - Total earned and used
    - Recent transactions
    - Available packages
    """
    credit_service = CreditService(db)
    payment_service = PaymentService(db)
    
    # Get credit summary
    summary = await credit_service.get_credit_summary(current_user.id)
    
    # Get available packages
    packages = await payment_service.get_all_credit_packages()
    
    return CreditSummary(
        current_balance=summary["current_balance"],
        total_earned=summary["total_earned"],
        total_spent=summary["total_used"],
        recent_transactions=[
            CreditTransactionResponse.model_validate(t)
            for t in summary["recent_transactions"]
        ],
        available_packages=[
            CreditPackageResponse(
                id=pkg.id,
                name=pkg.name,
                slug=pkg.slug,
                description=pkg.description,
                price_kobo=pkg.price_kobo,
                price_naira=pkg.price_naira,
                currency=pkg.currency,
                credits_amount=pkg.credits_amount,
                bonus_credits=pkg.bonus_credits,
                total_credits=pkg.total_credits,
                features=pkg.features or [],
                is_popular=pkg.is_popular == "Y",
                is_active=pkg.is_active == "Y",
                display_order=pkg.display_order,
            )
            for pkg in packages
        ],
    )


@router.get(
    "/costs",
    summary="Get credit costs",
    description="Get the credit costs for different simulation types."
)
async def get_credit_costs() -> dict:
    """
    Get credit costs for simulations.
    
    Returns the number of credits required for each simulation type.
    """
    return {
        "interview": CreditService.INTERVIEW_CREDIT_COST,
        "presentation": CreditService.PRESENTATION_CREDIT_COST,
    }
