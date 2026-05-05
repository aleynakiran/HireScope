import pytest

import services.github_profile as github_profile


@pytest.mark.asyncio
async def test_fetch_github_identity_reads_emails(monkeypatch: pytest.MonkeyPatch) -> None:
    class Resp:
        def __init__(self, payload: object) -> None:
            self._payload = payload

        def raise_for_status(self) -> None:
            return None

        def json(self) -> object:
            return self._payload

    class FakeClient:
        def __init__(self, *args, **kwargs) -> None:
            pass

        async def __aenter__(self) -> "FakeClient":
            return self

        async def __aexit__(self, *_exc) -> bool:
            return False

        async def get(self, url: str, headers=None) -> Resp:
            if url.endswith("/user"):
                return Resp({"id": 42, "login": "devuser", "email": None, "name": None})
            if url.endswith("/user/emails"):
                return Resp([{"email": "dev@example.com", "primary": True}])
            raise AssertionError(url)

    monkeypatch.setattr(github_profile.httpx, "AsyncClient", FakeClient)

    email, name, sub = await github_profile.fetch_github_identity("fake-token")
    assert email == "dev@example.com"
    assert name == "devuser"
    assert sub == "42"
