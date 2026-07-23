"""create core tables

Revision ID: 202607140001
Revises:
Create Date: 2026-07-14 19:30:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "202607140001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "dev_users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("display_name", sa.String(length=120), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email", name="uq_dev_users_email"),
    )
    op.create_table(
        "instruments",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("symbol", sa.String(length=32), nullable=False),
        sa.Column("exchange", sa.String(length=12), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("isin", sa.String(length=12), nullable=True),
        sa.Column("segment", sa.String(length=32), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("exchange in ('NSE', 'BSE')", name="ck_instruments_exchange"),
        sa.CheckConstraint("currency = 'INR'", name="ck_instruments_currency"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("exchange", "symbol", name="uq_instruments_exchange_symbol"),
    )
    op.create_index("ix_instruments_exchange_symbol", "instruments", ["exchange", "symbol"], unique=False)
    op.create_table(
        "ai_request_logs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("task", sa.String(length=64), nullable=False),
        sa.Column("provider", sa.String(length=64), nullable=False),
        sa.Column("prompt", sa.Text(), nullable=False),
        sa.Column("response", sa.JSON(), nullable=True),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["dev_users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ai_request_logs_created_at", "ai_request_logs", ["created_at"], unique=False)
    op.create_index("ix_ai_request_logs_task_created_at", "ai_request_logs", ["task", "created_at"], unique=False)
    op.create_table(
        "ohlcv_candles",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("instrument_id", sa.Uuid(), nullable=False),
        sa.Column("timeframe", sa.String(length=12), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("open", sa.Numeric(precision=18, scale=6), nullable=False),
        sa.Column("high", sa.Numeric(precision=18, scale=6), nullable=False),
        sa.Column("low", sa.Numeric(precision=18, scale=6), nullable=False),
        sa.Column("close", sa.Numeric(precision=18, scale=6), nullable=False),
        sa.Column("volume", sa.Numeric(precision=20, scale=4), nullable=False),
        sa.Column("source", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("high >= low", name="ck_ohlcv_high_gte_low"),
        sa.CheckConstraint("open >= 0 and high >= 0 and low >= 0 and close >= 0 and volume >= 0", name="ck_ohlcv_non_negative"),
        sa.ForeignKeyConstraint(["instrument_id"], ["instruments.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("instrument_id", "timeframe", "timestamp", name="uq_ohlcv_instrument_timeframe_timestamp"),
    )
    op.create_index("ix_ohlcv_instrument_timeframe_timestamp", "ohlcv_candles", ["instrument_id", "timeframe", "timestamp"], unique=False)
    op.create_index("ix_ohlcv_timestamp", "ohlcv_candles", ["timestamp"], unique=False)
    op.create_table(
        "strategy_definitions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("strategy_type", sa.String(length=64), nullable=False),
        sa.Column("parameters", sa.JSON(), nullable=False),
        sa.Column("created_by", sa.String(length=24), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["dev_users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_strategy_definitions_created_at", "strategy_definitions", ["created_at"], unique=False)
    op.create_table(
        "backtest_runs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("strategy_definition_id", sa.Uuid(), nullable=False),
        sa.Column("instrument_id", sa.Uuid(), nullable=False),
        sa.Column("timeframe", sa.String(length=12), nullable=False),
        sa.Column("start_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("engine", sa.String(length=32), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("end_at > start_at", name="ck_backtest_runs_end_after_start"),
        sa.ForeignKeyConstraint(["instrument_id"], ["instruments.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["strategy_definition_id"], ["strategy_definitions.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["user_id"], ["dev_users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_backtest_runs_created_at", "backtest_runs", ["created_at"], unique=False)
    op.create_index("ix_backtest_runs_status_created_at", "backtest_runs", ["status", "created_at"], unique=False)
    op.create_table(
        "backtest_results",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("backtest_run_id", sa.Uuid(), nullable=False),
        sa.Column("metrics", sa.JSON(), nullable=False),
        sa.Column("equity_curve", sa.JSON(), nullable=True),
        sa.Column("trades", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["backtest_run_id"], ["backtest_runs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("backtest_run_id", name="uq_backtest_results_backtest_run_id"),
    )


def downgrade() -> None:
    op.drop_table("backtest_results")
    op.drop_index("ix_backtest_runs_status_created_at", table_name="backtest_runs")
    op.drop_index("ix_backtest_runs_created_at", table_name="backtest_runs")
    op.drop_table("backtest_runs")
    op.drop_index("ix_strategy_definitions_created_at", table_name="strategy_definitions")
    op.drop_table("strategy_definitions")
    op.drop_index("ix_ohlcv_timestamp", table_name="ohlcv_candles")
    op.drop_index("ix_ohlcv_instrument_timeframe_timestamp", table_name="ohlcv_candles")
    op.drop_table("ohlcv_candles")
    op.drop_index("ix_ai_request_logs_task_created_at", table_name="ai_request_logs")
    op.drop_index("ix_ai_request_logs_created_at", table_name="ai_request_logs")
    op.drop_table("ai_request_logs")
    op.drop_index("ix_instruments_exchange_symbol", table_name="instruments")
    op.drop_table("instruments")
    op.drop_table("dev_users")

