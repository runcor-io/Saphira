"""
Base model with common fields and utilities.
"""

from datetime import datetime
from typing import Any

from sqlalchemy import Column, DateTime, event
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class BaseModel(Base):
    """Abstract base model with common fields."""
    
    __abstract__ = True
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    def to_dict(self) -> dict[str, Any]:
        """Convert model instance to dictionary."""
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
        }
    
    def update(self, **kwargs: Any) -> None:
        """Update model attributes."""
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)


@event.listens_for(BaseModel, "before_update", propagate=True)
def receive_before_update(mapper, connection, target):
    """Automatically update updated_at timestamp."""
    target.updated_at = datetime.utcnow()
