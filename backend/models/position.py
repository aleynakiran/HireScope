from typing import Optional

from sqlmodel import Field, SQLModel


class Position(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: Optional[str] = None
