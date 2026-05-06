import os

from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request
from starlette.responses import Response

limiter = Limiter(key_func=get_remote_address, enabled=os.getenv("TESTING") != "1")


async def security_headers_middleware(request: Request, call_next) -> Response:
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    return response
