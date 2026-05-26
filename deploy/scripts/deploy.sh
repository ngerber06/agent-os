#!/bin/bash
# Agent OS — Deploy script (run from CI or manually)
set -euo pipefail

REPO_DIR="/opt/agent-os"
BRANCH="${1:-main}"

echo "=== Deploying Agent OS ($BRANCH) ==="

cd "$REPO_DIR"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

docker compose -f docker-compose.yml build
docker compose -f docker-compose.yml up -d

echo "=== Deploy complete ==="
