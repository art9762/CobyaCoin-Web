"""Auction bidding. Bids are in MPL. Funds frozen on the active bidder, released when outbid."""
from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...models import AuctionLot, Balance, Bid, FeedEvent, User

MIN_INCREMENT_MPL = 500


async def place_bid(db: AsyncSession, user: User, lot_id: int, amount: float) -> AuctionLot:
    lot = await db.get(AuctionLot, lot_id)
    if not lot:
        raise ValueError("лот не найден")
    if lot.status != "active":
        raise ValueError("лот не активен")
    now = datetime.now(UTC)
    ends = lot.ends_at
    if ends.tzinfo is None:
        ends = ends.replace(tzinfo=UTC)
    if ends <= now:
        raise ValueError("время лота истекло")
    if lot.current_bidder_id == user.id:
        raise ValueError("ты уже лидер")
    min_bid = lot.current_bid + MIN_INCREMENT_MPL
    if amount < min_bid:
        raise ValueError(f"минимальная ставка {int(min_bid)} MPL")

    balance = await db.get(Balance, user.id)
    if not balance:
        raise ValueError("нет кошелька")
    if balance.mpl < amount:
        raise ValueError("недостаточно MPL")

    # Release previous bidder's freeze.
    if lot.current_bidder_id:
        prev_bal = await db.get(Balance, lot.current_bidder_id)
        if prev_bal:
            prev_bal.frozen_mpl -= lot.current_bid
            prev_bal.mpl += lot.current_bid

    balance.mpl -= amount
    balance.frozen_mpl += amount

    lot.current_bid = amount
    lot.current_bidder_id = user.id
    db.add(Bid(lot_id=lot.id, user_id=user.id, amount=amount))
    db.add(FeedEvent(
        user_id=user.id, emoji="📢",
        text=f"Ставка {int(amount):,} MPL — {lot.title}.".replace(",", " "),
        scope="user",
    ))
    # Anti-snipe: if <2min left, extend by 2min.
    remaining = (ends - now).total_seconds()
    if remaining < 120:
        lot.ends_at = now.replace(microsecond=0) + __import__("datetime").timedelta(seconds=120)

    return lot


async def finalize_due_lots(db: AsyncSession) -> int:
    """Finalize any active lots past their deadline. Return count."""
    now = datetime.now(UTC)
    rows = (await db.execute(select(AuctionLot).where(AuctionLot.status == "active"))).scalars().all()
    count = 0
    for lot in rows:
        ends = lot.ends_at
        if ends.tzinfo is None:
            ends = ends.replace(tzinfo=UTC)
        if ends > now:
            continue
        lot.status = "ended"
        if lot.current_bidder_id:
            winner_bal = await db.get(Balance, lot.current_bidder_id)
            if winner_bal:
                winner_bal.frozen_mpl -= lot.current_bid
            creator_bal = await db.get(Balance, lot.creator_id)
            if creator_bal and lot.current_bidder_id != lot.creator_id:
                creator_bal.mpl += lot.current_bid * 0.9
            db.add(FeedEvent(
                user_id=lot.current_bidder_id, emoji="🏆",
                text=f"Ты выиграл аукцион «{lot.title}» за {int(lot.current_bid):,} MPL.".replace(",", " "),
                scope="user",
            ))
        count += 1
    return count
