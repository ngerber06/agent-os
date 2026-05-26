"""Metrics endpoints.

REST read endpoints (GET /api/metrics/*) are implemented by Codex.
POST /api/metrics/ingest is Claude's internal endpoint used by the monitor.
"""
from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.agent import Agent
from app.models.metric import SystemMetric
from app.models.token_record import TokenRecord
from app.schemas.metric import SystemMetricIn, SystemMetricOut
from app.schemas.token import TokenAggregate, TokenRecordOut
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


@router.get("/tokens", response_model=Page[TokenRecordOut])
async def token_timeseries(
    params: PageParams = Depends(),
    agent_id: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    """Token usage timeseries, optionally filtered by agent."""
    q = select(TokenRecord).order_by(desc(TokenRecord.timestamp), desc(TokenRecord.id))
    count_q = select(func.count()).select_from(TokenRecord)
    if agent_id is not None:
        q = q.where(TokenRecord.agent_id == agent_id)
        count_q = count_q.where(TokenRecord.agent_id == agent_id)
    total = await db.scalar(count_q)
    result = await db.execute(q.offset(params.skip).limit(params.limit))
    return Page(items=result.scalars().all(), total=total or 0, skip=params.skip, limit=params.limit)


@router.get("/spend")
async def spend_breakdown(
    days: int = Query(default=30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
):
    """Spend breakdown by agent over the last N days."""
    since = datetime.now(timezone.utc) - timedelta(days=days)
    rows = await db.execute(
        select(
            TokenRecord.agent_id,
            Agent.name.label("agent_name"),
            func.coalesce(func.sum(TokenRecord.input_tokens), 0).label("input_tokens"),
            func.coalesce(func.sum(TokenRecord.output_tokens), 0).label("output_tokens"),
            func.coalesce(func.sum(TokenRecord.cost), 0.0).label("total_cost"),
        )
        .join(Agent, Agent.id == TokenRecord.agent_id, isouter=True)
        .where(TokenRecord.timestamp >= since)
        .group_by(TokenRecord.agent_id, Agent.name)
        .order_by(desc("total_cost"))
    )
    agents_spend = [
        {
            "agent_id": row.agent_id,
            "agent_name": row.agent_name or "unknown",
            "input_tokens": row.input_tokens,
            "output_tokens": row.output_tokens,
            "total_tokens": row.input_tokens + row.output_tokens,
            "total_cost": round(row.total_cost, 6),
        }
        for row in rows
    ]
    return {
        "days": days,
        "since": since.isoformat(),
        "agents": agents_spend,
        "total_cost": round(sum(a["total_cost"] for a in agents_spend), 6),
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
