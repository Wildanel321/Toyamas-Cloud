#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Toyamas Cloud - Automated VPS Provisioning Script
# Target: Ubuntu 22.04 / 24.04 LTS (4 vCPU, 8 GB RAM)
# Domain: wildanstore.my.id
# ==============================================================================

echo ">>> [1/6] Updating system packages..."
apt-get update && apt-get upgrade -y
apt-get install -y curl wget git ufw htop ca-certificates gnupg lsb-release

echo ">>> [2/6] Configuring UFW Firewall..."
# Only expose SSH, HTTP, and HTTPS as per Toyamas Security Baseline
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw allow 443/udp comment 'HTTP3/QUIC'
ufw --force enable

echo ">>> [3/6] Installing Docker Engine & Compose..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
  rm get-docker.sh
fi

systemctl enable docker
systemctl start docker

echo ">>> [4/6] Initializing Docker Network..."
docker network create toyamas-network 2>/dev/null || true

echo ">>> [5/6] Creating storage directories..."
mkdir -p /opt/toyamas-cloud/storage/caddy
mkdir -p /opt/toyamas-cloud/storage/builds

echo ">>> [6/6] VPS Provisioning Complete!"
echo "Next steps:"
echo "1. Clone repo to /opt/toyamas-cloud"
echo "2. Create /opt/toyamas-cloud/.env from .env.example"
echo "3. Run: docker compose -f docker-compose.prod.yml up -d --build"
