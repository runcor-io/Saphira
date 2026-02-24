"""
Database module for Saphire AI Backend.
Uses Supabase for database operations.
"""

from typing import Any

from supabase import Client, create_client

from app.config import get_settings

settings = get_settings()

# Initialize Supabase client
_supabase_client: Client | None = None


def get_supabase_client() -> Client:
    """Get Supabase client instance."""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_ANON_KEY
        )
    return _supabase_client


def get_supabase_admin_client() -> Client:
    """Get Supabase admin client with service role."""
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY
    )


async def close_db() -> None:
    """Close database connections."""
    global _supabase_client
    _supabase_client = None


# Type alias for database operations
DatabaseClient = Client
