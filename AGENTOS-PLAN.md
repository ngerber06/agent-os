# Agent OS — Infrastructure & Deployment Plan

> **Version:** 1.0.0
> **Status:** Draft / Ready for Implementation

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  Browser (Dashboard UI)              │
│  React SPA — built by Agy                           │
└─────────────┬───────────────────────┬───────────────┘
              │ REST API              │ WebSocket
              ▼                       ▼
┌──────────────────────────────────────────────────────┐
│           API Gateway (Traefik / Caddy)              │
│   auth proxy · rate limit · TLS termination         │
└──────────────────┬───────────────────────────────────┘
                   │
       ┌───────────┼───────────┬───────────┐
       ▼           ▼           ▼           ▼
┌────────────┐ ┌────────┐ ┌────────┐ ┌────────────┐
│  FastAPI   │ │  SSE   │ │  Auth  │ │   Agent    │
│  REST API  │ │  Stream│ │  Svc   │ │  Runner    │
│  :8001     │ │ :8002  │ │ :8003  │ │  (Hermes)  │
└─────┬──────┘ └───┬────┘ └───┬────┘ └──────┬─────┘
      │            │          │              │
      └────────────┴──────────┴──────────────┘
                      │
                      ▼
          ┌──────────────────────┐
          │     PostgreSQL       │
          │   (or SQLite local)  │
          └──────────────────────┘
```

### Deployment Targets

| Target | Database | Auth | Notes |
|--------|----------|------|-------|
| **hermes-vps** (production) | PostgreSQL (Docker) | OAuth2 + API keys | Traefik reverse proxy |
| **Local** (dev) | SQLite | Dev-only JWT | Docker Compose or bare metal |

---

## 2. Core Backend Services

### 2.1 API Service (`api/`) — FastAPI
- REST endpoints for CRUD on agents, projects, users, settings
- Token usage & spend aggregation endpoints
- VPS metrics proxy (reads from agent-OS agent on the VPS)

### 2.2 Stream Service (`stream/`) — WebSocket / SSE
- Live activity feed — connects to running agent processes
- Real-time system metrics (CPU, RAM, disk every 2s)
- Log tailing per agent

### 2.3 Auth Service (`auth/`)
- JWT-based auth
- API key management for agent access
- SSO support (Google OAuth, GitHub OAuth)
- Role-based access (owner, admin, viewer)

### 2.4 Agent Runner (`runner/`)
- Manages agent process lifecycle (Hermes, Claude Code, Codex CLI)
- Starts/stops/restarts agents via subprocess or Docker
- Captures stdout/stderr into the activity feed
- Reports status (idle, active, error)

### 2.5 VPS Monitor (`monitor/`)
- Runs on the VPS, exposes metrics via a small agent
- CPU / RAM / Disk / Uptime / Connections
- Sends telemetry back to the API or is polled

---

## 3. Data Model

```
users
  id, email, name, avatar_url, role, sso_provider, created_at

agents
  id, name, initials, model, status, type (hermes/codex/claude),
  config_json, context_window_pct, conv_count, 
  last_active_at, created_at

projects
  id, name, description, status, agent_id (FK),
  token_count_mtd, spend_mtd, created_at

activity_logs
  id, agent_id (FK), event_type, description,
  tokens_used, status_code, timestamp

token_records
  id, agent_id (FK), input_tokens, output_tokens,
  model, cost, timestamp

system_metrics
  id, cpu_pct, ram_used_gb, ram_total_gb, disk_used_gb,
  disk_total_gb, uptime_seconds, connections, region,
  timestamp
