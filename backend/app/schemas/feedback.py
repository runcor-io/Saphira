"""
Feedback Pydantic schemas.
"""

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.feedback import FeedbackCategory


# Feedback Item Schema
class FeedbackItemResponse(BaseModel):
    """Schema for feedback item response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    item_type: str  # strength, improvement, suggestion
    category: str
    description: str
    severity: int
    recommendation: Optional[str] = None
    example_quote: Optional[str] = None


class FeedbackItemCreate(BaseModel):
    """Schema for creating feedback item."""
    item_type: str
    category: str
    description: str
    severity: int = 3
    recommendation: Optional[str] = None
    example_quote: Optional[str] = None


# Q&A Feedback Schema
class QAFeedback(BaseModel):
    """Schema for Q&A specific feedback."""
    question_number: int
    question_text: str
    answer_summary: str
    score: int
    strengths: list[str]
    improvements: list[str]


# Feedback Base Schema
class FeedbackBase(BaseModel):
    """Base feedback schema."""
    overall_score: int
    confidence_score: Optional[int] = None
    clarity_score: Optional[int] = None
    content_score: Optional[int] = None
    delivery_score: Optional[int] = None


# Feedback Create Schema
class FeedbackCreate(FeedbackBase):
    """Schema for creating feedback."""
    category: FeedbackCategory
    summary: str
    strengths: list[str]
    improvements: list[str]
    technical_analysis: Optional[str] = None
    communication_analysis: Optional[str] = None
    body_language_tips: Optional[str] = None
    qa_feedback: list[QAFeedback] = []
    ai_model_used: Optional[str] = None
    persona_used: Optional[str] = None
    raw_ai_response: Optional[str] = None


# Feedback Response Schema
class FeedbackResponse(FeedbackBase):
    """Schema for feedback response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    interview_id: Optional[UUID] = None
    presentation_id: Optional[UUID] = None
    category: FeedbackCategory
    summary: str
    strengths: list[str]
    improvements: list[str]
    technical_analysis: Optional[str] = None
    communication_analysis: Optional[str] = None
    body_language_tips: Optional[str] = None
    qa_feedback: list[QAFeedback]
    ai_model_used: Optional[str] = None
    persona_used: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# Feedback Detail Schema
class FeedbackDetailResponse(FeedbackResponse):
    """Schema for detailed feedback response."""
    items: list[FeedbackItemResponse]


# Feedback Summary Schema
class FeedbackSummary(BaseModel):
    """Schema for feedback summary."""
    total_sessions: int
    average_score: float
    best_category: str
    improvement_areas: list[str]
    recent_feedback: list[FeedbackResponse]
