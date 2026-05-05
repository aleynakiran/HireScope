import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session, select

from database import engine
from models.user import User
from services.oauth_accounts import get_or_create_oauth_user


def test_oauth_links_existing_password_account(client: TestClient) -> None:
    suffix = uuid.uuid4().hex[:8]
    email = f"pw_then_oauth_{suffix}@test.dev"

    client.post(
        "/auth/register",
        json={"email": email, "password": "password123", "full_name": "Hybrid"},
    )

    with Session(engine) as db:
        needs_2fa, tok = get_or_create_oauth_user(
            db,
            provider="google",
            oauth_sub=f"g-{suffix}",
            email=email,
            full_name="Hybrid",
        )
        assert needs_2fa is False
        assert isinstance(tok, str)

    with Session(engine) as db:
        user = db.exec(select(User).where(User.email == email)).first()
        assert user is not None
        assert user.oauth_provider == "google"
        assert user.password_hash is not None
