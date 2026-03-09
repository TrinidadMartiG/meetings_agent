"""User Pydantic schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    """Fields shared between creation and response."""

    email: str
    name: str


class UserCreate(UserBase):
    """Payload for creating a user record (populated from Google token)."""

    google_id: str


class UserResponse(UserBase):
    """User data returned by the API."""

    id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}
