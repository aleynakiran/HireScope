from unittest.mock import AsyncMock

from fastapi.testclient import TestClient


def _session_with_one_answer(client: TestClient, headers: dict[str, str], monkeypatch):
    monkeypatch.setattr(
        "routers.sessions.generate_questions",
        AsyncMock(
            return_value=[
                {
                    "content": "Only question",
                    "difficulty": "warm_up",
                    "expected_keywords": ["algo"],
                },
                {"content": "Q2", "difficulty": "core", "expected_keywords": ["x"]},
                {"content": "Q3", "difficulty": "core", "expected_keywords": ["x"]},
                {"content": "Q4", "difficulty": "deep_dive", "expected_keywords": ["x"]},
                {"content": "Q5", "difficulty": "deep_dive", "expected_keywords": ["x"]},
            ]
        ),
    )
    monkeypatch.setattr(
        "routers.answers.evaluate_answer",
        AsyncMock(
            return_value={
                "score": 9,
                "depth_score": 8,
                "clarity_score": 9,
                "feedback": ["Strong"],
                "missing_concepts": [],
            }
        ),
    )

    pid = client.get("/positions", headers=headers).json()[0]["id"]
    session_id = client.post(
        "/sessions",
        headers=headers,
        json={"position_id": pid, "level": "senior", "tech_stack": ["Go"]},
    ).json()["id"]
    question_id = client.get(f"/sessions/{session_id}", headers=headers).json()["questions"][0][
        "id"
    ]
    client.post(
        "/answers",
        headers=headers,
        json={
            "session_id": session_id,
            "question_id": question_id,
            "content": "Detailed answer mentioning algo tradeoffs clearly.",
        },
    )
    return session_id


def test_evaluations_payload(client: TestClient, auth_headers: dict[str, str], monkeypatch) -> None:
    session_id = _session_with_one_answer(client, auth_headers, monkeypatch)

    res = client.get(f"/evaluations/{session_id}", headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["average_score"] == 9
    assert body["items"][0]["evaluation"]["score"] == 9


def test_complete_session(client: TestClient, auth_headers: dict[str, str], monkeypatch) -> None:
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
    session_id = client.post(
        "/sessions",
        headers=auth_headers,
        json={"position_id": pid, "level": "mid", "tech_stack": []},
    ).json()["id"]

    done = client.put(f"/sessions/{session_id}/complete", headers=auth_headers)
    assert done.status_code == 200
    assert done.json()["status"] == "completed"
