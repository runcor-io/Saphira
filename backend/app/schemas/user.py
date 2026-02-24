"""
User Pydantic schemas.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.user import UserRole


# Base Schema
class UserBase(BaseModel):
    """Base user schema with common fields."""
    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone_number: Optional[str] = Field(None, max_length=20)


# Create Schema
class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: str = Field(..., min_length=8, max_length=100)
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "user@example.com",
                "password": "StrongPass123!",
                "first_name": "John",
                "last_name": "Doe",
                "phone_number": "+2348012345678"
            }
        }
    )


# Update Schema
class UserUpdate(BaseModel):
    """Schema for updating user information."""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone_number: Optional[str] = Field(None, max_length=20)
    bio: Optional[str] = None
    avatar_url: Optional[str] = Field(None, max_length=500)
    job_title: Optional[str] = Field(None, max_length=100)
    company: Optional[str] = Field(None, max_length=100)
    industry: Optional[str] = Field(None, max_length=100)


# Response Schema
class UserResponse(UserBase):
    """Schema for user response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    full_name: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    industry: Optional[str] = None
    is_active: bool
    is_verified: bool
    role: UserRole
    credit_balance: int
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


# Profile Schema
class UserProfile(BaseModel):
    """Schema for user profile (public view)."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    full_name: str
    avatar_url: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    industry: Optional[str] = None
    bio: Optional[str] = None


# Login Schema
class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "user@example.com",
                "password": "StrongPass123!"
            }
        }
    )


# Password Change Schema
class PasswordChange(BaseModel):
    """Schema for password change."""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)
    confirm_password: str
    
    def model_post_init(self, __context) -> None:
        """Validate passwords match."""
        if self.new_password != self.confirm_password:
            raise ValueError("New password and confirm password must match")


# Password Reset Request Schema
class PasswordResetRequest(BaseModel):
    """Schema for password reset request."""
    email: EmailStr


# Password Reset Schema
class PasswordReset(BaseModel):
    """Schema for password reset."""
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)
    confirm_password: str
    
    def model_post_init(self, __context) -> None:
        """Validate passwords match."""
        if self.new_password != self.confirm_password:
            raise ValueError("New password and confirm password must match")


# Token Schema
class Token(BaseModel):
    """Schema for JWT tokens."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class TokenPayload(BaseModel):
    """Schema for token payload."""
    sub: Optional[str] = None  # user id
    exp: Optional[datetime] = None
    type: Optional[str] = None  # access or refresh
