"""
Interview simulation Pydantic schemas.
"""

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.interview import InterviewDifficulty, InterviewStatus


# Interview Question Schema
class InterviewQuestionResponse(BaseModel):
    """Schema for interview question response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    question_number: int
    question_text: str
    question_category: Optional[str] = None
    expected_skills: list[str]
    audio_url: Optional[str] = None
    created_at: datetime


class InterviewQuestionCreate(BaseModel):
    """Schema for creating interview question."""
    question_number: int
    question_text: str
    question_category: Optional[str] = None
    expected_skills: list[str] = Field(default_factory=list)


# Interview Answer Schema
class InterviewAnswerResponse(BaseModel):
    """Schema for interview answer response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    answer_text: str
    audio_url: Optional[str] = None
    transcription: Optional[str] = None
    response_time_seconds: Optional[int] = None
    created_at: datetime


class InterviewAnswerCreate(BaseModel):
    """Schema for creating interview answer."""
    answer_text: str
    audio_url: Optional[str] = None
    response_time_seconds: Optional[int] = None


# Interview Base Schema
class InterviewBase(BaseModel):
    """Base interview schema."""
    job_title: str = Field(..., min_length=1, max_length=200)
    company_name: Optional[str] = Field(None, max_length=200)
    industry: Optional[str] = Field(None, max_length=100)
    difficulty: InterviewDifficulty = InterviewDifficulty.MEDIUM
    use_voice: Optional[str] = None


# Interview Create Schema
class InterviewCreate(InterviewBase):
    """Schema for creating interview session."""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "job_title": "Senior Software Engineer",
                "company_name": "Tech Corp Nigeria",
                "industry": "Technology",
                "difficulty": "medium",
                "use_voice": None
            }
        }
    )


# Interview Update Schema
class InterviewUpdate(BaseModel):
    """Schema for updating interview session."""
    status: Optional[InterviewStatus] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None


# Interview Response Schema
class InterviewResponse(InterviewBase):
    """Schema for interview response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    user_id: UUID
    status: InterviewStatus
    persona_type: str
    credits_used: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    total_questions: int
    answered_questions: int
    created_at: datetime
    updated_at: datetime


# Interview Detail Schema
class InterviewDetailResponse(InterviewResponse):
    """Schema for detailed interview response with questions."""
    questions: list[InterviewQuestionResponse]
    answers: list[InterviewAnswerResponse]


# Interview List Schema
class InterviewListResponse(BaseModel):
    """Schema for interview list response."""
    interviews: list[InterviewResponse]
    total_count: int
    page: int
    page_size: int


# Interview Start Schema
class InterviewStartResponse(BaseModel):
    """Schema for interview start response."""
    interview_id: UUID
    session_token: str
    first_question: InterviewQuestionResponse
    remaining_credits: int


# Interview Submit Answer Schema
class InterviewSubmitAnswer(BaseModel):
    """Schema for submitting interview answer."""
    question_id: UUID
    answer_text: str
    audio_url: Optional[str] = None
    response_time_seconds: Optional[int] = None


class InterviewSubmitAnswerResponse(BaseModel):
    """Schema for interview submit answer response."""
    success: bool
    next_question: Optional[InterviewQuestionResponse] = None
    is_complete: bool
    credits_remaining: int
