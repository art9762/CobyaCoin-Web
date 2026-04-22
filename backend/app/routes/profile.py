from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.security import CurrentUser
from ..db import get_session
from ..models import (
    Balance,
    DailyBonus,
    FeedEvent,
    PromoCode,
    PromoRedemption,
    Referral,
    User,
)
from ..schemas.common import UserOut

router = APIRouter(prefix="/profile", tags=["profile"])


class PromoIn(BaseModel):
    code: str = Field(min_length=2, max_length=64)


class ProfileUpdateIn(BaseModel):
    display_name: str | None = None


@router.patch("/me", response_model=UserOut)
async def update_me(
    body: ProfileUpdateIn,
    user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_session)],
):
    if body.display_name is not None:
        user.display_name = body.display_name.strip()[:120]
    await db.commit()
    return user


@router.post("/promo")
async def redeem_promo(
    body: PromoIn,
    user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_session)],
):
    code_str = body.code.strip().upper()
    promo = await db.scalar(select(PromoCode).where(func.upper(PromoCode.code) == code_str))
    if not promo or not promo.active:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "код не найден")
    if promo.uses_remaining <= 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "код исчерпан")

    uses = await db.scalar(
        select(func.count()).where(PromoRedemption.code_id == promo.id, PromoRedemption.user_id == user.id)
    )
    if uses >= promo.per_user:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "ты уже активировал этот код")

    db.add(PromoRedemption(code_id=promo.id, user_id=user.id))
    promo.uses_remaining -= 1
    balance = await db.get(Balance, user.id)
    balance.mpl += promo.mpl_bonus
    balance.cbc += promo.cbc_bonus
    db.add(FeedEvent(
        user_id=user.id, emoji="🎫",
        text=f"Промокод {code_str} — +{int(promo.mpl_bonus):,} MPL, +{promo.cbc_bonus:g} CBC.".replace(",", " "),
        scope="user",
    ))
    await db.commit()
    return {"mpl": promo.mpl_bonus, "cbc": promo.cbc_bonus}


@router.get("/daily-bonus")
async def check_daily(user: CurrentUser, db: Annotated[AsyncSession, Depends(get_session)]):
    bonus = await db.get(DailyBonus, user.id)
    if not bonus:
        bonus = DailyBonus(user_id=user.id)
        db.add(bonus)
        await db.commit()
    last = bonus.last_claimed_at
    now = datetime.now(UTC)
    can_claim = True
    next_in = 0
    if last:
        if last.tzinfo is None:
            last = last.replace(tzinfo=UTC)
        delta = now - last
        can_claim = delta >= timedelta(hours=20)
        next_in = max(0, int((timedelta(hours=24) - delta).total_seconds()))
    return {"streak": bonus.streak, "can_claim": can_claim, "next_in_seconds": next_in}


@router.post("/daily-bonus")
async def claim_daily(user: CurrentUser, db: Annotated[AsyncSession, Depends(get_session)]):
    bonus = await db.get(DailyBonus, user.id) or DailyBonus(user_id=user.id)
    if bonus.user_id is None or bonus not in db.new:
        db.add(bonus)
    now = datetime.now(UTC)
    if bonus.last_claimed_at:
        last = bonus.last_claimed_at
        if last.tzinfo is None:
            last = last.replace(tzinfo=UTC)
        if now - last < timedelta(hours=20):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "ещё рано — возвращайся завтра")
        if now - last > timedelta(hours=48):
            bonus.streak = 0
    bonus.streak = min(bonus.streak + 1, 7)
    bonus.last_claimed_at = now
    reward_mpl = 500 * bonus.streak + 1500
    reward_cbc = 1.0 if bonus.streak >= 6 else 0
    balance = await db.get(Balance, user.id)
    balance.mpl += reward_mpl
    balance.cbc += reward_cbc
    db.add(FeedEvent(
        user_id=user.id, emoji="🎁",
        text=f"Ежедневный бонус · стрик {bonus.streak}/7 · +{int(reward_mpl):,} MPL{(' + ' + str(reward_cbc) + ' CBC') if reward_cbc else ''}.".replace(",", " "),
        scope="user",
    ))
    await db.commit()
    return {"streak": bonus.streak, "reward_mpl": reward_mpl, "reward_cbc": reward_cbc}


@router.get("/referrals")
async def referrals(user: CurrentUser, db: Annotated[AsyncSession, Depends(get_session)]):
    count = await db.scalar(
        select(func.count()).where(Referral.inviter_id == user.id)
    )
    invitees = (await db.execute(
        select(User).join(Referral, Referral.invitee_id == User.id)
        .where(Referral.inviter_id == user.id)
        .order_by(Referral.created_at.desc())
        .limit(10)
    )).scalars().all()
    return {
        "code": user.referral_code,
        "count": count or 0,
        "total_bonus_mpl": (count or 0) * 30_000,
        "recent": [{"handle": u.handle, "joined_at": u.joined_at} for u in invitees],
    }
