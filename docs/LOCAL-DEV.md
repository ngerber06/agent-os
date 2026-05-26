# Local Development

## Prerequisites

- Python 3.11+
- Docker + Docker Compose (optional)
- Node.js 18+ (for frontend dev)

## Setup

### Backend (bare metal)

```bash
cd api
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

# Copy and edit env
cp ../.env.example ../.env
# Edit DATABASE_URL for SQLite (default)

# Run migrations
alembic upgrade head

# Start API
uvicorn app.main:app --reload --port 8001
```

### Backend (Docker)

```bash
docker compose -f docker-compose.local.yml up
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Testing

```bash
cd api
source .venv/bin/activate
pytest -v
```

## Project Structure

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full architecture overview.
