import json

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select

from database import get_db
from middleware.security import limiter
from models.answer import Answer
from models.evaluation import Evaluation
from models.question import Question
from models.session import SessionModel
from models.user import User
from schemas.model_answer import ModelAnswerRequest
from services.ai_service import generate_model_answer
from services.auth_service import get_current_user

router = APIRouter(prefix="/evaluations", tags=["evaluations"])


@router.get("/{session_id}")
def session_evaluations(
    session_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    session = db.get(SessionModel, session_id)
    if not session or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    answers = db.exec(
        select(Answer).where(Answer.session_id == session_id).where(Answer.user_id == user.id)
    ).all()
    answer_ids = [a.id for a in answers]
    if not answer_ids:
        return {"items": [], "average_score": None}

    evaluations = db.exec(select(Evaluation).where(Evaluation.answer_id.in_(answer_ids))).all()
    avg = sum(row.score for row in evaluations) / len(evaluations)

    items = []
    for ans in answers:
        ev = next((e for e in evaluations if e.answer_id == ans.id), None)
        question = db.get(Question, ans.question_id)
        items.append(
            {
                "answer_id": ans.id,
                "question_id": ans.question_id,
                "question_content": question.content if question else "",
                "answer_content": ans.content,
                "evaluation": (
                    {
                        "score": ev.score,
                        "depth_score": ev.depth_score,
                        "clarity_score": ev.clarity_score,
                        "feedback": json.loads(ev.feedback or "[]"),
                        "missing_concepts": json.loads(ev.missing_concepts or "[]"),
                    }
                    if ev
                    else None
                ),
            }
        )

    return {"items": items, "average_score": avg}


@router.post("/{session_id}/model-answer")
@limiter.limit("10/minute")
async def model_answer(
    request: Request,
    session_id: int,
    payload: ModelAnswerRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    session = db.get(SessionModel, session_id)
    if not session or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    answer = db.get(Answer, payload.answer_id)
    if (
        not answer
        or answer.session_id != session_id
        or answer.user_id != user.id
    ):
        raise HTTPException(status_code=404, detail="Answer not found")

    question = db.get(Question, answer.question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    try:
        keywords = json.loads(question.expected_keywords or "[]")
    except json.JSONDecodeError:
        keywords = []
    if not isinstance(keywords, list):
        keywords = []

    result = await generate_model_answer(
        question.content,
        [str(k) for k in keywords],
        question.difficulty or "core",
    )
    return result
