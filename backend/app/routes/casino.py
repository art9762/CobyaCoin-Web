from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.security import CurrentUser
from ..db import get_session
from ..models import CasinoSpin, Jackpot, User
from ..schemas.common import CasinoSpinOut, JackpotOut
from ..services.game.casino import coinflip, spin_roulette

router = APIRouter(prefix="/casino", tags=["casino"])


class RouletteIn(BaseModel):
    bet: float = Field(gt=0)
    color: str = Field(pattern="^(red|black|green)$")


class CoinflipIn(BaseModel):
    bet: float = Field(gt=0)
    pick: str = Field(pattern="^(heads|tails)$")


@router.get("/jackpot", response_model=JackpotOut)
async def get_jackpot(db: Annotated[AsyncSession, Depends(get_session)]):
    jp = await db.scalar(select(Jackpot).where(Jackpot.id == 1))
    return JackpotOut(mpl=jp.mpl if jp else 0)


@router.post("/roulette", response_model=CasinoSpinOut)
async def spin(
    body: RouletteIn, user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_session)],
):
    try:
        outcome = await spin_roulette(db, user, body.bet, body.color)
    except ValueError as e:
        await db.rollback()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    await db.commit()
    return CasinoSpinOut(
        id=0, game="roulette", bet=body.bet, pick=body.color,
        result=outcome.result, payout=outcome.payout,
        delta_mpl=outcome.delta_mpl, wheel_angle=outcome.wheel_angle,
    )


@router.post("/coinflip", response_model=CasinoSpinOut)
async def flip(
    body: CoinflipIn, user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_session)],
):
    try:
        outcome = await coinflip(db, user, body.bet, body.pick)
    except ValueError as e:
        await db.rollback()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    await db.commit()
    return CasinoSpinOut(
        id=0, game="coinflip", bet=body.bet, pick=body.pick,
        result=outcome.result, payout=outcome.payout,
        delta_mpl=outcome.delta_mpl,
    )


@router.get("/hall-of-fame")
async def hall_of_fame(db: Annotated[AsyncSession, Depends(get_session)]):
    spins = (await db.execute(
        select(CasinoSpin).where(CasinoSpin.payout > 0)
        .order_by(CasinoSpin.created_at.desc()).limit(10)
    )).scalars().all()
    users = {u.id: u for u in (await db.execute(
        select(User).where(User.id.in_([s.user_id for s in spins]))
    )).scalars().all()} if spins else {}
    return [
        {
            "user": users[s.user_id].handle if s.user_id in users else "@anon",
            "payout": s.payout,
            "game": s.game,
            "created_at": s.created_at,
        } for s in spins
    ]
