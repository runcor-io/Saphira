"""
Presentation simulation models.
"""

import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text, Float
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import BaseModel


class PresentationStatus(str, PyEnum):
    """Presentation session status."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class PresentationType(str, PyEnum):
    """Presentation types."""
    PITCH_DECK = "pitch_deck"
    BUSINESS_PROPOSAL = "business_proposal"
    PROJECT_UPDATE = "project_update"
    SALES_PRESENTATION = "sales_presentation"
    TRAINING = "training"
    OTHER = "other"


class AudienceType(str, PyEnum):
    """Audience types."""
    EXECUTIVES = "executives"
    INVESTORS = "investors"
    TEAM = "team"
    CLIENTS = "clients"
    BOARD = "board"
    GENERAL = "general"


class Presentation(BaseModel):
    """Presentation simulation session model."""
    
    __tablename__ = "presentations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Configuration
    title = Column(String(300), nullable=False)
    presentation_type = Column(Enum(PresentationType), default=PresentationType.OTHER, nullable=False)
    audience_type = Column(Enum(AudienceType), default=AudienceType.GENERAL, nullable=False)
    industry = Column(String(100), nullable=True)
    duration_minutes = Column(Integer, default=15, nullable=False)
    persona_type = Column(String(50), default="nigerian_corporate", nullable=False)
    
    # Content
    topic_description = Column(Text, nullable=True)
    key_points = Column(JSONB, default=list, nullable=True)  # List of key points to cover
    slide_notes = Column(Text, nullable=True)  # User's slide notes or outline
    
    # Status
    status = Column(Enum(PresentationStatus), default=PresentationStatus.PENDING, nullable=False)
    credits_used = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    actual_duration_seconds = Column(Integer, nullable=True)
    
    # Voice settings
    use_voice = Column(String(50), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="presentations")
    questions = relationship("PresentationQuestion", back_populates="presentation", cascade="all, delete-orphan", order_by="PresentationQuestion.question_number")
    feedback = relationship("Feedback", back_populates="presentation", uselist=False, cascade="all, delete-orphan")
    
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
        return f"<Presentation(id={self.id}, title={self.title}, status={self.status})>"


class PresentationQuestion(BaseModel):
    """Presentation Q&A question model."""
    
    __tablename__ = "presentation_questions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    presentation_id = Column(UUID(as_uuid=True), ForeignKey("presentations.id", ondelete="CASCADE"), nullable=False)
    
    # Question details
    question_number = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    question_category = Column(String(100), nullable=True)  # clarification, challenge, interest, etc.
    persona_role = Column(String(100), nullable=True)  # CEO, CFO, Investor, etc.
    
    # Voice
    audio_url = Column(String(500), nullable=True)
    
    # Relationships
    presentation = relationship("Presentation", back_populates="questions")
    answers = relationship("PresentationAnswer", back_populates="question", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<PresentationQuestion(id={self.id}, number={self.question_number})>"


class PresentationAnswer(BaseModel):
    """Presentation Q&A answer model."""
    
    __tablename__ = "presentation_answers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question_id = Column(UUID(as_uuid=True), ForeignKey("presentation_questions.id", ondelete="CASCADE"), nullable=False)
    presentation_id = Column(UUID(as_uuid=True), ForeignKey("presentations.id", ondelete="CASCADE"), nullable=False)
    
    # Answer content
    answer_text = Column(Text, nullable=False)
    
    # Audio (if voice mode)
    audio_url = Column(String(500), nullable=True)
    transcription = Column(Text, nullable=True)
    
    # Timing
    response_time_seconds = Column(Integer, nullable=True)
    
    # Relationships
    question = relationship("PresentationQuestion", back_populates="answers")
    
    def __repr__(self) -> str:
        return f"<PresentationAnswer(id={self.id}, question_id={self.question_id})>"
