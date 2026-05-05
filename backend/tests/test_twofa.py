import pyotp
from fastapi.testclient import TestClient


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
