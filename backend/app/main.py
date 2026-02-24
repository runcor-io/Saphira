"""
Saphire AI - FastAPI Backend (Phase 2)
Simplified backend using Supabase for database
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.auth.router import router as auth_router
from app.routes.credits import router as credits_router
from app.routes.payments import router as payments_router
from app.routes.users import router as users_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager."""
    yield


def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="AI-powered professional simulation platform",
        docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
        redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
        lifespan=lifespan,
    )
    
    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Include all routers
    app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
    app.include_router(credits_router, prefix="/credits", tags=["Credits"])
    app.include_router(payments_router, prefix="/payments", tags=["Payments"])
    app.include_router(users_router, prefix="/users", tags=["Users"])
    
    # Health check endpoint
    @app.get("/", tags=["Health"])
    async def root():
        return {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "status": "operational",
            "environment": settings.ENVIRONMENT,
        }
    
    @app.get("/health", tags=["Health"])
    async def health_check():
        return {"status": "healthy"}
    
    return app


app = create_application()


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
