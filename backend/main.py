from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging

from config import FRONTEND_URL
from routers import questions, revision, auth, stats
from scheduler import start_scheduler, stop_scheduler

# Configure logging — stdout only (Azure App Service streams stdout to Log Stream)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Application starting up...")
    logger.info(f"CORS allowed origin: {FRONTEND_URL}")
    start_scheduler()
    logger.info("Email reminder scheduler started")
    yield
    # Shutdown
    logger.info("Application shutting down...")
    stop_scheduler()
    logger.info("Email reminder scheduler stopped")


app = FastAPI(title="CodeRecall API", version="1.0.0", lifespan=lifespan)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# Include routers
app.include_router(auth.router, tags=["Authentication"])
app.include_router(questions.router, tags=["Questions"])
app.include_router(revision.router, tags=["Revision"])
app.include_router(stats.router, tags=["Statistics"])

@app.get("/")
@limiter.limit("10/minute")
async def home(request: Request):
    logger.info("Root endpoint accessed")
    return {
        "message": "CodeRecall Backend Running",
        "version": "1.0.0",
        "status": "healthy"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for Azure App Service monitoring"""
    from database import SessionLocal
    try:
        db = SessionLocal()
        db.execute(__import__('sqlalchemy').text('SELECT 1'))
        db.close()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "database": "disconnected"}
        )