```

---

## 4. API Endpoints

### Agents
```
GET    /api/agents              — List all agents
POST   /api/agents              — Register/create an agent
GET    /api/agents/:id          — Agent detail + live status
PATCH  /api/agents/:id          — Update config
DELETE /api/agents/:id          — Deregister
POST   /api/agents/:id/start    — Start agent process
POST   /api/agents/:id/stop     — Stop agent process
POST   /api/agents/:id/restart  — Restart agent
```

### Activity
```
GET    /api/activity            — Paginated activity logs
WS     /ws/activity             — Real-time activity stream
WS     /ws/agent/:id/logs       — Tail logs for one agent
```

### Metrics
```
GET    /api/metrics/summary     — Dashboard summary row
GET    /api/metrics/system      — VPS CPU/RAM/Disk/Uptime
GET    /api/metrics/tokens      — Token usage timeseries
GET    /api/metrics/spend       — Spend data (MTD, today, hourly)
WS     /ws/metrics              — Real-time system metrics stream
```

### Tokens & Spend
```
GET    /api/tokens              — Token records (paginated, filterable)
GET    /api/tokens/aggregate    — Aggregated token stats
GET    /api/spend               — Spend breakdown by agent/project
```

### Projects
```
GET    /api/projects            — List projects
POST   /api/projects            — Create project
GET    /api/projects/:id        — Detail
PATCH  /api/projects/:id        — Update
DELETE /api/projects/:id        — Delete
```

### AI Brain
```
GET    /api/brain/search?q=     — Search knowledge base
GET    /api/brain/documents     — List documents
POST   /api/brain/documents     — Upload document
```

### Auth
```
POST   /auth/login              — Email/password or SSO callback
POST   /auth/refresh            — Refresh JWT
GET    /auth/me                 — Current user
GET    /auth/api-keys           — List API keys
POST   /auth/api-keys           — Create API key
```

---

## 5. Technology Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Backend** | Python FastAPI | Hermes-native, async, auto-docs |
| **Real-time** | WebSocket (via FastAPI) / SSE | Activity feed + live metrics |
| **Database** | PostgreSQL (prod) / SQLite (local) | SQLAlchemy async ORM |
| **Auth** | python-jose + httpx-oauth | JWT + SSO |
| **Process Mgmt** | asyncio subprocess + psutil | Agent runner + VPS monitor |
| **Container** | Docker / Docker Compose | Deploy anywhere |
| **Reverse Proxy** | Traefik (VPS) / Caddy (local) | TLS + routing |
| **Frontend** | React SPA (built by Agy) | Already have the design |
| **Monitoring** | Prometheus-style metrics endpoint | Optional Grafana |

---

## 6. Repository Structure

```
agent-os/
├── README.md
├── docker-compose.yml          # Full stack (prod)
├── docker-compose.local.yml    # Local dev (SQLite)
├── .env.example
├── .gitignore
│
├── api/                        # FastAPI backend
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── alembic.ini
│   ├── alembic/                # DB migrations
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py             # FastAPI app entry
│   │   ├── config.py           # Settings from env
│   │   ├── database.py         # SQLAlchemy async engine
│   │   ├── models/             # ORM models
│   │   │   ├── user.py
│   │   │   ├── agent.py
│   │   │   ├── project.py
│   │   │   ├── activity.py
│   │   │   ├── token_record.py
│   │   │   └── metric.py
│   │   ├── schemas/            # Pydantic schemas
│   │   │   ├── agent.py
│   │   │   ├── activity.py
│   │   │   ├── metric.py
│   │   │   ├── project.py
│   │   │   ├── token.py
│   │   │   └── user.py
│   │   ├── routers/            # API route handlers
│   │   │   ├── agents.py
│   │   │   ├── activity.py
│   │   │   ├── metrics.py
│   │   │   ├── tokens.py
│   │   │   ├── projects.py
│   │   │   ├── brain.py
│   │   │   └── auth.py
│   │   ├── services/           # Business logic
│   │   │   ├── agent_manager.py
│   │   │   ├── activity_stream.py
│   │   │   ├── metric_collector.py
│   │   │   ├── token_tracker.py
│   │   │   └── auth_service.py
│   │   ├── websocket/          # WS/SSE handlers
│   │   │   ├── activity.py
│   │   │   ├── metrics.py
│   │   │   └── agent_logs.py
│   │   └── utils/
│   │       ├── crypto.py
│   │       └── pagination.py
│   └── tests/
│       ├── conftest.py
│       ├── test_agents.py
│       ├── test_activity.py
│       ├── test_metrics.py
│       ├── test_tokens.py
│       ├── test_projects.py
│       ├── test_auth.py
│       └── test_ws.py
│
├── runner/                     # Agent process runner
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── runner.py               # Main process orchestrator
│   ├── agents/
│   │   ├── hermes_adapter.py   # Hermes agent interface
│   │   ├── codex_adapter.py    # Codex CLI interface
│   │   └── claude_adapter.py   # Claude Code interface
│   └── tests/
│
├── monitor/                    # VPS system monitor agent
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── monitor.py              # psutil-based collector
│   ├── publishers/
│   │   ├── api_publisher.py    # Push to API
│   │   └── ws_publisher.py     # Push via WebSocket
│   └── tests/
│
├── frontend/                   # React SPA (built by Agy)
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── ws/
│   └── ...
│
├── deploy/                     # Deployment configs
│   ├── traefik/
│   │   └── traefik.yml
│   ├── nginx/
│   │   └── agent-os.conf
│   └── scripts/
│       ├── setup-vps.sh
│       └── deploy.sh
│
└── docs/
    ├── ARCHITECTURE.md
    ├── API.md
    ├── LOCAL-DEV.md
    └── DEPLOY.md
