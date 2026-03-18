"""Task Pydantic schemas."""

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel


class TaskBase(BaseModel):
    """Fields shared between creation and response."""

    description: str
    client_id: UUID | None = None
    due_date: date | None = None


class TaskCreate(TaskBase):
    """Payload for creating a manual task."""

    meeting_id: UUID | None = None


class TaskUpdate(BaseModel):
    """Payload for partially updating a task."""

    status: str | None = None
    description: str | None = None
    due_date: date | None = None


class TaskResponse(TaskBase):
    """Task data returned by the API."""

    id: UUID
    user_id: UUID
    meeting_id: UUID | None
    status: str
    created_at: datetime
    comment_count: int = 0

    model_config = {"from_attributes": True}
