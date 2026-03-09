"""Initial schema: users, clients, meetings, insights, tasks.

Revision ID: 001
Revises:
Create Date: 2026-03-09 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create all application tables."""

    # ------------------------------------------------------------------
    # users
    # ------------------------------------------------------------------
    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("google_id", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("google_id"),
        sa.UniqueConstraint("email"),
    )

    # ------------------------------------------------------------------
    # clients
    # ------------------------------------------------------------------
    op.create_table(
        "clients",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE"
        ),
    )
    op.create_index("ix_clients_user_id", "clients", ["user_id"])

    # ------------------------------------------------------------------
    # meetings
    # ------------------------------------------------------------------
    op.create_table(
        "meetings",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("client_id", sa.UUID(), nullable=True),
        sa.Column("title", sa.String(length=512), nullable=False),
        sa.Column("meeting_date", sa.Date(), nullable=False),
        sa.Column("transcription_text", sa.Text(), nullable=False),
        sa.Column(
            "processed",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["client_id"], ["clients.id"], ondelete="SET NULL"
        ),
    )
    op.create_index("ix_meetings_user_id", "meetings", ["user_id"])
    op.create_index("ix_meetings_client_id", "meetings", ["client_id"])
    op.create_index("ix_meetings_meeting_date", "meetings", ["meeting_date"])

    # ------------------------------------------------------------------
    # insights
    # ------------------------------------------------------------------
    op.create_table(
        "insights",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("meeting_id", sa.UUID(), nullable=False),
        sa.Column("type", sa.String(length=50), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column(
            "priority",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["meeting_id"], ["meetings.id"], ondelete="CASCADE"
        ),
        sa.CheckConstraint(
            "type IN ('key_point', 'action_item', 'recommendation', 'reminder', 'client_context')",
            name="insight_type_check",
        ),
    )
    op.create_index("ix_insights_meeting_id", "insights", ["meeting_id"])
    op.create_index("ix_insights_type", "insights", ["type"])

    # ------------------------------------------------------------------
    # tasks
    # ------------------------------------------------------------------
    op.create_table(
        "tasks",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("meeting_id", sa.UUID(), nullable=True),
        sa.Column("client_id", sa.UUID(), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
            server_default=sa.text("'pending'"),
        ),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["meeting_id"], ["meetings.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["client_id"], ["clients.id"], ondelete="SET NULL"
        ),
        sa.CheckConstraint(
            "status IN ('pending', 'done')",
            name="task_status_check",
        ),
    )
    op.create_index("ix_tasks_user_id", "tasks", ["user_id"])
    op.create_index("ix_tasks_status", "tasks", ["status"])
    op.create_index("ix_tasks_client_id", "tasks", ["client_id"])


def downgrade() -> None:
    """Drop all application tables in reverse dependency order."""
    op.drop_table("tasks")
    op.drop_table("insights")
    op.drop_table("meetings")
    op.drop_table("clients")
    op.drop_table("users")