```

---

## 7. Implementation Phases

### Phase 1: Backend Core (Codex / Claude)
**Scope:** Database, API endpoints, auth, basic agent CRUD
- SQLAlchemy models + Alembic migrations
- All REST endpoints (agents, projects, activity, tokens, metrics)
- JWT auth with API key support
- Pydantic schemas + validation
- Unit tests for all endpoints
- Docker Compose for local dev (SQLite)

### Phase 2: Real-time & Monitoring (Codex / Claude)
**Scope:** WebSocket streams, VPS monitor, activity feed
- WebSocket endpoints for activity stream and metrics
- SSE fallback for environments that restrict WS
- `monitor/` service — psutil-based VPS metrics collector
- `runner/` service — agent process lifecycle manager
- Integration tests for streaming endpoints

### Phase 3: Integration & QA (Codex / Claude)
**Scope:** Hermes adapter, full integration tests, edge cases
- Hermes agent adapter (spawn Hermes subprocess, capture output)
- Codex CLI adapter
- Claude Code adapter
- Token usage tracking per agent call
- Load testing with locust or k6
- Error handling + retry logic

### Phase 4: Frontend (Agy)
**Scope:** React SPA matching the Agent OS Dashboard design
- All pages from the design: Activity, Agents, Projects, Spend, AI Brain, VPS
- WebSocket hooks for live data
- Command palette (⌘K search)
- Agent chat interface
- Responsive design

### Phase 5: Deployment & Live Testing (Hermes VPS)
**Scope:** VPS deployment, CI/CD, live testing
- Docker Compose for production (PostgreSQL)
- Traefik config for agent-os.nathangerber.tech
- GitHub Actions CI (lint, test, build)
- Live testing against real Hermes/Codex/Claude instances
- Performance optimization
- Monitoring + alerting

---

## 8. Deployment Architecture

### VPS (Production) — hermes-vps
```
Traefik (external)
  └── agent-os.nathangerber.tech
        ├── /api/* → api:8001
        ├── /ws/*  → api:8001 (WebSocket upgrade)
        └── /*     → frontend:5173 (static SPA)
        
Docker network: agentos-net
  - api:8001 (FastAPI + WebSocket)
  - postgres:5432
  - runner (agent process orchestrator)
  - monitor (VPS metrics collector)
```

### Local (Development)
```
docker compose -f docker-compose.local.yml up
  - api:8001 (FastAPI + SQLite)
  - frontend:5173 (Vite dev server)
  - monitor:9090 (local system metrics)
```

---

## 9. Getting Started

```bash
# Clone repo
git clone https://github.com/ngerber06/agent-os.git
cd agent-os

# Copy env
cp .env.example .env

# Start locally
docker compose -f docker-compose.local.yml up

# API docs at http://localhost:8001/docs
# Frontend at http://localhost:5173
```

---

## 10. Division of Labor

| Team | What They Build |
|------|----------------|
| **Agy** | Frontend SPA from the Agent OS Dashboard design |
| **Codex** | API routes, DB models, auth, schemas, unit tests |
| **Claude** | WebSocket/SSE streams, agent runner, VPS monitor, integration tests |
| **Hermes VPS** | Live testing, deployment, Traefik config, CI/CD, monitoring |

---

## 11. Next Steps

1. Create the GitHub repo `ngerber06/agent-os` with this plan and directory scaffold
2. Codex starts Phase 1 — API backend core + DB
3. Claude starts Phase 2 — real-time streaming + monitor
4. Agy starts Phase 4 — frontend
5. Integrate and test on Hermes VPS
6. Deploy to agent-os.nathangerber.tech
