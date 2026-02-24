"""
Credit service for handling credit operations.
"""

from typing import Optional
from uuid import UUID

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.credit import Credit, CreditTransaction, TransactionStatus, TransactionType


class CreditService:
    """Service class for credit operations."""
    
    # Credit costs for different operations
    INTERVIEW_CREDIT_COST = 10
    PRESENTATION_CREDIT_COST = 15
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_or_create_credit(self, user_id: UUID) -> Credit:
        """Get or create credit record for user."""
        result = await self.db.execute(select(Credit).where(Credit.user_id == user_id))
        credit = result.scalar_one_or_none()
        
        if not credit:
            credit = Credit(
                user_id=user_id,
                balance=0,
                lifetime_earned=0,
                lifetime_used=0,
            )
            self.db.add(credit)
            await self.db.commit()
            await self.db.refresh(credit)
        
        return credit
    
    async def get_balance(self, user_id: UUID) -> int:
        """Get user's credit balance."""
        credit = await self.get_or_create_credit(user_id)
        return credit.balance
    
    async def has_sufficient_credits(self, user_id: UUID, amount: int) -> bool:
        """Check if user has sufficient credits."""
        balance = await get_balance(self, user_id)
        return balance >= amount
    
    async def add_credits(
        self,
        user_id: UUID,
        amount: int,
        transaction_type: TransactionType,
        description: Optional[str] = None,
        payment_id: Optional[UUID] = None,
        package_name: Optional[str] = None,
        metadata_json: Optional[str] = None,
    ) -> CreditTransaction:
        """Add credits to user's account."""
        credit = await self.get_or_create_credit(user_id)
        
        # Update balance
        credit.add_credits(amount)
        
        # Create transaction record
        transaction = CreditTransaction(
            credit_id=credit.id,
            user_id=user_id,
            amount=amount,
            type=transaction_type,
            status=TransactionStatus.COMPLETED,
            description=description,
            payment_id=payment_id,
            package_name=package_name,
            metadata_json=metadata_json,
        )
        
        self.db.add(transaction)
        await self.db.commit()
        await self.db.refresh(transaction)
        
        return transaction
    
    async def deduct_credits(
        self,
        user_id: UUID,
        amount: int,
        simulation_type: str,
        simulation_id: UUID,
        description: Optional[str] = None,
    ) -> Optional[CreditTransaction]:
        """
        Deduct credits from user's account.
        Returns transaction if successful, None if insufficient balance.
        """
        credit = await self.get_or_create_credit(user_id)
        
        # Check balance
        if not credit.deduct_credits(amount):
            return None
        
        # Create transaction record (negative amount for deduction)
        transaction = CreditTransaction(
            credit_id=credit.id,
            user_id=user_id,
            amount=-amount,
            type=TransactionType.USAGE,
            status=TransactionStatus.COMPLETED,
            simulation_type=simulation_type,
            simulation_id=simulation_id,
            description=description or f"Used for {simulation_type}",
        )
        
        self.db.add(transaction)
        await self.db.commit()
        await self.db.refresh(transaction)
        
        return transaction
    
    async def check_and_deduct_simulation_credits(
        self,
        user_id: UUID,
        simulation_type: str,
        simulation_id: UUID,
    ) -> tuple[bool, int]:
        """
        Check and deduct credits for a simulation.
        Returns (success, remaining_balance).
        """
        # Determine cost
        if simulation_type == "interview":
            cost = self.INTERVIEW_CREDIT_COST
        elif simulation_type == "presentation":
            cost = self.PRESENTATION_CREDIT_COST
        else:
            return False, 0
        
        # Try to deduct
        transaction = await self.deduct_credits(
            user_id=user_id,
            amount=cost,
            simulation_type=simulation_type,
            simulation_id=simulation_id,
        )
        
        if not transaction:
            balance = await self.get_balance(user_id)
            return False, balance
        
        balance = await self.get_balance(user_id)
        return True, balance
    
    async def get_transaction_history(
        self,
        user_id: UUID,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[CreditTransaction], int]:
        """Get user's transaction history."""
        # Get total count
        count_result = await self.db.execute(
            select(func.count()).where(CreditTransaction.user_id == user_id)
        )
        total_count = count_result.scalar()
        
        # Get transactions
        offset = (page - 1) * page_size
        result = await self.db.execute(
            select(CreditTransaction)
            .where(CreditTransaction.user_id == user_id)
            .order_by(desc(CreditTransaction.created_at))
            .offset(offset)
            .limit(page_size)
        )
        
        transactions = list(result.scalars().all())
        return transactions, total_count
    
    async def get_credit_summary(self, user_id: UUID) -> dict:
        """Get credit summary for user."""
        credit = await self.get_or_create_credit(user_id)
        
        # Get recent transactions
        transactions, _ = await self.get_transaction_history(user_id, page=1, page_size=5)
        
        return {
            "current_balance": credit.balance,
            "total_earned": credit.lifetime_earned,
            "total_used": credit.lifetime_used,
            "recent_transactions": transactions,
        }
