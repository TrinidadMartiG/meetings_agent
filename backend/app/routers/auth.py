"""Authentication router: Google OAuth sign-in and JWT issuance."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.auth import create_access_token, verify_google_token

router = APIRouter(prefix="/auth", tags=["auth"])


class GoogleTokenRequest(BaseModel):
    """Request body for the Google OAuth endpoint."""

    token: str


class AuthResponse(BaseModel):
    """Response returned after a successful authentication."""

    access_token: str
    token_type: str
    user: dict


@router.post("/google", response_model=AuthResponse)
def google_auth(
    body: GoogleTokenRequest,
    db: Session = Depends(get_db),
) -> AuthResponse:
    """Authenticate a user via Google ID token.

    If the user does not exist yet they are created automatically (sign-up
    and sign-in are combined into a single endpoint, which is the standard
    pattern for OAuth-first apps).

    Args:
        body: The Google ID token sent by the frontend after a successful
            Google sign-in.
        db: Injected database session.

    Returns:
        An ``AuthResponse`` containing the JWT access token and basic user info.

    Raises:
        HTTPException: 401 if the Google token is invalid.
    """
    try:
        user_info = verify_google_token(body.token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        ) from exc

    user = db.query(User).filter(User.google_id == user_info["google_id"]).first()
    if not user:
        user = User(
            google_id=user_info["google_id"],
            email=user_info["email"],
            name=user_info["name"],
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(str(user.id), user.email)
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user={"id": str(user.id), "email": user.email, "name": user.name},
    )
