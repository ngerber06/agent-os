from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ConversationCreate(BaseModel):
    agent_id: Optional[int] = None
    title: str = "New conversation"
    model: Optional[str] = None


class ConversationOut(BaseModel):
    id: int
    agent_id: Optional[int]
    title: str
    model: Optional[str]
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


class ConvMessageOut(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str
    input_tokens: int
    output_tokens: int
    cost: float
    created_at: datetime
    model_config = {"from_attributes": True}
