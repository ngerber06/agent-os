"""Async pub/sub manager for the activity event stream."""
import asyncio
import json
from typing import Dict, Set
from fastapi import WebSocket


class ActivityStreamManager:
    def __init__(self):
        # Global subscribers (for /ws/activity)
        self._global: Set[asyncio.Queue] = set()
        # Per-agent subscribers (for /ws/agent/{id}/logs)
        self._agent: Dict[int, Set[asyncio.Queue]] = {}

    def _subscribe_global(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=256)
        self._global.add(q)
        return q

    def _unsubscribe_global(self, q: asyncio.Queue) -> None:
        self._global.discard(q)

    def _subscribe_agent(self, agent_id: int) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=256)
        self._agent.setdefault(agent_id, set()).add(q)
        return q

    def _unsubscribe_agent(self, agent_id: int, q: asyncio.Queue) -> None:
        if agent_id in self._agent:
            self._agent[agent_id].discard(q)

    async def broadcast(self, event: dict) -> None:
        """Broadcast an event to all global and relevant agent subscribers.

        Always wraps in {"type": "event", "data": {...}} so the frontend
        can distinguish live events from the initial seed message.
        """
        payload = json.dumps({"type": "event", "data": event})
        dead_global: Set[asyncio.Queue] = set()
        for q in list(self._global):
            try:
                q.put_nowait(payload)
            except asyncio.QueueFull:
                dead_global.add(q)
        self._global -= dead_global

        agent_id = event.get("agent_id")
        if agent_id and agent_id in self._agent:
            dead_agent: Set[asyncio.Queue] = set()
            for q in list(self._agent[agent_id]):
                try:
                    q.put_nowait(payload)
                except asyncio.QueueFull:
                    dead_agent.add(q)
            self._agent[agent_id] -= dead_agent

    async def relay_global(self, websocket: WebSocket) -> None:
        """Subscribe to the global stream and relay messages until disconnect."""
        q = self._subscribe_global()
        try:
            while True:
                payload = await q.get()
                await websocket.send_text(payload)
        except Exception:
            pass
        finally:
            self._unsubscribe_global(q)

    async def relay_agent(self, websocket: WebSocket, agent_id: int) -> None:
        """Subscribe to one agent's stream and relay until disconnect."""
        q = self._subscribe_agent(agent_id)
        try:
            while True:
                payload = await q.get()
                await websocket.send_text(payload)
        except Exception:
            pass
        finally:
            self._unsubscribe_agent(agent_id, q)


activity_stream = ActivityStreamManager()
