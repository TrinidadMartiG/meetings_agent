"""Add global_summary, summary_updated_at, summary_generating to clients.

Revision ID: 002
Revises: 001
Create Date: 2026-03-11 00:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("clients", sa.Column("global_summary", sa.Text(), nullable=True))
    op.add_column("clients", sa.Column("summary_updated_at", sa.DateTime(), nullable=True))
    op.add_column(
        "clients",
        sa.Column(
            "summary_generating",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )


def downgrade() -> None:
    op.drop_column("clients", "summary_generating")
    op.drop_column("clients", "summary_updated_at")
    op.drop_column("clients", "global_summary")
