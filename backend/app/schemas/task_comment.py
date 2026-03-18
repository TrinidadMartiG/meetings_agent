"""TaskComment Pydantic schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class TaskCommentCreate(BaseModel):
    """Payload for creating a comment on a task."""

    content: str


class TaskCommentResponse(BaseModel):
    """Comment data returned by the API."""

    id: UUID
    task_id: UUID
    user_id: UUID
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}
