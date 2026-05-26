"""Agent process orchestrator — polls API for active agents and manages their lifecycle."""
import asyncio
import json
import logging
import os
from typing import Dict

import httpx

from agents import BaseAgentAdapter
from agents.hermes_adapter import HermesAdapter
from agents.codex_adapter import CodexAdapter
from agents.claude_adapter import ClaudeAdapter

logging.basicConfig(level=logging.INFO, format="%(asctime)s [runner] %(message)s")
log = logging.getLogger(__name__)

API_URL = os.getenv("API_URL", "http://localhost:8001")
POLL_INTERVAL = int(os.getenv("RUNNER_POLL_INTERVAL", "10"))

_ADAPTER_MAP = {
    "hermes": HermesAdapter,
    "codex": CodexAdapter,
    "claude": ClaudeAdapter,
}


async def post_activity(client: httpx.AsyncClient, agent_id: int, event_type: str, description: str) -> None:
    try:
        await client.post(
            f"{API_URL}/api/activity/ingest",
            json={"agent_id": agent_id, "event_type": event_type, "description": description},
            timeout=5.0,
        )
    except Exception as exc:
        log.warning("Failed to post activity for agent %d: %s", agent_id, exc)


async def patch_agent_status(client: httpx.AsyncClient, agent_id: int, status: str) -> None:
    """Update the agent's status in the API so the DB reflects the real process state."""
    try:
        await client.patch(
            f"{API_URL}/api/agents/{agent_id}",
            json={"status": status},
            timeout=5.0,
        )
    except Exception as exc:
        log.warning("Failed to patch status for agent %d: %s", agent_id, exc)


async def run_agent(agent: dict, client: httpx.AsyncClient) -> None:
    agent_id = agent["id"]
    agent_type = agent.get("agent_type", "hermes").lower()
    config = {}
    try:
        if agent.get("config_json"):
            config = json.loads(agent["config_json"])
    except Exception:
        pass

    adapter_cls = _ADAPTER_MAP.get(agent_type, HermesAdapter)
    adapter: BaseAgentAdapter = adapter_cls(agent_id, config)

    await post_activity(client, agent_id, "started", f"Agent {agent['name']} starting")
    try:
        await adapter.start()
        async for line in adapter.output_lines():
            await post_activity(client, agent_id, "output", line)
        await post_activity(client, agent_id, "finished", f"Agent {agent['name']} exited cleanly")
        await patch_agent_status(client, agent_id, "idle")
    except asyncio.CancelledError:
        await post_activity(client, agent_id, "stopped", f"Agent {agent['name']} stopped by runner")
        await patch_agent_status(client, agent_id, "idle")
        raise
    except Exception as exc:
        log.error("Agent %d error: %s", agent_id, exc)
        await post_activity(client, agent_id, "error", str(exc))
        await patch_agent_status(client, agent_id, "error")
    finally:
        await adapter.stop()


async def main() -> None:
    log.info("Runner starting — API at %s, polling every %ds", API_URL, POLL_INTERVAL)
    running: Dict[int, asyncio.Task] = {}

    async with httpx.AsyncClient() as client:
        while True:
            try:
                resp = await client.get(f"{API_URL}/api/agents", timeout=5.0)
                resp.raise_for_status()
                agents = resp.json()
            except Exception as exc:
                log.warning("Failed to fetch agents: %s", exc)
                await asyncio.sleep(POLL_INTERVAL)
                continue

            active_ids = set()
            for agent in agents:
                if agent.get("status") == "active":
                    active_ids.add(agent["id"])
                    if agent["id"] not in running or running[agent["id"]].done():
                        task = asyncio.create_task(run_agent(agent, client))
                        running[agent["id"]] = task

            # Cancel tasks for agents that are no longer marked active
            for agent_id in list(running.keys()):
                if agent_id not in active_ids:
                    task = running.pop(agent_id)
                    if not task.done():
                        task.cancel()

            await asyncio.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    asyncio.run(main())
