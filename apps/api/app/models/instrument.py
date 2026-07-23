from sqlalchemy import Boolean, CheckConstraint, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.schema import conv

from app.db.base import Base
from app.models.common import TimestampMixin, UuidPrimaryKeyMixin


class Instrument(UuidPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "instruments"
    __table_args__ = (
        CheckConstraint("exchange in ('NSE', 'BSE')", name=conv("ck_instruments_exchange")),
        CheckConstraint("currency = 'INR'", name=conv("ck_instruments_currency")),
        UniqueConstraint("exchange", "symbol", name="uq_instruments_exchange_symbol"),
        Index("ix_instruments_exchange_symbol", "exchange", "symbol"),
    )

    symbol: Mapped[str] = mapped_column(String(32), nullable=False)
    exchange: Mapped[str] = mapped_column(String(12), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    isin: Mapped[str | None] = mapped_column(String(12), nullable=True)
    segment: Mapped[str] = mapped_column(String(32), nullable=False, default="equity")
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    candles = relationship("OhlcvCandle", back_populates="instrument")
    backtest_runs = relationship("BacktestRun", back_populates="instrument")
