from datetime import datetime
from pydantic import BaseModel


class SystemMetricIn(BaseModel):
    cpu_pct: float
    ram_used_gb: float
    ram_total_gb: float
    disk_used_gb: float
    disk_total_gb: float
    uptime_seconds: int
    connections: int = 0
    region: str = "hermes-vps"


class SystemMetricOut(SystemMetricIn):
    id: int
    timestamp: datetime

    model_config = {"from_attributes": True}
