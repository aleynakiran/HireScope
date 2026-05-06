import json
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from database import get_db
from models.answer import Answer
from models.audit_log import AuditLog
from models.evaluation import Evaluation
from models.question import Question
from models.session import SessionModel
from models.session_question import SessionQuestion
from models.position import Position
from models.user import User
from services.auth_service import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])


def _write_audit(
    db: Session, *, admin_id: int, action: str, target_user_id: int | None = None, details: dict | None = None
) -> None:
    db.add(
        AuditLog(
            admin_id=admin_id,
            action=action,
            target_user_id=target_user_id,
            details=json.dumps(details or {}),
        )
    )
    db.commit()


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
    _write_audit(
        db,
        admin_id=_admin.id,
        action="change_role",
        target_user_id=user.id,
        details={"role": role},
    )
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
    _write_audit(
        db,
        admin_id=_admin.id,
        action="delete_user",
        target_user_id=user_id,
    )
    return {"message": "User deleted"}


@router.get("/stats")
def stats(_admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    users = db.exec(select(User)).all()
    sessions = db.exec(select(SessionModel)).all()
    evaluations = db.exec(select(Evaluation)).all()
    avg_score = (
        sum(ev.score for ev in evaluations) / len(evaluations) if evaluations else None
    )
    now = datetime.utcnow()
    today = now.date()
    active_sessions_today = sum(1 for s in sessions if s.created_at.date() == today and s.status == "active")

    position_counts: dict[int, int] = {}
    for s in sessions:
        position_counts[s.position_id] = position_counts.get(s.position_id, 0) + 1
    position_ids = sorted(position_counts, key=position_counts.get, reverse=True)[:5]
    positions = {p.id: p.title for p in db.exec(select(Position)).all()}
    top_positions = [positions.get(pid, str(pid)) for pid in position_ids]

    registrations_last_7_days = []
    for delta in range(6, -1, -1):
        day = (now - timedelta(days=delta)).date()
        registrations_last_7_days.append(sum(1 for u in users if u.created_at.date() == day))

    return {
        "total_users": len(users),
        "active_sessions_today": active_sessions_today,
        "total_sessions": len(sessions),
        "average_score": avg_score,
        "top_positions": top_positions,
        "registrations_last_7_days": registrations_last_7_days,
    }


@router.get("/users/{user_id}")
def user_detail(user_id: int, _admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_dict(user)


@router.put("/users/{user_id}/activate")
def set_active(
    user_id: int,
    active: bool,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = active
    db.add(user)
    db.commit()
    db.refresh(user)
    _write_audit(
        db,
        admin_id=_admin.id,
        action="set_active",
        target_user_id=user.id,
        details={"active": active},
    )
    return _user_dict(user)


@router.get("/audit-log")
def audit_log(_admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    rows = db.exec(select(AuditLog).order_by(AuditLog.created_at.desc())).all()
    return [
        {
            "id": row.id,
            "admin_id": row.admin_id,
            "action": row.action,
            "target_user_id": row.target_user_id,
            "details": json.loads(row.details or "{}"),
            "created_at": row.created_at.isoformat(),
        }
        for row in rows
    ]


@router.get("/sessions")
def all_sessions(_admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    rows = db.exec(select(SessionModel)).all()
    return rows
