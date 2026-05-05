from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from database import get_db
from models.question import Question
from models.user import User
from services.auth_service import require_admin

router = APIRouter(prefix="/questions", tags=["questions"])


@router.get("")
def list_questions(_admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.exec(select(Question)).all()
