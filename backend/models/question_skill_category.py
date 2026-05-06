from sqlmodel import Field, SQLModel


class QuestionSkillCategory(SQLModel, table=True):
    __tablename__ = "question_skill_categories"

    question_id: int = Field(foreign_key="question.id", primary_key=True)
    skill_category_id: int = Field(foreign_key="skill_categories.id", primary_key=True)
