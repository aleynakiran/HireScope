import base64
from io import BytesIO

import pyotp
import qrcode


def generate_totp_secret() -> str:
    return pyotp.random_base32()


def generate_qr_code(secret: str, email: str) -> str:
    totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(name=email, issuer_name="HireScope")
    img = qrcode.make(totp_uri)
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode()


def verify_totp(secret: str | None, code: str) -> bool:
    if not secret:
        return False
    totp = pyotp.TOTP(secret)
    return bool(totp.verify(code, valid_window=1))
