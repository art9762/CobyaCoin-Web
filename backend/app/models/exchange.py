from datetime import UTC, datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base


class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (
        Index("ix_orders_status_side_price", "status", "side", "price"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    side: Mapped[str] = mapped_column(String(8))
    cbc: Mapped[float] = mapped_column(Float)
    mpl: Mapped[float] = mapped_column(Float)
    price: Mapped[float] = mapped_column(Float)
    filled_cbc: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(16), default="open", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))


class Trade(Base):
    __tablename__ = "trades"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    buyer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    seller_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    cbc: Mapped[float] = mapped_column(Float)
    mpl: Mapped[float] = mapped_column(Float)
    price: Mapped[float] = mapped_column(Float)
    counterparty: Mapped[str] = mapped_column(String(32), default="p2p")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), index=True)


class MarketState(Base):
    __tablename__ = "market_state"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    price: Mapped[float] = mapped_column(Float, default=104.28)
    prev_price: Mapped[float] = mapped_column(Float, default=104.28)
    reserve_liq_mpl: Mapped[float] = mapped_column(Float, default=412_000)
    reserve_liq_cbc: Mapped[float] = mapped_column(Float, default=2_904)
    circuit_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    circuit_dir: Mapped[str | None] = mapped_column(String(4), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))


class PriceTick(Base):
    __tablename__ = "price_ticks"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    price: Mapped[float] = mapped_column(Float)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), index=True)
