"""Global market ticker. Runs as a background task on the FastAPI app."""
from __future__ import annotations

import asyncio
import logging
import random
from datetime import UTC, datetime

from sqlalchemy import func, select

from ...db import SessionLocal
from ...models import MarketState, MiningFarm, PriceTick
from .auction import finalize_due_lots
from .mining import accrue

log = logging.getLogger("cobya.ticker")


async def _ensure_market():
    async with SessionLocal() as db:
        market = await db.scalar(select(MarketState).where(MarketState.id == 1))
        if not market:
            market = MarketState(id=1)
            db.add(market)
            await db.commit()


async def tick_once():
    async with SessionLocal() as db:
        market = await db.scalar(select(MarketState).where(MarketState.id == 1))
        if not market:
            market = MarketState(id=1)
            db.add(market)
            await db.flush()

        drift = random.uniform(-0.8, 0.85)
        new_price = max(40.0, min(300.0, market.price + drift))

        market.prev_price = market.price
        market.price = new_price
        market.updated_at = datetime.now(UTC)

        # Accrue mining for every farm — simple O(users) scan; fine up to low thousands.
        farms = (await db.execute(select(MiningFarm))).scalars().all()
        for farm in farms:
            await accrue(db, farm)

        # Finalize auctions whose deadline passed.
        await finalize_due_lots(db)

        # Snapshot tick for client history chart (keep recent 240).
        db.add(PriceTick(price=new_price))
        old_cutoff = (await db.execute(
            select(PriceTick).order_by(PriceTick.ts.desc()).offset(240).limit(1)
        )).scalar_one_or_none()
        if old_cutoff:
            await db.execute(
                PriceTick.__table__.delete().where(PriceTick.ts <= old_cutoff.ts)
            )

        await db.commit()


async def run_ticker(stop: asyncio.Event):
    await _ensure_market()
    # Seed an initial history so brand-new installs have a chart.
    async with SessionLocal() as db:
        count = await db.scalar(select(func.count()).select_from(PriceTick))
        if count == 0:
            base = 100.0
            now = datetime.now(UTC)
            for _ in range(120):
                base += random.uniform(-1.4, 1.6)
                base = max(80, min(120, base))
                db.add(PriceTick(price=base, ts=now))
            await db.commit()

    log.info("ticker started")
    while not stop.is_set():
        try:
            await tick_once()
        except Exception:
            log.exception("ticker tick failed")
        try:
            await asyncio.wait_for(stop.wait(), timeout=1.0)
        except TimeoutError:
            pass
    log.info("ticker stopped")
