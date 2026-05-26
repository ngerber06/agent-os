from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class AgentCreate(BaseModel):
    name: str
    initials: str
    model: str
    agent_type: str
    color: Optional[str] = None
    system_prompt: Optional[str] = None
    config_json: Optional[str] = None


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    model: Optional[str] = None
    status: Optional[str] = None
    color: Optional[str] = None
    system_prompt: Optional[str] = None
    config_json: Optional[str] = None
    context_window_pct: Optional[float] = None


class AgentOut(AgentCreate):
    id: int
    status: str
    context_window_pct: float
    conv_count: int
    last_active_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}
