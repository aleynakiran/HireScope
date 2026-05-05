from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class SessionModel(SQLModel, table=True):
    __tablename__ = "sessions"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True)
    position_id: int
    level: str
    tech_stack: str = "[]"
    status: str = "active"
    created_at: datetime = Field(default_factory=datetime.utcnow)
