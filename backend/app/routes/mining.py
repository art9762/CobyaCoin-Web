from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.security import CurrentUser
from ..db import get_session
from ..models import MiningFarm
from ..schemas.common import MiningOut
from ..services.game.mining import accrue, buy_gpu, collect, sell_gpu, upgrade_farm

router = APIRouter(prefix="/mining", tags=["mining"])


async def _serialize(db: AsyncSession, user_id: int) -> MiningOut:
    farm = await db.get(MiningFarm, user_id)
    hourly = farm.rate * farm.gpus * 3600
    daily = hourly * 24
    return MiningOut(
        level=farm.level, gpus=farm.gpus, max_gpus=farm.max_gpus,
        pending=farm.pending, rate=farm.rate, hourly=hourly, daily=daily,
    )


@router.get("", response_model=MiningOut)
async def get_farm(user: CurrentUser, db: Annotated[AsyncSession, Depends(get_session)]):
    farm = await db.get(MiningFarm, user.id)
    if farm:
        await accrue(db, farm)
        await db.commit()
    return await _serialize(db, user.id)


@router.post("/collect")
async def collect_farm(user: CurrentUser, db: Annotated[AsyncSession, Depends(get_session)]):
    gained = await collect(db, user)
    if gained <= 0:
        await db.rollback()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "нечего собирать")
    await db.commit()
    return {"collected_cbc": round(gained, 4)}


@router.post("/gpus/buy")
async def buy_new_gpu(user: CurrentUser, db: Annotated[AsyncSession, Depends(get_session)]):
    try:
        await buy_gpu(db, user)
    except ValueError as e:
        await db.rollback()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    await db.commit()
    return await _serialize(db, user.id)


@router.post("/gpus/sell")
async def sell_existing_gpu(user: CurrentUser, db: Annotated[AsyncSession, Depends(get_session)]):
    try:
        await sell_gpu(db, user)
    except ValueError as e:
        await db.rollback()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    await db.commit()
    return await _serialize(db, user.id)


@router.post("/upgrade")
async def upgrade(user: CurrentUser, db: Annotated[AsyncSession, Depends(get_session)]):
    try:
        await upgrade_farm(db, user)
    except ValueError as e:
        await db.rollback()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    await db.commit()
    return await _serialize(db, user.id)
