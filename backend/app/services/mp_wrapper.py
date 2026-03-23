"""
MoneyPrinterV2 Wrapper Service
Bridges the original MoneyPrinterV2 classes with the FastAPI SaaS layer.
Runs tasks as background coroutines, updating the DB Task record throughout.
"""
import sys
import os
import json
import asyncio
import logging
import tempfile
import shutil
from pathlib import Path
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)

# ─── Path setup so MoneyPrinterV2 src is importable ───────────────────────────
SRC_DIR = Path(__file__).parent.parent.parent / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

ROOT_DIR_OVERRIDE = Path(__file__).parent.parent.parent  # backend/ dir

UPLOADS_DIR = ROOT_DIR_OVERRIDE / "uploads"
SONGS_DIR   = ROOT_DIR_OVERRIDE / "Songs"
MP_DIR      = ROOT_DIR_OVERRIDE / ".mp"

for d in [UPLOADS_DIR / "videos", UPLOADS_DIR / "audio", UPLOADS_DIR / "images",
          SONGS_DIR, MP_DIR]:
    d.mkdir(parents=True, exist_ok=True)


def _write_config(user_config: dict) -> str:
    """Write a temporary config.json for MoneyPrinterV2 and return its path."""
    base = {
        "verbose": False,
        "firefox_profile": user_config.get("firefox_profile", ""),
        "headless": user_config.get("headless", True),
        "ollama_base_url": user_config.get("ollama_base_url", "http://127.0.0.1:11434"),
        "ollama_model": user_config.get("ollama_model", ""),
        "twitter_language": user_config.get("twitter_language", "French"),
        "nanobanana2_api_base_url": user_config.get("nanobanana2_api_base_url",
                                                     "https://generativelanguage.googleapis.com/v1beta"),
        "nanobanana2_api_key": user_config.get("nanobanana2_api_key", ""),
        "nanobanana2_model": user_config.get("nanobanana2_model", "gemini-3.1-flash-image-preview"),
        "nanobanana2_aspect_ratio": user_config.get("nanobanana2_aspect_ratio", "9:16"),
        "threads": user_config.get("threads", 2),
        "zip_url": user_config.get("zip_url", ""),
        "is_for_kids": user_config.get("is_for_kids", False),
        "google_maps_scraper": "https://github.com/gosom/google-maps-scraper/archive/refs/tags/v0.9.7.zip",
        "google_maps_scraper_niche": user_config.get("google_maps_scraper_niche", ""),
        "scraper_timeout": user_config.get("scraper_timeout", 300),
        "outreach_message_subject": user_config.get("outreach_message_subject", "Hello"),
        "outreach_message_body_file": "outreach_message.html",
        "email": user_config.get("email", {"smtp_server": "smtp.gmail.com", "smtp_port": 587,
                                            "username": "", "password": ""}),
        "stt_provider": user_config.get("stt_provider", "local_whisper"),
        "whisper_model": user_config.get("whisper_model", "base"),
        "whisper_device": user_config.get("whisper_device", "auto"),
        "whisper_compute_type": user_config.get("whisper_compute_type", "int8"),
        "assembly_ai_api_key": user_config.get("assembly_ai_api_key", ""),
        "tts_voice": user_config.get("tts_voice", "Jasper"),
        "font": "bold_font.ttf",
        "imagemagick_path": user_config.get("imagemagick_path", "/usr/bin/convert"),
        "script_sentence_length": user_config.get("script_sentence_length", 4),
    }
    config_path = str(ROOT_DIR_OVERRIDE / "config.json")
    with open(config_path, "w") as f:
        json.dump(base, f, indent=2)
    return config_path


def _append_log(task_id: int, message: str, db=None):
    """Append a log line to the task record."""
    if not db:
        return
    try:
        from app.models.task import Task
        task = db.query(Task).filter(Task.id == task_id).first()
        if task:
            current = task.logs or ""
            task.logs = current + f"[{datetime.utcnow().strftime('%H:%M:%S')}] {message}\n"
            db.commit()
    except Exception as e:
        logger.warning(f"Log append failed: {e}")


def _update_task(task_id: int, db, **kwargs):
    """Update task fields in DB."""
    if not db:
        return
    try:
        from app.models.task import Task
        task = db.query(Task).filter(Task.id == task_id).first()
        if task:
            for k, v in kwargs.items():
                setattr(task, k, v)
            db.commit()
    except Exception as e:
        logger.warning(f"Task update failed: {e}")


# ─── YOUTUBE VIDEO GENERATION ────────────────────────────────────────────────

