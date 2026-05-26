"""Alternative publisher: push metrics over a persistent WebSocket connection.

Useful when HTTP round-trips are too slow or you want bidirectional flow.
Not used by default — set MONITOR_PUBLISHER=ws to enable.
"""
import asyncio
import json
import logging

import websockets

log = logging.getLogger(__name__)


class WsPublisher:
    def __init__(self, ws_url: str):
        self._url = ws_url
        self._ws = None

    async def _ensure_connected(self):
        if self._ws is None or self._ws.closed:
            self._ws = await websockets.connect(self._url)

    async def publish(self, snapshot: dict) -> None:
        try:
            await self._ensure_connected()
            await self._ws.send(json.dumps(snapshot))
        except Exception as exc:
            log.warning("WS publish failed: %s — will reconnect next tick", exc)
            self._ws = None

    async def close(self) -> None:
        if self._ws:
            await self._ws.close()
