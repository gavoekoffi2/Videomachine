"""
Affiliate Marketing API — wraps MoneyPrinterV2 AFM class.
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_active_user
from app.models.task import Task
from app.models.user import User
from app.services.mp_wrapper import run_afm

router = APIRouter(prefix="/api/afm", tags=["affiliate-marketing"])


class AFMInput(BaseModel):
    affiliate_link: str
    twitter_topic: str


class TaskOut(BaseModel):
    id: int
    status: str
    affiliate_link: Optional[str] = None
    pitch: Optional[str] = None
    error_message: Optional[str] = None
    logs: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True



@router.post("/run", response_model=TaskOut)
async def run_afm_task(
    data: AFMInput,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_active_user),
    db: Session = Depends(get_db),
):
    cfg = current_user.mp_config or {}
    if not cfg.get("firefox_profile"):
        raise HTTPException(400, "Firefox profile requis. Configurez-le dans Paramètres.")

    task = Task(
        owner_id=current_user.id,
        task_type="afm",
        status="pending",
        title=f"AFM: {data.affiliate_link[:60]}",
        affiliate_link=data.affiliate_link,
        niche=data.twitter_topic,
        logs="",
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    from app.core.database import SessionLocal
    async def bg(tid, link, topic, config):
        bg_db = SessionLocal()
        try:
            await run_afm(tid, link, topic, config, bg_db)
        finally:
            bg_db.close()

    background_tasks.add_task(bg, task.id, data.affiliate_link, data.twitter_topic, cfg)
    return task


@router.get("/tasks", response_model=List[TaskOut])
async def list_tasks(
    current_user: User = Depends(get_active_user),
    db: Session = Depends(get_db),
):
    return (db.query(Task)
            .filter(Task.owner_id == current_user.id, Task.task_type == "afm")
            .order_by(Task.created_at.desc()).limit(50).all())


@router.get("/tasks/{task_id}/status")
async def get_status(task_id: int, current_user: User = Depends(get_active_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id, Task.owner_id == current_user.id).first()
    if not task:
        raise HTTPException(404, "Tâche introuvable")
    return {"id": task.id, "status": task.status, "logs": task.logs,
            "pitch": task.pitch, "error_message": task.error_message}
