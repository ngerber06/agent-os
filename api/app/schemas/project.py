from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    agent_id: Optional[int] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    agent_id: Optional[int] = None


class ProjectOut(ProjectCreate):
    id: int
    status: str
    token_count_mtd: int
    spend_mtd: float
    created_at: datetime

    model_config = {"from_attributes": True}
