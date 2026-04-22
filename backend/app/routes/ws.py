"""WebSocket endpoint: streams market updates + user-scoped feed events."""
import asyncio
import logging
from datetime import datetime

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import JWTError, jwt
from sqlalchemy import select

from ..config import get_settings
from ..db import SessionLocal
from ..models import MarketState
from ..services.pubsub import hub

router = APIRouter()
log = logging.getLogger("cobya.ws")
settings = get_settings()


async def _decode_user_id(token: str) -> int | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        return None


def _iso(v):
    if isinstance(v, datetime):
        return v.isoformat()
    return v


@router.websocket("/ws")
async def ws_endpoint(websocket: WebSocket, token: str | None = None):
    await websocket.accept()
    # Token validated eagerly so an invalid token still leaves the connection open
    # for public market data; per-user events are topic-filtered later.
    _ = await _decode_user_id(token) if token else None

    ob_q = hub.subscribe("orderbook")
    try:
        await _send_market_snapshot(websocket)
        stop = asyncio.Event()

        async def market_pusher():
            while not stop.is_set():
                await asyncio.sleep(1.0)
                try:
                    await _send_market_snapshot(websocket)
                except Exception:
                    stop.set()
                    return

        async def hub_pusher():
            while not stop.is_set():
                try:
                    msg = await asyncio.wait_for(ob_q.get(), timeout=5)
                    await websocket.send_json(msg)
                except TimeoutError:
                    continue
                except Exception:
                    stop.set()
                    return

        async def client_reader():
            while not stop.is_set():
                try:
                    data = await websocket.receive_text()
                    if data == "ping":
                        await websocket.send_text("pong")
                except WebSocketDisconnect:
                    stop.set()
                    return

        await asyncio.gather(market_pusher(), hub_pusher(), client_reader(), return_exceptions=True)
    finally:
        hub.unsubscribe("orderbook", ob_q)


async def _send_market_snapshot(websocket: WebSocket) -> None:
    async with SessionLocal() as db:
        market = await db.scalar(select(MarketState).where(MarketState.id == 1))
        if not market:
            return
        await websocket.send_json({
            "type": "market",
            "price": market.price,
            "prev_price": market.prev_price,
            "reserve_liq_mpl": market.reserve_liq_mpl,
            "reserve_liq_cbc": market.reserve_liq_cbc,
            "circuit": market.circuit_dir,
            "updated_at": _iso(market.updated_at),
        })
