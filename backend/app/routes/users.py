"""
User router for user-related endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_async_db
from app.models.user import User
from app.schemas.user import UserProfile, UserResponse, UserUpdate
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
    description="Get the currently authenticated user's full profile."
)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
) -> UserResponse:
    """
    Get current user's full profile.
    
    Returns all user information including credits and account status.
    """
    return UserResponse.model_validate(current_user)


@router.put(
    "/me",
    response_model=UserResponse,
    summary="Update current user",
    description="Update the currently authenticated user's profile."
)
async def update_current_user(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
) -> UserResponse:
    """
    Update current user's profile.
    
    Only provided fields will be updated. Fields not provided remain unchanged.
    """
    user_service = UserService(db)
    updated_user = await user_service.update(current_user.id, update_data)
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse.model_validate(updated_user)


@router.get(
    "/{user_id}/profile",
    response_model=UserProfile,
    summary="Get user profile",
    description="Get a user's public profile."
)
async def get_user_profile(
    user_id: str,
    db: AsyncSession = Depends(get_async_db)
) -> UserProfile:
    """
    Get a user's public profile.
    
    Returns limited public information about the user.
    """
    from uuid import UUID
    
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    user_service = UserService(db)
    user = await user_service.get_by_id(user_uuid)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserProfile.model_validate(user)


@router.delete(
    "/me",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete account",
    description="Delete the currently authenticated user's account."
)
async def delete_current_user(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
) -> None:
    """
    Delete the current user's account.
    
    This action is irreversible. All user data will be permanently deleted.
    """
    user_service = UserService(db)
    success = await user_service.delete(current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete account"
        )
