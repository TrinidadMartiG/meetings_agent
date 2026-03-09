"""ORM model package.

Importing all models here ensures Alembic autogenerate can discover them via
``Base.metadata``.
"""

from app.models.client import Client
from app.models.insight import Insight
from app.models.meeting import Meeting
from app.models.task import Task
from app.models.user import User

__all__ = ["User", "Client", "Meeting", "Insight", "Task"]
