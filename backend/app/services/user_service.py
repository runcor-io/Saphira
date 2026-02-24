"""
User service for handling user-related operations.
"""

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.password import hash_password, verify_password
from app.models.credit import Credit
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


class UserService:
    """Service class for user operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        """Get user by ID."""
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()
    
    async def create(self, user_data: UserCreate) -> User:
        """Create a new user."""
        # Hash password
        hashed_password = hash_password(user_data.password)
        
        # Create user
        user = User(
            email=user_data.email,
            hashed_password=hashed_password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            phone_number=user_data.phone_number,
        )
        
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        
        return user
    
    async def authenticate(self, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password."""
        user = await self.get_by_email(email)
        if not user:
            return None
        
        if not verify_password(password, user.hashed_password):
            return None
        
        return user
    
    async def update(self, user_id: UUID, update_data: UserUpdate) -> Optional[User]:
        """Update user information."""
        user = await self.get_by_id(user_id)
        if not user:
            return None
        
        update_dict = update_data.model_dump(exclude_unset=True)
        
        for field, value in update_dict.items():
            setattr(user, field, value)
        
        await self.db.commit()
        await self.db.refresh(user)
        
        return user
    
    async def update_last_login(self, user_id: UUID) -> None:
        """Update user's last login time."""
        user = await self.get_by_id(user_id)
        if user:
            user.last_login = datetime.now(timezone.utc)
            await self.db.commit()
    
    async def update_password(self, user_id: UUID, new_password: str) -> bool:
        """Update user's password."""
        user = await self.get_by_id(user_id)
        if not user:
            return False
        
        user.hashed_password = hash_password(new_password)
        await self.db.commit()
        return True
    
    async def verify_password(self, user_id: UUID, password: str) -> bool:
        """Verify user's password."""
        user = await self.get_by_id(user_id)
        if not user:
            return False
        
        return verify_password(password, user.hashed_password)
    
    async def initialize_credits(self, user_id: UUID, initial_balance: int = 0) -> Credit:
        """Initialize credits for a new user."""
        credit = Credit(
            user_id=user_id,
            balance=initial_balance,
            lifetime_earned=initial_balance,
            lifetime_used=0,
        )
        
        self.db.add(credit)
        await self.db.commit()
        await self.db.refresh(credit)
        
        return credit
    
    async def deactivate(self, user_id: UUID) -> bool:
        """Deactivate a user account."""
        user = await self.get_by_id(user_id)
        if not user:
            return False
        
        user.is_active = False
        await self.db.commit()
        return True
    
    async def delete(self, user_id: UUID) -> bool:
        """Delete a user account."""
        user = await self.get_by_id(user_id)
        if not user:
            return False
        
        await self.db.delete(user)
        await self.db.commit()
        return True
