from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.security import AdminUser
from ..db import get_session
from ..models import (
    AuctionLot,
    Balance,
    FeedEvent,
    Jackpot,
    PromoCode,
    User,
)

router = APIRouter(prefix="/admin", tags=["admin"])


class UserAdminOut(BaseModel):
    id: int
    handle: str
    display_name: str
    email: str | None
    is_admin: bool
    is_banned: bool
    ban_reason: str
    trades_count: int
    cbc: float
    mpl: float
    joined_at: datetime


class BanIn(BaseModel):
    is_banned: bool
    reason: str = ""


class GrantIn(BaseModel):
    mpl: float = 0
    cbc: float = 0
    reason: str = "admin grant"


class PromoCreateIn(BaseModel):
    code: str = Field(min_length=2, max_length=64)
    mpl_bonus: float = 0
    cbc_bonus: float = 0
    uses: int = Field(ge=1, default=100)
    per_user: int = Field(ge=1, default=1)


class JackpotIn(BaseModel):
    mpl: float = Field(ge=0)


class LotModerateIn(BaseModel):
    status: str = Field(pattern="^(active|rejected|ended)$")
    featured: bool | None = None


@router.get("/users", response_model=list[UserAdminOut])
async def list_users(
    admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_session)],
    q: str = "",
):
    stmt = select(User, Balance).join(Balance, Balance.user_id == User.id)
    if q:
        stmt = stmt.where(User.handle.ilike(f"%{q}%"))
    rows = (await db.execute(stmt.order_by(User.joined_at.desc()).limit(200))).all()
    return [
        UserAdminOut(
            id=u.id, handle=u.handle, display_name=u.display_name,
            email=u.email, is_admin=u.is_admin, is_banned=u.is_banned,
            ban_reason=u.ban_reason, trades_count=u.trades_count,
            cbc=b.cbc + b.frozen_cbc, mpl=b.mpl + b.frozen_mpl,
            joined_at=u.joined_at,
        )
        for u, b in rows
    ]


@router.post("/users/{user_id}/ban")
async def ban_user(
    user_id: int, body: BanIn,
    admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_session)],
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "not found")
    user.is_banned = body.is_banned
    user.ban_reason = body.reason[:200] if body.is_banned else ""
    await db.commit()
    return {"handle": user.handle, "is_banned": user.is_banned}


@router.post("/users/{user_id}/grant")
async def grant_balance(
    user_id: int, body: GrantIn,
    admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_session)],
):
    balance = await db.get(Balance, user_id)
    if not balance:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "no wallet")
    balance.mpl += body.mpl
    balance.cbc += body.cbc
    db.add(FeedEvent(
        user_id=user_id, emoji="🎁",
        text=f"Admin grant: +{int(body.mpl):,} MPL, +{body.cbc:g} CBC. {body.reason}".replace(",", " "),
        scope="user",
    ))
    await db.commit()
    return {"mpl": balance.mpl, "cbc": balance.cbc}


@router.get("/promo")
async def list_promos(admin: AdminUser, db: Annotated[AsyncSession, Depends(get_session)]):
    rows = (await db.execute(select(PromoCode).order_by(PromoCode.created_at.desc()).limit(200))).scalars().all()
    return [
        {
            "id": p.id, "code": p.code, "mpl_bonus": p.mpl_bonus, "cbc_bonus": p.cbc_bonus,
            "uses_remaining": p.uses_remaining, "per_user": p.per_user, "active": p.active,
        }
        for p in rows
    ]


@router.post("/promo")
async def create_promo(
    body: PromoCreateIn,
    admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_session)],
):
    code = body.code.strip().upper()
    existing = await db.scalar(select(PromoCode).where(func.upper(PromoCode.code) == code))
    if existing:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "code already exists")
    p = PromoCode(
        code=code, mpl_bonus=body.mpl_bonus, cbc_bonus=body.cbc_bonus,
        uses_remaining=body.uses, per_user=body.per_user, active=True,
    )
    db.add(p)
    await db.commit()
    return {"id": p.id, "code": p.code}


@router.delete("/promo/{promo_id}")
async def disable_promo(
    promo_id: int,
    admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_session)],
):
    promo = await db.get(PromoCode, promo_id)
    if not promo:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "not found")
    promo.active = False
    await db.commit()
    return {"ok": True}


@router.post("/jackpot")
async def set_jackpot(
    body: JackpotIn,
    admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_session)],
):
    jp = await db.scalar(select(Jackpot).where(Jackpot.id == 1))
    if not jp:
        jp = Jackpot(id=1, mpl=body.mpl)
        db.add(jp)
    else:
        jp.mpl = body.mpl
    jp.updated_at = datetime.now(UTC)
    await db.commit()
    return {"mpl": jp.mpl}


@router.get("/lots")
async def list_lots(admin: AdminUser, db: Annotated[AsyncSession, Depends(get_session)]):
    rows = (await db.execute(select(AuctionLot).order_by(AuctionLot.created_at.desc()).limit(200))).scalars().all()
    return [
        {
            "id": l.id, "title": l.title, "rarity": l.rarity, "status": l.status,
            "is_featured": l.is_featured, "current_bid": l.current_bid,
            "ends_at": l.ends_at, "creator_id": l.creator_id,
        }
        for l in rows
    ]


@router.patch("/lots/{lot_id}")
async def moderate_lot(
    lot_id: int, body: LotModerateIn,
    admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_session)],
):
    lot = await db.get(AuctionLot, lot_id)
    if not lot:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "not found")
    lot.status = body.status
    if body.featured is not None:
        lot.is_featured = body.featured
    await db.commit()
    return {"status": lot.status, "featured": lot.is_featured}


@router.get("/stats")
async def platform_stats(admin: AdminUser, db: Annotated[AsyncSession, Depends(get_session)]):
    from ..models import CasinoSpin, Order, Trade
    users_count = await db.scalar(select(func.count()).select_from(User))
    active_orders = await db.scalar(select(func.count()).select_from(Order).where(Order.status == "open"))
    trades_count = await db.scalar(select(func.count()).select_from(Trade))
    casino_count = await db.scalar(select(func.count()).select_from(CasinoSpin))
    cbc_total = await db.scalar(select(func.coalesce(func.sum(Balance.cbc + Balance.frozen_cbc), 0)))
    mpl_total = await db.scalar(select(func.coalesce(func.sum(Balance.mpl + Balance.frozen_mpl), 0)))
    return {
        "users": users_count or 0,
        "active_orders": active_orders or 0,
        "trades": trades_count or 0,
        "casino_spins": casino_count or 0,
        "supply_cbc": cbc_total or 0,
        "supply_mpl": mpl_total or 0,
    }
