"""Chat proxy — per-agent routing, DB persistence, real token tracking."""
import json
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from app.config import settings
from app.database import get_db, async_session
from app.models.agent import Agent
from app.models.conversation import Conversation, ConvMessage
from app.models.token_record import TokenRecord

log = logging.getLogger(__name__)
router = APIRouter()

# Per-agent default models
_DEFAULT_MODELS = {
    "hermes": "hermes-agent",
    "claude": "anthropic/claude-sonnet-4-6",
    "codex": "openai/gpt-4o",
    "gemini": "google/gemini-2.5-pro",
}

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


def _route(agent_type: str, model: Optional[str]) -> dict:
    resolved = model or _DEFAULT_MODELS.get(agent_type, "anthropic/claude-sonnet-4-6")
    if agent_type == "hermes":
        return {
            "url": f"{settings.hermes_api_url}/v1/chat/completions",
            "model": resolved,
            "key": settings.hermes_api_key,
            "local": True,
        }
    return {
        "url": OPENROUTER_URL,
        "model": resolved,
        "key": settings.openrouter_api_key,
        "local": False,
    }


class ChatRequest(BaseModel):
    agent_type: str = "hermes"
    agent_id: Optional[int] = None
    model: Optional[str] = None
    conversation_id: Optional[int] = None
    content: str


@router.post("/stream")
async def chat_stream(req: ChatRequest, db: AsyncSession = Depends(get_db)):
    route = _route(req.agent_type, req.model)
    is_new_conv = req.conversation_id is None

    # ── 1. Create or load conversation ──────────────────────────────────────
    if is_new_conv:
        conv = Conversation(
            agent_id=req.agent_id,
            title=req.content[:60] + ("…" if len(req.content) > 60 else ""),
            model=route["model"],
        )
        db.add(conv)
        await db.commit()
        await db.refresh(conv)
        conv_id = conv.id
    else:
        conv_id = req.conversation_id

    # ── 2. Load history ──────────────────────────────────────────────────────
    history_rows = await db.execute(
        select(ConvMessage)
        .where(ConvMessage.conversation_id == conv_id)
        .order_by(ConvMessage.created_at)
    )
    history = [{"role": m.role, "content": m.content} for m in history_rows.scalars()]

    # ── 3. Save user message ─────────────────────────────────────────────────
    user_msg = ConvMessage(conversation_id=conv_id, role="user", content=req.content)
    db.add(user_msg)
    # Bump conversation updated_at
    if not is_new_conv:
        conv_obj = await db.get(Conversation, conv_id)
        if conv_obj:
            conv_obj.updated_at = datetime.now(timezone.utc)
    await db.commit()

    # ── 4. Build upstream payload ────────────────────────────────────────────
    messages = [*history, {"role": "user", "content": req.content}]
    payload = {"model": route["model"], "messages": messages, "stream": True}
    headers = {"Authorization": f"Bearer {route['key']}", "Content-Type": "application/json"}
    if not route["local"]:
        headers["HTTP-Referer"] = "https://agents.nathangerber.tech"
        headers["X-Title"] = "Agent OS"

    agent_id = req.agent_id

    # ── 5. Stream ────────────────────────────────────────────────────────────
    async def generate():
        # Emit conversation metadata first so frontend knows the conv_id
        yield f"event: metadata\ndata: {json.dumps({'conversation_id': conv_id})}\n\n"

        accumulated = ""
        input_tokens = 0
        output_tokens = 0
        cost = 0.0
        buf = ""

        try:
            async with httpx.AsyncClient(timeout=180.0) as client:
                async with client.stream("POST", route["url"], json=payload, headers=headers) as resp:
                    async for chunk in resp.aiter_text():
                        yield chunk
                        buf += chunk
                        lines = buf.split("\n")
                        buf = lines.pop()
                        for line in lines:
                            if not line.startswith("data: "):
                                continue
                            data = line[6:].strip()
                            if not data or data == "[DONE]":
                                continue
                            try:
                                p = json.loads(data)
                                delta = ((p.get("choices") or [{}])[0]
                                         .get("delta", {}).get("content", ""))
                                if delta:
                                    accumulated += delta
                                usage = p.get("usage") or {}
                                if usage.get("prompt_tokens"):
                                    input_tokens = usage["prompt_tokens"]
                                    output_tokens = usage.get("completion_tokens", 0)
                                    cost = usage.get("cost", 0.0) or 0.0
                            except Exception:
                                pass
        except Exception as exc:
            log.warning("Upstream error: %s", exc)
            err = json.dumps({"error": str(exc)})
            yield f"event: error\ndata: {err}\n\n"
            return

        # ── 6. Persist assistant reply + tokens ──────────────────────────────
        try:
            async with async_session() as session:
                session.add(ConvMessage(
                    conversation_id=conv_id,
                    role="assistant",
                    content=accumulated,
                    input_tokens=input_tokens,
                    output_tokens=output_tokens,
                    cost=cost,
                ))
                if agent_id:
                    session.add(TokenRecord(
                        agent_id=agent_id,
                        input_tokens=input_tokens,
                        output_tokens=output_tokens,
                        model=route["model"],
                        cost=cost,
                    ))
                await session.commit()
        except Exception as exc:
            log.warning("Failed to persist assistant message: %s", exc)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/models")
async def list_models():
    """Return curated model list grouped by provider."""
    return {
        "hermes": [
            {"id": "hermes-agent", "label": "Hermes Agent", "desc": "Local · Full VPS context"},
        ],
        "claude": [
            {"id": "anthropic/claude-sonnet-4-6", "label": "Claude Sonnet 4.6", "desc": "Fast · Smart · 1M ctx"},
            {"id": "anthropic/claude-opus-4-7", "label": "Claude Opus 4.7", "desc": "Most capable · 1M ctx"},
            {"id": "anthropic/claude-haiku-4-5", "label": "Claude Haiku 4.5", "desc": "Fastest · 200K ctx"},
        ],
        "codex": [
            {"id": "openai/gpt-4o", "label": "GPT-4o", "desc": "OpenAI flagship · 128K ctx"},
            {"id": "openai/o4-mini", "label": "o4-mini", "desc": "Fast reasoning · 200K ctx"},
        ],
        "gemini": [
            {"id": "google/gemini-2.5-pro", "label": "Gemini 2.5 Pro", "desc": "Google flagship · 1M ctx"},
            {"id": "google/gemini-2.5-flash", "label": "Gemini 2.5 Flash", "desc": "Fast · 1M ctx"},
        ],
        "other": [
            {"id": "deepseek/deepseek-r1", "label": "DeepSeek R1", "desc": "Reasoning · 163K ctx"},
            {"id": "deepseek/deepseek-chat-v3.1", "label": "DeepSeek V3.1", "desc": "Fast · 163K ctx"},
            {"id": "meta-llama/llama-3.3-70b-instruct", "label": "Llama 3.3 70B", "desc": "Open · 131K ctx"},
        ],
    }
