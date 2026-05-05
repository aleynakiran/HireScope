from sqlmodel import Session, select

from models.user import User
from services.auth_service import create_access_token, create_temp_token_for_2fa


def get_or_create_oauth_user(
    db: Session, *, provider: str, oauth_sub: str, email: str, full_name: str
) -> tuple[bool, str]:
    """Returns (needs_2fa, token_or_temp)."""
    user = db.exec(
        select(User).where(User.oauth_provider == provider).where(User.oauth_id == oauth_sub)
    ).first()
    if not user:
        user = db.exec(select(User).where(User.email == email)).first()
        if user:
            user.oauth_provider = provider
            user.oauth_id = oauth_sub
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            user = User(
                email=email,
                full_name=full_name or email.split("@")[0],
                password_hash=None,
                oauth_provider=provider,
                oauth_id=oauth_sub,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

    if user.is_2fa_enabled:
        return True, create_temp_token_for_2fa(user.id)
    return False, create_access_token(user.id)
