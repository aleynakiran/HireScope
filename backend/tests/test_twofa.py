import pyotp
import pytest
from fastapi.testclient import TestClient

import routers.auth as auth_router
import services.email_service as email_service
import services.sms_service as sms_service


def test_2fa_setup_verify_disable(client: TestClient, auth_headers: dict[str, str]) -> None:
    setup = client.post("/2fa/setup", headers=auth_headers)
    assert setup.status_code == 200
    secret = setup.json()["secret"]

    bad = client.post("/2fa/verify", headers=auth_headers, json={"code": "000000"})
    assert bad.status_code == 400

    code = pyotp.TOTP(secret).now()
    ok = client.post("/2fa/verify", headers=auth_headers, json={"code": code})
    assert ok.status_code == 200

    me = client.get("/auth/me", headers=auth_headers)
    assert me.json()["is_2fa_enabled"] is True


def test_login_with_2fa(client: TestClient) -> None:
    email = "twofa_user@test.dev"
    password = "password123"
    client.post(
        "/auth/register",
        json={"email": email, "password": password, "full_name": "TOTP"},
    )

    setup_headers = {}
    res = client.post("/auth/login", json={"email": email, "password": password})
    token = res.json()["access_token"]
    setup_headers["Authorization"] = f"Bearer {token}"

    setup = client.post("/2fa/setup", headers=setup_headers)
    secret = setup.json()["secret"]
    code = pyotp.TOTP(secret).now()
    client.post("/2fa/verify", headers=setup_headers, json={"code": code})

    step1 = client.post("/auth/login", json={"email": email, "password": password})
    assert step1.status_code == 200
    body = step1.json()
    assert body["totp_required"] is True
    temp = body["temp_token"]

    bad = client.post("/auth/login/verify-2fa", json={"temp_token": temp, "totp_code": "000000"})
    assert bad.status_code == 400

    good_code = pyotp.TOTP(secret).now()
    step2 = client.post(
        "/auth/login/verify-2fa",
        json={"temp_token": temp, "totp_code": good_code},
    )
    assert step2.status_code == 200
    assert "access_token" in step2.json()


def test_login_with_email_otp(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    sent: dict[str, str] = {}
    email = "email_otp_user@test.dev"
    password = "password123"
    client.post(
        "/auth/register",
        json={"email": email, "password": password, "full_name": "Email OTP"},
    )

    res = client.post("/auth/login", json={"email": email, "password": password})
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    setup = client.post("/auth/2fa/email/setup", headers=headers, json={"enabled": True})
    assert setup.status_code == 200

    monkeypatch.setattr(email_service, "generate_otp", lambda: "654321")

    async def fake_send_email(recipient: str, otp: str) -> None:
        sent["recipient"] = recipient
        sent["otp"] = otp

    monkeypatch.setattr(auth_router, "send_email_otp", fake_send_email)

    step1 = client.post("/auth/login", json={"email": email, "password": password})
    assert step1.status_code == 200
    temp = step1.json()["temp_token"]

    send = client.post("/auth/login/send-2fa", json={"temp_token": temp, "method": "email"})
    assert send.status_code == 200
    assert sent == {"recipient": email, "otp": "654321"}

    bad = client.post(
        "/auth/login/verify-2fa",
        json={"temp_token": temp, "method": "email", "code": "000000"},
    )
    assert bad.status_code == 400

    step2 = client.post(
        "/auth/login/verify-2fa",
        json={"temp_token": temp, "method": "email", "code": "654321"},
    )
    assert step2.status_code == 200
    assert "access_token" in step2.json()


def test_login_with_sms_otp(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    sent: dict[str, str] = {}
    email = "sms_otp_user@test.dev"
    phone = "+905551112233"
    password = "password123"
    client.post(
        "/auth/register",
        json={"email": email, "password": password, "full_name": "SMS OTP"},
    )

    res = client.post("/auth/login", json={"email": email, "password": password})
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    setup = client.post("/auth/2fa/sms/setup", headers=headers, json={"phone_number": phone})
    assert setup.status_code == 200

    monkeypatch.setattr(sms_service, "generate_otp", lambda: "112233")

    async def fake_send_sms(recipient: str, otp: str) -> None:
        sent["recipient"] = recipient
        sent["otp"] = otp

    monkeypatch.setattr(auth_router, "send_sms_otp", fake_send_sms)

    step1 = client.post("/auth/login", json={"email": email, "password": password})
    assert step1.status_code == 200
    temp = step1.json()["temp_token"]

    send = client.post("/auth/login/send-2fa", json={"temp_token": temp, "method": "sms"})
    assert send.status_code == 200
    assert sent == {"recipient": phone, "otp": "112233"}

    bad = client.post(
        "/auth/login/verify-2fa",
        json={"temp_token": temp, "method": "sms", "code": "000000"},
    )
    assert bad.status_code == 400

    step2 = client.post(
        "/auth/login/verify-2fa",
        json={"temp_token": temp, "method": "sms", "code": "112233"},
    )
    assert step2.status_code == 200
    assert "access_token" in step2.json()
