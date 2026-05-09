import json
import statistics
from collections import Counter

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from database import get_db
from models.answer import Answer
from models.evaluation import Evaluation
from models.session import SessionModel
from models.user import User
from services.ai_service import generate_focus_tips
from services.auth_service import get_current_user

router = APIRouter(prefix="/insights", tags=["insights"])

RUBRIC_LABELS = {
    "depth": "Technical Depth",
    "clarity": "Communication & Clarity",
    "consistency": "Answer Consistency",
    "overall": "Overall Performance",
}

SESSION_WINDOW = 5
FOCUS_THRESHOLD = 7.0
HIGH_PRIORITY_BELOW = 6.0


def _priority_meta(score: float) -> tuple[str, str | None]:
    if score < HIGH_PRIORITY_BELOW:
        return "high", "High Priority Improvement"
    if score < FOCUS_THRESHOLD:
        return "medium", None
    return "low", None


@router.get("/improvement-hub")
async def improvement_hub(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    sessions_ordered = db.exec(
        select(SessionModel)
        .where(SessionModel.user_id == user.id)
        .order_by(SessionModel.created_at.desc())
    ).all()

    selected_ids: list[int] = []
    for sess in sessions_ordered:
        answers = db.exec(
            select(Answer).where(Answer.session_id == sess.id).where(Answer.user_id == user.id)
        ).all()
        if not answers:
            continue
        a_ids = [a.id for a in answers]
        evs = db.exec(select(Evaluation).where(Evaluation.answer_id.in_(a_ids))).all()
        if not evs:
            continue
        selected_ids.append(sess.id)
        if len(selected_ids) >= SESSION_WINDOW:
            break

    if not selected_ids:
        return {
            "sessions_analyzed": 0,
            "session_ids": [],
            "rubric_snapshot": None,
            "focus_areas": [],
            "top_missing_concepts": [],
        }

    answers = db.exec(
        select(Answer)
        .where(Answer.session_id.in_(selected_ids))
        .where(Answer.user_id == user.id)
    ).all()
    answer_ids = [a.id for a in answers]
    evaluations = db.exec(select(Evaluation).where(Evaluation.answer_id.in_(answer_ids))).all()

    depths = [e.depth_score for e in evaluations]
    clarities = [e.clarity_score for e in evaluations]
    scores = [e.score for e in evaluations]

    depth_avg = sum(depths) / len(depths)
    clarity_avg = sum(clarities) / len(clarities)
    overall_avg = sum(scores) / len(scores)

    if len(scores) >= 2:
        stdev = statistics.pstdev(scores)
        consistency_avg = max(1.0, min(10.0, 10.0 - stdev * 2.0))
    else:
        consistency_avg = overall_avg

    rubric_snapshot = {
        "depth": round(depth_avg, 2),
        "clarity": round(clarity_avg, 2),
        "consistency": round(consistency_avg, 2),
        "overall": round(overall_avg, 2),
    }

    dims: list[tuple[str, float]] = [
        ("depth", depth_avg),
        ("clarity", clarity_avg),
        ("consistency", consistency_avg),
        ("overall", overall_avg),
    ]

    below = [(k, v) for k, v in dims if v < FOCUS_THRESHOLD]
    below.sort(key=lambda x: x[1])
    rest = [(k, v) for k, v in dims if v >= FOCUS_THRESHOLD]
    rest.sort(key=lambda x: x[1])

    ordered_keys: list[str] = []
    for k, _ in below + rest:
        if k not in ordered_keys:
            ordered_keys.append(k)

    pick_keys = ordered_keys[:3]

    concept_counts: Counter[str] = Counter()
    concept_display: dict[str, str] = {}
    for ev in evaluations:
        try:
            mc = json.loads(ev.missing_concepts or "[]")
        except json.JSONDecodeError:
            continue
        if not isinstance(mc, list):
            continue
        for raw in mc:
            c = str(raw).strip()
            if not c:
                continue
            low = c.lower()
            concept_counts[low] += 1
            concept_display.setdefault(low, c)

    top_missing = [concept_display[k] for k, _ in concept_counts.most_common(10)]

    focus_payload: list[dict] = []
    for key in pick_keys:
        score = rubric_snapshot[key]
        tier, badge = _priority_meta(score)
        focus_payload.append(
            {
                "key": key,
                "label": RUBRIC_LABELS[key],
                "score": rubric_snapshot[key],
                "priority": tier,
                "priority_label": badge,
            }
        )

    tips = await generate_focus_tips(focus_payload, top_missing)

    focus_areas = []
    for i, area in enumerate(focus_payload):
        tip = tips[i] if i < len(tips) else ""
        row = {**area, "tip": tip, "target_score": 10.0}
        focus_areas.append(row)

    return {
        "sessions_analyzed": len(selected_ids),
        "session_ids": selected_ids,
        "rubric_snapshot": rubric_snapshot,
        "focus_areas": focus_areas,
        "top_missing_concepts": top_missing,
    }
