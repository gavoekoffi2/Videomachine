"""
API for managing each user's MoneyPrinterV2 configuration.
The config is stored as JSON in the User.mp_config column.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.core.security import get_active_user

router = APIRouter(prefix="/api/config", tags=["config"])


class MPConfig(BaseModel):
    # LLM
    ollama_base_url: str = "http://127.0.0.1:11434"
    ollama_model: str = ""
    # Selenium
    firefox_profile: str = ""
    headless: bool = True
    # Image AI
    nanobanana2_api_key: str = ""
    nanobanana2_model: str = "gemini-3.1-flash-image-preview"
    nanobanana2_aspect_ratio: str = "9:16"
    # TTS
    tts_voice: str = "Jasper"
    # Video
    threads: int = 2
    script_sentence_length: int = 4
    imagemagick_path: str = "/usr/bin/convert"
    # Subtitles
    stt_provider: str = "local_whisper"
    whisper_model: str = "base"
    whisper_device: str = "auto"
    whisper_compute_type: str = "int8"
    assembly_ai_api_key: str = ""
    # Twitter
    twitter_language: str = "French"
    # Music
    zip_url: str = ""
    # YouTube
    is_for_kids: bool = False
    # TikTok
    tiktok_access_token: str = ""
    tiktok_default_privacy: str = "PUBLIC_TO_EVERYONE"
    # Outreach/Email
    outreach_message_subject: str = "Hello"
    google_maps_scraper_niche: str = ""
    # Email
    email_smtp_server: str = "smtp.gmail.com"
    email_smtp_port: int = 587
    email_username: str = ""
    email_password: str = ""


@router.get("/")
async def get_config(current_user=Depends(get_active_user)):
    return current_user.mp_config or {}


@router.put("/")
async def update_config(config: MPConfig, current_user=Depends(get_active_user), db: Session = Depends(get_db)):
    data = config.model_dump()
    # Nest email config
    data["email"] = {
        "smtp_server": data.pop("email_smtp_server"),
        "smtp_port": data.pop("email_smtp_port"),
        "username": data.pop("email_username"),
        "password": data.pop("email_password"),
    }
    current_user.mp_config = data
    db.commit()
    return {"message": "Configuration sauvegardée", "config": data}


@router.get("/ollama-models")
async def get_ollama_models(current_user=Depends(get_active_user)):
    """List available Ollama models from the configured server."""
    try:
        import sys, os
        src_dir = os.path.join(os.path.dirname(__file__), "..", "..", "src")
        if src_dir not in sys.path:
            sys.path.insert(0, src_dir)

        cfg = current_user.mp_config or {}
        base_url = cfg.get("ollama_base_url", "http://127.0.0.1:11434")

        import ollama
        client = ollama.Client(host=base_url)
        response = client.list()
        models = sorted(m.model for m in response.models)
        return {"models": models}
    except Exception as e:
        return {"models": [], "error": str(e)}
