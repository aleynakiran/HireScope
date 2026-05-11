from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select

from database import get_db
from middleware.security import limiter
from models.user import User
from schemas.auth import (
    EmailSendRequest,
    EmailSetupRequest,
    EmailVerifyRequest,
    LoginSend2FARequest,
    LoginRequest,
    RegisterRequest,
    SmsSendRequest,
    SmsSetupRequest,
    SmsVerifyRequest,
    Verify2FARequest,
)
from services.backup_code_service import generate_backup_codes, verify_backup_code
from services.email_service import issue_email_otp, send_email_otp, verify_email_otp
from services.auth_service import (
    create_access_token,
    create_temp_token_for_2fa,
    get_current_user,
    get_password_hash,
    user_id_from_temp_2fa_token,
    verify_password,
)
from services.sms_service import issue_sms_otp, send_sms_otp, verify_sms_otp
from services.twofa_service import verify_totp

router = APIRouter(prefix="/auth", tags=["auth"])


def _sync_2fa_enabled(user: User) -> None:
    user.is_2fa_enabled = bool(user.totp_enabled or user.email_otp_enabled or user.sms_otp_enabled)


def _pending_2fa_user(temp_token: str, db: Session) -> User:
    user_id = user_id_from_temp_2fa_token(temp_token)
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid verification request")
    return user


def _delivery_http_error(exc: RuntimeError) -> HTTPException:
    return HTTPException(status_code=503, detail=str(exc))


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
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    if user.is_2fa_enabled or user.email_otp_enabled or user.sms_otp_enabled:
        temp = create_temp_token_for_2fa(user.id)
        available_methods = []
        if user.totp_enabled or (user.is_2fa_enabled and user.totp_secret):
            available_methods.append("totp")
        if user.email_otp_enabled:
            available_methods.append("email")
        if user.sms_otp_enabled and user.phone_number:
            available_methods.append("sms")
        if not available_methods and user.is_2fa_enabled:
            available_methods.append("totp")
        return {
            "two_factor_required": True,
            "totp_required": "totp" in available_methods,
            "available_2fa_methods": available_methods,
            "temp_token": temp,
            "token_type": "pending",
        }
    token = create_access_token(user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "two_factor_required": False,
        "totp_required": False,
    }


@router.post("/login/verify-2fa")
@limiter.limit("10/minute")
def verify_2fa_login(request: Request, payload: Verify2FARequest, db: Session = Depends(get_db)) -> dict:
    user = _pending_2fa_user(payload.temp_token, db)
    method = payload.method
    valid = False
    if method == "totp":
        valid = bool((user.totp_enabled or user.is_2fa_enabled) and verify_totp(user.totp_secret, payload.code))
    elif method == "email":
        valid = bool(user.email_otp_enabled and verify_email_otp(user.email, payload.code))
    elif method == "sms":
        valid = bool(
            user.sms_otp_enabled and user.phone_number and verify_sms_otp(user.phone_number, payload.code)
        )
    elif method == "backup":
        valid = verify_backup_code(user.id, payload.code, db)
    if not valid:
        raise HTTPException(status_code=400, detail="Invalid 2FA verification code")
    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer"}


@router.post("/login/send-2fa")
@limiter.limit("10/minute")
async def send_login_2fa_code(
    request: Request,
    payload: LoginSend2FARequest,
    db: Session = Depends(get_db),
):
    user = _pending_2fa_user(payload.temp_token, db)

    if payload.method == "email":
        if not user.email_otp_enabled:
            raise HTTPException(status_code=400, detail="Email OTP is not enabled")
        otp = issue_email_otp(user.email)
        try:
            await send_email_otp(user.email, otp)
        except RuntimeError as exc:
            raise _delivery_http_error(exc) from exc
        return {"message": "Email OTP sent"}

    if not user.sms_otp_enabled or not user.phone_number:
        raise HTTPException(status_code=400, detail="SMS OTP is not enabled")
    otp = issue_sms_otp(user.phone_number)
    try:
        await send_sms_otp(user.phone_number, otp)
    except RuntimeError as exc:
        raise _delivery_http_error(exc) from exc
    return {"message": "SMS OTP sent"}


