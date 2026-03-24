"""
Social Publisher API — VideoMachine SaaS
Facebook, Instagram, LinkedIn publishing via Playwright + cookies.
No official API keys needed — uses saved browser cookies.
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_active_user
from app.models.task import Task
from app.models.user import User
from app.services.mp_wrapper import run_social_publish

router = APIRouter(prefix="/api/social", tags=["social"])

SUPPORTED_PLATFORMS = ["facebook", "instagram", "linkedin"]


class SocialPostInput(BaseModel):
    video_path: str
    topic: str
    platforms: Optional[List[str]] = None          # None = all configured
    captions: Optional[Dict[str, str]] = None       # per-platform overrides


class TaskOut(BaseModel):
    id: int
    status: str
    tweet_content: Optional[str]    # JSON string of per-platform results
    error_message: Optional[str]
    logs: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


@router.post("/post", response_model=TaskOut)
async def post_social(
    data: SocialPostInput,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_active_user),
    db: Session = Depends(get_db),
):
    """Publish a video to one or more social platforms."""
    cfg = current_user.mp_config or {}

    # Determine which platforms have cookies configured
    platforms = data.platforms or SUPPORTED_PLATFORMS
    configured = [p for p in platforms if cfg.get(f"{p}_cookies")]

    if not configured:
        raise HTTPException(
            400,
            "Aucun cookie configuré pour les plateformes demandées. "
            "Configurez les cookies dans Paramètres → Social Media."
        )

    task = Task(
        owner_id=current_user.id,
        task_type="social",
        status="pending",
        title=f"Social: {data.topic[:60]}",
        niche=data.topic,
        logs="",
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    from app.core.database import SessionLocal

    async def bg(tid, video_path, topic, platforms, captions, config):
        bg_db = SessionLocal()
        try:
            await run_social_publish(tid, video_path, topic, platforms, captions, config, bg_db)
        finally:
            bg_db.close()

    background_tasks.add_task(
        bg, task.id, data.video_path, data.topic,
        configured, data.captions or {}, cfg,
    )
    return task


@router.post("/post-from-task/{youtube_task_id}", response_model=TaskOut)
async def post_from_youtube_task(
    youtube_task_id: int,
    topic: str = "",
    platforms: Optional[str] = None,   # comma-separated
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: User = Depends(get_active_user),
    db: Session = Depends(get_db),
):
    """Republish a completed YouTube Short to social platforms."""
    cfg = current_user.mp_config or {}

    yt_task = db.query(Task).filter(
        Task.id == youtube_task_id,
        Task.owner_id == current_user.id,
        Task.task_type == "youtube",
        Task.status == "completed",
    ).first()
    if not yt_task:
        raise HTTPException(404, "Tâche YouTube introuvable ou non terminée.")
    if not yt_task.video_path:
        raise HTTPException(400, "Aucune vidéo associée à cette tâche YouTube.")

    platform_list = [p.strip() for p in platforms.split(",")] if platforms else SUPPORTED_PLATFORMS
    configured = [p for p in platform_list if cfg.get(f"{p}_cookies")]

    if not configured:
        raise HTTPException(400, "Aucun cookie configuré pour les plateformes demandées.")

    task_topic = topic or yt_task.niche or yt_task.title or "video"
    task = Task(
        owner_id=current_user.id,
        task_type="social",
        status="pending",
        title=f"Social (de YT#{youtube_task_id}): {task_topic[:50]}",
        niche=task_topic,
        logs="",
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    from app.core.database import SessionLocal

    async def bg(tid, video_path, t, plats, config):
        bg_db = SessionLocal()
        try:
            await run_social_publish(tid, video_path, t, plats, {}, config, bg_db)
        finally:
            bg_db.close()

    background_tasks.add_task(bg, task.id, yt_task.video_path, task_topic, configured, cfg)
    return task


@router.get("/posts", response_model=List[TaskOut])
async def list_posts(
    skip: int = 0, limit: int = 50,
    current_user: User = Depends(get_active_user),
    db: Session = Depends(get_db),
):
    return (db.query(Task)
            .filter(Task.owner_id == current_user.id, Task.task_type == "social")
            .order_by(Task.created_at.desc())
            .offset(skip).limit(limit).all())


@router.get("/posts/{task_id}/status")
async def get_status(
    task_id: int,
    current_user: User = Depends(get_active_user),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(
        Task.id == task_id, Task.owner_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(404, "Tâche introuvable")
    return {
        "id": task.id,
        "status": task.status,
        "results": task.tweet_content,   # JSON string of per-platform results
        "logs": task.logs,
        "error_message": task.error_message,
    }
