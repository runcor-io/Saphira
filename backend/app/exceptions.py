"""
Custom exceptions for Saphire AI.
"""

from fastapi import HTTPException, status


class SaphireException(Exception):
    """Base exception for Saphire AI."""
    
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class NotFoundException(SaphireException):
    """Resource not found exception."""
    
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status.HTTP_404_NOT_FOUND)


class BadRequestException(SaphireException):
    """Bad request exception."""
    
    def __init__(self, message: str = "Bad request"):
        super().__init__(message, status.HTTP_400_BAD_REQUEST)


class UnauthorizedException(SaphireException):
    """Unauthorized access exception."""
    
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED)


class ForbiddenException(SaphireException):
    """Forbidden access exception."""
    
    def __init__(self, message: str = "Forbidden"):
        super().__init__(message, status.HTTP_403_FORBIDDEN)


class ConflictException(SaphireException):
    """Conflict exception."""
    
    def __init__(self, message: str = "Conflict"):
        super().__init__(message, status.HTTP_409_CONFLICT)


class InsufficientCreditsException(SaphireException):
    """Insufficient credits exception."""
    
    def __init__(self, message: str = "Insufficient credits", required: int = 0, available: int = 0):
        self.required = required
        self.available = available
        super().__init__(message, status.HTTP_402_PAYMENT_REQUIRED)


class PaymentFailedException(SaphireException):
    """Payment failed exception."""
    
    def __init__(self, message: str = "Payment failed"):
        super().__init__(message, status.HTTP_400_BAD_REQUEST)


class AIProcessingException(SaphireException):
    """AI processing exception."""
    
    def __init__(self, message: str = "AI processing failed"):
        super().__init__(message, status.HTTP_500_INTERNAL_SERVER_ERROR)
