#!/bin/bash
# Agent OS — VPS setup script
set -euo pipefail

echo "=== Agent OS VPS Setup ==="

# Prerequisites
command -v docker >/dev/null 2>&1 || { echo "Docker required. Install first."; exit 1; }
command -v git >/dev/null 2>&1 || { echo "Git required."; exit 1; }

# Clone repo
if [ ! -d "/opt/agent-os" ]; then
    git clone https://github.com/ngerber06/agent-os.git /opt/agent-os
fi

cd /opt/agent-os

# Copy env and edit
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "Edit .env with your secrets before continuing."
    exit 1
fi

# Ensure Traefik network exists
docker network inspect traefik-public >/dev/null 2>&1 || \
    docker network create traefik-public

# Start stack
docker compose -f docker-compose.yml up -d

echo "=== Deployed ==="
echo "API: https://agent-os.nathangerber.tech/api/"
echo "Docs: https://agent-os.nathangerber.tech/docs"
