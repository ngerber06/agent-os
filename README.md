# Agent OS

A management portal for autonomous AI agents. Monitor, control, and deploy agents (Hermes, Codex, Claude) from a single dashboard.

## Architecture

```
agent-os/
├── api/             # FastAPI backend (REST + WebSocket)
├── runner/          # Agent process lifecycle manager
├── monitor/         # VPS system metrics collector
├── frontend/        # React SPA (built by Agy)
└── deploy/          # Traefik, Nginx, deployment scripts
```

## Quick Start

```bash
cp .env.example .env
docker compose -f docker-compose.local.yml up
```

- API docs: `http://localhost:8001/docs`
- Frontend: `http://localhost:5173`

## Development

See [docs/LOCAL-DEV.md](docs/LOCAL-DEV.md) for setup instructions.
See [AGENTOS-PLAN.md](AGENTOS-PLAN.md) for the full infrastructure plan.

## Team

| Area | Owner |
|------|-------|
| Frontend | Agy |
| API Backend | Codex |
| Streaming + Runner + Monitor | Claude |
| Deployment + Live Testing | Hermes VPS |