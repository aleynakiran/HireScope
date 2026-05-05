from unittest.mock import AsyncMock

from fastapi.testclient import TestClient


def test_sessions_flow(client: TestClient, auth_headers: dict[str, str], monkeypatch) -> None:
    monkeypatch.setattr(
        "routers.sessions.generate_questions",
        AsyncMock(
            return_value=[
                {
                    "content": "Q1",
                    "difficulty": "warm_up",
                    "expected_keywords": ["a"],
                },
                {
                    "content": "Q2",
                    "difficulty": "core",
                    "expected_keywords": ["b"],
                },
                {
                    "content": "Q3",
                    "difficulty": "core",
                    "expected_keywords": ["c"],
                },
                {
                    "content": "Q4",
                    "difficulty": "deep_dive",
                    "expected_keywords": ["d"],
                },
                {
                    "content": "Q5",
                    "difficulty": "deep_dive",
                    "expected_keywords": ["e"],
                },
            ]
        ),
    )

    positions = client.get("/positions", headers=auth_headers)
    assert positions.status_code == 200
    position_id = positions.json()[0]["id"]

    created = client.post(
        "/sessions",
        headers=auth_headers,
        json={
            "position_id": position_id,
            "level": "junior",
            "tech_stack": ["Python"],
        },
    )
    assert created.status_code == 200
    session_id = created.json()["id"]

    detail = client.get(f"/sessions/{session_id}", headers=auth_headers)
    assert detail.status_code == 200
    assert len(detail.json()["questions"]) == 5
