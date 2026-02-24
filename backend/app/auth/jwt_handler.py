"""
JWT token generation and validation utilities.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from jose import JWTError, jwt

from app.config import get_settings

settings = get_settings()


def create_access_token(
    user_id: str | UUID,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token for a user.
    
    Args:
        user_id: The user's ID.
        expires_delta: Optional custom expiration time.
    
    Returns:
        The encoded JWT token string.
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(user_id),
        "exp": expire,
        "type": "access",
        "iat": datetime.now(timezone.utc),
    }
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(
    user_id: str | UUID,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT refresh token for a user.
    
    Args:
        user_id: The user's ID.
        expires_delta: Optional custom expiration time.
    
    Returns:
        The encoded JWT refresh token string.
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode = {
        "sub": str(user_id),
        "exp": expire,
        "type": "refresh",
        "iat": datetime.now(timezone.utc),
    }
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """
    Decode and validate a JWT token.
    
    Args:
        token: The JWT token to decode.
    
    Returns:
        The decoded token payload if valid, None otherwise.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None


def verify_access_token(token: str) -> Optional[str]:
    """
    Verify an access token and return the user ID.
    
    Args:
        token: The access token to verify.
    
    Returns:
        The user ID if the token is valid, None otherwise.
    """
    payload = decode_token(token)
    if payload is None:
        return None
    
    # Check token type
    if payload.get("type") != "access":
        return None
    
    user_id: str = payload.get("sub")
    return user_id


def verify_refresh_token(token: str) -> Optional[str]:
    """
    Verify a refresh token and return the user ID.
    
    Args:
        token: The refresh token to verify.
    
    Returns:
        The user ID if the token is valid, None otherwise.
    """
    payload = decode_token(token)
    if payload is None:
        return None
    
    # Check token type
    if payload.get("type") != "refresh":
        return None
    
    user_id: str = payload.get("sub")
    return user_id


def get_token_expiry(token: str) -> Optional[datetime]:
    """
    Get the expiration time of a token.
    
    Args:
        token: The JWT token.
    
    Returns:
        The expiration datetime if valid, None otherwise.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        exp = payload.get("exp")
        if exp:
            return datetime.fromtimestamp(exp, tz=timezone.utc)
        return None
    except JWTError:
        return None


def create_token_pair(user_id: str | UUID) -> dict:
    """
    Create both access and refresh tokens for a user.
    
    Args:
        user_id: The user's ID.
    
    Returns:
        Dictionary containing access_token, refresh_token, token_type, and expires_in.
    """
    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }
