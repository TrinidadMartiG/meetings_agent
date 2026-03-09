"""Meeting ORM model."""

from datetime import date, datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Meeting(Base):
    """A meeting with its raw transcription and processing state."""

    __tablename__ = "meetings"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    client_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("clients.id", ondelete="SET NULL"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    meeting_date: Mapped[date] = mapped_column(nullable=False)
    transcription_text: Mapped[str] = mapped_column(Text, nullable=False)
    processed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="meetings")  # type: ignore[name-defined]  # noqa: F821
    client: Mapped["Client | None"] = relationship("Client", back_populates="meetings")  # type: ignore[name-defined]  # noqa: F821
    insights: Mapped[list["Insight"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Insight", back_populates="meeting", cascade="all, delete-orphan"
    )
    tasks: Mapped[list["Task"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Task", back_populates="meeting"
    )
