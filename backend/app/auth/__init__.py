"""
Authentication module for Saphire AI.
"""

from app.auth.dependencies import (
    get_current_admin_user,
    get_current_active_user,
    get_current_user,
    get_current_verified_user,
    optional_current_user,
)
from app.auth.jwt_handler import (
    create_access_token,
    create_refresh_token,
    create_token_pair,
    decode_token,
    verify_access_token,
    verify_refresh_token,
)
from app.auth.password import hash_password, validate_password_strength, verify_password

__all__ = [
    # Password utilities
    "hash_password",
    "verify_password",
    "validate_password_strength",
    # JWT utilities
    "create_access_token",
    "create_refresh_token",
    "create_token_pair",
    "decode_token",
    "verify_access_token",
    "verify_refresh_token",
    # Dependencies
    "get_current_user",
    "get_current_active_user",
    "get_current_verified_user",
    "get_current_admin_user",
    "optional_current_user",
]
