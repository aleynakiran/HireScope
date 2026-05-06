import os
import random
import string
from datetime import datetime, timedelta, timezone

OTP_STORE: dict[str, tuple[str, datetime]] = {}


def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def issue_email_otp(email: str) -> str:
    otp = generate_otp()
    expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    OTP_STORE[f"email:{email.lower()}"] = (otp, expires)
    return otp


def verify_email_otp(email: str, otp: str) -> bool:
    key = f"email:{email.lower()}"
    entry = OTP_STORE.get(key)
    if not entry:
        return False
    expected, expires = entry
    if datetime.now(timezone.utc) > expires:
        OTP_STORE.pop(key, None)
        return False
    if otp != expected:
        return False
    OTP_STORE.pop(key, None)
    return True


async def send_email_otp(email: str, otp: str) -> None:
    # Placeholder sender for development. In production configure SMTP and send email.
    smtp_host = os.getenv("SMTP_HOST")
    if not smtp_host:
        # Intentionally no-op in local development.
        return
