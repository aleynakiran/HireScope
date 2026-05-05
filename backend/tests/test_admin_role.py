from fastapi.testclient import TestClient


def test_admin_invalid_role(client: TestClient, admin_headers: dict[str, str]) -> None:
    client.post(
        "/auth/register",
        json={
            "email": "role_change@test.dev",
            "password": "password123",
            "full_name": "RC",
        },
    )

    uid = next(
        u["id"]
        for u in client.get("/admin/users", headers=admin_headers).json()
        if u["email"] == "role_change@test.dev"
    )

    res = client.put(f"/admin/users/{uid}/role?role=superuser", headers=admin_headers)
    assert res.status_code == 400


def test_admin_promotes_user_to_admin(client: TestClient, admin_headers: dict[str, str]) -> None:
    client.post(
        "/auth/register",
        json={
            "email": "promote_me@test.dev",
            "password": "password123",
            "full_name": "Promote",
        },
    )

    uid = next(
        u["id"]
        for u in client.get("/admin/users", headers=admin_headers).json()
        if u["email"] == "promote_me@test.dev"
    )

    res = client.put(f"/admin/users/{uid}/role?role=admin", headers=admin_headers)
    assert res.status_code == 200
    assert res.json()["role"] == "admin"
