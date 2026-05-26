"""WebSocket endpoint: /ws/activity — real-time activity event stream."""
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.activity import ActivityLog
from app.schemas.activity import ActivityLogOut
from app.services.activity_stream import activity_stream

router = APIRouter()


@router.websocket("/ws/activity")
async def ws_activity(websocket: WebSocket, db: AsyncSession = Depends(get_db)):
    await websocket.accept()
    try:
        # Send last 50 events as seed so the client has history on connect
        result = await db.execute(
            select(ActivityLog).order_by(desc(ActivityLog.timestamp)).limit(50)
        )
        logs = list(reversed(result.scalars().all()))
        seed = [ActivityLogOut.model_validate(log).model_dump(mode="json") for log in logs]
        await websocket.send_text(json.dumps({"type": "seed", "events": seed}))

        # Now relay live broadcasts until disconnect
        await activity_stream.relay_global(websocket)
    except WebSocketDisconnect:
        pass
