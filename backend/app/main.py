from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
import logging

from app.core.config import settings
from app.core.database import engine, Base
from app.models import *  # Import all models to register with Base

# Import routers
from app.api import auth, leave, salary, documents, chat, notifications, analytics, admin

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    logger.info(f"Starting {settings.APP_NAME}...")

    # Create upload directories
    for dir_path in [
        settings.salary_slips_dir,
        settings.documents_dir,
        settings.policies_dir,
        settings.logos_dir
    ]:
        os.makedirs(dir_path, exist_ok=True)
        logger.info(f"Directory ready: {dir_path}")

    # Create database tables (Alembic handles migrations in production)
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified")

    yield

    logger.info("Shutting down...")


app = FastAPI(
    title="AI Employee Operating System",
    description="AI-powered HR self-service platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)

# ── CORS ────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global Exception Handler ────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again."}
    )


# ── Health Check ─────────────────────────────────────────────────
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "environment": settings.APP_ENV
    }


# ── API Routes ────────────────────────────────────────────────────
PREFIX = "/api/v1"

app.include_router(auth.router, prefix=PREFIX)
app.include_router(leave.router, prefix=PREFIX)
app.include_router(salary.router, prefix=PREFIX)
app.include_router(documents.router, prefix=PREFIX)
app.include_router(chat.router, prefix=PREFIX)
app.include_router(notifications.router, prefix=PREFIX)
app.include_router(analytics.router, prefix=PREFIX)
app.include_router(admin.router, prefix=PREFIX)


# ── Root ──────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "message": "AI Employee Operating System API",
        "docs": "/api/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
