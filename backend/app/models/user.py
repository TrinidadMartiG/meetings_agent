"""User ORM model."""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    """Registered KAM user, authenticated via Google OAuth."""

    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    google_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    # Relationships
    clients: Mapped[list["Client"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Client", back_populates="user", cascade="all, delete-orphan"
    )
    meetings: Mapped[list["Meeting"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Meeting", back_populates="user", cascade="all, delete-orphan"
    )
    tasks: Mapped[list["Task"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Task", back_populates="user", cascade="all, delete-orphan"
    )
