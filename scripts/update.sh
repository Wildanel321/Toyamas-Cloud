#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Toyamas Cloud - Zero-Downtime Platform Update Script
# ==============================================================================

echo ">>> Pulling latest changes from Git..."
git pull origin main

echo ">>> Running database migrations..."
docker compose -f docker-compose.prod.yml exec -T toyamas-app npx prisma db push

echo ">>> Building and updating containers..."
docker compose -f docker-compose.prod.yml up -d --build --remove-orphans

echo ">>> Pruning dangling images..."
docker image prune -f

echo ">>> Update successfully completed!"
