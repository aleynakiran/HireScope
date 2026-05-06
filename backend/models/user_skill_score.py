from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class UserSkillScore(SQLModel, table=True):
    __tablename__ = "user_skill_scores"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True)
    session_id: int = Field(index=True)
    skill_category_id: int = Field(index=True)
    score: float
    created_at: datetime = Field(default_factory=datetime.utcnow)
