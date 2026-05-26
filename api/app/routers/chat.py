"""Chat proxy — streams Hermes (and other agent) responses via SSE."""
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
import httpx

from app.config import settings

router = APIRouter()


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    agent: str = "hermes"
    messages: List[ChatMessage]


@router.post("/stream")
async def chat_stream(req: ChatRequest):
    """Proxy chat messages to the Hermes gateway and stream SSE back to the browser."""
    url = f"{settings.hermes_api_url}/v1/chat/completions"
    payload = {
        "model": "hermes-agent",
        "messages": [{"role": m.role, "content": m.content} for m in req.messages],
        "stream": True,
    }
    headers = {
        "Authorization": f"Bearer {settings.hermes_api_key}",
        "Content-Type": "application/json",
    }

    async def generate():
        async with httpx.AsyncClient(timeout=180.0) as client:
            async with client.stream("POST", url, json=payload, headers=headers) as resp:
                async for chunk in resp.aiter_text():
                    yield chunk

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
