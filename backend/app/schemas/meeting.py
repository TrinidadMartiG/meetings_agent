"""Meeting Pydantic schemas."""

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel


class MeetingBase(BaseModel):
    """Fields shared between creation and response."""

    title: str
    meeting_date: date
    client_id: UUID | None = None


class MeetingCreate(MeetingBase):
    """Payload for creating a new meeting with its transcription."""

    transcription_text: str


class MeetingResponse(MeetingBase):
    """Full meeting data including transcription, returned by the API."""

    id: UUID
    user_id: UUID
    transcription_text: str
    processed: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class MeetingListItem(MeetingBase):
    """Lightweight meeting representation used in list endpoints (no transcription)."""

    id: UUID
    user_id: UUID
    processed: bool
    created_at: datetime

    model_config = {"from_attributes": True}
