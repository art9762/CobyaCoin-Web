from datetime import datetime

from pydantic import BaseModel, ConfigDict


class OrmModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(OrmModel):
    id: int
    handle: str
    display_name: str
    avatar_url: str
    email: str | None
    is_admin: bool
    is_banned: bool
    joined_at: datetime
    trades_count: int
    referral_code: str


class WalletOut(BaseModel):
    cbc: float
    mpl: float
    frozen_cbc: float
    frozen_mpl: float
    equity_mpl: float


class MarketOut(BaseModel):
    price: float
    prev_price: float
    reserve_liq_mpl: float
    reserve_liq_cbc: float
    circuit: str | None
    day_change_pct: float
    ticks: list[float]


class MiningOut(BaseModel):
    level: int
    gpus: int
    max_gpus: int
    pending: float
    rate: float
    hourly: float
    daily: float


class OrderOut(OrmModel):
    id: int
    user_handle: str
    side: str
    cbc: float
    mpl: float
    price: float
    filled_cbc: float
    status: str
    created_at: datetime


class TradeOut(BaseModel):
    id: int
    buyer_handle: str
    seller_handle: str
    cbc: float
    mpl: float
    price: float
    counterparty: str
    created_at: datetime


class FeedEventOut(OrmModel):
    id: int
    emoji: str
    text: str
    scope: str
    created_at: datetime


class AuctionLotOut(BaseModel):
    id: int
    title: str
    description: str
    rarity: str
    image_emoji: str
    current_bid: float
    current_bidder_handle: str | None
    ends_at: datetime
    status: str
    is_featured: bool
    creator_handle: str


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    handle: str
    display_name: str
    cbc: float
    mpl: float
    trades: int


class JackpotOut(BaseModel):
    mpl: float


class CasinoSpinOut(BaseModel):
    id: int
    game: str
    bet: float
    pick: str
    result: str
    payout: float
    delta_mpl: float
    wheel_angle: float | None = None
