"""Task ORM model."""

from datetime import date, datetime
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Task(Base):
    """An actionable task for a KAM, either extracted by AI or created manually."""

    __tablename__ = "tasks"
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'done')",
            name="task_status_check",
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    meeting_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("meetings.id", ondelete="SET NULL"), nullable=True
    )
    client_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("clients.id", ondelete="SET NULL"), nullable=True
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    due_date: Mapped[date | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="tasks")  # type: ignore[name-defined]  # noqa: F821
    meeting: Mapped["Meeting | None"] = relationship("Meeting", back_populates="tasks")  # type: ignore[name-defined]  # noqa: F821
    client: Mapped["Client | None"] = relationship("Client", back_populates="tasks")  # type: ignore[name-defined]  # noqa: F821
