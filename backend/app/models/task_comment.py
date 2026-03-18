"""TaskComment ORM model."""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TaskComment(Base):
    """A markdown-formatted comment attached to a task."""

    __tablename__ = "task_comments"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    task_id: Mapped[UUID] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    task: Mapped["Task"] = relationship("Task", back_populates="comments")  # type: ignore[name-defined]  # noqa: F821
    user: Mapped["User"] = relationship("User")  # type: ignore[name-defined]  # noqa: F821
