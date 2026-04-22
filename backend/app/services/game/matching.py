"""Order matching engine.

Simple price-time-priority match against the best counter-side orders,
plus a Reserve (central bank) fallback that always stands ready at the
market price, draining/refilling its own liquidity pool.
"""
from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...models import Balance, FeedEvent, MarketState, Order, Trade, User

RESERVE_SPREAD = 0.01
RESERVE_FEE = 0.10


class InsufficientFunds(Exception):
    pass


async def _reserve_price(db: AsyncSession, side: str) -> float:
    market = await db.scalar(select(MarketState).where(MarketState.id == 1))
    price = market.price if market else 100.0
    # Reserve sells slightly above mid, buys slightly below.
    if side == "buy":
        return price * (1 + RESERVE_SPREAD)
    return price * (1 - RESERVE_SPREAD)


async def place_limit_order(
    db: AsyncSession, user: User, side: str, cbc: float, mpl: float
) -> dict:
    if side not in {"buy", "sell"}:
        raise ValueError("side must be buy|sell")
    if cbc <= 0 or mpl <= 0:
        raise ValueError("amounts must be positive")
    price = mpl / cbc

    balance = await db.get(Balance, user.id)
    if balance is None:
        raise InsufficientFunds("no wallet")

    if side == "buy" and balance.mpl < mpl:
        raise InsufficientFunds("недостаточно MPL")
    if side == "sell" and balance.cbc < cbc:
        raise InsufficientFunds("недостаточно CBC")

    # Freeze funds.
    if side == "buy":
        balance.mpl -= mpl
        balance.frozen_mpl += mpl
    else:
        balance.cbc -= cbc
        balance.frozen_cbc += cbc

    order = Order(user_id=user.id, side=side, cbc=cbc, mpl=mpl, price=price, status="open")
    db.add(order)
    await db.flush()

    fills = await _match(db, order)
    return {"order_id": order.id, "fills": fills}


