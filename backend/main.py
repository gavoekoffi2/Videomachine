import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

load_dotenv()

from app.core.config import settings
from app.core.database import init_db
from app.api import auth, videos, payments, admin

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting VideoMachine API...")
    init_db()
    os.makedirs("./uploads/videos", exist_ok=True)
    os.makedirs("./uploads/audio", exist_ok=True)
    os.makedirs("./uploads/images", exist_ok=True)
    os.makedirs("./uploads/temp", exist_ok=True)
    logger.info("VideoMachine API started successfully!")
    yield
    # Shutdown
    logger.info("VideoMachine API shutting down...")


app = FastAPI(
    title="VideoMachine API",
    description="SaaS Video Generation Platform - API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes
app.include_router(auth.router)
app.include_router(videos.router)
app.include_router(payments.router)
app.include_router(admin.router)

# Static files (uploaded videos, thumbnails)
os.makedirs("./uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="./uploads"), name="uploads")


@app.get("/")
async def root():
    return {
        "name": "VideoMachine API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
