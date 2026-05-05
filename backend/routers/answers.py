import json

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select

from database import get_db
from middleware.security import limiter
from models.answer import Answer
from models.evaluation import Evaluation
from models.question import Question
from models.session import SessionModel
from models.session_question import SessionQuestion
from models.user import User
from schemas.answer import AnswerCreate
from services.ai_service import evaluate_answer
from services.auth_service import get_current_user

router = APIRouter(prefix="/answers", tags=["answers"])


@router.post("")
@limiter.limit("20/minute")
async def submit_answer(
    request: Request,
    payload: AnswerCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    session = db.get(SessionModel, payload.session_id)
    if not session or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    link = db.exec(
        select(SessionQuestion)
        .where(SessionQuestion.session_id == payload.session_id)
        .where(SessionQuestion.question_id == payload.question_id)
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Question not part of this session")

    existing = db.exec(
        select(Answer)
        .where(Answer.session_id == payload.session_id)
        .where(Answer.question_id == payload.question_id)
        .where(Answer.user_id == user.id)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Question already answered")

    answer = Answer(
        session_id=payload.session_id,
        question_id=payload.question_id,
        user_id=user.id,
        content=payload.content,
    )
    db.add(answer)
    db.commit()
    db.refresh(answer)

    question = db.get(Question, payload.question_id)
    expected = json.loads(question.expected_keywords) if question else []
    result = await evaluate_answer(
        question.content if question else "",
        payload.content,
        expected,
        question.difficulty if question else "core",
    )
    evaluation = Evaluation(
        answer_id=answer.id,
        score=result["score"],
        depth_score=result["depth_score"],
        clarity_score=result["clarity_score"],
        feedback=json.dumps(result["feedback"]),
        missing_concepts=json.dumps(result["missing_concepts"]),
    )
    db.add(evaluation)
    db.commit()
    return {"answer_id": answer.id, "evaluation": result}


@router.get("/{session_id}")
def list_answers(
    session_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    session = db.get(SessionModel, session_id)
    if not session or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    return db.exec(
        select(Answer).where(Answer.session_id == session_id).where(Answer.user_id == user.id)
    ).all()
