from .admin import router as admin_router
from .answers import router as answers_router
from .auth import router as auth_router
from .evaluations import router as evaluations_router
from .insights import router as insights_router
from .oauth import router as oauth_router
from .positions import router as positions_router
from .questions import router as questions_router
from .sessions import router as sessions_router
from .twofa import router as twofa_router

__all__ = [
    "auth_router",
    "oauth_router",
    "twofa_router",
    "positions_router",
    "questions_router",
    "sessions_router",
    "answers_router",
    "evaluations_router",
    "insights_router",
    "admin_router",
]
