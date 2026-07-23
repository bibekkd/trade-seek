from datetime import datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.schema import conv
from sqlalchemy.types import Uuid

from app.db.base import Base
from app.models.common import TimestampMixin, UuidPrimaryKeyMixin


class OhlcvCandle(UuidPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "ohlcv_candles"
    __table_args__ = (
        CheckConstraint("high >= low", name=conv("ck_ohlcv_high_gte_low")),
        CheckConstraint(
            "open >= 0 and high >= 0 and low >= 0 and close >= 0 and volume >= 0",
            name=conv("ck_ohlcv_non_negative"),
        ),
        UniqueConstraint(
            "instrument_id",
            "timeframe",
            "timestamp",
            name="uq_ohlcv_instrument_timeframe_timestamp",
        ),
        Index("ix_ohlcv_instrument_timeframe_timestamp", "instrument_id", "timeframe", "timestamp"),
        Index("ix_ohlcv_timestamp", "timestamp"),
    )

    instrument_id: Mapped[str] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("instruments.id", ondelete="CASCADE"),
        nullable=False,
    )
    timeframe: Mapped[str] = mapped_column(String(12), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    open: Mapped[Decimal] = mapped_column(Numeric(18, 6), nullable=False)
    high: Mapped[Decimal] = mapped_column(Numeric(18, 6), nullable=False)
    low: Mapped[Decimal] = mapped_column(Numeric(18, 6), nullable=False)
    close: Mapped[Decimal] = mapped_column(Numeric(18, 6), nullable=False)
    volume: Mapped[Decimal] = mapped_column(Numeric(20, 4), nullable=False)
    source: Mapped[str] = mapped_column(String(64), nullable=False)

    instrument = relationship("Instrument", back_populates="candles")
