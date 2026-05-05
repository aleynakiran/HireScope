import uuid

from sqlmodel import Session, select

from database import engine
from models.user import User
from services.oauth_accounts import get_or_create_oauth_user


def test_oauth_user_created_and_linked() -> None:
    suffix = uuid.uuid4().hex[:8]
    email = f"oauth_user_{suffix}@test.dev"

    with Session(engine) as db:
        need_2fa, tok = get_or_create_oauth_user(
            db,
            provider="google",
            oauth_sub=f"sub-{suffix}",
            email=email,
            full_name="OAuth User",
        )
        assert need_2fa is False
        assert isinstance(tok, str)

        user = db.exec(select(User).where(User.email == email)).first()
        assert user is not None
        assert user.oauth_provider == "google"


def test_oauth_existing_email_linked() -> None:
    suffix = uuid.uuid4().hex[:8]
    email = f"link_existing_{suffix}@test.dev"
    sub = f"gh-{suffix}"

    with Session(engine) as db:
        need_2fa, tok = get_or_create_oauth_user(
            db,
            provider="github",
            oauth_sub=sub,
            email=email,
            full_name="Link User",
        )
        assert need_2fa is False
        assert isinstance(tok, str)

        need_2fa_2, tok_2 = get_or_create_oauth_user(
            db,
            provider="github",
            oauth_sub=sub,
            email=email,
            full_name="Link User",
        )
        assert need_2fa_2 is False
        assert isinstance(tok_2, str)
