from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select

from database import get_db
from middleware.security import limiter
from models.user import User
from schemas.auth import LoginRequest, RegisterRequest, Verify2FARequest
from services.auth_service import (
    create_access_token,
    create_temp_token_for_2fa,
    get_current_user,
    get_password_hash,
    user_id_from_temp_2fa_token,
    verify_password,
)
from services.twofa_service import verify_totp

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
@limiter.limit("10/minute")
def register(request: Request, payload: RegisterRequest, db: Session = Depends(get_db)) -> dict:
    existing = db.exec(select(User).where(User.email == payload.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already in use")
    user = User(
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        full_name=payload.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "email": user.email, "full_name": user.full_name}


@router.post("/login")
@limiter.limit("5/minute")
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)) -> dict:
    user = db.exec(select(User).where(User.email == payload.email)).first()
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.is_2fa_enabled:
        temp = create_temp_token_for_2fa(user.id)
        return {"totp_required": True, "temp_token": temp, "token_type": "pending"}
    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer", "totp_required": False}


@router.post("/login/verify-2fa")
@limiter.limit("10/minute")
def verify_2fa_login(request: Request, payload: Verify2FARequest, db: Session = Depends(get_db)) -> dict:
    user_id = user_id_from_temp_2fa_token(payload.temp_token)
    user = db.get(User, user_id)
    if not user or not user.is_2fa_enabled:
        raise HTTPException(status_code=401, detail="Invalid verification request")
    if not verify_totp(user.totp_secret, payload.totp_code):
        raise HTTPException(status_code=400, detail="Invalid TOTP code")
    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me")
def me(current_user: User = Depends(get_current_user)) -> dict:
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "is_2fa_enabled": current_user.is_2fa_enabled,
    }
