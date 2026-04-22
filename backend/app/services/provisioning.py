"""User provisioning — ensure a User row exists, with starter balances and farm."""
from __future__ import annotations

import re
import secrets
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..models import (
    Balance,
    DailyBonus,
    FeedEvent,
    MiningFarm,
    Referral,
    User,
)

settings = get_settings()


def _slugify_handle(src: str) -> str:
    base = re.sub(r"[^a-zA-Z0-9_]+", "", (src or "").strip().lower())[:24] or "guest"
    return f"@{base}"


async def _unique_handle(db: AsyncSession, raw: str) -> str:
    candidate = _slugify_handle(raw)
    existing = await db.scalar(select(User).where(User.handle == candidate))
    if not existing:
        return candidate
    # Append numeric suffix until unique.
    for i in range(2, 2000):
        probe = f"{candidate}{i}"
        existing = await db.scalar(select(User).where(User.handle == probe))
        if not existing:
            return probe
    return f"{candidate}{secrets.token_hex(3)}"


async def _unique_referral_code(db: AsyncSession) -> str:
    for _ in range(50):
        code = secrets.token_urlsafe(6).replace("_", "").replace("-", "")[:8].upper()
        existing = await db.scalar(select(User).where(User.referral_code == code))
        if not existing:
            return code
    return secrets.token_hex(6).upper()


async def ensure_user(
    db: AsyncSession,
    *,
    telegram_id: int | None = None,
    google_sub: str | None = None,
    apple_sub: str | None = None,
    handle_hint: str = "",
    display_name: str = "",
    email: str | None = None,
    avatar_url: str = "",
    ref_code: str | None = None,
) -> User:
    query = select(User)
    if telegram_id is not None:
        user = await db.scalar(query.where(User.telegram_id == telegram_id))
        if user:
            return user
    if google_sub:
        user = await db.scalar(query.where(User.google_sub == google_sub))
        if user:
            return user
    if apple_sub:
        user = await db.scalar(query.where(User.apple_sub == apple_sub))
        if user:
            return user
    if email:
        user = await db.scalar(query.where(User.email == email))
        if user:
            # Link the new identity onto existing account.
            if telegram_id is not None and user.telegram_id is None:
                user.telegram_id = telegram_id
            if google_sub and not user.google_sub:
                user.google_sub = google_sub
            if apple_sub and not user.apple_sub:
                user.apple_sub = apple_sub
            await db.flush()
            return user

    handle = await _unique_handle(db, handle_hint or display_name or email or "guest")
    referral_code = await _unique_referral_code(db)
    is_admin = handle.lower() in settings.admin_handle_list

    user = User(
        handle=handle,
        display_name=display_name or handle,
        email=email,
        avatar_url=avatar_url,
        telegram_id=telegram_id,
        google_sub=google_sub,
        apple_sub=apple_sub,
        is_admin=is_admin,
        joined_at=datetime.now(UTC),
        referral_code=referral_code,
    )
    db.add(user)
    await db.flush()

    db.add(Balance(user_id=user.id, cbc=settings.seed_cbc, mpl=settings.seed_mpl))
    db.add(MiningFarm(user_id=user.id))
    db.add(DailyBonus(user_id=user.id, streak=0))
    db.add(FeedEvent(
        user_id=user.id, emoji="🤖",
        text=f"Добро пожаловать в CobyaCoin, {user.handle}! Тебе начислено {int(settings.seed_mpl):,} MPL и {int(settings.seed_cbc)} CBC.".replace(",", " "),
        scope="user",
    ))

    if ref_code:
        inviter = await db.scalar(select(User).where(User.referral_code == ref_code.upper()))
        if inviter and inviter.id != user.id:
            db.add(Referral(inviter_id=inviter.id, invitee_id=user.id, bonus_paid=True))
            inviter_balance = await db.get(Balance, inviter.id)
            if inviter_balance:
                inviter_balance.mpl += 30_000
                inviter_balance.cbc += 90
            user_balance = await db.get(Balance, user.id)
            if user_balance:
                user_balance.mpl += 10_000
            db.add(FeedEvent(
                user_id=inviter.id, emoji="🎫",
                text=f"Реферал {user.handle} присоединился. +30 000 MPL + 90 CBC.",
                scope="user",
            ))

    await db.flush()
    return user
