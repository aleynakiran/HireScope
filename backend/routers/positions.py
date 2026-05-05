from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from database import get_db
from models.position import Position
from models.user import User
from services.auth_service import get_current_user

router = APIRouter(prefix="/positions", tags=["positions"])


@router.get("")
def list_positions(_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.exec(select(Position)).all()
