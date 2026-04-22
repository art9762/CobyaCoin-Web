from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.security import CurrentUser
from ..db import get_session
from ..models import Balance, FeedEvent, MarketState
from ..schemas.common import FeedEventOut, WalletOut

router = APIRouter(prefix="/wallet", tags=["wallet"])


@router.get("", response_model=WalletOut)
async def get_wallet(user: CurrentUser, db: Annotated[AsyncSession, Depends(get_session)]):
    balance = await db.get(Balance, user.id)
    market = await db.scalar(select(MarketState).where(MarketState.id == 1))
    price = market.price if market else 100
    return WalletOut(
        cbc=balance.cbc,
        mpl=balance.mpl,
        frozen_cbc=balance.frozen_cbc,
        frozen_mpl=balance.frozen_mpl,
        equity_mpl=balance.mpl + balance.frozen_mpl + (balance.cbc + balance.frozen_cbc) * price,
    )


@router.get("/feed", response_model=list[FeedEventOut])
async def wallet_feed(user: CurrentUser, db: Annotated[AsyncSession, Depends(get_session)]):
    from sqlalchemy import or_
    events = (await db.execute(
        select(FeedEvent)
        .where(or_(FeedEvent.user_id == user.id, FeedEvent.scope == "global"))
        .order_by(FeedEvent.created_at.desc())
        .limit(20)
    )).scalars().all()
    return events
