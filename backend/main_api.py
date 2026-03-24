"""
VideoMachine SaaS API
FastAPI server that wraps MoneyPrinterV2 functionality.
"""
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
from app.api import auth, config_api, youtube_api, twitter_api, afm_api, payments_api, tiktok_api, social_api

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)s %(levelname)s: %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🎬 VideoMachine API démarrage...")
    init_db()
    for d in ["uploads/videos", "uploads/audio", "uploads/images", "Songs", ".mp"]:
        os.makedirs(d, exist_ok=True)
    logger.info("✅ VideoMachine API prêt!")
    yield
    logger.info("VideoMachine API arrêt.")


app = FastAPI(
    title="VideoMachine SaaS API",
    description="Plateforme SaaS basée sur MoneyPrinterV2",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(config_api.router)
app.include_router(youtube_api.router)
app.include_router(twitter_api.router)
app.include_router(afm_api.router)
app.include_router(tiktok_api.router)
app.include_router(social_api.router)
app.include_router(payments_api.router)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
async def root():
    return {"name": "VideoMachine SaaS", "version": "2.0.0",
            "engine": "MoneyPrinterV2", "docs": "/docs", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.exception_handler(Exception)
async def exc_handler(request, exc):
    logger.error(f"Unhandled: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Erreur interne"})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main_api:app", host="0.0.0.0", port=8000, reload=True)
