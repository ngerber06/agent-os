"""Base class for agent subprocess adapters."""
from abc import ABC, abstractmethod
from typing import AsyncIterator


class BaseAgentAdapter(ABC):
    """Common interface for all agent adapters."""

    def __init__(self, agent_id: int, config: dict):
        self.agent_id = agent_id
        self.config = config

    @abstractmethod
    async def start(self) -> None:
        """Spawn the agent subprocess."""

    @abstractmethod
    async def stop(self) -> None:
        """Terminate the agent subprocess gracefully."""

    @abstractmethod
    async def is_running(self) -> bool:
        """Return True if the subprocess is alive."""

    @abstractmethod
    async def output_lines(self) -> AsyncIterator[str]:
        """Async generator that yields stdout/stderr lines as they arrive."""
