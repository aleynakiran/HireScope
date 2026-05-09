from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient


def test_improvement_hub_empty(client: TestClient, auth_headers: dict[str, str]) -> None:
    res = client.get("/insights/improvement-hub", headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["sessions_analyzed"] == 0
    assert body["rubric_snapshot"] is None
    assert body["focus_areas"] == []
    assert body["top_missing_concepts"] == []


def test_improvement_hub_focus_areas_and_snapshot(
    client: TestClient, auth_headers: dict[str, str], monkeypatch
) -> None:
    monkeypatch.setattr(
        "routers.insights.generate_focus_tips",
        AsyncMock(return_value=["Tip depth", "Tip overall", "Tip clarity"]),
    )

    monkeypatch.setattr(
        "routers.sessions.generate_questions",
        AsyncMock(
            return_value=[
                {"content": "Q1", "difficulty": "warm_up", "expected_keywords": ["k"]},
                {"content": "Q2", "difficulty": "core", "expected_keywords": ["k"]},
                {"content": "Q3", "difficulty": "core", "expected_keywords": ["k"]},
                {"content": "Q4", "difficulty": "deep_dive", "expected_keywords": ["k"]},
                {"content": "Q5", "difficulty": "deep_dive", "expected_keywords": ["k"]},
            ]
        ),
    )

    payloads = iter(
        [
            {
                "score": 7,
                "depth_score": 4,
                "clarity_score": 8,
                "feedback": [],
                "missing_concepts": ["index tuning"],
            },
            {
                "score": 8,
                "depth_score": 5,
                "clarity_score": 9,
                "feedback": [],
                "missing_concepts": ["index tuning"],
            },
        ]
    )

    async def fake_eval(*_a, **_kw):
        return next(payloads)

    monkeypatch.setattr("routers.answers.evaluate_answer", fake_eval)

    pid = client.get("/positions", headers=auth_headers).json()[0]["id"]
    sid = client.post(
        "/sessions",
        headers=auth_headers,
        json={"position_id": pid, "level": "mid", "tech_stack": ["Python"]},
    ).json()["id"]
    qs = client.get(f"/sessions/{sid}", headers=auth_headers).json()["questions"]
    for q in qs[:2]:
        r = client.post(
            "/answers",
            headers=auth_headers,
            json={
                "session_id": sid,
                "question_id": q["id"],
                "content": "answer body",
            },
        )
        assert r.status_code == 200

    res = client.get("/insights/improvement-hub", headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["sessions_analyzed"] >= 1
    snap = body["rubric_snapshot"]
    assert snap["depth"] == pytest.approx(4.5, rel=0.01)
    assert snap["clarity"] == pytest.approx(8.5, rel=0.01)
    assert "index tuning" in body["top_missing_concepts"]

    assert len(body["focus_areas"]) == 3
    depth_area = next(f for f in body["focus_areas"] if f["key"] == "depth")
    assert depth_area["priority"] == "high"
    assert depth_area["priority_label"] == "High Priority Improvement"
    assert depth_area["tip"] == "Tip depth"
