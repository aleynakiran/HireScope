import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlmodel import Session, select
from starlette.middleware.sessions import SessionMiddleware

from database import (
    create_db_and_tables,
    engine,
    migrate_legacy_sqlite_schema,
    seed_positions,
    seed_skill_categories,
)
from middleware.security import limiter, security_headers_middleware
from models.user import User
from routers import (
    admin_router,
    answers_router,
    auth_router,
    evaluations_router,
    oauth_router,
    positions_router,
    questions_router,
    sessions_router,
    twofa_router,
)

load_dotenv()


def _cors_allow_origins() -> list[str]:
    """Comma-separated FRONTEND_URL or sensible local defaults (localhost + 127.0.0.1)."""
    raw = os.getenv("FRONTEND_URL", "").strip()
    if raw:
        return [o.strip() for o in raw.split(",") if o.strip()]
    return [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


app = FastAPI(title="HireScope API", version="0.1.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

secret_key = os.getenv("SECRET_KEY", "dev-secret-key")
app.add_middleware(SessionMiddleware, secret_key=secret_key)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_allow_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth_router)
app.include_router(oauth_router)
app.include_router(twofa_router)
app.include_router(positions_router)
app.include_router(questions_router)
app.include_router(sessions_router)
app.include_router(answers_router)
app.include_router(evaluations_router)
app.include_router(admin_router)
app.middleware("http")(security_headers_middleware)


@app.on_event("startup")
def on_startup() -> None:
    create_db_and_tables()
    migrate_legacy_sqlite_schema()
    seed_positions()
    seed_skill_categories()

    bootstrap_admin_email = os.getenv("BOOTSTRAP_ADMIN_EMAIL")
    if bootstrap_admin_email:
        with Session(engine) as session:
            user = session.exec(select(User).where(User.email == bootstrap_admin_email)).first()
            if user and user.role != "admin":
                user.role = "admin"
                session.add(user)
                session.commit()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
