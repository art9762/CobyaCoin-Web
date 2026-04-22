from datetime import UTC, datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base


class MiningFarm(Base):
    __tablename__ = "mining_farms"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    level: Mapped[int] = mapped_column(Integer, default=1)
    gpus: Mapped[int] = mapped_column(Integer, default=2)
    max_gpus: Mapped[int] = mapped_column(Integer, default=10)
    pending: Mapped[float] = mapped_column(Float, default=0.0)
    rate: Mapped[float] = mapped_column(Float, default=0.0032)
    last_tick: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
