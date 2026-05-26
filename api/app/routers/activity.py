"""Activity log endpoints.

REST CRUD (GET /api/activity) is implemented by Codex.
POST /api/activity/ingest is Claude's internal endpoint used by the runner.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.activity import ActivityLog
from app.schemas.activity import ActivityLogIn, ActivityLogOut
from app.services.activity_stream import activity_stream
from app.utils.pagination import Page, PageParams

router = APIRouter()


@router.get("", response_model=Page[ActivityLogOut])
async def list_activity(params: PageParams = Depends(), db: AsyncSession = Depends(get_db)):
    total = await db.scalar(select(func.count()).select_from(ActivityLog))
    result = await db.execute(
        select(ActivityLog)
        .order_by(desc(ActivityLog.timestamp), desc(ActivityLog.id))
        .offset(params.skip)
        .limit(params.limit)
    )
    return Page(
        items=result.scalars().all(),
        total=total or 0,
        skip=params.skip,
        limit=params.limit,
    )


@router.post("/ingest", response_model=ActivityLogOut, status_code=status.HTTP_201_CREATED)
async def ingest_activity(payload: ActivityLogIn, db: AsyncSession = Depends(get_db)):
    """Receive an activity event from the runner, persist it, and broadcast to WebSocket clients."""
    log = ActivityLog(**payload.model_dump())
    db.add(log)
    await db.commit()
    await db.refresh(log)

    event = ActivityLogOut.model_validate(log).model_dump(mode="json")
    await activity_stream.broadcast(event)
    return log
