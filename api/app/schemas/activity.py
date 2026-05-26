from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ActivityLogIn(BaseModel):
    agent_id: Optional[int] = None
    event_type: str
    description: str
    tokens_used: int = 0
    status_code: Optional[str] = None


class ActivityLogOut(ActivityLogIn):
    id: int
    timestamp: datetime

    model_config = {"from_attributes": True}
