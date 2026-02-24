"""
Configuration module for Saphire AI Backend.
Loads environment variables and provides application settings.
"""

from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    APP_NAME: str = "Saphire AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # OpenAI
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_TEMPERATURE: float = 0.7
    
    # Supabase
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    
    # Paystack (Nigerian Payments)
    PAYSTACK_SECRET_KEY: str
    PAYSTACK_BASE_URL: str = "https://api.paystack.co"
    
    # Email (Resend)
    RESEND_API_KEY: str
    
    # Voice (ElevenLabs)
    ELEVENLABS_API_KEY: str
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
    
    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
