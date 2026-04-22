from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..models import MarketState, PriceTick, Trade
from ..schemas.common import MarketOut, TradeOut

router = APIRouter(prefix="/market", tags=["market"])


@router.get("", response_model=MarketOut)
async def get_market(db: Annotated[AsyncSession, Depends(get_session)]):
    market = await db.scalar(select(MarketState).where(MarketState.id == 1))
    ticks = (await db.execute(
        select(PriceTick.price).order_by(PriceTick.ts.asc()).limit(240)
    )).scalars().all()
    if not market:
        return MarketOut(price=100.0, prev_price=100.0, reserve_liq_mpl=0, reserve_liq_cbc=0,
                        circuit=None, day_change_pct=0, ticks=list(ticks))
    first = ticks[0] if ticks else market.price
    day_change = (market.price - first) / first * 100 if first else 0
    return MarketOut(
        price=market.price,
        prev_price=market.prev_price,
        reserve_liq_mpl=market.reserve_liq_mpl,
        reserve_liq_cbc=market.reserve_liq_cbc,
        circuit=market.circuit_dir,
        day_change_pct=day_change,
        ticks=list(ticks),
    )


@router.get("/trades", response_model=list[TradeOut])
async def recent_trades(db: Annotated[AsyncSession, Depends(get_session)]):
    trades = (await db.execute(
        select(Trade).order_by(Trade.created_at.desc()).limit(20)
    )).scalars().all()

    from ..models.user import User
    users = {u.id: u for u in (await db.execute(select(User).where(
        User.id.in_([t.buyer_id for t in trades] + [t.seller_id for t in trades])
    ))).scalars().all()}
    out: list[TradeOut] = []
    for t in trades:
        buyer = users.get(t.buyer_id)
        seller = users.get(t.seller_id)
        out.append(TradeOut(
            id=t.id,
            buyer_handle=buyer.handle if buyer else "@reserve",
            seller_handle=seller.handle if seller else "@reserve",
            cbc=t.cbc, mpl=t.mpl, price=t.price,
            counterparty=t.counterparty,
            created_at=t.created_at,
        ))
    return out
