import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlmodel import Session, select

from database import get_db
from models.user import User

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
TEMP_TOKEN_EXPIRE_MINUTES = int(os.getenv("TEMP_TOKEN_EXPIRE_MINUTES", "5"))
TOKEN_TYPE_2FA_PENDING = "2fa_pending"


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: int, expires_minutes: Optional[int] = None) -> str:
    expire_delta = timedelta(minutes=expires_minutes or ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) + expire_delta,
        "typ": "access",
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_temp_token_for_2fa(user_id: int) -> str:
    expire_delta = timedelta(minutes=TEMP_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) + expire_delta,
        "typ": TOKEN_TYPE_2FA_PENDING,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def user_id_from_temp_2fa_token(token: str) -> int:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired temporary token",
        ) from exc
    if payload.get("typ") != TOKEN_TYPE_2FA_PENDING:
        raise HTTPException(status_code=401, detail="Invalid temporary token")
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=401, detail="Invalid temporary token")
    return int(sub)


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("typ") == TOKEN_TYPE_2FA_PENDING:
            raise credentials_exception
        sub = payload.get("sub")
        if not sub:
            raise credentials_exception
    except JWTError as exc:
        raise credentials_exception from exc

    user = db.exec(select(User).where(User.id == int(sub))).first()
    if not user or not user.is_active:
        raise credentials_exception
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