@router.post("/2fa/totp/setup")
@limiter.limit("10/minute")
def setup_totp(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from services.twofa_service import generate_qr_code, generate_totp_secret

    secret = generate_totp_secret()
    current_user.totp_secret = secret
    db.add(current_user)
    db.commit()
    qr_code = generate_qr_code(secret, current_user.email)
    return {"secret": secret, "qr_code": f"data:image/png;base64,{qr_code}"}


@router.post("/2fa/totp/verify")
@limiter.limit("10/minute")
def verify_totp_setup(
    request: Request, body: EmailVerifyRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if not current_user.totp_secret or not verify_totp(current_user.totp_secret, body.otp):
        raise HTTPException(status_code=400, detail="Invalid TOTP code")
    current_user.totp_enabled = True
    _sync_2fa_enabled(current_user)
    db.add(current_user)
    db.commit()
    return {"message": "TOTP 2FA enabled"}


@router.post("/2fa/email/setup")
def setup_email_2fa(
    payload: EmailSetupRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    current_user.email_otp_enabled = payload.enabled
    _sync_2fa_enabled(current_user)
    db.add(current_user)
    db.commit()
    return {"message": "Email OTP updated", "enabled": current_user.email_otp_enabled}


@router.post("/2fa/email/send")
@limiter.limit("10/minute")
async def send_email_2fa(request: Request, payload: EmailSendRequest, current_user: User = Depends(get_current_user)):
    if not current_user.email_otp_enabled:
        raise HTTPException(status_code=400, detail="Email OTP is not enabled")
    otp = issue_email_otp(current_user.email)
    try:
        await send_email_otp(current_user.email, otp)
    except RuntimeError as exc:
        raise _delivery_http_error(exc) from exc
    return {"message": "Email OTP sent"}


@router.post("/2fa/email/verify")
def verify_email_2fa(body: EmailVerifyRequest, current_user: User = Depends(get_current_user)):
    if not verify_email_otp(current_user.email, body.otp):
        raise HTTPException(status_code=400, detail="Invalid email OTP")
    return {"message": "Email OTP verified"}


@router.post("/2fa/sms/setup")
def setup_sms_2fa(payload: SmsSetupRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.phone_number = payload.phone_number
    current_user.sms_otp_enabled = True
    _sync_2fa_enabled(current_user)
    db.add(current_user)
    db.commit()
    return {"message": "SMS OTP enabled", "phone_number": current_user.phone_number}


@router.post("/2fa/sms/send")
@limiter.limit("10/minute")
async def send_sms_2fa(request: Request, payload: SmsSendRequest, current_user: User = Depends(get_current_user)):
    if not current_user.sms_otp_enabled or not current_user.phone_number:
        raise HTTPException(status_code=400, detail="SMS OTP is not enabled")
    otp = issue_sms_otp(current_user.phone_number)
    try:
        await send_sms_otp(current_user.phone_number, otp)
    except RuntimeError as exc:
        raise _delivery_http_error(exc) from exc
    return {"message": "SMS OTP sent"}


@router.post("/2fa/sms/verify")
def verify_sms_2fa(body: SmsVerifyRequest, current_user: User = Depends(get_current_user)):
    if not current_user.phone_number or not verify_sms_otp(current_user.phone_number, body.otp):
        raise HTTPException(status_code=400, detail="Invalid SMS OTP")
    return {"message": "SMS OTP verified"}


@router.post("/2fa/backup-codes/generate")
def create_backup_codes(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    codes = generate_backup_codes(current_user.id, db, count=8)
    return {"backup_codes": codes}


@router.post("/2fa/backup-codes/verify")
def check_backup_code(body: Verify2FARequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if body.method != "backup":
        raise HTTPException(status_code=400, detail="Use method='backup' for this endpoint")
    if not verify_backup_code(current_user.id, body.code, db):
        raise HTTPException(status_code=400, detail="Invalid backup code")
    return {"message": "Backup code verified"}


@router.get("/me")
def me(current_user: User = Depends(get_current_user)) -> dict:
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "is_2fa_enabled": current_user.is_2fa_enabled,
        "totp_enabled": current_user.totp_enabled,
        "email_otp_enabled": current_user.email_otp_enabled,
        "sms_otp_enabled": current_user.sms_otp_enabled,
        "phone_number": current_user.phone_number,
        "is_active": current_user.is_active,
    }
