from pydantic import BaseModel, field_validator


class AnswerCreate(BaseModel):
    session_id: int
    question_id: int
    content: str

    @field_validator("content")
    @classmethod
    def sanitize_answer(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 10:
            raise ValueError("Answer must be at least 10 characters")
        if len(value) > 5000:
            raise ValueError("Answer too long (max 5000 characters)")
        blocked = ["ignore previous instructions", "you are now", "jailbreak", "dan mode"]
        lower = value.lower()
        if any(item in lower for item in blocked):
            raise ValueError("Invalid input detected")
        return value
