"""
Application dependencies for FastAPI.
"""

from typing import Optional

from fastapi import Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_db
from app.services.credit_service import CreditService
from app.services.payment_service import PaymentService
from app.services.user_service import UserService


async def get_user_service(db: AsyncSession = Depends(get_async_db)) -> UserService:
    """Get user service instance."""
    return UserService(db)


async def get_credit_service(db: AsyncSession = Depends(get_async_db)) -> CreditService:
    """Get credit service instance."""
    return CreditService(db)


async def get_payment_service(db: AsyncSession = Depends(get_async_db)) -> PaymentService:
    """Get payment service instance."""
    return PaymentService(db)


class PaginationParams:
    """Pagination parameters dependency."""
    
    def __init__(
        self,
        page: int = Query(1, ge=1, description="Page number"),
        page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    ):
        self.page = page
        self.page_size = page_size
        self.offset = (page - 1) * page_size


async def verify_simulation_credits(
    simulation_type: str,
    user_id: str,
    db: AsyncSession = Depends(get_async_db),
) -> bool:
    """
    Verify user has sufficient credits for simulation.
    
    Args:
        simulation_type: Type of simulation
        user_id: User ID
        db: Database session
    
    Returns:
        True if user has sufficient credits
    
    Raises:
        HTTPException: If insufficient credits
    """
    from uuid import UUID
    
    credit_service = CreditService(db)
    user_uuid = UUID(user_id)
    
    # Get required credits
    if simulation_type == "interview":
        required = CreditService.INTERVIEW_CREDIT_COST
    elif simulation_type == "presentation":
        required = CreditService.PRESENTATION_CREDIT_COST
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid simulation type"
        )
    
    # Check balance
    balance = await credit_service.get_balance(user_uuid)
    
    if balance < required:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "message": "Insufficient credits",
                "required": required,
                "available": balance,
                "shortfall": required - balance,
            }
        )
    
    return True
