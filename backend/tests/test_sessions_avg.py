from unittest.mock import AsyncMock

from fastapi.testclient import TestClient


def test_sessions_average_score_when_empty(client: TestClient, auth_headers: dict[str, str], monkeypatch):
    monkeypatch.setattr(
        "routers.sessions.generate_questions",
        AsyncMock(
            return_value=[
                {"content": "A", "difficulty": "warm_up", "expected_keywords": ["k"]},
                {"content": "B", "difficulty": "core", "expected_keywords": ["k"]},
                {"content": "C", "difficulty": "core", "expected_keywords": ["k"]},
                {"content": "D", "difficulty": "deep_dive", "expected_keywords": ["k"]},
                {"content": "E", "difficulty": "deep_dive", "expected_keywords": ["k"]},
            ]
        ),
    )

    pid = client.get("/positions", headers=auth_headers).json()[0]["id"]
    client.post(
        "/sessions",
        headers=auth_headers,
        json={"position_id": pid, "level": "mid", "tech_stack": []},
    )

    rows = client.get("/sessions", headers=auth_headers).json()
    assert rows[0]["average_score"] is None
