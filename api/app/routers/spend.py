"""Top-level spend endpoints (alias of /api/metrics/spend for plan compatibility)."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta, timezone

from app.database import get_db
from app.models.agent import Agent
from app.models.token_record import TokenRecord

router = APIRouter()


@router.get("")
async def spend_summary(
    days: int = Query(default=30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
):
    """MTD and daily spend, grouped by agent."""
    now = datetime.now(timezone.utc)
    mtd_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    since = now - timedelta(days=days)

    async def _totals(after: datetime):
        rows = await db.execute(
            select(
                func.coalesce(func.sum(TokenRecord.cost), 0.0),
                func.coalesce(func.sum(TokenRecord.input_tokens + TokenRecord.output_tokens), 0),
            ).where(TokenRecord.timestamp >= after)
        )
        cost, tokens = rows.one()
        return {"cost": round(float(cost), 6), "tokens": int(tokens)}

    return {
        "today": await _totals(today_start),
        "mtd": await _totals(mtd_start),
        "period_days": days,
        "period": await _totals(since),
    }
