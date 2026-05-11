import asyncio
import os
import random
import smtplib
import string
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage

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


def email_delivery_configured() -> bool:
    return all(
        os.getenv(name, "").strip()
        for name in ("SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD")
    )


async def send_email_otp(email: str, otp: str) -> None:
    smtp_host = os.getenv("SMTP_HOST", "").strip()
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_password = os.getenv("SMTP_PASSWORD", "").strip()
    sender = os.getenv("SMTP_FROM", "").strip() or smtp_user
    use_ssl = os.getenv("SMTP_USE_SSL", "0") == "1" or smtp_port == 465

    if not smtp_host or not smtp_user or not smtp_password or not sender:
        raise RuntimeError("Email OTP delivery is not configured")

    message = EmailMessage()
    message["Subject"] = "HireScope 2FA code"
    message["From"] = sender
    message["To"] = email
    message.set_content(
        "Your HireScope verification code is "
        f"{otp}. It expires in 10 minutes.\n\n"
        "If you did not request this code, you can safely ignore this email."
    )

    def _send() -> None:
        if use_ssl:
            with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=20) as server:
                server.login(smtp_user, smtp_password)
                server.send_message(message)
            return

        with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(smtp_user, smtp_password)
            server.send_message(message)

    await asyncio.to_thread(_send)