async def run_youtube_video(task_id: int, niche: str, language: str,
                             user_config: dict, db=None) -> dict:
    """
    Full YouTube Short generation pipeline using the real MoneyPrinterV2 YouTube class.
    Runs synchronous MP2 code in a thread pool to avoid blocking the event loop.
    """
    def _sync_generate():
        # Patch ROOT_DIR in config module so MP2 finds config.json and .mp/
        _write_config(user_config)

        # Monkey-patch ROOT_DIR inside the imported modules
        import config as mp_config
        mp_config.ROOT_DIR = str(ROOT_DIR_OVERRIDE)

        import cache as mp_cache
        mp_cache  # triggers imports

        from llm_provider import select_model
        model = user_config.get("ollama_model", "")
        if model:
            select_model(model)

        from classes.Tts import TTS
        from classes.YouTube import YouTube

        tts = TTS()
        youtube = YouTube(
            account_uuid="saas-user",
            account_nickname="saas",
            fp_profile_path=user_config.get("firefox_profile", "/tmp"),
            niche=niche,
            language=language,
        )

        _update_task(task_id, db, status="running")
        _append_log(task_id, "Génération du topic...", db)
        topic = youtube.generate_topic()
        _update_task(task_id, db, topic=topic)
        _append_log(task_id, f"Topic: {topic}", db)

        _append_log(task_id, "Génération du script...", db)
        script = youtube.generate_script()
        _update_task(task_id, db, script=script)

        _append_log(task_id, "Génération des métadonnées...", db)
        metadata = youtube.generate_metadata()
        _update_task(task_id, db, title=metadata.get("title", topic), metadata_json=metadata)

        _append_log(task_id, "Génération des prompts d'images...", db)
        youtube.generate_prompts()

        _append_log(task_id, f"Génération de {len(youtube.image_prompts)} images IA...", db)
        for i, prompt in enumerate(youtube.image_prompts):
            _append_log(task_id, f"  Image {i+1}/{len(youtube.image_prompts)}: {prompt[:60]}...", db)
            youtube.generate_image(prompt)

        _append_log(task_id, "Synthèse vocale (TTS)...", db)
        youtube.generate_script_to_speech(tts)

        _append_log(task_id, "Assemblage de la vidéo (MoviePy)...", db)
        raw_video_path = youtube.combine()

        # Move video to uploads/
        import uuid
        final_name = f"yt_{uuid.uuid4().hex[:12]}.mp4"
        final_path = str(UPLOADS_DIR / "videos" / final_name)
        shutil.move(raw_video_path, final_path)
        youtube.video_path = final_path

        # Generate thumbnail
        thumb_name = final_name.replace(".mp4", "_thumb.jpg")
        thumb_path = str(UPLOADS_DIR / "videos" / thumb_name)
        try:
            import subprocess
            subprocess.run(["ffmpeg", "-y", "-i", final_path, "-ss", "00:00:01",
                           "-vframes", "1", "-q:v", "2", thumb_path],
                          capture_output=True, timeout=30)
        except Exception:
            thumb_path = None

        file_size = os.path.getsize(final_path) if os.path.exists(final_path) else 0

        return {
            "video_path": final_path,
            "video_url": f"/uploads/videos/{final_name}",
            "thumbnail_url": f"/uploads/videos/{thumb_name}" if thumb_path and os.path.exists(thumb_path) else None,
            "file_size": file_size,
            "title": metadata.get("title", topic),
            "topic": topic,
            "script": script,
            "metadata": metadata,
        }

    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, _sync_generate)

        _update_task(task_id, db,
                     status="completed",
                     video_url=result["video_url"],
                     thumbnail_url=result["thumbnail_url"],
                     file_size=result["file_size"],
                     title=result["title"],
                     topic=result["topic"],
                     script=result["script"],
                     metadata_json=result["metadata"],
                     completed_at=datetime.utcnow())
        _append_log(task_id, "✅ Vidéo générée avec succès!", db)
        return result

    except Exception as e:
        logger.exception(f"YouTube task {task_id} failed: {e}")
        _update_task(task_id, db, status="failed", error_message=str(e))
        _append_log(task_id, f"❌ Erreur: {e}", db)
        return {"error": str(e)}


# ─── YOUTUBE UPLOAD ───────────────────────────────────────────────────────────

