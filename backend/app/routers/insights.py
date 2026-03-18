"""Insights router: query AI-extracted insights."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user_id
from app.models.insight import Insight
from app.models.meeting import Meeting
from app.schemas.insight import InsightResponse, InsightUpdate

router = APIRouter(tags=["insights"])


@router.get("", response_model=list[InsightResponse])
def list_insights(
    meeting_id: UUID | None = None,
    client_id: UUID | None = None,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> list[Insight]:
    """Return insights visible to the authenticated user.

    Supports two optional filters that can be combined:

    - ``?meeting_id=<uuid>`` — insights for a specific meeting.
    - ``?client_id=<uuid>`` — insights for all meetings linked to a client.

    Without any filter, all insights for all the user's meetings are returned.

    Args:
        meeting_id: Optional UUID to filter by meeting.
        client_id: Optional UUID to filter by client (joins through Meeting).
        user_id: Injected authenticated user ID.
        db: Injected database session.

    Returns:
        A list of ``InsightResponse`` objects ordered by priority descending.

    Raises:
        HTTPException: 404 if a ``meeting_id`` is specified but does not belong
            to the current user.
    """
    # Base query — join Meeting to enforce ownership
    query = (
        db.query(Insight)
        .join(Meeting, Insight.meeting_id == Meeting.id)
        .filter(Meeting.user_id == UUID(user_id))
    )

    if meeting_id is not None:
        # Verify the meeting belongs to the user before filtering
        meeting = (
            db.query(Meeting)
            .filter(Meeting.id == meeting_id, Meeting.user_id == UUID(user_id))
            .first()
        )
        if not meeting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found"
            )
        query = query.filter(Insight.meeting_id == meeting_id)

    if client_id is not None:
        query = query.filter(Meeting.client_id == client_id)

    return query.order_by(Insight.priority.desc()).all()


@router.patch("/{insight_id}", response_model=InsightResponse)
def update_insight(
    insight_id: UUID,
    body: InsightUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Insight:
    """Update the content of an insight owned by the current user.

    Args:
        insight_id: UUID of the insight to update.
        body: Payload with the new ``content`` string.
        user_id: Injected authenticated user ID.
        db: Injected database session.

    Returns:
        The updated ``InsightResponse``.

    Raises:
        HTTPException: 404 if not found or not owned by the current user.
    """
    insight = (
        db.query(Insight)
        .join(Meeting, Insight.meeting_id == Meeting.id)
        .filter(Insight.id == insight_id, Meeting.user_id == UUID(user_id))
        .first()
    )
    if not insight:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Insight not found")

    insight.content = body.content.strip()
    db.commit()
    db.refresh(insight)
    return insight
