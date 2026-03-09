"""Insight Pydantic schemas."""

from uuid import UUID

from pydantic import BaseModel


class InsightResponse(BaseModel):
    """Insight data returned by the API."""

    id: UUID
    meeting_id: UUID
    type: str
    content: str
    priority: int

    model_config = {"from_attributes": True}
