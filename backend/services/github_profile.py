import httpx


async def fetch_github_identity(access_token: str) -> tuple[str, str, str]:
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/vnd.github+json",
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        user_resp = await client.get("https://api.github.com/user", headers=headers)
        user_resp.raise_for_status()
        profile = user_resp.json()
        email = profile.get("email")
        if not email:
            emails_resp = await client.get("https://api.github.com/user/emails", headers=headers)
            emails_resp.raise_for_status()
            emails = emails_resp.json()
            primary = next((e["email"] for e in emails if e.get("primary")), None)
            email = primary or (emails[0]["email"] if emails else None)
        if not email:
            login = profile.get("login") or "github_user"
            numeric_id = profile.get("id")
            email = f"{login}+{numeric_id}@users.noreply.github.com"
        name = str(profile.get("name") or profile.get("login") or email.split("@")[0])
        sub = str(profile["id"])
        return email, name, sub
