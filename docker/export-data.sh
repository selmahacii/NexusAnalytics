#!/bin/sh
# ── Export database from running Nexus container ─────────────
# Copies the SQLite database file to the host with a timestamped backup.
# Usage: ./docker/export-data.sh [output_dir]
#
# Examples:
#   ./docker/export-data.sh                 # Export to ./db/export/
#   ./docker/export-data.sh /tmp/backup     # Export to custom directory

set -e

CONTAINER_NAME="${CONTAINER_NAME:-nexus-data}"
DB_FILE="/app/db/custom.db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_DIR="${1:-./db/export}"

echo "=== Nexus Database Export ==="

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "ERROR: Container '${CONTAINER_NAME}' is not running."
  echo "Start it first with: docker compose -f docker-compose.test.yml up -d --build"
  exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

BACKUP_FILE="${OUTPUT_DIR}/nexus_${TIMESTAMP}.db"

# Copy database from container
echo "Copying database from container..."
docker cp "${CONTAINER_NAME}:${DB_FILE}" "$BACKUP_FILE"

# Verify the file was copied
if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Failed to copy database file."
  exit 1
fi

FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "Exported: $BACKUP_FILE ($FILE_SIZE)"

# Print table row counts
echo ""
echo "Table row counts:"
echo "-------------------"

# Try to use sqlite3 if available (check in container first)
if docker exec "$CONTAINER_NAME" command -v sqlite3 > /dev/null 2>&1; then
  docker exec "$CONTAINER_NAME" sqlite3 "$DB_FILE" "
    SELECT '  Customers:           ' || COUNT(*) FROM Customer;
    SELECT '  Products:            ' || COUNT(*) FROM Product;
    SELECT '  Sale Transactions:   ' || COUNT(*) FROM SaleTransaction;
    SELECT '  Employees:           ' || COUNT(*) FROM Employee;
    SELECT '  Supply Chain Orders: ' || COUNT(*) FROM SupplyChainOrder;
    SELECT '  Financial Actuals:   ' || COUNT(*) FROM FinancialActual;
    SELECT '  Production Logs:     ' || COUNT(*) FROM ProductionLog;
    SELECT '  Model Versions:      ' || COUNT(*) FROM ModelVersion;
    SELECT '  Forecast Outputs:    ' || COUNT(*) FROM ForecastOutput;
    SELECT '  Anomaly Events:      ' || COUNT(*) FROM AnomalyEvent;
    SELECT '  Data Ingestion Logs: ' || COUNT(*) FROM DataIngestionLog;
  " 2>/dev/null || echo "  (unable to query table counts)"
else
  echo "  (sqlite3 not available in container, skipping row counts)"
fi

echo ""
echo "Export complete: $BACKUP_FILE"
