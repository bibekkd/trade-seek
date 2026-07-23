from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.schema import conv
from sqlalchemy.types import Uuid

from app.db.base import Base
from app.models.common import TimestampMixin, UuidPrimaryKeyMixin


class BacktestRun(UuidPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "backtest_runs"
    __table_args__ = (
        CheckConstraint("end_at > start_at", name=conv("ck_backtest_runs_end_after_start")),
        Index("ix_backtest_runs_created_at", "created_at"),
        Index("ix_backtest_runs_status_created_at", "status", "created_at"),
    )

    user_id: Mapped[str | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("dev_users.id", ondelete="SET NULL"),
        nullable=True,
    )
    strategy_definition_id: Mapped[str] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("strategy_definitions.id", ondelete="RESTRICT"),
        nullable=False,
    )
    instrument_id: Mapped[str] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("instruments.id", ondelete="RESTRICT"),
        nullable=False,
    )
    timeframe: Mapped[str] = mapped_column(String(12), nullable=False)
    data_provider: Mapped[str] = mapped_column(String(24), nullable=False, default="fixture")
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="queued")
    engine: Mapped[str] = mapped_column(String(32), nullable=False, default="vectorbt")
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("DevUser", back_populates="backtest_runs")
    strategy_definition = relationship("StrategyDefinition", back_populates="backtest_runs")
    instrument = relationship("Instrument", back_populates="backtest_runs")
    result = relationship("BacktestResult", back_populates="backtest_run", uselist=False)
