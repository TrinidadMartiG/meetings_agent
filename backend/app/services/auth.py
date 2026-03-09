"""Authentication service: Google OAuth token verification and JWT helpers."""

from datetime import datetime, timedelta

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from jose import jwt

from app.config import settings


def verify_google_token(token: str) -> dict[str, str]:
    """Verify a Google ID token and return extracted user fields.

    Args:
        token: The raw Google ID token string sent by the client.

    Returns:
        A dict with ``google_id``, ``email``, and ``name`` keys.

    Raises:
        ValueError: If the token is invalid or cannot be verified.
    """
    idinfo = id_token.verify_oauth2_token(
        token,
        google_requests.Request(),
        settings.google_client_id,
    )
    return {
        "google_id": idinfo["sub"],
        "email": idinfo["email"],
        "name": idinfo.get("name", ""),
    }


def create_access_token(user_id: str, email: str) -> str:
    """Create a signed JWT access token.

    Args:
        user_id: The string representation of the user's UUID primary key.
        email: The user's email address, embedded in the token for convenience.

    Returns:
        A signed JWT string.
    """
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": user_id, "email": email, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT access token.

    Args:
        token: The JWT string to decode.

    Returns:
        The decoded payload dictionary.

    Raises:
        jose.JWTError: If the token is expired or the signature is invalid.
    """
    return jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=[settings.jwt_algorithm],
    )
