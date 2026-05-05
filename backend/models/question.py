from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Question(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    content: str
    difficulty: str
    expected_keywords: str = "[]"
    position_id: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
