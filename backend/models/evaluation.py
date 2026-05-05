from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Evaluation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    answer_id: int = Field(index=True, unique=True)
    score: int
    depth_score: int
    clarity_score: int
    feedback: str = "[]"
    missing_concepts: str = "[]"
    created_at: datetime = Field(default_factory=datetime.utcnow)
