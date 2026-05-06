from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_log"

    id: Optional[int] = Field(default=None, primary_key=True)
    admin_id: int = Field(index=True)
    action: str
    target_user_id: Optional[int] = Field(default=None, index=True)
    details: str = "{}"
    created_at: datetime = Field(default_factory=datetime.utcnow)
