#!/bin/sh
# ── Import database into running Nexus container ────────────
# Copies a SQLite database file from host into the container.
# The container will be restarted to pick up the new data.
# Usage: ./docker/import-data.sh <db_file_path>
#
# Examples:
#   ./docker/import-data.sh ./db/export/nexus_20250101_120000.db
#   ./docker/import-data.sh /tmp/backup/mydb.db

set -e

CONTAINER_NAME="${CONTAINER_NAME:-nexus-data}"
DB_FILE="/app/db/custom.db"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.test.yml}"

# Validate arguments
if [ $# -lt 1 ]; then
  echo "ERROR: Database file path is required."
  echo "Usage: $0 <db_file_path>"
  echo ""
  echo "Example:"
  echo "  $0 ./db/export/nexus_20250101_120000.db"
  exit 1
fi

INPUT_FILE="$1"

# Validate input file exists
if [ ! -f "$INPUT_FILE" ]; then
  echo "ERROR: File not found: $INPUT_FILE"
  exit 1
fi

# Validate it looks like a SQLite file
FILE_HEADER=$(head -c 16 "$INPUT_FILE" 2>/dev/null || echo "")
if ! echo "$FILE_HEADER" | grep -q "SQLite format"; then
  echo "WARNING: File does not appear to be a valid SQLite database."
  echo "Header: $FILE_HEADER"
  read -p "Continue anyway? [y/N] " CONFIRM
  if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "Aborted."
    exit 1
  fi
fi

FILE_SIZE=$(du -h "$INPUT_FILE" | cut -f1)
echo "=== Nexus Database Import ==="
echo "Source: $INPUT_FILE ($FILE_SIZE)"
echo "Target: ${CONTAINER_NAME}:${DB_FILE}"

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "ERROR: Container '${CONTAINER_NAME}' is not running."
  echo "Start it first with: docker compose -f $COMPOSE_FILE up -d --build"
  exit 1
fi

# Create a backup of the current database before overwriting
echo ""
echo "Creating backup of current database..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./db/export"
mkdir -p "$BACKUP_DIR"
docker cp "${CONTAINER_NAME}:${DB_FILE}" "${BACKUP_DIR}/nexus_pre_import_${TIMESTAMP}.db" 2>/dev/null || echo "  (no existing database to back up)"

# Copy the new database into the container
echo "Importing database..."
docker cp "$INPUT_FILE" "${CONTAINER_NAME}:${DB_FILE}"

# Verify the import
echo "Verifying import..."
VERIFY_SIZE=$(docker exec "$CONTAINER_NAME" wc -c < "$DB_FILE" 2>/dev/null || echo "0")
if [ "$VERIFY_SIZE" -gt 0 ]; then
  echo "  Database file size in container: $(docker exec "$CONTAINER_NAME" du -h "$DB_FILE" | cut -f1)"
else
  echo "  WARNING: Could not verify database file in container."
fi

# Restart the container to pick up the new data
echo ""
echo "Restarting container to load new data..."
docker compose -f "$COMPOSE_FILE" restart "$CONTAINER_NAME"

echo ""
echo "Import complete. Container is restarting with new data."
echo "Monitor logs with: docker compose -f $COMPOSE_FILE logs -f"
