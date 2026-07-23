from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.db.base import Base
from app.models.common import TimestampMixin, UuidPrimaryKeyMixin


class ResearchRun(UuidPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "research_runs"
    __table_args__ = (
        Index("ix_research_runs_created_at", "created_at"),
        Index("ix_research_runs_status_created_at", "status", "created_at"),
    )

    user_id: Mapped[str | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("dev_users.id", ondelete="SET NULL"),
        nullable=True,
    )
    ai_request_log_id: Mapped[str | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("ai_request_logs.id", ondelete="SET NULL"),
        nullable=True,
    )
    backtest_run_id: Mapped[str | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("backtest_runs.id", ondelete="SET NULL"),
        nullable=True,
    )
    symbol: Mapped[str] = mapped_column(String(32), nullable=False)
    exchange: Mapped[str] = mapped_column(String(12), nullable=False)
    timeframe: Mapped[str] = mapped_column(String(12), nullable=False)
    data_provider: Mapped[str] = mapped_column(String(24), nullable=False, default="fixture")
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="running")
    strategy_proposal: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    user = relationship("DevUser", back_populates="research_runs")
    ai_request_log = relationship("AIRequestLog")
    backtest_run = relationship("BacktestRun")
