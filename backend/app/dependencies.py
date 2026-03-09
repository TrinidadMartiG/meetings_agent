"""Shared FastAPI dependencies used across multiple routers."""

from fastapi import Header, HTTPException, status
from jose import JWTError

from app.services.auth import decode_access_token


def get_current_user_id(authorization: str = Header(...)) -> str:
    """Extract and validate the authenticated user's ID from the Bearer token.

    Args:
        authorization: The raw ``Authorization`` header value, expected in the
            format ``Bearer <jwt>``.

    Returns:
        The string UUID of the authenticated user.

    Raises:
        HTTPException: 401 if the header is missing, malformed, or the token
            is invalid or expired.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = authorization.replace("Bearer ", "").strip()
        payload = decode_access_token(token)
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise credentials_exception
        return user_id
    except JWTError:
        raise credentials_exception
