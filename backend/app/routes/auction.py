from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.security import CurrentUser
from ..db import get_session
from ..models import AuctionLot, User
from ..schemas.common import AuctionLotOut
from ..services.game.auction import place_bid

router = APIRouter(prefix="/auction", tags=["auction"])

RARITIES = {"common", "rare", "legendary", "mythic"}


class CreateLotIn(BaseModel):
    title: str = Field(min_length=2, max_length=64)
    description: str = Field(default="", max_length=500)
    rarity: str = Field(default="rare")
    image_emoji: str = Field(default="🎴", max_length=8)
    start_bid: float = Field(gt=0)
    duration_hours: int = Field(default=24, ge=1, le=168)


class BidIn(BaseModel):
    amount: float = Field(gt=0)


async def _serialize(db: AsyncSession, lots: list[AuctionLot]) -> list[AuctionLotOut]:
    user_ids = {l.creator_id for l in lots}
    user_ids.update(l.current_bidder_id for l in lots if l.current_bidder_id)
    users = {u.id: u for u in (await db.execute(select(User).where(User.id.in_(user_ids)))).scalars().all()}
    return [
        AuctionLotOut(
            id=l.id, title=l.title, description=l.description, rarity=l.rarity,
            image_emoji=l.image_emoji,
            current_bid=l.current_bid, ends_at=l.ends_at, status=l.status,
            is_featured=l.is_featured,
            current_bidder_handle=users[l.current_bidder_id].handle if l.current_bidder_id in users else None,
            creator_handle=users[l.creator_id].handle if l.creator_id in users else "@anon",
        )
        for l in lots
    ]


@router.get("", response_model=list[AuctionLotOut])
async def list_lots(db: Annotated[AsyncSession, Depends(get_session)]):
    lots = (await db.execute(
        select(AuctionLot).where(AuctionLot.status == "active").order_by(AuctionLot.ends_at.asc())
    )).scalars().all()
    return await _serialize(db, list(lots))


@router.post("", response_model=AuctionLotOut)
async def create_lot(
    body: CreateLotIn,
    user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_session)],
):
    if body.rarity not in RARITIES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "rarity must be common|rare|legendary|mythic")
    lot = AuctionLot(
        creator_id=user.id, title=body.title, description=body.description,
        rarity=body.rarity, image_emoji=body.image_emoji,
        start_bid=body.start_bid, current_bid=body.start_bid,
        ends_at=datetime.now(UTC) + timedelta(hours=body.duration_hours),
        status="pending",
    )
    db.add(lot)
    await db.commit()
    return (await _serialize(db, [lot]))[0]


@router.post("/{lot_id}/bid", response_model=AuctionLotOut)
async def bid(
    lot_id: int,
    body: BidIn,
    user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_session)],
):
    try:
        lot = await place_bid(db, user, lot_id, body.amount)
    except ValueError as e:
        await db.rollback()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    await db.commit()
    return (await _serialize(db, [lot]))[0]
