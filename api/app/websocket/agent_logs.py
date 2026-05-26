"""WebSocket endpoint: /ws/agent/{agent_id}/logs — tail logs for one agent."""
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.activity import ActivityLog
from app.schemas.activity import ActivityLogOut
from app.services.activity_stream import activity_stream

router = APIRouter()


@router.websocket("/ws/agent/{agent_id}/logs")
async def ws_agent_logs(agent_id: int, websocket: WebSocket, db: AsyncSession = Depends(get_db)):
    await websocket.accept()
    try:
        # Seed with last 100 log lines for this agent
        result = await db.execute(
            select(ActivityLog)
            .where(ActivityLog.agent_id == agent_id)
            .order_by(desc(ActivityLog.timestamp))
            .limit(100)
        )
        logs = list(reversed(result.scalars().all()))
        seed = [ActivityLogOut.model_validate(log).model_dump(mode="json") for log in logs]
        await websocket.send_text(json.dumps({"type": "seed", "agent_id": agent_id, "events": seed}))

        # Relay live events for this specific agent
        await activity_stream.relay_agent(websocket, agent_id)
    except WebSocketDisconnect:
        pass
