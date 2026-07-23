from sqlalchemy import ForeignKey, Index, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.db.base import Base
from app.models.common import TimestampMixin, UuidPrimaryKeyMixin


class AIRequestLog(UuidPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "ai_request_logs"
    __table_args__ = (
        Index("ix_ai_request_logs_created_at", "created_at"),
        Index("ix_ai_request_logs_task_created_at", "task", "created_at"),
    )

    user_id: Mapped[str | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("dev_users.id", ondelete="SET NULL"),
        nullable=True,
    )
    task: Mapped[str] = mapped_column(String(64), nullable=False)
    provider: Mapped[str] = mapped_column(String(64), nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    response: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(24), nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    user = relationship("DevUser", back_populates="ai_request_logs")

