from datetime import datetime
from sqlalchemy import String, Float, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class SystemMetric(Base):
    __tablename__ = "system_metrics"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    cpu_pct: Mapped[float] = mapped_column(Float)
    ram_used_gb: Mapped[float] = mapped_column(Float)
    ram_total_gb: Mapped[float] = mapped_column(Float)
    disk_used_gb: Mapped[float] = mapped_column(Float)
    disk_total_gb: Mapped[float] = mapped_column(Float)
    uptime_seconds: Mapped[int] = mapped_column(Integer)
    connections: Mapped[int] = mapped_column(Integer, default=0)
    region: Mapped[str] = mapped_column(String(50), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
