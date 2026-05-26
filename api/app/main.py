"""Agent OS — FastAPI application entry point."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.routers import agents, activity, metrics, tokens, projects, brain, auth, spend, chat
from app.websocket import activity as ws_activity, metrics as ws_metrics, agent_logs as ws_logs


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables on startup (dev only; use Alembic in prod)."""
    if settings.environment == "development":
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="Agent OS API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(agents.router, prefix="/api/agents", tags=["agents"])
app.include_router(activity.router, prefix="/api/activity", tags=["activity"])
app.include_router(metrics.router, prefix="/api/metrics", tags=["metrics"])
app.include_router(tokens.router, prefix="/api/tokens", tags=["tokens"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(brain.router, prefix="/api/brain", tags=["brain"])
app.include_router(spend.router, prefix="/api/spend", tags=["spend"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])

# WebSocket endpoints
app.include_router(ws_activity.router)
app.include_router(ws_metrics.router)
app.include_router(ws_logs.router)


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
