"""
Twitter Bot API — wraps MoneyPrinterV2 Twitter class.
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
from app.services.mp_wrapper import run_twitter_post

router = APIRouter(prefix="/api/twitter", tags=["twitter"])


class PostInput(BaseModel):
    topic: str
    custom_text: Optional[str] = None  # If set, post this instead of AI-generated


class TaskOut(BaseModel):
    id: int
    status: str
    tweet_content: Optional[str]
    error_message: Optional[str]
    logs: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


@router.post("/post", response_model=TaskOut)
async def post_tweet(
    data: PostInput,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_active_user),
    db: Session = Depends(get_db),
):
    cfg = current_user.mp_config or {}
    if not cfg.get("firefox_profile"):
        raise HTTPException(400, "Firefox profile requis. Configurez-le dans Paramètres.")

    task = Task(
        owner_id=current_user.id,
        task_type="twitter",
        status="pending",
        title=f"Tweet: {data.topic[:60]}",
        niche=data.topic,
        tweet_content=data.custom_text,
        logs="",
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    from app.core.database import SessionLocal
    async def bg(tid, topic, text, config):
        bg_db = SessionLocal()
        try:
            await run_twitter_post(tid, topic, text, config, bg_db)
        finally:
            bg_db.close()

    background_tasks.add_task(bg, task.id, data.topic, data.custom_text, cfg)
    return task


@router.get("/posts", response_model=List[TaskOut])
async def list_posts(
    skip: int = 0, limit: int = 50,
    current_user: User = Depends(get_active_user),
    db: Session = Depends(get_db),
):
    return (db.query(Task)
            .filter(Task.owner_id == current_user.id, Task.task_type == "twitter")
            .order_by(Task.created_at.desc())
            .offset(skip).limit(limit).all())


@router.get("/posts/{task_id}/status")
async def get_status(task_id: int, current_user: User = Depends(get_active_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id, Task.owner_id == current_user.id).first()
    if not task:
        raise HTTPException(404, "Tâche introuvable")
    return {"id": task.id, "status": task.status, "logs": task.logs,
            "tweet_content": task.tweet_content, "error_message": task.error_message}
