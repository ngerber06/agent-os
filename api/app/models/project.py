from datetime import datetime
from sqlalchemy import String, Integer, Float, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")
    agent_id: Mapped[int] = mapped_column(ForeignKey("agents.id"), nullable=True)
    token_count_mtd: Mapped[int] = mapped_column(Integer, default=0)
    spend_mtd: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
