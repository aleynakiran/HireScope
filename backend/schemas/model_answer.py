from pydantic import BaseModel


class ModelAnswerRequest(BaseModel):
    answer_id: int
