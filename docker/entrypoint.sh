#!/bin/sh
# ── Entrypoint for Nexus container ──────────────────────────────
# Handles DB initialization, seeding, and server startup.
# Usage: ./entrypoint.sh [command]
#   start      (default) Push schema -> seed data -> start server
#   seed       Push schema -> seed data -> exit
#   seed-only  Seed data only (no schema push, no server) -> exit
#   reset      Delete all data -> re-seed -> exit
#   dev        Start dev server

set -e

echo "==========================================="
echo "  Nexus Analytics"
echo "  Container Entrypoint"
echo "========================================="

# ── Configuration ───────────────────────────────────────────
DATABASE_URL="${DATABASE_URL:-file:/app/db/custom.db}"
SEED_SCRIPT="/app/server/seed/standaloneSeed.ts"
DATA_FILE="/app/data/online_retail.xlsx"
DB_FILE="/app/db/custom.db"
SCHEMA_DIR="/app/prisma"

# ── Helper: ensure database directory exists ────────────────
ensure_db_dir() {
  DB_DIR=$(dirname "$DB_FILE")
  if [ ! -d "$DB_DIR" ]; then
    echo "[entrypoint] Creating database directory: $DB_DIR"
    mkdir -p "$DB_DIR"
  fi
}

# ── Helper: push Prisma schema to database ──────────────────
push_schema() {
  echo "[entrypoint] Pushing Prisma schema to database..."
  if [ -d "$SCHEMA_DIR" ] && [ -f "$SCHEMA_DIR/schema.prisma" ]; then
    cd /app
    bunx prisma db push --skip-generate --accept-data-loss 2>&1 || {
      echo "[entrypoint] WARNING: Schema push encountered issues, continuing..."
    }
    echo "[entrypoint] Schema push complete."
  else
    echo "[entrypoint] WARNING: Prisma schema not found at $SCHEMA_DIR"
  fi
}

# ── Helper: check if database has data ──────────────────────
has_data() {
  if [ ! -f "$DB_FILE" ]; then
    return 1
  fi
  # Use sqlite3 if available, otherwise check file size as heuristic
  if command -v sqlite3 > /dev/null 2>&1; then
    ROW_COUNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';" 2>/dev/null || echo "0")
    if [ "$ROW_COUNT" -eq 0 ]; then
      return 1
    fi
    CUSTOMER_COUNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM Customer LIMIT 1;" 2>/dev/null || echo "0")
    if [ "$CUSTOMER_COUNT" -gt 0 ]; then
      return 0
    fi
    return 1
  else
    # Fallback: check if DB file is larger than empty (100KB threshold)
    FILE_SIZE=$(wc -c < "$DB_FILE" 2>/dev/null || echo "0")
    if [ "$FILE_SIZE" -gt 102400 ]; then
      return 0
    fi
    return 1
  fi
}

# ── Helper: seed database using standalone script ───────────
seed_database() {
  local seed_args=""
  local label=""

  if [ "$1" = "force" ]; then
    seed_args="--force"
    label="(force re-seed)"
  fi

  echo "[entrypoint] Seeding database $label..."
  echo "[entrypoint] Running: bun run $SEED_SCRIPT $seed_args"

  # Run the standalone seed script directly (no HTTP overhead)
  cd /app
  bun run "$SEED_SCRIPT" $seed_args
  local exit_code=$?

  if [ $exit_code -eq 0 ]; then
    echo "[entrypoint] Seed completed successfully."
  else
    echo "[entrypoint] WARNING: Seed script exited with code $exit_code"
    echo "[entrypoint] Server will start with existing data if available."
  fi

  return $exit_code
}

# ── Helper: delete all data (reset) ─────────────────────────
reset_database() {
  echo "[entrypoint] Resetting database..."
  if [ -f "$DB_FILE" ]; then
    rm -f "$DB_FILE"
    echo "[entrypoint] Database file removed."
  fi
  ensure_db_dir
}

# ── Helper: show status ─────────────────────────────────────
show_status() {
  echo "[entrypoint] Environment:"
  echo "  NODE_ENV:      ${NODE_ENV:-not set}"
  echo "  DATABASE_URL:  $DATABASE_URL"
  echo "  DB file:       ${DB_FILE}"
  echo "  Data file:     ${DATA_FILE}"
  echo "  DB exists:     $([ -f "$DB_FILE" ] && echo "yes" || echo "no")"
  echo "  Data exists:   $([ -f "$DATA_FILE" ] && echo "yes ($(du -h "$DATA_FILE" 2>/dev/null | cut -f1))" || echo "no (mount data/ volume)")"
  if [ -f "$DB_FILE" ]; then
    echo "  DB size:       $(du -h "$DB_FILE" | cut -f1)"
  fi
  echo ""
}

# ── Main ────────────────────────────────────────────────────
COMMAND="${1:-start}"

show_status
ensure_db_dir

case "$COMMAND" in
  start)
    echo "[entrypoint] Mode: PRODUCTION (seed + start)"
    push_schema
    if ! has_data; then
      seed_database
    else
      echo "[entrypoint] Database already has data, skipping seed."
    fi
    echo "[entrypoint] Starting production server..."
    exec bun server.js
    ;;

  seed)
    echo "[entrypoint] Mode: SEED (schema + seed + exit)"
    push_schema
    seed_database
    echo "[entrypoint] Seed complete. Exiting."
    exit 0
    ;;

  seed-only)
    echo "[entrypoint] Mode: SEED-ONLY (seed without schema push)"
    seed_database
    echo "[entrypoint] Seed complete. Exiting."
    exit 0
    ;;

  reset)
    echo "[entrypoint] Mode: RESET (delete + schema + re-seed + exit)"
    reset_database
    push_schema
    seed_database force
    echo "[entrypoint] Reset complete. Exiting."
    exit 0
    ;;

  dev)
    echo "[entrypoint] Mode: DEVELOPMENT"
    push_schema
    exec bun run dev
    ;;

  *)
    echo "[entrypoint] Unknown command: $COMMAND"
    echo "[entrypoint] Usage: entrypoint.sh [start|seed|seed-only|reset|dev]"
    exit 1
    ;;
esac
