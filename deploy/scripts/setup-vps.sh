#!/bin/bash
# Agent OS — VPS setup script
# MODIFIED for hermes-vps: repo at /root/agent-os, shared PostgreSQL
set -euo pipefail

echo "=== Agent OS VPS Setup (hermes-vps) ==="

# Prerequisites
command -v docker >/dev/null 2>&1 || { echo "Docker required. Install first."; exit 1; }
command -v git >/dev/null 2>&1 || { echo "Git required."; exit 1; }

# Repo already cloned at /root/agent-os
REPO_DIR="/root/agent-os"
if [ ! -d "$REPO_DIR" ]; then
    git clone https://github.com/ngerber06/agent-os.git "$REPO_DIR"
fi

cd "$REPO_DIR"

# Copy env and edit
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "Edit .env with your secrets before continuing."
    echo "Use shared PostgreSQL: postgresql+asyncpg://agentos:agentos@mem0-dev-postgres-1:5432/agentos"
    exit 1
fi

# Create database in existing PostgreSQL (mem0 stack)
docker exec mem0-dev-postgres-1 psql -U postgres -c "
  CREATE DATABASE agentos;
  CREATE USER agentos WITH PASSWORD 'agentos';
  \c agentos;
  GRANT ALL ON SCHEMA public TO agentos;
" 2>/dev/null || echo "Database may already exist — continuing."

# Use the VPS-specific compose file
docker compose -f docker-compose.vps.yml up -d --build

echo "=== Deployed ==="
echo "API: https://agent-os.nathangerber.tech/api/"
echo "Docs: https://agent-os.nathangerber.tech/docs"
