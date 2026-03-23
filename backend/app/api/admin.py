from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.video import Video
from app.models.payment import Payment

router = APIRouter(prefix="/api/admin", tags=["admin"])


def require_admin(current_user=Depends(get_current_active_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("/stats")
async def get_stats(admin=Depends(require_admin), db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_videos = db.query(Video).count()
    completed_videos = db.query(Video).filter(Video.status == "completed").count()
    total_revenue = db.query(Payment).filter(Payment.status == "completed").with_entities(
        Payment.amount
    ).all()
    revenue = sum(p.amount for p in total_revenue)

    plan_counts = {}
    for plan in ["free", "starter", "pro", "enterprise"]:
        plan_counts[plan] = db.query(User).filter(User.plan == plan).count()

    return {
        "total_users": total_users,
        "total_videos": total_videos,
        "completed_videos": completed_videos,
        "success_rate": round(completed_videos / total_videos * 100, 1) if total_videos else 0,
        "total_revenue_xof": revenue,
        "plan_distribution": plan_counts,
    }


@router.get("/users")
async def list_users(
    skip: int = 0, limit: int = 50,
    admin=Depends(require_admin), db: Session = Depends(get_db)
):
    users = db.query(User).offset(skip).limit(limit).all()
    return [
        {
            "id": u.id, "email": u.email, "username": u.username,
            "plan": u.plan, "videos_generated": u.videos_generated,
            "is_active": u.is_active, "created_at": u.created_at,
        }
        for u in users
    ]


@router.put("/users/{user_id}/plan")
async def update_user_plan(
    user_id: int, plan: str,
    admin=Depends(require_admin), db: Session = Depends(get_db)
):
    from app.api.payments import PLAN_LIMITS
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.plan = plan
    user.videos_limit = PLAN_LIMITS.get(plan, 3)
    db.commit()
    return {"message": f"User plan updated to {plan}"}
