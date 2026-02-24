"""
Feedback model for interview and presentation evaluations.
"""

import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text, Float
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import BaseModel


class FeedbackCategory(str, PyEnum):
    """Feedback category types."""
    INTERVIEW = "interview"
    PRESENTATION = "presentation"


class Feedback(BaseModel):
    """AI-generated feedback model for simulations."""
    
    __tablename__ = "feedback"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Association (one of these will be set)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id", ondelete="CASCADE"), nullable=True)
    presentation_id = Column(UUID(as_uuid=True), ForeignKey("presentations.id", ondelete="CASCADE"), nullable=True)
    
    category = Column(Enum(FeedbackCategory), nullable=False)
    
    # Overall scores (1-100)
    overall_score = Column(Integer, nullable=False)
    confidence_score = Column(Integer, nullable=True)
    clarity_score = Column(Integer, nullable=True)
    content_score = Column(Integer, nullable=True)
    delivery_score = Column(Integer, nullable=True)
    
    # Detailed feedback
    summary = Column(Text, nullable=False)
    strengths = Column(JSONB, default=list, nullable=False)  # List of strengths
    improvements = Column(JSONB, default=list, nullable=False)  # List of improvement areas
    
    # Detailed analysis by category
    technical_analysis = Column(Text, nullable=True)
    communication_analysis = Column(Text, nullable=True)
    body_language_tips = Column(Text, nullable=True)  # For video/audio analysis in future
    
    # Question/Answer specific feedback
    qa_feedback = Column(JSONB, default=list, nullable=True)  # List of per-QA feedback
    
    # AI metadata
    ai_model_used = Column(String(100), nullable=True)
    persona_used = Column(String(100), nullable=True)
    
    # Raw AI response (for debugging)
    raw_ai_response = Column(Text, nullable=True)
    
    # Relationships
    interview = relationship("Interview", back_populates="feedback")
    presentation = relationship("Presentation", back_populates="feedback")
    
    def __repr__(self) -> str:
        return f"<Feedback(id={self.id}, score={self.overall_score}, category={self.category})>"


class FeedbackItem(BaseModel):
    """
    Individual feedback item model.
    Stores granular feedback points.
    """
    
    __tablename__ = "feedback_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    feedback_id = Column(UUID(as_uuid=True), ForeignKey("feedback.id", ondelete="CASCADE"), nullable=False)
    
    # Item details
    item_type = Column(String(50), nullable=False)  # strength, improvement, suggestion
    category = Column(String(50), nullable=False)  # technical, communication, structure, etc.
    description = Column(Text, nullable=False)
    severity = Column(Integer, default=3, nullable=False)  # 1-5 scale
    
    # Recommendation
    recommendation = Column(Text, nullable=True)
    example_quote = Column(Text, nullable=True)  # Quote from user's answer
    
    def __repr__(self) -> str:
        return f"<FeedbackItem(id={self.id}, type={self.item_type}, category={self.category})>"
