from datetime import UTC, datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base


class CasinoSpin(Base):
    __tablename__ = "casino_spins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    game: Mapped[str] = mapped_column(String(16))
    bet: Mapped[float] = mapped_column(Float)
    pick: Mapped[str] = mapped_column(String(16))
    result: Mapped[str] = mapped_column(String(16))
    payout: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), index=True)


class Jackpot(Base):
    __tablename__ = "jackpot"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    mpl: Mapped[float] = mapped_column(Float, default=412_000)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
