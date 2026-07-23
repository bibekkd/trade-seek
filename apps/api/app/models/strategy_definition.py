from sqlalchemy import ForeignKey, Index, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.db.base import Base
from app.models.common import TimestampMixin, UuidPrimaryKeyMixin


class StrategyDefinition(UuidPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "strategy_definitions"
    __table_args__ = (Index("ix_strategy_definitions_created_at", "created_at"),)

    user_id: Mapped[str | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("dev_users.id", ondelete="SET NULL"),
        nullable=True,
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    strategy_type: Mapped[str] = mapped_column(String(64), nullable=False)
    parameters: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_by: Mapped[str] = mapped_column(String(24), nullable=False)

    user = relationship("DevUser", back_populates="strategies")
    backtest_runs = relationship("BacktestRun", back_populates="strategy_definition")

