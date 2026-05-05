import os
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select

os.environ.setdefault("TESTING", "1")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-ci")

from database import engine  # noqa: E402
from main import app  # noqa: E402
from models.user import User  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _lifespan() -> None:
    with TestClient(app):
        yield


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def auth_headers(client: TestClient) -> dict[str, str]:
    suffix = uuid.uuid4().hex[:8]
    email = f"user_{suffix}@test.dev"
    client.post(
        "/auth/register",
        json={
            "email": email,
            "password": "password123",
            "full_name": "Test User",
        },
    )
    res = client.post(
        "/auth/login",
        json={"email": email, "password": "password123"},
    )
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(client: TestClient) -> dict[str, str]:
    suffix = uuid.uuid4().hex[:8]
    email = f"admin_{suffix}@test.dev"
    client.post(
        "/auth/register",
        json={
            "email": email,
            "password": "password123",
            "full_name": "Admin User",
        },
    )
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == email)).first()
        assert user is not None
        user.role = "admin"
        session.add(user)
        session.commit()

    res = client.post(
        "/auth/login",
        json={"email": email, "password": "password123"},
    )
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
