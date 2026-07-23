from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Index, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.schema import conv
from sqlalchemy.types import Uuid

from app.db.base import Base
from app.models.common import TimestampMixin, UuidPrimaryKeyMixin


class PaperAccount(UuidPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "paper_accounts"
    __table_args__ = (
        CheckConstraint("cash >= 0", name=conv("ck_paper_accounts_cash_non_negative")),
        CheckConstraint("initial_cash > 0", name=conv("ck_paper_accounts_initial_cash_positive")),
        Index("ix_paper_accounts_status_created_at", "status", "created_at"),
    )

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    initial_cash: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    cash: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="active")
    kill_switch_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    orders = relationship("PaperOrder", back_populates="account")
    positions = relationship("PaperPosition", back_populates="account")
    strategy_runs = relationship("PaperStrategyRun", back_populates="account")


class PaperPosition(UuidPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "paper_positions"
    __table_args__ = (
        CheckConstraint("quantity >= 0", name=conv("ck_paper_positions_quantity_non_negative")),
        Index("ix_paper_positions_account_instrument", "account_id", "instrument_id"),
    )

    account_id: Mapped[str] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("paper_accounts.id", ondelete="CASCADE"),
        nullable=False,
    )
    instrument_id: Mapped[str] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("instruments.id", ondelete="RESTRICT"),
        nullable=False,
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(18, 8), nullable=False, default=0)
    average_price: Mapped[Decimal] = mapped_column(Numeric(18, 6), nullable=False, default=0)

    account = relationship("PaperAccount", back_populates="positions")
    instrument = relationship("Instrument")


class PaperOrder(UuidPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "paper_orders"
    __table_args__ = (
        CheckConstraint("side in ('buy', 'sell')", name=conv("ck_paper_orders_side")),
        CheckConstraint("order_type = 'market'", name=conv("ck_paper_orders_market_only")),
        Index("ix_paper_orders_account_created_at", "account_id", "created_at"),
        Index("ix_paper_orders_status_created_at", "status", "created_at"),
    )

    account_id: Mapped[str] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("paper_accounts.id", ondelete="CASCADE"),
        nullable=False,
    )
    instrument_id: Mapped[str] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("instruments.id", ondelete="RESTRICT"),
        nullable=False,
    )
    strategy_run_id: Mapped[str | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("paper_strategy_runs.id", ondelete="SET NULL"),
        nullable=True,
    )
    side: Mapped[str] = mapped_column(String(8), nullable=False)
    order_type: Mapped[str] = mapped_column(String(16), nullable=False, default="market")
    quantity: Mapped[Decimal] = mapped_column(Numeric(18, 8), nullable=False)
    status: Mapped[str] = mapped_column(String(24), nullable=False)
    requested_price: Mapped[Decimal] = mapped_column(Numeric(18, 6), nullable=False)
    filled_price: Mapped[Decimal | None] = mapped_column(Numeric(18, 6), nullable=True)
    filled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    account = relationship("PaperAccount", back_populates="orders")
    instrument = relationship("Instrument")
    strategy_run = relationship("PaperStrategyRun", back_populates="orders")


class PaperStrategyRun(UuidPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "paper_strategy_runs"
    __table_args__ = (Index("ix_paper_strategy_runs_status_created_at", "status", "created_at"),)

    account_id: Mapped[str] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("paper_accounts.id", ondelete="CASCADE"),
        nullable=False,
    )
    backtest_run_id: Mapped[str] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("backtest_runs.id", ondelete="RESTRICT"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="active")
    max_position_value: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    last_signal: Mapped[str | None] = mapped_column(String(24), nullable=True)

    account = relationship("PaperAccount", back_populates="strategy_runs")
    backtest_run = relationship("BacktestRun")
    orders = relationship("PaperOrder", back_populates="strategy_run")
