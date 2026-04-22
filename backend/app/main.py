import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import UTC, datetime, timedelta

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select

from .config import get_settings
from .db import SessionLocal
from .models import AuctionLot, PromoCode, User
from .routes import (
    admin as admin_routes,
)
from .routes import (
    auction as auction_routes,
)
from .routes import (
    auth as auth_routes,
)
from .routes import (
    casino as casino_routes,
)
from .routes import (
    exchange as exchange_routes,
)
from .routes import (
    leaderboard as leaderboard_routes,
)
from .routes import (
    market as market_routes,
)
from .routes import (
    mining as mining_routes,
)
from .routes import (
    profile as profile_routes,
)
from .routes import (
    wallet as wallet_routes,
)
from .routes import (
    ws as ws_routes,
)
from .services.game.ticker import run_ticker

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
log = logging.getLogger("cobya")

settings = get_settings()


async def _seed_defaults():
    """Insert default promo + starter auction lots so a fresh install feels alive."""
    async with SessionLocal() as db:
        existing = await db.scalar(select(func.count()).select_from(PromoCode))
        if not existing:
            db.add(PromoCode(code="COBYA26", mpl_bonus=settings.promo_cobya26_mpl, cbc_bonus=0, uses_remaining=10_000, per_user=1))
            db.add(PromoCode(code="WELCOME", mpl_bonus=5000, cbc_bonus=0, uses_remaining=10_000, per_user=1))
        lots = await db.scalar(select(func.count()).select_from(AuctionLot))
        if not lots:
            # Need a creator user — bootstrap a "reserve" system account if missing.
            reserve = await db.scalar(select(User).where(User.handle == "@reserve"))
            if not reserve:
                reserve = User(
                    handle="@reserve",
                    display_name="Central Reserve",
                    is_admin=False,
                    referral_code="RESERVE0",
                )
                db.add(reserve)
                await db.flush()
            now = datetime.now(UTC)
            starters = [
                ("Кленовый туз", "legendary", "🏆", 82_000, 4),
                ("Монета №001",   "mythic",    "💠", 144_000, 8),
                ("Медная GPU",    "rare",      "🎴", 9_400,  2),
                ("Стикерпак Кобякоин", "common", "📦", 2_200, 6),
            ]
            for title, rarity, emoji, bid, hours in starters:
                db.add(AuctionLot(
                    creator_id=reserve.id, title=title, rarity=rarity,
                    image_emoji=emoji, start_bid=bid, current_bid=bid,
                    ends_at=now + timedelta(hours=hours),
                    status="active", is_featured=(rarity in {"legendary", "mythic"}),
                ))
        await db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await _seed_defaults()
    stop = asyncio.Event()
    task = asyncio.create_task(run_ticker(stop))
    try:
        yield
    finally:
        stop.set()
        await asyncio.wait_for(task, timeout=3)


app = FastAPI(title="CobyaCoin API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(market_routes.router)
app.include_router(wallet_routes.router)
app.include_router(exchange_routes.router)
app.include_router(mining_routes.router)
app.include_router(auction_routes.router)
app.include_router(casino_routes.router)
app.include_router(leaderboard_routes.router)
app.include_router(profile_routes.router)
app.include_router(admin_routes.router)
app.include_router(ws_routes.router)


@app.get("/healthz")
async def healthz():
    return {"ok": True}
