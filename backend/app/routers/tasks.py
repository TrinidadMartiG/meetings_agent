"""Tasks router: manual task management and weekly AI digest."""

from datetime import datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user_id
from app.models.insight import Insight
from app.models.meeting import Meeting
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate
from app.services.gemini import generate_weekly_digest

router = APIRouter(tags=["tasks"])


@router.get("/weekly-digest")
def weekly_digest(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> dict[str, list[dict]]:
    """Generate a prioritised task list from the last 7 days of insights.

    Fetches all insights linked to meetings that belong to the current user
    and were created in the last 7 days, then asks Gemini to produce the top-5
    priority tasks.

    Args:
        user_id: Injected authenticated user ID.
        db: Injected database session.

    Returns:
        A dict with a ``tasks`` key containing up to 5 priority task strings.
    """
    cutoff = datetime.utcnow() - timedelta(days=7)

    recent_insights = (
        db.query(Insight)
        .join(Meeting, Insight.meeting_id == Meeting.id)
        .filter(
            Meeting.user_id == UUID(user_id),
            Meeting.created_at >= cutoff,
        )
        .order_by(Insight.priority.desc())
        .all()
    )

    if not recent_insights:
        return {"tasks": []}

    insights_summary = "\n".join(
        f"[{ins.type.upper()}] {ins.content}" for ins in recent_insights
    )

    tasks = generate_weekly_digest(insights_summary)
    return {"tasks": tasks}


@router.get("", response_model=list[TaskResponse])
def list_tasks(
    task_status: str | None = None,
    client_id: UUID | None = None,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> list[Task]:
    """List tasks for the authenticated user with optional filters.

    Args:
        task_status: Optional filter — ``pending`` or ``done``.
        client_id: Optional filter to return only tasks linked to a client.
        user_id: Injected authenticated user ID.
        db: Injected database session.

    Returns:
        A list of ``TaskResponse`` objects ordered by creation date descending.
    """
    query = db.query(Task).filter(Task.user_id == UUID(user_id))

    if task_status is not None:
        query = query.filter(Task.status == task_status)

    if client_id is not None:
        query = query.filter(Task.client_id == client_id)

    return query.order_by(Task.created_at.desc()).all()


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    body: TaskCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Task:
    """Create a manual task for the authenticated user.

    Args:
        body: The task creation payload.
        user_id: Injected authenticated user ID.
        db: Injected database session.

    Returns:
        The newly created ``TaskResponse``.
    """
    task = Task(
        user_id=UUID(user_id),
        meeting_id=body.meeting_id,
        client_id=body.client_id,
        description=body.description,
        due_date=body.due_date,
        status="pending",
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: UUID,
    body: TaskUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Task:
    """Partially update a task owned by the current user.

    Only the fields present in the request body are modified.

    Args:
        task_id: The UUID of the task to update.
        body: The partial update payload.
        user_id: Injected authenticated user ID.
        db: Injected database session.

    Returns:
        The updated ``TaskResponse``.

    Raises:
        HTTPException: 404 if not found or not owned by the current user.
        HTTPException: 400 if an invalid status value is supplied.
    """
    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.user_id == UUID(user_id))
        .first()
    )
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if body.status is not None:
        if body.status not in ("pending", "done"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="status must be 'pending' or 'done'",
            )
        task.status = body.status

    if body.description is not None:
        task.description = body.description

    if body.due_date is not None:
        task.due_date = body.due_date

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> None:
    """Delete a task owned by the current user.

    Args:
        task_id: The UUID of the task to delete.
        user_id: Injected authenticated user ID.
        db: Injected database session.

    Raises:
        HTTPException: 404 if not found or not owned by the current user.
    """
    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.user_id == UUID(user_id))
        .first()
    )
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    db.delete(task)
    db.commit()
