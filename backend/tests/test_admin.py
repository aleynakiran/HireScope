from fastapi.testclient import TestClient


def test_admin_users_requires_role(client: TestClient, auth_headers: dict[str, str]) -> None:
    res = client.get("/admin/users", headers=auth_headers)
    assert res.status_code == 403


def test_admin_users_ok(client: TestClient, admin_headers: dict[str, str]) -> None:
    res = client.get("/admin/users", headers=admin_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_admin_stats(client: TestClient, admin_headers: dict[str, str]) -> None:
    res = client.get("/admin/stats", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_users" in data
