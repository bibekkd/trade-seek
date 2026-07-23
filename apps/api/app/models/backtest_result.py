from sqlalchemy import ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.db.base import Base
from app.models.common import TimestampMixin, UuidPrimaryKeyMixin


class BacktestResult(UuidPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "backtest_results"
    __table_args__ = (
        UniqueConstraint("backtest_run_id", name="uq_backtest_results_backtest_run_id"),
    )

    backtest_run_id: Mapped[str] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("backtest_runs.id", ondelete="CASCADE"),
        nullable=False,
    )
    metrics: Mapped[dict] = mapped_column(JSON, nullable=False)
    equity_curve: Mapped[list | None] = mapped_column(JSON, nullable=True)
    trades: Mapped[list | None] = mapped_column(JSON, nullable=True)

    backtest_run = relationship("BacktestRun", back_populates="result")

