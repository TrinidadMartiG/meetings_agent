"""Client Pydantic schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ClientBase(BaseModel):
    """Fields shared between creation and response."""

    name: str


class ClientCreate(ClientBase):
    """Payload for creating a new client."""


class ClientResponse(ClientBase):
    """Client data returned by the API."""

    id: UUID
    user_id: UUID
    created_at: datetime
    global_summary: str | None = None
    summary_updated_at: datetime | None = None
    summary_generating: bool = False

    model_config = {"from_attributes": True}
