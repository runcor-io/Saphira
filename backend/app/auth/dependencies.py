"""
Authentication dependencies for FastAPI routes.
"""

from typing import Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt_handler import verify_access_token
from app.database import get_async_db
from app.models.user import User
from app.services.user_service import UserService

# Security scheme
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_async_db)
) -> User:
    """
    Get the current authenticated user.
    
    Args:
        credentials: The HTTP Authorization credentials.
        db: Database session.
    
    Returns:
        The authenticated User object.
    
    Raises:
        HTTPException: If authentication fails.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not credentials:
        raise credentials_exception
    
    token = credentials.credentials
    user_id = verify_access_token(token)
    
    if user_id is None:
        raise credentials_exception
    
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise credentials_exception
    
    user_service = UserService(db)
    user = await user_service.get_by_id(user_uuid)
    
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get the current active user.
    
    Args:
        current_user: The current authenticated user.
    
    Returns:
        The active User object.
    
    Raises:
        HTTPException: If user is not active.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


async def get_current_verified_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Get the current verified user.
    
    Args:
        current_user: The current active user.
    
    Returns:
        The verified User object.
    
    Raises:
        HTTPException: If user is not verified.
    """
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified"
        )
    return current_user


async def get_current_admin_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Get the current admin user.
    
    Args:
        current_user: The current active user.
    
    Returns:
        The admin User object.
    
    Raises:
        HTTPException: If user is not an admin.
    """
    from app.models.user import UserRole
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user


async def optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_async_db)
) -> Optional[User]:
    """
    Optionally get the current user (returns None if not authenticated).
    
    Args:
        credentials: The HTTP Authorization credentials.
        db: Database session.
    
    Returns:
        The User object if authenticated, None otherwise.
    """
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        user_id = verify_access_token(token)
        
        if user_id is None:
            return None
        
        user_uuid = UUID(user_id)
        user_service = UserService(db)
        user = await user_service.get_by_id(user_uuid)
        
        if user and user.is_active:
            return user
        return None
    except Exception:
        return None
