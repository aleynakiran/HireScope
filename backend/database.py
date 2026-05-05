import os
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
    from models import evaluation  # noqa: F401
    from models import position  # noqa: F401
    from models import question  # noqa: F401
    from models import session as session_model  # noqa: F401
    from models import session_question  # noqa: F401
    from models import user  # noqa: F401

    SQLModel.metadata.create_all(engine)


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


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
