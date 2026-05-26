#!/bin/bash
# Agent OS — Deploy script (run from CI or manually)
set -euo pipefail

REPO_DIR="/root/agent-os"
BRANCH="${1:-main}"

echo "=== Deploying Agent OS ($BRANCH) on hermes-vps ==="

cd "$REPO_DIR"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

docker compose -f docker-compose.vps.yml build
docker compose -f docker-compose.vps.yml up -d

echo "=== Deploy complete ==="
