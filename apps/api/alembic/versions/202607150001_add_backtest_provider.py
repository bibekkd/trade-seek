"""add provider to backtest runs

Revision ID: 202607150001
Revises: 202607140001
Create Date: 2026-07-15 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "202607150001"
down_revision: Union[str, None] = "202607140001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, None] = None


def upgrade() -> None:
    op.add_column(
        "backtest_runs",
        sa.Column("data_provider", sa.String(length=24), nullable=False, server_default="fixture"),
    )


def downgrade() -> None:
    op.drop_column("backtest_runs", "data_provider")
