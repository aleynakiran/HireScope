from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    password_hash: Optional[str] = None
    full_name: str
    role: str = "user"
    is_2fa_enabled: bool = False
    totp_secret: Optional[str] = None
    totp_enabled: bool = False
    email_otp_enabled: bool = False
    sms_otp_enabled: bool = False
    phone_number: Optional[str] = None
    oauth_provider: Optional[str] = None
    oauth_id: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
