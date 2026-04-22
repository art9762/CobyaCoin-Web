"""Mining logic: accrue CBC at `rate * gpus` per second, user collects manually."""
from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from ...models import Balance, FeedEvent, MiningFarm, User

GPU_COST_MPL = 320
GPU_SELL_MPL = 180


def _fmt(v: float) -> str:
    return f"{v:,.0f}".replace(",", " ")


async def accrue(db: AsyncSession, farm: MiningFarm) -> None:
    now = datetime.now(UTC)
    last = farm.last_tick
    if last.tzinfo is None:
        last = last.replace(tzinfo=UTC)
    dt = max(0.0, (now - last).total_seconds())
    dt = min(dt, 86_400)  # cap at 24h — otherwise offline farms would dump.
    farm.pending += farm.rate * farm.gpus * dt
    farm.last_tick = now


async def collect(db: AsyncSession, user: User) -> float:
    farm = await db.get(MiningFarm, user.id)
    if not farm:
        return 0.0
    await accrue(db, farm)
    gained = farm.pending
    if gained < 1e-4:
        return 0.0
    farm.pending = 0.0
    balance = await db.get(Balance, user.id)
    balance.cbc += gained
    db.add(FeedEvent(
        user_id=user.id, emoji="💰",
        text=f"Намайнено +{gained:.2f} CBC собрано.",
        scope="user",
    ))
    return gained


async def buy_gpu(db: AsyncSession, user: User) -> None:
    farm = await db.get(MiningFarm, user.id)
    balance = await db.get(Balance, user.id)
    if not farm or not balance:
        raise ValueError("no farm")
    if farm.gpus >= farm.max_gpus:
        raise ValueError("достигнут максимум — проапгрейди ферму")
    if balance.mpl < GPU_COST_MPL:
        raise ValueError("недостаточно MPL")
    balance.mpl -= GPU_COST_MPL
    farm.gpus += 1
    await accrue(db, farm)
    db.add(FeedEvent(
        user_id=user.id, emoji="⛏",
        text=f"GPU установлен. Ферма: {farm.gpus}/{farm.max_gpus}.",
        scope="user",
    ))


async def sell_gpu(db: AsyncSession, user: User) -> None:
    farm = await db.get(MiningFarm, user.id)
    balance = await db.get(Balance, user.id)
    if not farm or not balance or farm.gpus <= 0:
        raise ValueError("нет GPU")
    balance.mpl += GPU_SELL_MPL
    farm.gpus -= 1
    await accrue(db, farm)


async def upgrade_farm(db: AsyncSession, user: User) -> None:
    farm = await db.get(MiningFarm, user.id)
    balance = await db.get(Balance, user.id)
    if not farm or not balance:
        raise ValueError("no farm")
    cost = farm.level * 1000
    if balance.mpl < cost:
        raise ValueError("недостаточно MPL")
    balance.mpl -= cost
    farm.level += 1
    farm.max_gpus += 10
    farm.rate *= 1.2
    await accrue(db, farm)
    db.add(FeedEvent(
        user_id=user.id, emoji="🛠",
        text=f"Ферма повышена до lvl {farm.level}. Max GPU {farm.max_gpus}.",
        scope="user",
    ))