async def _match(db: AsyncSession, order: Order) -> list[Trade]:
    """Walk the counter-side book, take as much as we can, then clear remainder
    against the Reserve at its posted price."""
    fills: list[Trade] = []
    counter_side = "sell" if order.side == "buy" else "buy"
    # Price-time priority: buys want lowest sells; sells want highest buys.
    price_order = Order.price.asc() if counter_side == "sell" else Order.price.desc()
    stmt = (
        select(Order)
        .where(Order.status == "open", Order.side == counter_side, Order.user_id != order.user_id)
        .order_by(price_order, Order.created_at.asc())
    )
    if order.side == "buy":
        stmt = stmt.where(Order.price <= order.price)
    else:
        stmt = stmt.where(Order.price >= order.price)

    remaining_cbc = order.cbc - order.filled_cbc
    counter_orders = (await db.execute(stmt)).scalars().all()

    for counter in counter_orders:
        if remaining_cbc <= 1e-9:
            break
        counter_remaining = counter.cbc - counter.filled_cbc
        trade_cbc = min(remaining_cbc, counter_remaining)
        trade_price = counter.price  # resting price wins
        trade_mpl = trade_cbc * trade_price

        buyer_id = order.user_id if order.side == "buy" else counter.user_id
        seller_id = order.user_id if order.side == "sell" else counter.user_id

        await _settle(db, buyer_id, seller_id, trade_cbc, trade_mpl, trade_price, "p2p",
                      taker_order=order, maker_order=counter)

        trade = Trade(
            buyer_id=buyer_id, seller_id=seller_id,
            cbc=trade_cbc, mpl=trade_mpl, price=trade_price, counterparty="p2p",
        )
        db.add(trade)
        fills.append(trade)

        order.filled_cbc += trade_cbc
        counter.filled_cbc += trade_cbc
        if counter.cbc - counter.filled_cbc <= 1e-9:
            counter.status = "filled"
        remaining_cbc -= trade_cbc

    # Reserve fallback — fills the rest at the reserve price (inside the order's limit).
    if remaining_cbc > 1e-9:
        market = await db.scalar(select(MarketState).where(MarketState.id == 1))
        reserve_price = await _reserve_price(db, order.side)
        if (order.side == "buy" and reserve_price <= order.price) or (
            order.side == "sell" and reserve_price >= order.price
        ):
            trade_cbc = remaining_cbc
            trade_mpl = trade_cbc * reserve_price
            buyer_id = order.user_id if order.side == "buy" else None
            seller_id = order.user_id if order.side == "sell" else None

            if order.side == "buy":
                # buyer pays MPL from frozen, gets CBC; reserve supplies CBC.
                balance = await db.get(Balance, order.user_id)
                balance.frozen_mpl -= trade_mpl
                balance.cbc += trade_cbc
                if market:
                    market.reserve_liq_cbc = max(0.0, market.reserve_liq_cbc - trade_cbc)
                    market.reserve_liq_mpl += trade_mpl
            else:
                balance = await db.get(Balance, order.user_id)
                balance.frozen_cbc -= trade_cbc
                balance.mpl += trade_mpl * (1 - RESERVE_FEE)
                if market:
                    market.reserve_liq_cbc += trade_cbc
                    market.reserve_liq_mpl = max(0.0, market.reserve_liq_mpl - trade_mpl)

            trade = Trade(
                buyer_id=buyer_id or 0,
                seller_id=seller_id or 0,
                cbc=trade_cbc, mpl=trade_mpl, price=reserve_price, counterparty="reserve",
            )
            db.add(trade)
            fills.append(trade)
            order.filled_cbc += trade_cbc
            remaining_cbc = 0

            # Nudge price toward order direction.
            if market:
                impact = (trade_cbc / 400) * (1 if order.side == "buy" else -1)
                market.prev_price = market.price
                market.price = max(40, min(300, market.price + impact))
                market.updated_at = datetime.now(UTC)

    if order.cbc - order.filled_cbc <= 1e-9:
        order.status = "filled"
        # refund any rounding remainder from frozen — not tracked precisely here.

    # Bump user's trade counter once per order placement that actually filled.
    if fills:
        user = await db.get(User, order.user_id)
        if user:
            user.trades_count += 1
        db.add(FeedEvent(
            user_id=order.user_id, emoji="✅",
            text=f"Ордер {'куплен' if order.side == 'buy' else 'продан'}: {order.filled_cbc:.2f} CBC.",
            scope="user",
        ))

    return fills


async def _settle(
    db: AsyncSession,
    buyer_id: int, seller_id: int,
    cbc: float, mpl: float, price: float, counterparty: str,
    *, taker_order: Order, maker_order: Order,
) -> None:
    buyer_bal = await db.get(Balance, buyer_id)
    seller_bal = await db.get(Balance, seller_id)

    # Buyer: frozen_mpl goes out, cbc comes in.
    buyer_bal.frozen_mpl -= mpl
    buyer_bal.cbc += cbc

    # Seller: frozen_cbc goes out, mpl comes in (minus fee).
    fee = mpl * RESERVE_FEE
    seller_bal.frozen_cbc -= cbc
    seller_bal.mpl += (mpl - fee)


async def cancel_order(db: AsyncSession, user: User, order_id: int) -> None:
    order = await db.get(Order, order_id)
    if not order or order.user_id != user.id:
        raise ValueError("order not found")
    if order.status != "open":
        raise ValueError("already settled")

    balance = await db.get(Balance, user.id)
    remaining_cbc = order.cbc - order.filled_cbc
    if order.side == "buy":
        remaining_mpl = remaining_cbc * order.price
        balance.frozen_mpl -= remaining_mpl
        balance.mpl += remaining_mpl
    else:
        balance.frozen_cbc -= remaining_cbc
        balance.cbc += remaining_cbc

    order.status = "cancelled"
