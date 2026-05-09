import json

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select

from database import get_db
from middleware.security import limiter
from models.answer import Answer
from models.evaluation import Evaluation
from models.position import Position
from models.question import Question
from models.session import SessionModel
from models.session_question import SessionQuestion
from models.user import User
from schemas.session import SessionCreate
from services.ai_service import generate_questions
from services.auth_service import get_current_user

router = APIRouter(prefix="/sessions", tags=["sessions"])


def _session_average_score(db: Session, session_id: int, user_id: int) -> float | None:
    answers = db.exec(
        select(Answer).where(Answer.session_id == session_id).where(Answer.user_id == user_id)
    ).all()
    if not answers:
        return None
    answer_ids = [a.id for a in answers]
    evaluations = db.exec(select(Evaluation).where(Evaluation.answer_id.in_(answer_ids))).all()
    if not evaluations:
        return None
    return sum(ev.score for ev in evaluations) / len(evaluations)


@router.get("")
def list_sessions(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sessions = db.exec(
        select(SessionModel)
        .where(SessionModel.user_id == user.id)
        .order_by(SessionModel.created_at.desc())
    ).all()
    result = []
    for s in sessions:
        position = db.get(Position, s.position_id)
        result.append(
            {
                "id": s.id,
                "position_id": s.position_id,
                "position_title": position.title if position else "",
                "level": s.level,
                "status": s.status,
                "created_at": s.created_at.isoformat(),
                "tech_stack": json.loads(s.tech_stack) if s.tech_stack else [],
                "average_score": _session_average_score(db, s.id, user.id),
            }
        )
    return result


@router.post("")
@limiter.limit("10/minute")
async def create_session(
    request: Request,
    payload: SessionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    position = db.get(Position, payload.position_id)
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")

    session = SessionModel(
        user_id=user.id,
        position_id=payload.position_id,
        level=payload.level,
        tech_stack=json.dumps(payload.tech_stack),
        status="active",
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    generated = await generate_questions(position.title, payload.level, payload.tech_stack)
    for idx, item in enumerate(generated):
        question = Question(
            content=item["content"],
            difficulty=item["difficulty"],
            expected_keywords=json.dumps(item["expected_keywords"]),
            position_id=payload.position_id,
        )
        db.add(question)
        db.flush()
        db.add(
            SessionQuestion(session_id=session.id, question_id=question.id, order_index=idx)
        )
    db.commit()
    db.refresh(session)
    return {"id": session.id, "status": session.status}


@router.get("/{session_id}")
def get_session(
    session_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    session = db.get(SessionModel, session_id)
    if not session or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    links = db.exec(
        select(SessionQuestion)
        .where(SessionQuestion.session_id == session_id)
        .order_by(SessionQuestion.order_index)
    ).all()
    questions = []
    for link in links:
        question = db.get(Question, link.question_id)
        if question:
            questions.append(
                {
                    "id": question.id,
                    "content": question.content,
                    "difficulty": question.difficulty,
                    "expected_keywords": json.loads(question.expected_keywords or "[]"),
                    "order_index": link.order_index,
                }
            )

    position = db.get(Position, session.position_id)
    return {
        "id": session.id,
        "position_id": session.position_id,
        "position_title": position.title if position else "",
        "level": session.level,
        "tech_stack": json.loads(session.tech_stack or "[]"),
        "status": session.status,
        "created_at": session.created_at.isoformat(),
        "questions": questions,
    }


@router.put("/{session_id}/complete")
def complete_session(
    session_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    session = db.get(SessionModel, session_id)
    if not session or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    session.status = "completed"
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"id": session.id, "status": session.status}
