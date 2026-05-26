# API Reference

Base URL: `http://localhost:8001` (dev) or `https://agent-os.nathangerber.tech` (prod)

## Authentication

Most endpoints require a Bearer token:

```
Authorization: Bearer <jwt_token>
```

Or an API key:

```
X-API-Key: <api_key>
```

## Endpoints

### Auth
- `POST /auth/login` — Login (returns JWT)
- `POST /auth/refresh` — Refresh token
- `GET /auth/me` — Current user
- `GET /auth/api-keys` — List API keys
- `POST /auth/api-keys` — Create API key

### Agents
- `GET /api/agents` — List all agents
- `POST /api/agents` — Register agent
- `GET /api/agents/:id` — Agent detail
- `PATCH /api/agents/:id` — Update agent
- `DELETE /api/agents/:id` — Remove agent
- `POST /api/agents/:id/start` — Start agent
- `POST /api/agents/:id/stop` — Stop agent
- `POST /api/agents/:id/restart` — Restart agent

### Activity
- `GET /api/activity` — Paginated activity logs
- `WS /ws/activity` — Real-time activity stream
- `WS /ws/agent/:id/logs` — Tail logs for one agent

### Metrics
- `GET /api/metrics/summary` — Dashboard summary
- `GET /api/metrics/system` — VPS system metrics
- `GET /api/metrics/tokens` — Token usage timeseries
- `WS /ws/metrics` — Real-time metrics stream

### Token & Spend
- `GET /api/tokens` — Token records (paginated)
- `GET /api/tokens/aggregate` — Aggregated stats
- `GET /api/spend` — Spend breakdown

### Projects
- `GET /api/projects` — List projects
- `POST /api/projects` — Create project
- `GET /api/projects/:id` — Detail
- `PATCH /api/projects/:id` — Update
- `DELETE /api/projects/:id` — Delete

Full auto-generated docs at `/docs` when the API is running.
