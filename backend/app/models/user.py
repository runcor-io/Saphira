"""
User model for authentication and user management.
"""

import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Boolean, Column, DateTime, Enum, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import BaseModel


class UserRole(str, PyEnum):
    """User role enumeration."""
    USER = "user"
    ADMIN = "admin"


class User(BaseModel):
    """User model for authentication and user management."""
    
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone_number = Column(String(20), nullable=True)
    
    # Profile
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    job_title = Column(String(100), nullable=True)
    company = Column(String(100), nullable=True)
    industry = Column(String(100), nullable=True)
    
    # Status and role
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    
    # Timestamps
    last_login = Column(DateTime(timezone=True), nullable=True)
    email_verified_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    credits = relationship("Credit", back_populates="user", uselist=False, cascade="all, delete-orphan")
    interviews = relationship("Interview", back_populates="user", cascade="all, delete-orphan")
    presentations = relationship("Presentation", back_populates="user", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="user", cascade="all, delete-orphan")
    
    @property
    def full_name(self) -> str:
        """Get user's full name."""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def credit_balance(self) -> int:
        """Get user's current credit balance."""
        if self.credits:
            return self.credits.balance
        return 0
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, name={self.full_name})>"
