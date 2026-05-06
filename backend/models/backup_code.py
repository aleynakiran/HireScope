from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class BackupCode(SQLModel, table=True):
    __tablename__ = "backup_codes"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True)
    code_hash: str
    used: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
