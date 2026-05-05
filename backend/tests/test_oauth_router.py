from fastapi.testclient import TestClient


def test_google_oauth_unconfigured_returns_503(client: TestClient, monkeypatch) -> None:
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "")
    res = client.get("/oauth/google", follow_redirects=False)
    assert res.status_code == 503


def test_github_oauth_unconfigured_returns_503(client: TestClient, monkeypatch) -> None:
    monkeypatch.setenv("GITHUB_CLIENT_ID", "")
    res = client.get("/oauth/github", follow_redirects=False)
    assert res.status_code == 503