async def run_youtube_upload(task_id: int, user_config: dict, db=None) -> dict:
    """Upload the generated video to YouTube via Selenium (requires Firefox profile)."""
    def _sync_upload():
        _write_config(user_config)
        import config as mp_config
        mp_config.ROOT_DIR = str(ROOT_DIR_OVERRIDE)

        from llm_provider import select_model
        model = user_config.get("ollama_model", "")
        if model:
            select_model(model)

        from classes.YouTube import YouTube
        from app.models.task import Task as TaskModel

        task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
        if not task or not task.video_path:
            raise ValueError("Task has no video_path. Generate video first.")

        youtube = YouTube(
            account_uuid="saas-user",
            account_nickname="saas",
            fp_profile_path=user_config.get("firefox_profile", "/tmp"),
            niche=task.niche or "general",
            language=task.language or "English",
        )
        youtube.video_path = task.video_path
        youtube.metadata = task.metadata_json or {"title": task.title, "description": task.script or ""}
        youtube.get_channel_id()
        success = youtube.upload_video()
        return {"uploaded": success, "youtube_url": getattr(youtube, "uploaded_video_url", None)}

    try:
        _append_log(task_id, "Upload YouTube via Selenium...", db)
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, _sync_upload)
        if result.get("youtube_url"):
            _update_task(task_id, db, youtube_url=result["youtube_url"])
            _append_log(task_id, f"✅ Uploadé: {result['youtube_url']}", db)
        return result
    except Exception as e:
        logger.exception(f"Upload task {task_id} failed: {e}")
        _append_log(task_id, f"❌ Upload échoué: {e}", db)
        return {"error": str(e)}


# ─── TWITTER POST ─────────────────────────────────────────────────────────────

async def run_twitter_post(task_id: int, topic: str, text: Optional[str],
                            user_config: dict, db=None) -> dict:
    """Generate and post a tweet using the real MoneyPrinterV2 Twitter class."""
    def _sync_post():
        _write_config(user_config)
        import config as mp_config
        mp_config.ROOT_DIR = str(ROOT_DIR_OVERRIDE)

        from llm_provider import select_model
        model = user_config.get("ollama_model", "")
        if model:
            select_model(model)

        from classes.Twitter import Twitter
        fp = user_config.get("firefox_profile", "")
        if not fp or not os.path.isdir(fp):
            raise ValueError("Firefox profile invalide. Configurez-le dans Paramètres.")

        twitter = Twitter(
            account_uuid="saas-user",
            account_nickname="saas",
            fp_profile_path=fp,
            topic=topic,
        )

        if text:
            post_content = text
        else:
            _append_log(task_id, "Génération du tweet par IA...", db)
            post_content = twitter.generate_post()

        _append_log(task_id, f"Publication du tweet: {post_content[:80]}...", db)
        twitter.post(text=post_content)
        return {"content": post_content}

    try:
        _update_task(task_id, db, status="running")
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, _sync_post)
        _update_task(task_id, db,
                     status="completed",
                     tweet_content=result["content"],
                     completed_at=datetime.utcnow())
        _append_log(task_id, "✅ Tweet publié!", db)
        return result
    except Exception as e:
        logger.exception(f"Twitter task {task_id} failed: {e}")
        _update_task(task_id, db, status="failed", error_message=str(e))
        _append_log(task_id, f"❌ Erreur: {e}", db)
        return {"error": str(e)}


# ─── AFFILIATE MARKETING ──────────────────────────────────────────────────────

async def run_afm(task_id: int, affiliate_link: str, twitter_topic: str,
                  user_config: dict, db=None) -> dict:
    """Generate an affiliate pitch and post it to Twitter using MoneyPrinterV2 AFM."""
    def _sync_afm():
        _write_config(user_config)
        import config as mp_config
        mp_config.ROOT_DIR = str(ROOT_DIR_OVERRIDE)

        from llm_provider import select_model
        model = user_config.get("ollama_model", "")
        if model:
            select_model(model)

        fp = user_config.get("firefox_profile", "")
        if not fp or not os.path.isdir(fp):
            raise ValueError("Firefox profile invalide. Configurez-le dans Paramètres.")

        from classes.AFM import AffiliateMarketing
        _append_log(task_id, "Scraping du produit affilié...", db)
        afm = AffiliateMarketing(
            affiliate_link=affiliate_link,
            fp_profile_path=fp,
            twitter_account_uuid="saas-user",
            account_nickname="saas",
            topic=twitter_topic,
        )
        _append_log(task_id, "Génération du pitch...", db)
        pitch = afm.generate_pitch()
        _append_log(task_id, "Partage sur Twitter...", db)
        afm.share_pitch("twitter")
        afm.quit()
        return {"pitch": pitch}

    try:
        _update_task(task_id, db, status="running", affiliate_link=affiliate_link)
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, _sync_afm)
        _update_task(task_id, db, status="completed", pitch=result["pitch"], completed_at=datetime.utcnow())
        _append_log(task_id, "✅ Pitch affilié publié!", db)
        return result
    except Exception as e:
        logger.exception(f"AFM task {task_id} failed: {e}")
        _update_task(task_id, db, status="failed", error_message=str(e))
        _append_log(task_id, f"❌ Erreur: {e}", db)
        return {"error": str(e)}
