from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.core.database import get_db
from app.core.security import verify_password, hash_password, create_token, get_active_user
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterInput(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: str = ""


class UserOut(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    plan: str
    videos_generated: int
    videos_limit: int
    is_admin: bool
    mp_config: dict = {}
    created_at: datetime

    class Config:
        from_attributes = True


class TokenOut(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


@router.post("/register", response_model=TokenOut)
async def register(data: RegisterInput, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(400, "Email déjà utilisé")
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(400, "Nom d'utilisateur déjà pris")

    user = User(
        email=data.email,
        username=data.username,
        full_name=data.full_name,
        hashed_password=hash_password(data.password),
        plan="free",
        videos_limit=3,
        mp_config={},
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token({"sub": user.email})
    return TokenOut(access_token=token, token_type="bearer", user=user)


@router.post("/login", response_model=TokenOut)
async def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Email ou mot de passe incorrect")
    user.last_login = datetime.utcnow()
    db.commit()
    token = create_token({"sub": user.email})
    return TokenOut(access_token=token, token_type="bearer", user=user)


@router.get("/me", response_model=UserOut)
async def me(current_user=Depends(get_active_user)):
    return current_user


@router.put("/me", response_model=UserOut)
async def update_me(full_name: str = None, current_user=Depends(get_active_user), db: Session = Depends(get_db)):
    if full_name is not None:
        current_user.full_name = full_name
    db.commit()
    db.refresh(current_user)
    return current_user


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


@router.post("/change-password")
async def change_password(data: PasswordChange, current_user=Depends(get_active_user), db: Session = Depends(get_db)):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(400, "Mot de passe actuel incorrect")
    current_user.hashed_password = hash_password(data.new_password)
    db.commit()
    return {"message": "Mot de passe modifié"}
