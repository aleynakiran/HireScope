from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Answer(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(index=True)
    question_id: int
    user_id: int
    content: str
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
