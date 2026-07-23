"""add research runs

Revision ID: 202607160001
Revises: 202607150001
Create Date: 2026-07-16 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "202607160001"
down_revision: Union[str, None] = "202607150001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, None] = None


def upgrade() -> None:
    op.create_table(
        "research_runs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("ai_request_log_id", sa.Uuid(), nullable=True),
        sa.Column("backtest_run_id", sa.Uuid(), nullable=True),
        sa.Column("symbol", sa.String(length=32), nullable=False),
        sa.Column("exchange", sa.String(length=12), nullable=False),
        sa.Column("timeframe", sa.String(length=12), nullable=False),
        sa.Column("data_provider", sa.String(length=24), nullable=False),
        sa.Column("start_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("prompt", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("strategy_proposal", sa.JSON(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["ai_request_log_id"], ["ai_request_logs.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["backtest_run_id"], ["backtest_runs.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["dev_users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_research_runs_created_at", "research_runs", ["created_at"], unique=False)
    op.create_index("ix_research_runs_status_created_at", "research_runs", ["status", "created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_research_runs_status_created_at", table_name="research_runs")
    op.drop_index("ix_research_runs_created_at", table_name="research_runs")
    op.drop_table("research_runs")
