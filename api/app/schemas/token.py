from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class TokenRecordIn(BaseModel):
    agent_id: Optional[int] = None
    input_tokens: int = 0
    output_tokens: int = 0
    model: str
    cost: float = 0.0


class TokenRecordOut(TokenRecordIn):
    id: int
    timestamp: datetime

    model_config = {"from_attributes": True}


class TokenAggregate(BaseModel):
    total_input: int
    total_output: int
    total_tokens: int
    total_cost: float
