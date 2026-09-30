#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Toyamas Cloud - Application-Level Database & Metadata Backup
# ==============================================================================

BACKUP_DIR="/opt/toyamas-cloud/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/toyamas_backup_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo ">>> Creating PostgreSQL dump..."
docker exec toyamas-postgres pg_dump -U toyamas toyamas_cloud | gzip > "${BACKUP_FILE}"

echo ">>> Backup created successfully: ${BACKUP_FILE} ($(du -h "${BACKUP_FILE}" | cut -f1))"

# Keep last 14 backups
find "${BACKUP_DIR}" -name "toyamas_backup_*.sql.gz" -type f -mtime +14 -delete
echo ">>> Cleaned up backups older than 14 days."
