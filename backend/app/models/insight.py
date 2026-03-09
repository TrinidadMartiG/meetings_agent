"""Insight ORM model."""

from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

INSIGHT_TYPES = ("key_point", "action_item", "recommendation", "reminder", "client_context")


class Insight(Base):
    """A structured insight extracted from a meeting transcription by Gemini."""

    __tablename__ = "insights"
    __table_args__ = (
        CheckConstraint(
            "type IN ('key_point', 'action_item', 'recommendation', 'reminder', 'client_context')",
            name="insight_type_check",
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    meeting_id: Mapped[UUID] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False
    )
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Relationships
    meeting: Mapped["Meeting"] = relationship("Meeting", back_populates="insights")  # type: ignore[name-defined]  # noqa: F821
