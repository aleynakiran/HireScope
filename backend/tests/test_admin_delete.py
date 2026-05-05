from fastapi.testclient import TestClient


def test_admin_can_delete_user(client: TestClient, admin_headers: dict[str, str]) -> None:
    client.post(
        "/auth/register",
        json={
            "email": "victim_delete@test.dev",
            "password": "password123",
            "full_name": "Victim",
        },
    )

    users_before = client.get("/admin/users", headers=admin_headers).json()
    victim_id = next(u["id"] for u in users_before if u["email"] == "victim_delete@test.dev")

    res = client.delete(f"/admin/users/{victim_id}", headers=admin_headers)
    assert res.status_code == 200

    emails = {u["email"] for u in client.get("/admin/users", headers=admin_headers).json()}
    assert "victim_delete@test.dev" not in emails


def test_questions_requires_admin(client: TestClient, auth_headers: dict[str, str]) -> None:
    assert client.get("/questions", headers=auth_headers).status_code == 403


def test_questions_admin_ok(client: TestClient, admin_headers: dict[str, str]) -> None:
    res = client.get("/questions", headers=admin_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)
