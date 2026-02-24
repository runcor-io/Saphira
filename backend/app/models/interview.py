"""
Interview simulation models.
"""

import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text, Float
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import BaseModel


class InterviewStatus(str, PyEnum):
    """Interview session status."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class InterviewDifficulty(str, PyEnum):
    """Interview difficulty levels."""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    EXPERT = "expert"


class Interview(BaseModel):
    """Interview simulation session model."""
    
    __tablename__ = "interviews"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Configuration
    job_title = Column(String(200), nullable=False)
    company_name = Column(String(200), nullable=True)
    industry = Column(String(100), nullable=True)
    difficulty = Column(Enum(InterviewDifficulty), default=InterviewDifficulty.MEDIUM, nullable=False)
    persona_type = Column(String(50), default="nigerian_corporate", nullable=False)
    
    # Status
    status = Column(Enum(InterviewStatus), default=InterviewStatus.PENDING, nullable=False)
    credits_used = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    
    # Voice settings
    use_voice = Column(String(50), nullable=True)  # ElevenLabs voice ID or null
    
    # Relationships
    user = relationship("User", back_populates="interviews")
    questions = relationship("InterviewQuestion", back_populates="interview", cascade="all, delete-orphan", order_by="InterviewQuestion.question_number")
    feedback = relationship("Feedback", back_populates="interview", uselist=False, cascade="all, delete-orphan")
    
    @property
    def total_questions(self) -> int:
        """Get total number of questions."""
        return len(self.questions) if self.questions else 0
    
    @property
    def answered_questions(self) -> int:
        """Get number of answered questions."""
        if not self.questions:
            return 0
        return sum(1 for q in self.questions if q.answers)
    
    def __repr__(self) -> str:
        return f"<Interview(id={self.id}, job_title={self.job_title}, status={self.status})>"


class InterviewQuestion(BaseModel):
    """Interview question model."""
    
    __tablename__ = "interview_questions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False)
    
    # Question details
    question_number = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    question_category = Column(String(100), nullable=True)  # technical, behavioral, situational, etc.
    expected_skills = Column(JSONB, default=list, nullable=True)  # List of expected skills to assess
    
    # Voice
    audio_url = Column(String(500), nullable=True)  # URL to generated audio
    
    # Relationships
    interview = relationship("Interview", back_populates="questions")
    answers = relationship("InterviewAnswer", back_populates="question", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<InterviewQuestion(id={self.id}, number={self.question_number})>"


class InterviewAnswer(BaseModel):
    """Interview answer model."""
    
    __tablename__ = "interview_answers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question_id = Column(UUID(as_uuid=True), ForeignKey("interview_questions.id", ondelete="CASCADE"), nullable=False)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False)
    
    # Answer content
    answer_text = Column(Text, nullable=False)
    
    # Audio (if voice mode)
    audio_url = Column(String(500), nullable=True)
    transcription = Column(Text, nullable=True)  # If audio was transcribed
    
    # Timing
    response_time_seconds = Column(Integer, nullable=True)
    
    # Relationships
    question = relationship("InterviewQuestion", back_populates="answers")
    
    def __repr__(self) -> str:
        return f"<InterviewAnswer(id={self.id}, question_id={self.question_id})>"
