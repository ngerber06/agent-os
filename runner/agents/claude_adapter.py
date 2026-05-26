"""Claude Code CLI agent subprocess adapter."""
import asyncio
import logging
from typing import AsyncIterator

from agents import BaseAgentAdapter

log = logging.getLogger(__name__)


class ClaudeAdapter(BaseAgentAdapter):
    """Spawns and manages the Claude Code CLI process."""

    def __init__(self, agent_id: int, config: dict):
        super().__init__(agent_id, config)
        self._proc: asyncio.subprocess.Process | None = None

    async def start(self) -> None:
        cmd = self.config.get("command", "claude")
        args = self.config.get("args", [])
        log.info("Starting Claude agent %d: %s %s", self.agent_id, cmd, args)
        self._proc = await asyncio.create_subprocess_exec(
            cmd,
            *args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
        )

    async def stop(self) -> None:
        if self._proc and self._proc.returncode is None:
            self._proc.terminate()
            try:
                await asyncio.wait_for(self._proc.wait(), timeout=5.0)
            except asyncio.TimeoutError:
                self._proc.kill()

    async def is_running(self) -> bool:
        return self._proc is not None and self._proc.returncode is None

    async def output_lines(self) -> AsyncIterator[str]:
        if not self._proc or not self._proc.stdout:
            return
        async for line in self._proc.stdout:
            yield line.decode(errors="replace").rstrip()
