# Agent OS — VPS Deployment Plan (hermes-vps)

> **Target:** `2.24.67.230` (hermes-vps)
> **Domain:** `agent-os.nathangerber.tech`
> **Repo:** `/root/agent-os` (already cloned)
> **Status:** Plan ready for Home Hermes to execute

---

## Current VPS State

| Resource | Detail |
|----------|--------|
| Traefik | ✅ Running, host network, dynamic file provider at `/root/infra/docker/traefik/dynamic/` |
| ACME email | `ngerber06@gmail.com` |
| Basic auth | `nate / Natedog51!` — htpasswd at `dynamic/htpasswd` |
| PostgreSQL | ✅ Running (mem0 stack) on port `8432`, user `postgres` |
| Hermes gateway | Port `8642` (API server active) |
| Hermes dashboard | Port `9119` (systemd service) |
| Free ports | `8001`, `5173` confirmed available |
| Repo location | `/root/agent-os` (not `/opt/agent-os`) |

---

## Phase 1 — Database

Do NOT deploy a new PostgreSQL container. Use the existing instance:

```yaml
# Create database and user for agent-os
docker exec mem0-dev-postgres-1 psql -U postgres -c "
  CREATE DATABASE agentos;
  CREATE USER agentos WITH PASSWORD 'agentos';
  GRANT ALL PRIVILEGES ON DATABASE agentos TO agentos;
  \\c agentos
  GRANT ALL ON SCHEMA public TO agentos;
"
```

Update production docker-compose to point to existing PostgreSQL:
- Host: `postgres` (Docker service name of mem0's postgres)
- Actually need to connect via the mem0 Docker network
- Easiest: expose and use `host.docker.internal:8432` or `172.16.0.1:8432`

**Better approach: Use a shared network** so agent-os containers can reach the mem0 PostgreSQL:
```bash
docker network connect mem0-dev_mem0_network agentos-api-1
```
Then database URL: `postgresql+asyncpg://agentos:agentos@mem0-dev-postgres-1:5432/agentos`

---

## Phase 2 — Docker Compose (Production)

Based on `/root/agent-os/docker-compose.yml` but with VPS-specific modifications:

### Changes to `docker-compose.yml`:

1. **Remove `postgres` service** — use existing instance
2. **Remove `networks:` section** — connect to `mem0-dev_mem0_network` instead
3. **Remove `ports:` from api** — Traefik on host network, no port publishing needed (unless debugging)
4. **Runner** — mount `~/.config/hermes:/root/.config/hermes:ro` since Hermes config is at `/root/.hermes/`

### Add `docker-compose.vps.yml`:

```yaml
version: "3.9"

services:
  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    env_file: .env
    environment:
      - DATABASE_URL=postgresql+asyncpg://agentos:agentos@mem0-dev-postgres-1:5432/agentos
      - ENVIRONMENT=production
    depends_on:
      mem0-dev-postgres-1:
        condition: service_healthy
    networks:
      - mem0-dev_mem0_network
    restart: unless-stopped

  runner:
    build:
      context: ./runner
      dockerfile: Dockerfile
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /root/.hermes:/root/.config/hermes:ro
    env_file: .env
    depends_on:
      - api
    networks:
      - mem0-dev_mem0_network
    restart: unless-stopped

  monitor:
    build:
      context: ./monitor
      dockerfile: Dockerfile
    privileged: true
    env_file: .env
    environment:
      - MONITOR_API_URL=http://api:8001
    depends_on:
      - api
    networks:
      - mem0-dev_mem0_network
    restart: unless-stopped

networks:
  mem0-dev_mem0_network:
    external: true
```

---

## Phase 3 — Environment File

Create `/root/agent-os/.env`:

```bash
# Database (uses existing PostgreSQL from mem0 stack)
DATABASE_URL=postgresql+asyncpg://agentos:agentos@mem0-dev-postgres-1:5432/agentos

# Auth — generate a random 32-char secret
JWT_SECRET=$(openssl rand -hex 32)
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# API
API_HOST=0.0.0.0
API_PORT=8001
CORS_ORIGINS=https://agent-os.nathangerber.tech

# Hermes API (gateway runs on host, accessible via Docker host)
HERMES_API_URL=http://172.16.0.1:8642
HERMES_API_KEY=

# Monitor
MONITOR_INTERVAL_SECONDS=5

# Deployment
ENVIRONMENT=production
LOG_LEVEL=info
```

---

## Phase 4 — Traefik Route

Add to existing `/root/infra/docker/traefik/dynamic/hermes-dashboard.yml`:

```yaml
    agentos-api:
      rule: "Host(`agent-os.nathangerber.tech`) && PathPrefix(`/api/`)"
      entryPoints:
        - websecure
      tls:
        certResolver: letsencrypt
      middlewares:
        - hermes-dashboard-auth
      service: agentos-api

    agentos-ws:
      rule: "Host(`agent-os.nathangerber.tech`) && PathPrefix(`/ws/`)"
      entryPoints:
        - websecure
      tls:
        certResolver: letsencrypt
      middlewares:
        - hermes-dashboard-auth
      service: agentos-api

    agentos-frontend:
      rule: "Host(`agent-os.nathangerber.tech`)"
      entryPoints:
        - websecure
      tls:
        certResolver: letsencrypt
      middlewares:
        - hermes-dashboard-auth
      service: agentos-frontend
```

And in the `services:` section:

```yaml
    agentos-api:
      loadBalancer:
        servers:
          - url: "http://127.0.0.1:8001"

    agentos-frontend:
      loadBalancer:
        servers:
          - url: "http://127.0.0.1:5173"
```

Then restart Traefik:
```bash
cd /root/infra/docker/traefik && docker compose up -d --force-recreate
```

---

## Phase 5 — Build & Deploy

```bash
cd /root/agent-os

# 1. Create PostgreSQL database (one-time)
docker exec mem0-dev-postgres-1 psql -U postgres -c "
  CREATE DATABASE agentos;
  CREATE USER agentos WITH PASSWORD 'agentos';
  \\c agentos;
  GRANT ALL ON SCHEMA public TO agentos;
"

# 2. Create .env
cp .env.example .env
# ... edit with secrets from Phase 3

# 3. Build and start
docker compose -f docker-compose.vps.yml build
docker compose -f docker-compose.vps.yml up -d

# 4. Verify
curl -s https://agent-os.nathangerber.tech/api/agents
curl -s https://agent-os.nathangerber.tech/health
```

---

## Phase 6 — Testing Checklist

| Check | Expected |
|-------|----------|
| `GET /api/agents` | `[]` (empty) |
| `GET /health` | `{"status": "ok", ...}` |
| `POST /auth/login` | Returns JWT |
| `GET /api/metrics/system` | CPU/RAM/disk data |
| WebSocket `/ws/metrics` | Live metrics stream |
| Traefik basic auth | Prompts for nate/Natedog51! |
| Frontend at root | React SPA loads (when built) |

---

## Notes

- The `frontend/` directory is **not yet built** — Phase 4 assigned to Agy in the plan
- Until the frontend is ready, the root URL `agent-os.nathangerber.tech` will serve a 502 (no service on port 5173)
- The `runner/` service is optional for Phase 1 — can start with just `api` and `monitor`
- Hermes API integration (`HERMES_API_URL`) requires the Hermes gateway to be running on port 8642 (it currently is)
- All secrets use the existing Traefik basic auth (`nate` / `Natedog51!`) — no additional auth layer needed at the Traefik level
