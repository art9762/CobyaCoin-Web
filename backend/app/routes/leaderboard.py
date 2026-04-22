from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..models import Balance, MarketState, User
from ..schemas.common import LeaderboardEntry

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("", response_model=list[LeaderboardEntry])
async def leaderboard(
    by: str = Query(default="cbc", pattern="^(cbc|mpl|equity|trades)$"),
    limit: int = Query(default=50, le=200),
    db: Annotated[AsyncSession, Depends(get_session)] = None,
):
    market = await db.scalar(select(MarketState).where(MarketState.id == 1))
    price = market.price if market else 100

    rows = (await db.execute(
        select(User, Balance)
        .join(Balance, Balance.user_id == User.id)
        .where(User.is_banned.is_(False))
    )).all()

    items = []
    for user, balance in rows:
        cbc_total = balance.cbc + balance.frozen_cbc
        mpl_total = balance.mpl + balance.frozen_mpl
        equity = mpl_total + cbc_total * price
        items.append({
            "user_id": user.id, "handle": user.handle, "display_name": user.display_name or user.handle,
            "cbc": cbc_total, "mpl": mpl_total, "equity": equity, "trades": user.trades_count,
        })

    key_map = {"cbc": "cbc", "mpl": "mpl", "equity": "equity", "trades": "trades"}
    items.sort(key=lambda x: x[key_map[by]], reverse=True)
    items = items[:limit]

    return [
        LeaderboardEntry(
            rank=i + 1, user_id=it["user_id"], handle=it["handle"],
            display_name=it["display_name"],
            cbc=it["cbc"], mpl=it["mpl"], trades=it["trades"],
        )
        for i, it in enumerate(items)
    ]
