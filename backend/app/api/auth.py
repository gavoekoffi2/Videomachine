from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from pydantic import BaseModel, EmailStr
from app.core.database import get_db
from app.core.security import (
    verify_password, get_password_hash, create_access_token,
    get_current_active_user
)
from app.models.user import User
from app.models.subscription import Subscription

router = APIRouter(prefix="/api/auth", tags=["auth"])


class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: str = ""


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: str = ""
    avatar_url: str = ""
    plan: str
    videos_generated: int
    videos_limit: int
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


@router.post("/register", response_model=Token)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    # Check existing
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    # Create user
    user = User(
        email=user_data.email,
        username=user_data.username,
        full_name=user_data.full_name,
        hashed_password=get_password_hash(user_data.password),
        plan="free",
        videos_limit=3,
    )
    db.add(user)
    db.flush()

    # Create free subscription
    sub = Subscription(
        user_id=user.id,
        plan="free",
        status="active",
        price=0,
        videos_limit=3,
        current_period_end=datetime.utcnow() + timedelta(days=365),
    )
    db.add(sub)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.email})
    return Token(access_token=token, token_type="bearer", user=user)


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    user.last_login = datetime.utcnow()
    db.commit()
    token = create_access_token({"sub": user.email})
    return Token(access_token=token, token_type="bearer", user=user)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_active_user)):
    return current_user


@router.put("/me")
async def update_me(
    full_name: str = None,
    avatar_url: str = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if full_name:
        current_user.full_name = full_name
    if avatar_url:
        current_user.avatar_url = avatar_url
    db.commit()
    return {"message": "Profile updated"}


class ChangePassword(BaseModel):
    current_password: str
    new_password: str


@router.post("/change-password")
async def change_password(
    data: ChangePassword,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}
