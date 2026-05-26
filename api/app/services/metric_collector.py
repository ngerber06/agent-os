"""Async pub/sub manager for system metrics."""
import asyncio
import json
from typing import Optional, Set
from fastapi import WebSocket


class MetricCollector:
    def __init__(self):
        self._subscribers: Set[asyncio.Queue] = set()
        self._latest: Optional[str] = None

    def _subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=64)
        self._subscribers.add(q)
        return q

    def _unsubscribe(self, q: asyncio.Queue) -> None:
        self._subscribers.discard(q)

    async def ingest(self, metric: dict) -> None:
        """Store latest snapshot and broadcast to all subscribers."""
        payload = json.dumps(metric)
        self._latest = payload
        dead: Set[asyncio.Queue] = set()
        for q in list(self._subscribers):
            try:
                q.put_nowait(payload)
            except asyncio.QueueFull:
                dead.add(q)
        self._subscribers -= dead

    def latest(self) -> Optional[str]:
        return self._latest

    async def relay(self, websocket: WebSocket) -> None:
        """Subscribe and relay metric updates until disconnect."""
        # Send current snapshot immediately so client has data on connect
        if self._latest:
            await websocket.send_text(self._latest)
        q = self._subscribe()
        try:
            while True:
                payload = await q.get()
                await websocket.send_text(payload)
        except Exception:
            pass
        finally:
            self._unsubscribe(q)


metric_collector = MetricCollector()
