from datetime import datetime
from sqlalchemy import String, Integer, Float, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    agent_id: Mapped[int] = mapped_column(ForeignKey("agents.id"), nullable=True)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    tokens_used: Mapped[int] = mapped_column(Integer, default=0)
    status_code: Mapped[str] = mapped_column(String(10), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
