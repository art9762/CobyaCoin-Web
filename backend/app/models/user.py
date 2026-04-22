from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    handle: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(128), default="")
    avatar_url: Mapped[str] = mapped_column(String(512), default="")
    email: Mapped[str | None] = mapped_column(String(256), nullable=True, index=True)

    telegram_id: Mapped[int | None] = mapped_column(Integer, nullable=True, unique=True, index=True)
    google_sub: Mapped[str | None] = mapped_column(String(128), nullable=True, unique=True, index=True)
    apple_sub: Mapped[str | None] = mapped_column(String(128), nullable=True, unique=True, index=True)

    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    is_banned: Mapped[bool] = mapped_column(Boolean, default=False)
    ban_reason: Mapped[str] = mapped_column(String(256), default="")

    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    trades_count: Mapped[int] = mapped_column(Integer, default=0)

    referral_code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
