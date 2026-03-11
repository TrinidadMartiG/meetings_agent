"""Meetings router: import, retrieve, and AI-process meeting transcriptions."""

from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import SessionLocal, get_db
from app.dependencies import get_current_user_id
from app.models.insight import Insight
from app.models.meeting import Meeting
from app.models.task import Task
from app.schemas.meeting import MeetingCreate, MeetingListItem, MeetingResponse, MeetingUpdate
from app.services.gemini import process_transcription

router = APIRouter(tags=["meetings"])


# ---------------------------------------------------------------------------
# Background processing
# ---------------------------------------------------------------------------


def _process_meeting_background(meeting_id: str) -> None:
    """Background task: call Gemini to extract insights and persist results.

    This function opens its own database session because it runs outside the
    original request lifecycle (the request session is already closed by the
    time this executes).

    Args:
        meeting_id: String UUID of the meeting to process.
    """
    db = SessionLocal()
    try:
        meeting = db.query(Meeting).filter(Meeting.id == UUID(meeting_id)).first()
        if not meeting:
            return

        result = process_transcription(meeting.transcription_text)

        # Persist key points
        for content in result.get("key_points", []):
            db.add(
                Insight(
                    meeting_id=meeting.id,
                    type="key_point",
                    content=content,
                    priority=2,
                )
            )

        # Persist action items as both insights and tasks
        for item in result.get("action_items", []):
            description = item.get("description", "")
            db.add(
                Insight(
                    meeting_id=meeting.id,
                    type="action_item",
                    content=description,
                    priority=3,
                )
            )
            db.add(
                Task(
                    user_id=meeting.user_id,
                    meeting_id=meeting.id,
                    client_id=meeting.client_id,
                    description=description,
                    status="pending",
                )
            )

        # Persist recommendations
        for content in result.get("recommendations", []):
            db.add(
                Insight(
                    meeting_id=meeting.id,
                    type="recommendation",
                    content=content,
                    priority=1,
                )
            )

        # Persist reminders
        for content in result.get("reminders", []):
            db.add(
                Insight(
                    meeting_id=meeting.id,
                    type="reminder",
                    content=content,
                    priority=2,
                )
            )

        # Persist client context summary
        client_ctx = result.get("client_context", "")
        if client_ctx:
            db.add(
                Insight(
                    meeting_id=meeting.id,
                    type="client_context",
                    content=client_ctx,
                    priority=1,
                )
            )

        meeting.processed = True
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Route handlers
# ---------------------------------------------------------------------------


@router.get("", response_model=list[MeetingListItem])
def list_meetings(
    client_id: UUID | None = None,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> list[Meeting]:
    """List all meetings for the authenticated user.

    Args:
        client_id: Optional filter to return only meetings for a specific client.
        user_id: Injected authenticated user ID.
        db: Injected database session.

    Returns:
        A list of ``MeetingListItem`` objects (without transcription text).
    """
    query = db.query(Meeting).filter(Meeting.user_id == UUID(user_id))
    if client_id is not None:
        query = query.filter(Meeting.client_id == client_id)
    return query.order_by(Meeting.meeting_date.desc()).all()


@router.post("", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
def create_meeting(
    body: MeetingCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Meeting:
    """Create a new meeting with its transcription text.

    Args:
        body: The meeting creation payload including transcription text.
        user_id: Injected authenticated user ID.
        db: Injected database session.

    Returns:
        The newly created ``MeetingResponse``.
    """
    meeting = Meeting(
        user_id=UUID(user_id),
        client_id=body.client_id,
        title=body.title,
        meeting_date=body.meeting_date,
        transcription_text=body.transcription_text,
        processed=False,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


@router.get("/{meeting_id}", response_model=MeetingResponse)
def get_meeting(
    meeting_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Meeting:
    """Retrieve the full details of a single meeting including its transcription.

    Args:
        meeting_id: The UUID of the meeting.
        user_id: Injected authenticated user ID.
        db: Injected database session.

    Returns:
        The ``MeetingResponse`` for the requested meeting.

    Raises:
        HTTPException: 404 if not found or not owned by the current user.
    """
    meeting = (
        db.query(Meeting)
        .filter(Meeting.id == meeting_id, Meeting.user_id == UUID(user_id))
        .first()
    )
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
    return meeting


@router.patch("/{meeting_id}", response_model=MeetingResponse)
def update_meeting(
    meeting_id: UUID,
    body: MeetingUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Meeting:
    """Partially update a meeting (e.g. assign or change its client).

    Args:
        meeting_id: The UUID of the meeting to update.
        body: Fields to update (currently only ``client_id``).
        user_id: Injected authenticated user ID.
        db: Injected database session.

    Returns:
        The updated ``MeetingResponse``.

    Raises:
        HTTPException: 404 if not found or not owned by the current user.
    """
    meeting = (
        db.query(Meeting)
        .filter(Meeting.id == meeting_id, Meeting.user_id == UUID(user_id))
        .first()
    )
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    if body.client_id is not None:
        meeting.client_id = body.client_id
        # Propagate to all tasks from this meeting (covers both initial assignment
        # and re-assignment after tasks were already created without a client)
        (
            db.query(Task)
            .filter(Task.meeting_id == meeting.id)
            .update({"client_id": body.client_id})
        )

    db.commit()
    db.refresh(meeting)
    return meeting


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(
    meeting_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> None:
    """Delete a meeting owned by the current user.

    Args:
        meeting_id: The UUID of the meeting to delete.
        user_id: Injected authenticated user ID.
        db: Injected database session.

    Raises:
        HTTPException: 404 if not found or not owned by the current user.
    """
    meeting = (
        db.query(Meeting)
        .filter(Meeting.id == meeting_id, Meeting.user_id == UUID(user_id))
        .first()
    )
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
    db.delete(meeting)
    db.commit()


@router.post("/{meeting_id}/process", status_code=status.HTTP_202_ACCEPTED)
def process_meeting(
    meeting_id: UUID,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Trigger AI processing of a meeting transcription as a background task.

    The endpoint returns immediately with 202 Accepted. The client should
    poll ``GET /meetings/{id}`` and check the ``processed`` flag.

    Args:
        meeting_id: The UUID of the meeting to process.
        background_tasks: FastAPI background task queue.
        user_id: Injected authenticated user ID.
        db: Injected database session.

    Returns:
        A confirmation message.

    Raises:
        HTTPException: 404 if not found or not owned by the current user.
        HTTPException: 400 if the meeting has already been processed.
    """
    meeting = (
        db.query(Meeting)
        .filter(Meeting.id == meeting_id, Meeting.user_id == UUID(user_id))
        .first()
    )
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
    if meeting.processed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Meeting has already been processed",
        )

    background_tasks.add_task(_process_meeting_background, str(meeting_id))
    return {"detail": "Processing started"}
