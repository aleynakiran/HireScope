from typing import Optional

from sqlmodel import Field, SQLModel


class SkillCategory(SQLModel, table=True):
    __tablename__ = "skill_categories"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)
    description: Optional[str] = None
