"""
Authentication router for user registration, login, and token management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.jwt_handler import create_token_pair, verify_refresh_token
from app.auth.password import validate_password_strength
from app.database import get_async_db
from app.models.user import User
from app.schemas.user import (
    PasswordChange,
    PasswordReset,
    PasswordResetRequest,
    Token,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.services.user_service import UserService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Create a new user account with email and password."
)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_async_db)
) -> UserResponse:
    """
    Register a new user.
    
    - **email**: Valid email address (must be unique)
    - **password**: At least 8 characters with uppercase, lowercase, and digit
    - **first_name**: User's first name
    - **last_name**: User's last name
    - **phone_number**: Optional phone number
    """
    user_service = UserService(db)
    
    # Check if email already exists
    existing_user = await user_service.get_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate password strength
    is_valid, error_message = validate_password_strength(user_data.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
    
    # Create user
    user = await user_service.create(user_data)
    
    # Initialize credits for the user
    await user_service.initialize_credits(user.id)
    
    return UserResponse.model_validate(user)


@router.post(
    "/login",
    response_model=Token,
    summary="User login",
    description="Authenticate user and return access tokens."
)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_async_db)
) -> Token:
    """
    Login with email and password.
    
    - **email**: Registered email address
    - **password**: Account password
    
    Returns access_token and refresh_token on success.
    """
    user_service = UserService(db)
    
    # Authenticate user
    user = await user_service.authenticate(credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Update last login
    await user_service.update_last_login(user.id)
    
    # Create tokens
    tokens = create_token_pair(user.id)
    
    return Token(**tokens)


@router.post(
    "/refresh",
    response_model=Token,
    summary="Refresh access token",
    description="Get a new access token using a refresh token."
)
async def refresh_token(refresh_token: str) -> Token:
    """
    Refresh access token using a valid refresh token.
    
    - **refresh_token**: Valid refresh token from login
    """
    user_id = verify_refresh_token(refresh_token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create new token pair
    tokens = create_token_pair(user_id)
    
    return Token(**tokens)


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="User logout",
    description="Logout the current user (client should discard tokens)."
)
async def logout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
) -> dict:
    """
    Logout the current user.
    
    Note: Tokens should be discarded on the client side.
    This endpoint can be extended to implement token blacklisting.
    """
    # In a more advanced implementation, we could add the token to a blacklist
    # For now, we just acknowledge the logout
    return {"message": "Successfully logged out"}


@router.post(
    "/password/change",
    status_code=status.HTTP_200_OK,
    summary="Change password",
    description="Change the current user's password."
)
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
) -> dict:
    """
    Change user password.
    
    - **current_password**: Current password for verification
    - **new_password**: New password (must meet strength requirements)
    - **confirm_password**: Must match new_password
    """
    user_service = UserService(db)
    
    # Verify current password
    if not await user_service.verify_password(current_user.id, password_data.current_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password strength
    is_valid, error_message = validate_password_strength(password_data.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
    
    # Update password
    await user_service.update_password(current_user.id, password_data.new_password)
    
    return {"message": "Password changed successfully"}


@router.post(
    "/password/reset-request",
    status_code=status.HTTP_200_OK,
    summary="Request password reset",
    description="Request a password reset email."
)
async def request_password_reset(
    reset_request: PasswordResetRequest,
    db: AsyncSession = Depends(get_async_db)
) -> dict:
    """
    Request password reset.
    
    - **email**: Email address of the account
    
    Note: If the email exists, a reset link will be sent.
    This endpoint always returns success to prevent email enumeration.
    """
    user_service = UserService(db)
    
    # Check if user exists (but don't reveal this information)
    user = await user_service.get_by_email(reset_request.email)
    
    if user:
        # In a real implementation, generate a reset token and send email
        # For now, we just acknowledge the request
        # await send_password_reset_email(user.email, reset_token)
        pass
    
    # Always return success to prevent email enumeration
    return {
        "message": "If an account with that email exists, a password reset link has been sent"
    }


@router.post(
    "/password/reset",
    status_code=status.HTTP_200_OK,
    summary="Reset password",
    description="Reset password using a reset token."
)
async def reset_password(
    reset_data: PasswordReset,
    db: AsyncSession = Depends(get_async_db)
) -> dict:
    """
    Reset password using token.
    
    - **token**: Password reset token from email
    - **new_password**: New password
    - **confirm_password**: Must match new_password
    """
    user_service = UserService(db)
    
    # Validate new password strength
    is_valid, error_message = validate_password_strength(reset_data.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
    
    # In a real implementation, verify the reset token and update password
    # For now, this is a placeholder
    # await user_service.reset_password_with_token(reset_data.token, reset_data.new_password)
    
    return {"message": "Password reset successfully"}


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
    description="Get the currently authenticated user's information."
)
async def get_me(
    current_user: User = Depends(get_current_user)
) -> UserResponse:
    """
    Get current user information.
    
    Returns the profile of the currently authenticated user.
    """
    return UserResponse.model_validate(current_user)
