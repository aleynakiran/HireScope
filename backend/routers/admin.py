from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from database import get_db
from models.answer import Answer
from models.evaluation import Evaluation
from models.session import SessionModel
from models.session_question import SessionQuestion
from models.question import Question
from models.user import User
from services.auth_service import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])


def _user_dict(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "is_2fa_enabled": user.is_2fa_enabled,
        "oauth_provider": user.oauth_provider,
        "created_at": user.created_at.isoformat(),
    }


@router.get("/users")
def list_users(_admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    users = db.exec(select(User)).all()
    return [_user_dict(u) for u in users]


@router.put("/users/{user_id}/role")
def set_role(
    user_id: int, role: str, _admin: User = Depends(require_admin), db: Session = Depends(get_db)
):
    if role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="Invalid role")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = role
    db.add(user)
    db.commit()
    db.refresh(user)
    return _user_dict(user)


@router.delete("/users/{user_id}")
def delete_user(user_id: int, _admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    sessions = db.exec(select(SessionModel).where(SessionModel.user_id == user_id)).all()
    for session in sessions:
        answers = db.exec(select(Answer).where(Answer.session_id == session.id)).all()
        for answer in answers:
            evaluation = db.exec(
                select(Evaluation).where(Evaluation.answer_id == answer.id)
            ).first()
            if evaluation:
                db.delete(evaluation)
            db.delete(answer)

        links = db.exec(
            select(SessionQuestion).where(SessionQuestion.session_id == session.id)
        ).all()
        for link in links:
            question = db.get(Question, link.question_id)
            db.delete(link)
            if question:
                db.delete(question)

        db.delete(session)

    db.delete(user)
    db.commit()
    return {"message": "User deleted"}


@router.get("/stats")
def stats(_admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    users = db.exec(select(User)).all()
    sessions = db.exec(select(SessionModel)).all()
    evaluations = db.exec(select(Evaluation)).all()
    avg_score = (
        sum(ev.score for ev in evaluations) / len(evaluations) if evaluations else None
    )
    return {
        "total_users": len(users),
        "total_sessions": len(sessions),
        "average_score": avg_score,
    }
