"""
API routes for Saphire AI.
"""

from app.routes.credits import router as credits_router
from app.routes.payments import router as payments_router
from app.routes.users import router as users_router

__all__ = [
    "credits_router",
    "payments_router",
    "users_router",
]
