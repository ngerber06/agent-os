"""Stub: agent process state tracking (filled in by runner integration)."""
from typing import Dict


class AgentProcessState:
    """In-memory map of agent_id → process status reported by the runner."""

    def __init__(self):
        self._states: Dict[int, str] = {}

    def set_status(self, agent_id: int, status: str) -> None:
        self._states[agent_id] = status

    def get_status(self, agent_id: int) -> str:
        return self._states.get(agent_id, "unknown")

    def all_statuses(self) -> Dict[int, str]:
        return dict(self._states)


agent_process_state = AgentProcessState()
