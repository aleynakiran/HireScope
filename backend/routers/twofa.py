from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session

from database import get_db
from middleware.security import limiter
from models.user import User
from schemas.twofa import TwoFACodeBody
from services.auth_service import get_current_user
from services.twofa_service import generate_qr_code, generate_totp_secret, verify_totp

router = APIRouter(prefix="/2fa", tags=["2fa"])


@router.post("/setup")
@limiter.limit("10/minute")
def setup_2fa(
    request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    secret = generate_totp_secret()
    current_user.totp_secret = secret
    db.add(current_user)
    db.commit()
    qr_code = generate_qr_code(secret, current_user.email)
    return {"qr_code": qr_code, "secret": secret}


@router.post("/verify")
@limiter.limit("10/minute")
def verify_setup(
    request: Request,
    body: TwoFACodeBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.totp_secret:
        raise HTTPException(status_code=400, detail="Run setup first")
    if not verify_totp(current_user.totp_secret, body.code):
        raise HTTPException(status_code=400, detail="Invalid TOTP code")
    current_user.is_2fa_enabled = True
    db.add(current_user)
    db.commit()
    return {"message": "2FA activated successfully"}


@router.post("/disable")
def disable_2fa(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.is_2fa_enabled = False
    current_user.totp_secret = None
    db.add(current_user)
    db.commit()
    return {"message": "2FA disabled"}
