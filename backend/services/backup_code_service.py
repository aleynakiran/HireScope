import random
import string

from passlib.context import CryptContext
from sqlmodel import Session, select

from models.backup_code import BackupCode

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def generate_backup_codes(user_id: int, db: Session, count: int = 8) -> list[str]:
    db_codes = db.exec(select(BackupCode).where(BackupCode.user_id == user_id)).all()
    for row in db_codes:
        db.delete(row)
    db.flush()

    plain_codes = [
        "".join(random.choices(string.ascii_uppercase + string.digits, k=10)) for _ in range(count)
    ]
    for code in plain_codes:
        db.add(BackupCode(user_id=user_id, code_hash=pwd_context.hash(code), used=False))
    db.commit()
    return plain_codes


def verify_backup_code(user_id: int, code: str, db: Session) -> bool:
    rows = db.exec(
        select(BackupCode).where(BackupCode.user_id == user_id).where(BackupCode.used.is_(False))
    ).all()
    for row in rows:
        if pwd_context.verify(code, row.code_hash):
            row.used = True
            db.add(row)
            db.commit()
            return True
    return False
