import os
import random
import string
from datetime import datetime, timedelta, timezone

from twilio.rest import Client

OTP_STORE: dict[str, tuple[str, datetime]] = {}


def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def issue_sms_otp(phone_number: str) -> str:
    otp = generate_otp()
    expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    OTP_STORE[f"sms:{phone_number}"] = (otp, expires)
    return otp


def verify_sms_otp(phone_number: str, otp: str) -> bool:
    key = f"sms:{phone_number}"
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


async def send_sms_otp(phone_number: str, otp: str) -> None:
    sid = os.getenv("TWILIO_ACCOUNT_SID")
    token = os.getenv("TWILIO_AUTH_TOKEN")
    sender = os.getenv("TWILIO_PHONE")
    if not sid or not token or not sender:
        # Local no-op if Twilio is not configured.
        return
    client = Client(sid, token)
    client.messages.create(body=f"HireScope 2FA code: {otp}", from_=sender, to=phone_number)
