"""add waitlist signups

Revision ID: 202607240001
Revises: 202607180001
Create Date: 2026-07-24 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "202607240001"
down_revision: Union[str, None] = "202607180001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, None] = None


def upgrade() -> None:
    op.create_table(
        "waitlist_signups",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=64), nullable=False),
        sa.Column("source", sa.String(length=64), server_default="landing", nullable=False),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email", name="uq_waitlist_signups_email"),
    )
    op.create_index("ix_waitlist_signups_created_at", "waitlist_signups", ["created_at"], unique=False)
    op.create_index("ix_waitlist_signups_role_created_at", "waitlist_signups", ["role", "created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_waitlist_signups_role_created_at", table_name="waitlist_signups")
    op.drop_index("ix_waitlist_signups_created_at", table_name="waitlist_signups")
    op.drop_table("waitlist_signups")
