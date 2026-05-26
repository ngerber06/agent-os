# Architecture

## Overview

Agent OS uses a microservices architecture with four main services:

```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│   API    │  │  Runner  │  │ Monitor  │  │ Frontend │
│ FastAPI  │  │ Process  │  │ Metrics  │  │  React   │
│ :8001    │  │ Manager  │  │ Collector│  │ :5173    │
└────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
     │              │              │              │
     └──────────────┴──────────────┴──────────────┘
                        │
                   ┌────┴─────┐
                   │PostgreSQL│
                   └──────────┘
```

## Services

### API (FastAPI)
- REST endpoints for agents, projects, activity, metrics, tokens
- WebSocket endpoints for real-time streaming
- JWT + API key authentication
- Pydantic validation + auto-docs

### Runner
- Manages agent process lifecycle (Hermes, Codex, Claude)
- Captures stdout/stderr → activity feed
- Reports agent status (idle, active, error)

### Monitor
- Collects VPS metrics via psutil (CPU/RAM/Disk/Uptime/Connections)
- Publishes to API via HTTP or WebSocket

### Frontend (React SPA)
- Built by Agy from the Agent OS Dashboard design
- WebSocket hooks for live data
- Command palette (⌘K)
- Agent chat interface

## Data Flow

1. **Agent activity**: Runner spawns agent → captures output → sends to API → broadcasts via WebSocket → displayed in frontend activity feed
2. **System metrics**: Monitor polls psutil → pushes to API → stored in DB → streamed via WebSocket → frontend dashboard widgets update
3. **Token tracking**: API records token usage per agent call → aggregated for MTD/24h/daily spend

## Deployment

- **Production**: VPS (hermes-vps) via Docker Compose + Traefik
- **Development**: Local via docker-compose.local.yml (SQLite)
