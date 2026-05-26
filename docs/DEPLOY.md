# Deployment

## VPS (Production)

### One-time setup

```bash
# SSH into VPS
ssh hermes-vps

# Run setup script
bash <(curl -s https://raw.githubusercontent.com/ngerber06/agent-os/main/deploy/scripts/setup-vps.sh)

# Edit .env with secrets
nano /opt/agent-os/.env

# Start
cd /opt/agent-os && docker compose -f docker-compose.yml up -d
```

### Deploy updates

```bash
# From any machine
ssh hermes-vps "cd /opt/agent-os && ./deploy/scripts/deploy.sh main"
```

Or set up GitHub Actions — see `.github/workflows/deploy.yml`.

## Local

```bash
docker compose -f docker-compose.local.yml up --build
```

## DNS

- Agent OS: `agent-os.nathangerber.tech → 2.24.67.230` (Traefik)
- Wildcard `*.nathangerber.tech` already points to the VPS
