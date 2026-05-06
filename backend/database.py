import os
import sqlite3
from typing import Generator

from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine, select

TESTING = os.getenv("TESTING") == "1"
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./hirescope.db")

if TESTING:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    engine = create_engine(DATABASE_URL, echo=False)


def create_db_and_tables() -> None:
    from models import answer  # noqa: F401
    from models import audit_log  # noqa: F401
    from models import backup_code  # noqa: F401
    from models import evaluation  # noqa: F401
    from models import position  # noqa: F401
    from models import question  # noqa: F401
    from models import question_skill_category  # noqa: F401
    from models import session as session_model  # noqa: F401
    from models import session_question  # noqa: F401
    from models import skill_category  # noqa: F401
    from models import user  # noqa: F401
    from models import user_skill_score  # noqa: F401

    SQLModel.metadata.create_all(engine)


def migrate_legacy_sqlite_schema() -> None:
    """
    Lightweight compatibility migration for existing local SQLite files.
    Adds newly introduced columns if they don't exist yet.
    """
    if TESTING:
        return
    if not DATABASE_URL.startswith("sqlite:///"):
        return

    db_path = DATABASE_URL.replace("sqlite:///", "", 1)
    if not os.path.exists(db_path):
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    try:
        cur.execute("PRAGMA table_info('user')")
        existing = {row[1] for row in cur.fetchall()}
        additions = [
            ("totp_enabled", "INTEGER NOT NULL DEFAULT 0"),
            ("email_otp_enabled", "INTEGER NOT NULL DEFAULT 0"),
            ("sms_otp_enabled", "INTEGER NOT NULL DEFAULT 0"),
            ("phone_number", "TEXT"),
            ("is_active", "INTEGER NOT NULL DEFAULT 1"),
        ]
        for col, ddl in additions:
            if col not in existing:
                cur.execute(f"ALTER TABLE user ADD COLUMN {col} {ddl}")
        conn.commit()
    finally:
        conn.close()


def seed_positions() -> None:
    from models.position import Position

    with Session(engine) as db:
        if db.exec(select(Position)).first():
            return
        seeds = [
            ("Backend Developer", "APIs, databases, queues, scaling."),
            ("ML Engineer", "Model training, evaluation, ML systems."),
            ("DevOps", "CI/CD, containers, observability, reliability."),
            ("Frontend Developer", "React, performance, accessibility."),
            ("Full Stack Developer", "End-to-end product delivery."),
        ]
        for title, description in seeds:
            db.add(Position(title=title, description=description))
        db.commit()


def seed_skill_categories() -> None:
    from models.skill_category import SkillCategory

    with Session(engine) as db:
        if db.exec(select(SkillCategory)).first():
            return
        seeds = [
            ("algorithms", "Problem solving, complexity and data structures."),
            ("system_design", "Scalable architecture and tradeoffs."),
            ("behavioral", "Communication, collaboration and ownership."),
            ("language_specific", "Language-level idioms and runtime behavior."),
            ("databases", "Modeling, indexing, transactions and queries."),
            ("security", "Authentication, authorization and hardening."),
        ]
        for name, description in seeds:
            db.add(SkillCategory(name=name, description=description))
        db.commit()


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
