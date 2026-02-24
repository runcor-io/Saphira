"""
Presentation simulation Pydantic schemas.
"""

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.presentation import AudienceType, PresentationStatus, PresentationType


# Presentation Question Schema
class PresentationQuestionResponse(BaseModel):
    """Schema for presentation question response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    question_number: int
    question_text: str
    question_category: Optional[str] = None
    persona_role: Optional[str] = None
    audio_url: Optional[str] = None
    created_at: datetime


class PresentationQuestionCreate(BaseModel):
    """Schema for creating presentation question."""
    question_number: int
    question_text: str
    question_category: Optional[str] = None
    persona_role: Optional[str] = None


# Presentation Answer Schema
class PresentationAnswerResponse(BaseModel):
    """Schema for presentation answer response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    answer_text: str
    audio_url: Optional[str] = None
    transcription: Optional[str] = None
    response_time_seconds: Optional[int] = None
    created_at: datetime


class PresentationAnswerCreate(BaseModel):
    """Schema for creating presentation answer."""
    answer_text: str
    audio_url: Optional[str] = None
    response_time_seconds: Optional[int] = None


# Presentation Base Schema
class PresentationBase(BaseModel):
    """Base presentation schema."""
    title: str = Field(..., min_length=1, max_length=300)
    presentation_type: PresentationType = PresentationType.OTHER
    audience_type: AudienceType = AudienceType.GENERAL
    industry: Optional[str] = Field(None, max_length=100)
    duration_minutes: int = Field(default=15, ge=5, le=120)
    use_voice: Optional[str] = None


# Presentation Create Schema
class PresentationCreate(PresentationBase):
    """Schema for creating presentation session."""
    topic_description: Optional[str] = None
    key_points: list[str] = Field(default_factory=list)
    slide_notes: Optional[str] = None
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Q3 Financial Performance Review",
                "presentation_type": "business_proposal",
                "audience_type": "executives",
                "industry": "Finance",
                "duration_minutes": 20,
                "topic_description": "Presenting Q3 financial results to the board",
                "key_points": ["Revenue growth", "Cost reduction", "Future projections"],
                "slide_notes": "15 slides covering all major financial metrics"
            }
        }
    )


# Presentation Update Schema
class PresentationUpdate(BaseModel):
    """Schema for updating presentation session."""
    status: Optional[PresentationStatus] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    actual_duration_seconds: Optional[int] = None


# Presentation Response Schema
class PresentationResponse(PresentationBase):
    """Schema for presentation response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    user_id: UUID
    status: PresentationStatus
    persona_type: str
    credits_used: int
    topic_description: Optional[str] = None
    key_points: list[str]
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    actual_duration_seconds: Optional[int] = None
    total_questions: int
    answered_questions: int
    created_at: datetime
    updated_at: datetime


# Presentation Detail Schema
class PresentationDetailResponse(PresentationResponse):
    """Schema for detailed presentation response with questions."""
    questions: list[PresentationQuestionResponse]
    answers: list[PresentationAnswerResponse]


# Presentation List Schema
class PresentationListResponse(BaseModel):
    """Schema for presentation list response."""
    presentations: list[PresentationResponse]
    total_count: int
    page: int
    page_size: int


# Presentation Start Schema
class PresentationStartResponse(BaseModel):
    """Schema for presentation start response."""
    presentation_id: UUID
    session_token: str
    first_question: PresentationQuestionResponse
    remaining_credits: int


# Presentation Submit Answer Schema
class PresentationSubmitAnswer(BaseModel):
    """Schema for submitting presentation answer."""
    question_id: UUID
    answer_text: str
    audio_url: Optional[str] = None
    response_time_seconds: Optional[int] = None


class PresentationSubmitAnswerResponse(BaseModel):
    """Schema for presentation submit answer response."""
    success: bool
    next_question: Optional[PresentationQuestionResponse] = None
    is_complete: bool
    credits_remaining: int
