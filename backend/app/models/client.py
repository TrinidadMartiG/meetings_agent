"""Client ORM model."""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Client(Base):
    """A commercial client associated with a KAM user."""

    __tablename__ = "clients"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="clients")  # type: ignore[name-defined]  # noqa: F821
    meetings: Mapped[list["Meeting"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Meeting", back_populates="client"
    )
    tasks: Mapped[list["Task"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Task", back_populates="client"
    )
