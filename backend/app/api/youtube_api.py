"""
YouTube Shorts Automation API
Wraps MoneyPrinterV2's YouTube class.
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_active_user
from app.models.task import Task
from app.models.user import User
from app.services.mp_wrapper import run_youtube_video, run_youtube_upload

router = APIRouter(prefix="/api/youtube", tags=["youtube"])

LANGUAGES = [
    {"code": "French", "label": "Français"},
    {"code": "English", "label": "Anglais"},
    {"code": "Spanish", "label": "Espagnol"},
    {"code": "Portuguese", "label": "Portugais"},
    {"code": "Arabic", "label": "Arabe"},
    {"code": "German", "label": "Allemand"},
]


class GenerateVideoInput(BaseModel):
    niche: str
    language: str = "French"


class TaskOut(BaseModel):
    id: int
    task_type: str
    status: str
    title: Optional[str]
    niche: Optional[str]
    language: Optional[str]
    topic: Optional[str]
    script: Optional[str]
    video_url: Optional[str]
    thumbnail_url: Optional[str]
    youtube_url: Optional[str]
    error_message: Optional[str]
    logs: Optional[str]
    file_size: Optional[int]
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


async def _bg_generate(task_id: int, niche: str, language: str, user_config: dict, db):
    await run_youtube_video(task_id, niche, language, user_config, db)


@router.get("/languages")
async def get_languages():
    return {"languages": LANGUAGES}


@router.post("/generate", response_model=TaskOut)
async def generate_video(
    data: GenerateVideoInput,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_active_user),
    db: Session = Depends(get_db),
):
    # Check limits
    if current_user.videos_limit != -1 and current_user.videos_generated >= current_user.videos_limit:
        raise HTTPException(403, f"Limite de vidéos atteinte ({current_user.videos_limit}). Upgradez votre plan.")

    cfg = current_user.mp_config or {}
    if not cfg.get("ollama_model") and not cfg.get("nanobanana2_api_key"):
        raise HTTPException(400, "Configurez Ollama ou une clé API IA dans les Paramètres.")

    task = Task(
        owner_id=current_user.id,
        task_type="youtube",
        status="pending",
        niche=data.niche,
        language=data.language,
        title=f"Génération: {data.niche[:80]}",
        logs="",
    )
    db.add(task)
    current_user.videos_generated += 1
    db.commit()
    db.refresh(task)

    from app.core.database import SessionLocal
    async def bg(tid, niche, lang, cfg):
        bg_db = SessionLocal()
        try:
            await run_youtube_video(tid, niche, lang, cfg, bg_db)
        finally:
            bg_db.close()

    background_tasks.add_task(bg, task.id, data.niche, data.language, cfg)
    return task


@router.post("/{task_id}/upload", response_model=TaskOut)
async def upload_to_youtube(
    task_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_active_user),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id, Task.owner_id == current_user.id).first()
    if not task:
        raise HTTPException(404, "Tâche introuvable")
    if task.status != "completed":
        raise HTTPException(400, "La vidéo n'est pas encore générée")
    if not task.video_url:
        raise HTTPException(400, "Aucun fichier vidéo disponible")

    cfg = current_user.mp_config or {}
    if not cfg.get("firefox_profile"):
        raise HTTPException(400, "Firefox profile requis pour l'upload YouTube. Configurez-le dans Paramètres.")

    from app.core.database import SessionLocal
    async def bg(tid, config):
        bg_db = SessionLocal()
        try:
            await run_youtube_upload(tid, config, bg_db)
        finally:
            bg_db.close()

    background_tasks.add_task(bg, task_id, cfg)
    return task


@router.get("/tasks", response_model=List[TaskOut])
async def list_tasks(
    skip: int = 0, limit: int = 30,
    current_user: User = Depends(get_active_user),
    db: Session = Depends(get_db),
):
    return (db.query(Task)
            .filter(Task.owner_id == current_user.id, Task.task_type == "youtube")
            .order_by(Task.created_at.desc())
            .offset(skip).limit(limit).all())


@router.get("/tasks/{task_id}", response_model=TaskOut)
async def get_task(task_id: int, current_user: User = Depends(get_active_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id, Task.owner_id == current_user.id).first()
    if not task:
        raise HTTPException(404, "Tâche introuvable")
    return task


@router.get("/tasks/{task_id}/status")
async def get_status(task_id: int, current_user: User = Depends(get_active_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id, Task.owner_id == current_user.id).first()
    if not task:
        raise HTTPException(404, "Tâche introuvable")
    return {"id": task.id, "status": task.status, "logs": task.logs,
            "video_url": task.video_url, "thumbnail_url": task.thumbnail_url,
            "youtube_url": task.youtube_url, "error_message": task.error_message}


@router.delete("/tasks/{task_id}")
async def delete_task(task_id: int, current_user: User = Depends(get_active_user), db: Session = Depends(get_db)):
    import os
    task = db.query(Task).filter(Task.id == task_id, Task.owner_id == current_user.id).first()
    if not task:
        raise HTTPException(404, "Tâche introuvable")
    # Remove video file
    if task.video_url:
        path = f"./backend{task.video_url}"
        if os.path.exists(path):
            os.remove(path)
    db.delete(task)
    db.commit()
    return {"message": "Supprimé"}
