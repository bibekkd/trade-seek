"""add paper trading

Revision ID: 202607180001
Revises: 202607160001
Create Date: 2026-07-18 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "202607180001"
down_revision: Union[str, None] = "202607160001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, None] = None


def upgrade() -> None:
    op.create_table(
        "paper_accounts",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("initial_cash", sa.Numeric(18, 4), nullable=False),
        sa.Column("cash", sa.Numeric(18, 4), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("kill_switch_enabled", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("cash >= 0", name="ck_paper_accounts_ck_paper_accounts_cash_non_negative"),
        sa.CheckConstraint("initial_cash > 0", name="ck_paper_accounts_ck_paper_accounts_initial_cash_positive"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_paper_accounts_status_created_at", "paper_accounts", ["status", "created_at"], unique=False)

    op.create_table(
        "paper_strategy_runs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("account_id", sa.Uuid(), nullable=False),
        sa.Column("backtest_run_id", sa.Uuid(), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("max_position_value", sa.Numeric(18, 4), nullable=False),
        sa.Column("last_signal", sa.String(length=24), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["paper_accounts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["backtest_run_id"], ["backtest_runs.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_paper_strategy_runs_status_created_at", "paper_strategy_runs", ["status", "created_at"], unique=False)

    op.create_table(
        "paper_positions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("account_id", sa.Uuid(), nullable=False),
        sa.Column("instrument_id", sa.Uuid(), nullable=False),
        sa.Column("quantity", sa.Numeric(18, 8), nullable=False),
        sa.Column("average_price", sa.Numeric(18, 6), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("quantity >= 0", name="ck_paper_positions_ck_paper_positions_quantity_non_negative"),
        sa.ForeignKeyConstraint(["account_id"], ["paper_accounts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["instrument_id"], ["instruments.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_paper_positions_account_instrument", "paper_positions", ["account_id", "instrument_id"], unique=False)

    op.create_table(
        "paper_orders",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("account_id", sa.Uuid(), nullable=False),
        sa.Column("instrument_id", sa.Uuid(), nullable=False),
        sa.Column("strategy_run_id", sa.Uuid(), nullable=True),
        sa.Column("side", sa.String(length=8), nullable=False),
        sa.Column("order_type", sa.String(length=16), nullable=False),
        sa.Column("quantity", sa.Numeric(18, 8), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("requested_price", sa.Numeric(18, 6), nullable=False),
        sa.Column("filled_price", sa.Numeric(18, 6), nullable=True),
        sa.Column("filled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("order_type = 'market'", name="ck_paper_orders_ck_paper_orders_market_only"),
        sa.CheckConstraint("side in ('buy', 'sell')", name="ck_paper_orders_ck_paper_orders_side"),
        sa.ForeignKeyConstraint(["account_id"], ["paper_accounts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["instrument_id"], ["instruments.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["strategy_run_id"], ["paper_strategy_runs.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_paper_orders_account_created_at", "paper_orders", ["account_id", "created_at"], unique=False)
    op.create_index("ix_paper_orders_status_created_at", "paper_orders", ["status", "created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_paper_orders_status_created_at", table_name="paper_orders")
    op.drop_index("ix_paper_orders_account_created_at", table_name="paper_orders")
    op.drop_table("paper_orders")
    op.drop_index("ix_paper_positions_account_instrument", table_name="paper_positions")
    op.drop_table("paper_positions")
    op.drop_index("ix_paper_strategy_runs_status_created_at", table_name="paper_strategy_runs")
    op.drop_table("paper_strategy_runs")
    op.drop_index("ix_paper_accounts_status_created_at", table_name="paper_accounts")
    op.drop_table("paper_accounts")
