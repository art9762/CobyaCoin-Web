from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.security import CurrentUser
from ..db import get_session
from ..models import Order, User
from ..schemas.common import OrderOut
from ..services.game.matching import InsufficientFunds, cancel_order, place_limit_order
from ..services.pubsub import hub

router = APIRouter(prefix="/exchange", tags=["exchange"])


class PlaceOrderIn(BaseModel):
    side: str = Field(pattern="^(buy|sell)$")
    cbc: float = Field(gt=0)
    mpl: float = Field(gt=0)


@router.get("/orders", response_model=list[OrderOut])
async def list_orders(db: Annotated[AsyncSession, Depends(get_session)]):
    orders = (await db.execute(
        select(Order).where(Order.status == "open").order_by(Order.created_at.desc()).limit(30)
    )).scalars().all()
    users = {u.id: u for u in (await db.execute(select(User).where(
        User.id.in_([o.user_id for o in orders]))
    )).scalars().all()} if orders else {}
    return [
        OrderOut(
            id=o.id, user_handle=users[o.user_id].handle if o.user_id in users else "@anon",
            side=o.side, cbc=o.cbc, mpl=o.mpl, price=o.price,
            filled_cbc=o.filled_cbc, status=o.status, created_at=o.created_at,
        )
        for o in orders
    ]


@router.get("/orders/mine", response_model=list[OrderOut])
async def list_my_orders(user: CurrentUser, db: Annotated[AsyncSession, Depends(get_session)]):
    orders = (await db.execute(
        select(Order).where(Order.user_id == user.id).order_by(Order.created_at.desc()).limit(30)
    )).scalars().all()
    return [
        OrderOut(
            id=o.id, user_handle=user.handle, side=o.side,
            cbc=o.cbc, mpl=o.mpl, price=o.price,
            filled_cbc=o.filled_cbc, status=o.status, created_at=o.created_at,
        )
        for o in orders
    ]


@router.post("/orders")
async def place_order(
    body: PlaceOrderIn,
    user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_session)],
):
    try:
        result = await place_limit_order(db, user, body.side, body.cbc, body.mpl)
    except InsufficientFunds as e:
        await db.rollback()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    except ValueError as e:
        await db.rollback()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    await db.commit()
    hub.publish("orderbook", {"type": "orderbook_update"})
    hub.publish("trades", {"type": "new_fills", "count": len(result["fills"])})
    return {"order_id": result["order_id"], "fills": len(result["fills"])}


@router.delete("/orders/{order_id}")
async def delete_order(
    order_id: int,
    user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_session)],
):
    try:
        await cancel_order(db, user, order_id)
    except ValueError as e:
        await db.rollback()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    await db.commit()
    hub.publish("orderbook", {"type": "orderbook_update"})
    return {"status": "cancelled"}
