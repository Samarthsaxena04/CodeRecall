"""
Centralized configuration loaded from environment variables.
Import from here instead of calling os.getenv() in every file.
"""

import os
from dotenv import load_dotenv

load_dotenv()

_secret_key = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours default
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))  # 30 days default
SIGNUP_TOKEN_EXPIRE_MINUTES = 15

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

_frontend_url = os.getenv("FRONTEND_URL")

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

if not _secret_key:
    raise ValueError("SECRET_KEY environment variable is not set!")
if not _frontend_url:
    raise ValueError("FRONTEND_URL environment variable is not set!")


def _parse_origins(value: str) -> list[str]:
    # Support a single URL or a comma-separated list (useful for Azure SWA
    # production + preview/staging URLs).
    return [origin.strip() for origin in value.split(",") if origin.strip()]

# Export as str (not str|None) so Pylance doesn't complain in every file that imports these
SECRET_KEY: str = _secret_key
FRONTEND_URL: str = _frontend_url
FRONTEND_URLS: list[str] = _parse_origins(_frontend_url)
