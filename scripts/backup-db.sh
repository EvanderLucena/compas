#!/bin/bash
# backup-db.sh — Automated PostgreSQL backup with gzip compression and retention pruning
# Usage: ./scripts/backup-db.sh
# Can be run directly on the host or inside a scheduled cron job (e.g. 0 3 * * * /path/to/backup-db.sh)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$ROOT_DIR"

BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
POSTGRES_USER="${POSTGRES_USER:-nutriai}"
POSTGRES_DB="${POSTGRES_DB:-nutriai}"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"

TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"
BACKUP_FILE="$BACKUP_DIR/compas_${POSTGRES_DB}_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "=== Compas Database Backup Started ==="
echo "Timestamp: $TIMESTAMP"
echo "Target: $BACKUP_FILE"

# Determine execution strategy (Docker Compose vs local pg_dump)
if docker compose -f docker/docker-compose.yml ps --services --filter "status=running" 2>/dev/null | grep -q "postgres"; then
  echo "Detected running PostgreSQL container in docker-compose.yml"
  docker compose -f docker/docker-compose.yml exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip > "$BACKUP_FILE"
elif command -v pg_dump >/dev/null 2>&1; then
  echo "Using host pg_dump client (connecting to $POSTGRES_HOST:$POSTGRES_PORT)"
  pg_dump -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip > "$BACKUP_FILE"
elif docker ps --filter "name=postgres" --filter "status=running" -q | grep -q .; then
  CONTAINER_ID=$(docker ps --filter "name=postgres" --filter "status=running" -q | head -n 1)
  echo "Using running docker container ID: $CONTAINER_ID"
  docker exec -t "$CONTAINER_ID" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip > "$BACKUP_FILE"
else
  echo "ERROR: Neither running postgres container nor local pg_dump binary found." >&2
  exit 1
fi

# Verify backup was created and has non-zero size
if [ ! -s "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file was created but is empty (0 bytes): $BACKUP_FILE" >&2
  rm -f "$BACKUP_FILE"
  exit 1
fi

BACKUP_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
echo "Backup completed successfully! Size: $BACKUP_SIZE"

# Prune archives older than RETENTION_DAYS
echo "Applying retention policy: pruning backups older than $RETENTION_DAYS days..."
DELETED_COUNT=0
while IFS= read -r -d '' old_backup; do
  echo "Removing expired backup: $(basename "$old_backup")"
  rm -f "$old_backup"
  DELETED_COUNT=$((DELETED_COUNT + 1))
done < <(find "$BACKUP_DIR" -name "compas_${POSTGRES_DB}_*.sql.gz" -type f -mtime "+$RETENTION_DAYS" -print0)

echo "Retention cleanup complete ($DELETED_COUNT expired backups removed)."
echo "=== Backup Finished Successfully ==="