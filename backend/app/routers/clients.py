"""Clients router: CRUD for commercial clients owned by a KAM user."""

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import SessionLocal, get_db
from app.dependencies import get_current_user_id
from app.models.client import Client
from app.models.meeting import Meeting
from app.models.task import Task
from app.schemas.client import ClientCreate, ClientResponse
from app.services.gemini import generate_client_summary

router = APIRouter(tags=["clients"])


# ---------------------------------------------------------------------------
# Summary helpers
# ---------------------------------------------------------------------------


def _build_client_data(client_id: UUID, client_name: str, db: Session) -> dict:
    """Assemble all client context needed for generate_client_summary.

    Args:
        client_id: UUID of the client.
        client_name: Display name of the client.
        db: Database session.

    Returns:
        A dict ready to pass to ``generate_client_summary``.
    """
    meetings = (
        db.query(Meeting)
        .filter(Meeting.client_id == client_id, Meeting.processed.is_(True))
        .order_by(Meeting.meeting_date.asc())
        .options(joinedload(Meeting.insights))
        .all()
    )
    tasks = db.query(Task).filter(Task.client_id == client_id).all()

    total = len(tasks)
    done = sum(1 for t in tasks if t.status == "done")
    pct = (done / total * 100) if total else 0.0

    meeting_title_map = {str(m.id): m.title for m in meetings}

    return {
        "client_name": client_name,
        "total_meetings": len(meetings),
        "meetings": [
            {
                "title": m.title,
                "date": str(m.meeting_date),
                "insights": [
                    {"type": i.type, "content": i.content}
                    for i in sorted(m.insights, key=lambda x: x.priority, reverse=True)
                ],
            }
            for m in meetings
        ],
        "tasks": [
            {
                "description": t.description,
                "status": t.status,
                "due_date": str(t.due_date) if t.due_date else None,
                "from_meeting": meeting_title_map.get(str(t.meeting_id)) if t.meeting_id else None,
            }
            for t in tasks
        ],
        "task_stats": {
            "total": total,
            "done": done,
            "pending": total - done,
            "completion_pct": pct,
        },
    }


def _generate_summary_background(client_id: str) -> None:
    """Background task: call Gemini to generate the client's global summary.

    Opens its own DB session (same pattern as meeting processing background task).
    Resets ``summary_generating`` flag on both success and failure so the user
    can always retry.

    Args:
        client_id: String UUID of the client.
    """
    db = SessionLocal()
    try:
        client = db.query(Client).filter(Client.id == UUID(client_id)).first()
        if not client:
            return

        client.summary_generating = True
        db.commit()

        client_data = _build_client_data(UUID(client_id), client.name, db)
        summary = generate_client_summary(client_data)

        client.global_summary = summary
        client.summary_updated_at = datetime.utcnow()
        client.summary_generating = False
        db.commit()
    except Exception:
        # Reset flag so users can retry
        try:
            client = db.query(Client).filter(Client.id == UUID(client_id)).first()
            if client:
                client.summary_generating = False
                db.commit()
        except Exception:
            pass
        db.rollback()
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Route handlers (order matters — specific paths before parameterised ones)
# ---------------------------------------------------------------------------


@router.get("", response_model=list[ClientResponse])
def list_clients(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> list[Client]:
    """Return all clients belonging to the authenticated user."""
    return db.query(Client).filter(Client.user_id == UUID(user_id)).all()


@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
def create_client(
    body: ClientCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Client:
    """Create a new client for the authenticated user."""
    client = Client(user_id=UUID(user_id), name=body.name)
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


@router.post("/{client_id}/summarize", response_model=ClientResponse)
def summarize_client(
    client_id: UUID,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Client:
    """Trigger a Gemini-powered global summary for the client.

    Returns immediately (202-style). The summary is written asynchronously
    by the background task. The frontend should poll or refresh after a few
    seconds to pick up the new ``global_summary`` value.

    Raises:
        HTTPException: 404 if client not found or not owned by user.
        HTTPException: 409 if summary is already being generated.
    """
    client = (
        db.query(Client)
        .filter(Client.id == client_id, Client.user_id == UUID(user_id))
        .first()
    )
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
    if client.summary_generating:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El resumen ya está siendo generado",
        )

    background_tasks.add_task(_generate_summary_background, str(client_id))
    return client


@router.get("/{client_id}", response_model=ClientResponse)
def get_client(
    client_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Client:
    """Retrieve a single client by ID (must belong to the current user)."""
    client = (
        db.query(Client)
        .filter(Client.id == client_id, Client.user_id == UUID(user_id))
        .first()
    )
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    return client


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(
    client_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> None:
    """Delete a client owned by the current user."""
    client = (
        db.query(Client)
        .filter(Client.id == client_id, Client.user_id == UUID(user_id))
        .first()
    )
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    db.delete(client)
    db.commit()
