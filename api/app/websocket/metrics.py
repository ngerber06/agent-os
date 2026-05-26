"""WebSocket endpoint: /ws/metrics — real-time system metrics stream."""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.metric_collector import metric_collector

router = APIRouter()


@router.websocket("/ws/metrics")
async def ws_metrics(websocket: WebSocket):
    await websocket.accept()
    try:
        # relay() sends the latest snapshot immediately then streams updates
        await metric_collector.relay(websocket)
    except WebSocketDisconnect:
        pass
