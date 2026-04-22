"""Tiny in-memory pub/sub for broadcasting live events to WebSocket clients."""
from __future__ import annotations

import asyncio
from collections import defaultdict


class Hub:
    def __init__(self) -> None:
        self._subs: dict[str, set[asyncio.Queue]] = defaultdict(set)

    def subscribe(self, topic: str) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=100)
        self._subs[topic].add(q)
        return q

    def unsubscribe(self, topic: str, q: asyncio.Queue) -> None:
        self._subs[topic].discard(q)

    def publish(self, topic: str, message: dict) -> None:
        for q in list(self._subs.get(topic, [])):
            try:
                q.put_nowait(message)
            except asyncio.QueueFull:
                pass


hub = Hub()
