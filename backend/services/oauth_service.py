import os

from authlib.integrations.starlette_client import OAuth

oauth = OAuth()

oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID", ""),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET", ""),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

oauth.register(
    name="github",
    client_id=os.getenv("GITHUB_CLIENT_ID", ""),
    client_secret=os.getenv("GITHUB_CLIENT_SECRET", ""),
    access_token_url="https://github.com/login/oauth/access_token",
    authorize_url="https://github.com/login/oauth/authorize",
    api_base_url="https://api.github.com/",
    client_kwargs={"scope": "user:email"},
)

oauth.register(
    name="linkedin",
    client_id=os.getenv("LINKEDIN_CLIENT_ID", ""),
    client_secret=os.getenv("LINKEDIN_CLIENT_SECRET", ""),
    authorize_url="https://www.linkedin.com/oauth/v2/authorization",
    access_token_url="https://www.linkedin.com/oauth/v2/accessToken",
    api_base_url="https://api.linkedin.com/v2/",
    client_kwargs={"scope": "r_liteprofile r_emailaddress"},
)

oauth.register(
    name="microsoft",
    client_id=os.getenv("MICROSOFT_CLIENT_ID", ""),
    client_secret=os.getenv("MICROSOFT_CLIENT_SECRET", ""),
    server_metadata_url=(
        "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration"
    ),
    client_kwargs={"scope": "openid email profile User.Read"},
)
