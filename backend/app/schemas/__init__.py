"""
Pydantic schemas for request/response validation.
"""

# User schemas
from app.schemas.user import (
    PasswordChange,
    PasswordReset,
    PasswordResetRequest,
    Token,
    TokenPayload,
    UserBase,
    UserCreate,
    UserLogin,
    UserProfile,
    UserResponse,
    UserUpdate,
)

# Credit schemas
from app.schemas.credit import (
    CreditBalance,
    CreditHistoryResponse,
    CreditPackageResponse,
    CreditPurchaseResponse,
    CreditSummary,
    CreditTransactionCreate,
    CreditTransactionResponse,
    CreditUsageRequest,
)

# Interview schemas
from app.schemas.interview import (
    InterviewAnswerCreate,
    InterviewAnswerResponse,
    InterviewCreate,
    InterviewDetailResponse,
    InterviewListResponse,
    InterviewQuestionCreate,
    InterviewQuestionResponse,
    InterviewResponse,
    InterviewStartResponse,
    InterviewSubmitAnswer,
    InterviewSubmitAnswerResponse,
    InterviewUpdate,
)

# Presentation schemas
from app.schemas.presentation import (
    PresentationAnswerCreate,
    PresentationAnswerResponse,
    PresentationCreate,
    PresentationDetailResponse,
    PresentationListResponse,
    PresentationQuestionCreate,
    PresentationQuestionResponse,
    PresentationResponse,
    PresentationStartResponse,
    PresentationSubmitAnswer,
    PresentationSubmitAnswerResponse,
    PresentationUpdate,
)

# Feedback schemas
from app.schemas.feedback import (
    FeedbackCreate,
    FeedbackDetailResponse,
    FeedbackItemCreate,
    FeedbackItemResponse,
    FeedbackResponse,
    FeedbackSummary,
    QAFeedback,
)

# Payment schemas
from app.schemas.payment import (
    CreditPackageCreate,
    CreditPackageUpdate,
    PaymentDetailResponse,
    PaymentInitializeRequest,
    PaymentInitializeResponse,
    PaymentListResponse,
    PaymentResponse,
    PaymentVerifyResponse,
    PaystackWebhookPayload,
    TransactionHistoryResponse,
)

__all__ = [
    # User
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserProfile",
    "UserLogin",
    "PasswordChange",
    "PasswordResetRequest",
    "PasswordReset",
    "Token",
    "TokenPayload",
    # Credits
    "CreditBalance",
    "CreditTransactionResponse",
    "CreditTransactionCreate",
    "CreditPackageResponse",
    "CreditUsageRequest",
    "CreditPurchaseResponse",
    "CreditHistoryResponse",
    "CreditSummary",
    # Interview
    "InterviewQuestionResponse",
    "InterviewQuestionCreate",
    "InterviewAnswerResponse",
    "InterviewAnswerCreate",
    "InterviewCreate",
    "InterviewUpdate",
    "InterviewResponse",
    "InterviewDetailResponse",
    "InterviewListResponse",
    "InterviewStartResponse",
    "InterviewSubmitAnswer",
    "InterviewSubmitAnswerResponse",
    # Presentation
    "PresentationQuestionResponse",
    "PresentationQuestionCreate",
    "PresentationAnswerResponse",
    "PresentationAnswerCreate",
    "PresentationCreate",
    "PresentationUpdate",
    "PresentationResponse",
    "PresentationDetailResponse",
    "PresentationListResponse",
    "PresentationStartResponse",
    "PresentationSubmitAnswer",
    "PresentationSubmitAnswerResponse",
    # Feedback
    "FeedbackCreate",
    "FeedbackResponse",
    "FeedbackDetailResponse",
    "FeedbackItemCreate",
    "FeedbackItemResponse",
    "FeedbackSummary",
    "QAFeedback",
    # Payment
    "CreditPackageCreate",
    "CreditPackageUpdate",
    "PaymentInitializeRequest",
    "PaymentInitializeResponse",
    "PaymentResponse",
    "PaymentDetailResponse",
    "PaymentListResponse",
    "PaymentVerifyResponse",
    "PaystackWebhookPayload",
    "TransactionHistoryResponse",
]
