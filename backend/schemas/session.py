from pydantic import BaseModel


class SessionCreate(BaseModel):
    position_id: int
    level: str
    tech_stack: list[str]
