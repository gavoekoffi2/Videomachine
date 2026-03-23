import asyncio
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.video import Video
from app.models.user import User
from app.services.video_generator import video_generator

router = APIRouter(prefix="/api/videos", tags=["videos"])


class VideoCreate(BaseModel):
    topic: str
    language: str = "fr"
    style: str = "motivational"
    voice_name: str = "fr-FR-DeniseNeural"
    resolution: str = "1080x1920"
    music_type: str = "upbeat"


class VideoResponse(BaseModel):
    id: int
    title: str
    topic: str
    status: str
    video_url: Optional[str]
    thumbnail_url: Optional[str]
    duration: Optional[float]
    file_size: Optional[int]
    language: str
    style: Optional[str]
    voice_name: Optional[str]
    views: int
    downloads: int
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


VOICE_OPTIONS = {
    "fr": [
        {"id": "fr-FR-DeniseNeural", "name": "Denise (Française)"},
        {"id": "fr-FR-HenriNeural", "name": "Henri (Français)"},
        {"id": "fr-BE-CharlineNeural", "name": "Charline (Belge)"},
    ],
    "en": [
        {"id": "en-US-JennyNeural", "name": "Jenny (American)"},
        {"id": "en-US-GuyNeural", "name": "Guy (American)"},
        {"id": "en-GB-SoniaNeural", "name": "Sonia (British)"},
    ],
    "es": [
        {"id": "es-ES-ElviraNeural", "name": "Elvira (Española)"},
    ],
}

VIDEO_STYLES = [
    {"id": "motivational", "name": "Motivationnel", "description": "Inspirant et dynamique"},
    {"id": "educational", "name": "Éducatif", "description": "Informatif et clair"},
    {"id": "news", "name": "Actualités", "description": "Style journalistique"},
    {"id": "story", "name": "Histoire", "description": "Narratif et captivant"},
    {"id": "marketing", "name": "Marketing", "description": "Persuasif et commercial"},
]


@router.get("/options")
async def get_options():
    return {"voices": VOICE_OPTIONS, "styles": VIDEO_STYLES}


async def run_video_generation(video_id: int, topic: str, language: str,
                                style: str, voice_name: str, resolution: str):
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        await video_generator.full_pipeline(
            video_id=video_id,
            topic=topic,
            language=language,
            style=style,
            voice_name=voice_name,
            resolution=resolution,
            db=db
        )
    finally:
        db.close()


@router.post("/generate", response_model=VideoResponse)
async def generate_video(
    video_data: VideoCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check plan limits
    if current_user.videos_limit != -1 and current_user.videos_generated >= current_user.videos_limit:
        raise HTTPException(
            status_code=403,
            detail=f"Video limit reached ({current_user.videos_limit} videos). Please upgrade your plan."
        )

    # Create video record
    video = Video(
        owner_id=current_user.id,
        title=f"Vidéo: {video_data.topic[:100]}",
        topic=video_data.topic,
        status="pending",
        language=video_data.language,
        video_style=video_data.style,
        voice_name=video_data.voice_name,
        resolution=video_data.resolution,
        music_type=video_data.music_type,
    )
    db.add(video)

    # Update user counter
    current_user.videos_generated += 1
    db.commit()
    db.refresh(video)

    # Start background generation
    background_tasks.add_task(
        run_video_generation,
        video.id, video_data.topic, video_data.language,
        video_data.style, video_data.voice_name, video_data.resolution
    )

    return video


@router.get("/", response_model=List[VideoResponse])
async def list_videos(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    videos = (db.query(Video)
              .filter(Video.owner_id == current_user.id)
              .order_by(Video.created_at.desc())
              .offset(skip)
              .limit(limit)
              .all())
    return videos


@router.get("/{video_id}", response_model=VideoResponse)
async def get_video(
    video_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    video = db.query(Video).filter(Video.id == video_id, Video.owner_id == current_user.id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return video


@router.get("/{video_id}/status")
async def get_video_status(
    video_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    video = db.query(Video).filter(Video.id == video_id, Video.owner_id == current_user.id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return {
        "id": video.id,
        "status": video.status,
        "video_url": video.video_url,
        "thumbnail_url": video.thumbnail_url,
        "error_message": video.error_message,
    }


@router.delete("/{video_id}")
async def delete_video(
    video_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    import os
    video = db.query(Video).filter(Video.id == video_id, Video.owner_id == current_user.id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    # Delete files
    for url in [video.video_url, video.thumbnail_url]:
        if url:
            path = f".{url}"
            if os.path.exists(path):
                os.remove(path)

    db.delete(video)
    db.commit()
    return {"message": "Video deleted"}


@router.post("/{video_id}/download")
async def increment_download(
    video_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    video = db.query(Video).filter(Video.id == video_id, Video.owner_id == current_user.id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    video.downloads += 1
    db.commit()
    return {"download_url": video.video_url}
