"""Metrics endpoints.

REST read endpoints (GET /api/metrics/*) are implemented by Codex.
POST /api/metrics/ingest is Claude's internal endpoint used by the monitor.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.metric import SystemMetric
from app.models.token_record import TokenRecord
from app.schemas.metric import SystemMetricIn, SystemMetricOut
from app.schemas.token import TokenAggregate
from app.services.metric_collector import metric_collector
from app.utils.pagination import Page, PageParams

router = APIRouter()


@router.get("/system", response_model=Page[SystemMetricOut])
async def list_system_metrics(params: PageParams = Depends(), db: AsyncSession = Depends(get_db)):
    total = await db.scalar(select(func.count()).select_from(SystemMetric))
    result = await db.execute(
        select(SystemMetric)
        .order_by(desc(SystemMetric.timestamp), desc(SystemMetric.id))
        .offset(params.skip)
        .limit(params.limit)
    )
    return Page(
        items=result.scalars().all(),
        total=total or 0,
        skip=params.skip,
        limit=params.limit,
    )


@router.get("/summary")
async def metrics_summary(db: AsyncSession = Depends(get_db)):
    latest_metric = await db.scalar(
        select(SystemMetric).order_by(desc(SystemMetric.timestamp), desc(SystemMetric.id)).limit(1)
    )
    totals = await db.execute(
        select(
            func.coalesce(func.sum(TokenRecord.input_tokens), 0),
            func.coalesce(func.sum(TokenRecord.output_tokens), 0),
            func.coalesce(func.sum(TokenRecord.cost), 0.0),
        )
    )
    total_input, total_output, total_cost = totals.one()
    token_usage = TokenAggregate(
        total_input=total_input,
        total_output=total_output,
        total_tokens=total_input + total_output,
        total_cost=total_cost,
    )
    return {
        "latest_system": (
            SystemMetricOut.model_validate(latest_metric).model_dump(mode="json")
            if latest_metric
            else None
        ),
        "tokens": token_usage.model_dump(),
    }


@router.post("/ingest", response_model=SystemMetricOut, status_code=status.HTTP_201_CREATED)
async def ingest_metric(payload: SystemMetricIn, db: AsyncSession = Depends(get_db)):
    """Receive a metrics snapshot from the monitor, persist it, and broadcast to WebSocket clients."""
    metric = SystemMetric(**payload.model_dump())
    db.add(metric)
    await db.commit()
    await db.refresh(metric)

    snapshot = SystemMetricOut.model_validate(metric).model_dump(mode="json")
    await metric_collector.ingest(snapshot)
    return metric
