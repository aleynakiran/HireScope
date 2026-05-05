from sqlmodel import Field, SQLModel


class SessionQuestion(SQLModel, table=True):
    __tablename__ = "session_questions"

    session_id: int = Field(foreign_key="sessions.id", primary_key=True)
    question_id: int = Field(foreign_key="question.id", primary_key=True)
    order_index: int = 0
