from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import TimestampMixin, UuidPrimaryKeyMixin


class DevUser(UuidPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "dev_users"

    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    strategies = relationship("StrategyDefinition", back_populates="user")
    backtest_runs = relationship("BacktestRun", back_populates="user")
    ai_request_logs = relationship("AIRequestLog", back_populates="user")
    research_runs = relationship("ResearchRun", back_populates="user")
