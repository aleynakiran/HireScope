from fastapi.testclient import TestClient


def test_register_login_me(client: TestClient) -> None:
    res = client.post(
        "/auth/register",
        json={
            "email": "newperson@test.dev",
            "password": "password123",
            "full_name": "New Person",
        },
    )
    assert res.status_code == 200

    res = client.post(
        "/auth/login",
        json={"email": "newperson@test.dev", "password": "password123"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["token_type"] == "bearer"
    token = body["access_token"]

    me = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "newperson@test.dev"


def test_duplicate_email(client: TestClient) -> None:
    payload = {
        "email": "dup@test.dev",
        "password": "password123",
        "full_name": "Dup",
    }
    assert client.post("/auth/register", json=payload).status_code == 200
    assert client.post("/auth/register", json=payload).status_code == 400


def test_me_requires_auth(client: TestClient) -> None:
    assert client.get("/auth/me").status_code == 401
