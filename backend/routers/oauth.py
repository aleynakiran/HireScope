import os

import httpx
from authlib.oidc.core.claims import CodeIDToken
from fastapi import APIRouter, Depends, HTTPException
from starlette.requests import Request
from starlette.responses import RedirectResponse
from sqlmodel import Session

from database import get_db
from services.github_profile import fetch_github_identity
from services.oauth_accounts import get_or_create_oauth_user
from services.oauth_service import oauth

router = APIRouter(prefix="/oauth", tags=["oauth"])

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


class _LinkedInCodeIDToken(CodeIDToken):
    """LinkedIn OIDC id_tokens may omit `nonce` even when the auth request included one."""

    def validate_nonce(self) -> None:
        return


def _redirect_missing_config(provider: str) -> None:
    cid = os.getenv(f"{provider.upper()}_CLIENT_ID", "")
    if not cid:
        raise HTTPException(status_code=503, detail=f"{provider.title()} OAuth is not configured")


@router.get("/google")
async def google_login(request: Request):
    _redirect_missing_config("GOOGLE")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "")
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    _redirect_missing_config("GOOGLE")
    token = await oauth.google.authorize_access_token(request)
    userinfo = token.get("userinfo") or {}
    email = userinfo.get("email")
    sub = userinfo.get("sub")
    name = userinfo.get("name")

    if (not email or not sub) and token.get("access_token"):
        async with httpx.AsyncClient(timeout=30.0) as client:
            info_resp = await client.get(
                "https://openidconnect.googleapis.com/v1/userinfo",
                headers={"Authorization": f"Bearer {token['access_token']}"},
            )
            info_resp.raise_for_status()
            userinfo = info_resp.json()
            email = userinfo.get("email")
            sub = userinfo.get("sub")
            name = name or userinfo.get("name")

    name = name or (email.split("@")[0] if email else "Google User")
    if not email or not sub:
        raise HTTPException(status_code=400, detail="Missing Google profile data")

    needs_2fa, tok = get_or_create_oauth_user(
        db, provider="google", oauth_sub=str(sub), email=str(email), full_name=str(name)
    )
    if needs_2fa:
        return RedirectResponse(f"{FRONTEND_URL}/oauth/callback?twofa=1&temp_token={tok}")
    return RedirectResponse(f"{FRONTEND_URL}/oauth/callback?token={tok}")


@router.get("/github")
async def github_login(request: Request):
    _redirect_missing_config("GITHUB")
    redirect_uri = os.getenv("GITHUB_REDIRECT_URI", "")
    return await oauth.github.authorize_redirect(request, redirect_uri)


@router.get("/github/callback")
async def github_callback(request: Request, db: Session = Depends(get_db)):
    _redirect_missing_config("GITHUB")
    token = await oauth.github.authorize_access_token(request)
    access_token = token.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="Missing GitHub token")

    email, name, sub = await fetch_github_identity(str(access_token))
    needs_2fa, tok = get_or_create_oauth_user(
        db, provider="github", oauth_sub=sub, email=email, full_name=name
    )
    if needs_2fa:
        return RedirectResponse(f"{FRONTEND_URL}/oauth/callback?twofa=1&temp_token={tok}")
    return RedirectResponse(f"{FRONTEND_URL}/oauth/callback?token={tok}")


@router.get("/linkedin")
async def linkedin_login(request: Request):
    _redirect_missing_config("LINKEDIN")
    redirect_uri = os.getenv("LINKEDIN_REDIRECT_URI", "")
    return await oauth.linkedin.authorize_redirect(request, redirect_uri)


@router.get("/linkedin/callback")
async def linkedin_callback(request: Request, db: Session = Depends(get_db)):
    _redirect_missing_config("LINKEDIN")
    token = await oauth.linkedin.authorize_access_token(
        request, claims_cls=_LinkedInCodeIDToken
    )
    userinfo = token.get("userinfo") or {}
    email = userinfo.get("email")
    sub = userinfo.get("sub")
    full_name = userinfo.get("name") or "LinkedIn User"

    if (not email or not sub) and token.get("access_token"):
        async with httpx.AsyncClient(timeout=30.0) as client:
            profile_resp = await client.get(
                "https://api.linkedin.com/v2/userinfo",
                headers={"Authorization": f"Bearer {token['access_token']}"},
            )
            profile_resp.raise_for_status()
            profile = profile_resp.json()
        email = email or profile.get("email")
        sub = sub or profile.get("sub")
        full_name = full_name or profile.get("name") or "LinkedIn User"

    if not sub:
        raise HTTPException(status_code=400, detail="Missing LinkedIn profile data")
    if not email:
        # Keep login flow stable even if an app returns profile without email.
        email = f"linkedin_{sub}@oauth.local"
    needs_2fa, tok = get_or_create_oauth_user(
        db, provider="linkedin", oauth_sub=str(sub), email=str(email), full_name=str(full_name)
    )
    if needs_2fa:
        return RedirectResponse(f"{FRONTEND_URL}/oauth/callback?twofa=1&temp_token={tok}")
    return RedirectResponse(f"{FRONTEND_URL}/oauth/callback?token={tok}")


@router.get("/discord")
async def discord_login(request: Request):
    _redirect_missing_config("DISCORD")
    redirect_uri = os.getenv("DISCORD_REDIRECT_URI", "")
    return await oauth.discord.authorize_redirect(request, redirect_uri)


@router.get("/discord/callback")
async def discord_callback(request: Request, db: Session = Depends(get_db)):
    _redirect_missing_config("DISCORD")
    token = await oauth.discord.authorize_access_token(request)
    access_token = token.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="Missing Discord token")

    async with httpx.AsyncClient(timeout=30.0) as client:
        profile_resp = await client.get(
            "https://discord.com/api/users/@me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        profile_resp.raise_for_status()
        profile = profile_resp.json()

    sub = str(profile.get("id")) if profile.get("id") is not None else None
    if not sub:
        raise HTTPException(status_code=400, detail="Missing Discord profile id")

    email = profile.get("email")
    if not email:
        email = f"discord_{sub}@oauth.local"

    full_name = profile.get("global_name") or profile.get("username") or "Discord User"

    needs_2fa, tok = get_or_create_oauth_user(
        db, provider="discord", oauth_sub=sub, email=str(email), full_name=str(full_name)
    )
    if needs_2fa:
        return RedirectResponse(f"{FRONTEND_URL}/oauth/callback?twofa=1&temp_token={tok}")
    return RedirectResponse(f"{FRONTEND_URL}/oauth/callback?token={tok}")


