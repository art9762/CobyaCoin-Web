"""Server-authoritative casino logic (roulette + coinflip)."""
from __future__ import annotations

import secrets
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...models import Balance, CasinoSpin, FeedEvent, Jackpot, User

ROULETTE_POCKETS = ["red", "black", "red", "black", "red", "black",
                    "red", "black", "red", "black", "red", "black", "green"]


@dataclass
class SpinOutcome:
    result: str
    payout: float
    delta_mpl: float
    wheel_angle: float
    jackpot_mpl: float


async def _jackpot(db: AsyncSession) -> Jackpot:
    jp = await db.scalar(select(Jackpot).where(Jackpot.id == 1))
    if not jp:
        jp = Jackpot(id=1, mpl=412_000)
        db.add(jp)
        await db.flush()
    return jp


async def spin_roulette(db: AsyncSession, user: User, bet: float, color: str) -> SpinOutcome:
    if color not in {"red", "black", "green"}:
        raise ValueError("invalid color")
    if bet <= 0:
        raise ValueError("bet must be positive")
    balance = await db.get(Balance, user.id)
    if not balance or balance.mpl < bet:
        raise ValueError("недостаточно MPL")

    # Use secrets for RNG to prevent manipulation on the server.
    pocket_idx = secrets.randbelow(len(ROULETTE_POCKETS))
    result = ROULETTE_POCKETS[pocket_idx]
    won = result == color
    mult = 14 if (won and color == "green") else (2 if won else 0)
    payout = mult * bet
    delta = payout - bet

    balance.mpl += delta

    jp = await _jackpot(db)
    if won:
        jp.mpl = max(50_000, jp.mpl - payout * 0.4)
    else:
        jp.mpl += bet * 0.3

    # Wheel-angle so every client renders the same final rotation.
    rotations = 5 + (secrets.randbelow(300) / 100.0)
    final_angle = rotations * 360 + (pocket_idx / len(ROULETTE_POCKETS)) * 360

    db.add(CasinoSpin(
        user_id=user.id, game="roulette", bet=bet, pick=color,
        result=result, payout=payout,
    ))
    if won:
        db.add(FeedEvent(user_id=user.id, emoji="🎰",
                         text=f"Выигрыш +{payout:,.0f} MPL ({result}).".replace(",", " "), scope="user"))
    else:
        db.add(FeedEvent(user_id=user.id, emoji="❌",
                         text=f"Выпало {result}. Ставка сгорела.", scope="user"))

    return SpinOutcome(
        result=result, payout=payout, delta_mpl=delta,
        wheel_angle=final_angle, jackpot_mpl=jp.mpl,
    )


async def coinflip(db: AsyncSession, user: User, bet: float, pick: str) -> SpinOutcome:
    if pick not in {"heads", "tails"}:
        raise ValueError("invalid pick")
    if bet <= 0:
        raise ValueError("bet must be positive")
    balance = await db.get(Balance, user.id)
    if not balance or balance.mpl < bet:
        raise ValueError("недостаточно MPL")

    side = "heads" if secrets.randbelow(2) == 0 else "tails"
    won = side == pick
    payout = bet * 1.9 if won else 0
    delta = payout - bet
    balance.mpl += delta

    db.add(CasinoSpin(user_id=user.id, game="coinflip", bet=bet, pick=pick, result=side, payout=payout))
    db.add(FeedEvent(
        user_id=user.id, emoji="🪙" if won else "❌",
        text=f"Подкидной: {side} · {'+' if won else '−'}{abs(delta):,.0f} MPL.".replace(",", " "),
        scope="user",
    ))
    jp = await _jackpot(db)
    return SpinOutcome(result=side, payout=payout, delta_mpl=delta, wheel_angle=0.0, jackpot_mpl=jp.mpl)
