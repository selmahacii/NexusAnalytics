# ── Nexus Analytics — Makefile ──────────────────────────────────
# Docker shortcuts for build, test, deploy, and data management.

.PHONY: help build up down restart logs shell clean \
        test-build test-up test-logs test-down test-restart test-shell test-run test-api \
        data-seed data-reset data-export data-import data-status data-shell \
        lint

# ── Variables ──────────────────────────────────────────────────
COMPOSE_FILE     ?= docker-compose.yml
COMPOSE_TEST     ?= docker-compose.test.yml
CONTAINER_NAME  ?= nexus-app
CONTAINER_DATA  ?= nexus-data
PORT            ?= 3000
EXPORT_DIR      ?= ./db/export

# ── Help ──────────────────────────────────────────────────────
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		sed 's/##//' | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── Production ─────────────────────────────────────────────────
build: ## Build production image
	docker compose -f $(COMPOSE_FILE) build

up: ## Start production container (detached)
	docker compose -f $(COMPOSE_FILE) up -d --build

down: ## Stop and remove production container
	docker compose -f $(COMPOSE_FILE) down

restart: ## Restart production container
	docker compose -f $(COMPOSE_FILE) restart

logs: ## Follow production container logs
	docker compose -f $(COMPOSE_FILE) logs -f

shell: ## Open a shell inside the running container
	docker exec -it $(CONTAINER_NAME) sh

# ── Testing / Data Seeding ─────────────────────────────────────
test-build: ## Build test image
	docker compose -f $(COMPOSE_TEST) build

test-up: ## Build and start with auto-seed (detached)
	docker compose -f $(COMPOSE_TEST) up -d --build

test-logs: ## Follow test container logs
	docker compose -f $(COMPOSE_TEST) logs -f

test-down: ## Stop and remove test container + DB volume
	docker compose -f $(COMPOSE_TEST) down -v

test-restart: ## Rebuild and restart test container
	docker compose -f $(COMPOSE_TEST) down -v
	docker compose -f $(COMPOSE_TEST) up -d --build

test-shell: ## Open shell inside test container
	docker exec -it $(CONTAINER_DATA) sh

test-run: ## Run a single command inside test container
	@echo "Running: $(CMD)"
	docker exec -it $(CONTAINER_DATA) $(CMD)

# ── Testing API endpoints ──────────────────────────────────────
test-api: ## Run API endpoint tests against running container
	@echo "=== API Endpoint Tests ==="
	@echo ""
	@echo "1/12 Health Check..."
	@curl -sf http://localhost:$(PORT)/api | grep -q '"status":"ok"' && echo "   OK 200" || echo "   FAIL"
	@echo "2/12 Seed Status..."
	@curl -sf http://localhost:$(PORT)/api/seed?action=status | grep -q '"seeded":true' && echo "   OK Seeded" || echo "   FAIL Not seeded"
	@echo "3/12 Dashboard..."
	@curl -sf http://localhost:$(PORT)/api/dashboard | grep -q '"revenueYtd"' && echo "   OK 200" || echo "   FAIL"
	@echo "4/12 Revenue Forecast..."
	@curl -sf http://localhost:$(PORT)/api/forecast/revenue | grep -q '"forecast"' && echo "   OK 200" || echo "   FAIL"
	@echo "5/12 Demand Forecast..."
	@curl -sf http://localhost:$(PORT)/api/forecast/demand | grep -q '"categories"' && echo "   OK 200" || echo "   FAIL"
	@echo "6/12 Churn Prediction..."
	@curl -sf http://localhost:$(PORT)/api/predictions/churn | grep -q '"totalAnalyzed"' && echo "   OK 200" || echo "   FAIL"
	@echo "7/12 Supply Risk..."
	@curl -sf http://localhost:$(PORT)/api/predictions/supply-risk | grep -q '"totalSuppliers"' && echo "   OK 200" || echo "   FAIL"
	@echo "8/12 Market Intelligence..."
	@curl -sf http://localhost:$(PORT)/api/market | grep -q '"data"' && echo "   OK 200" || echo "   FAIL"
	@echo "9/12 Anomalies..."
	@curl -sf http://localhost:$(PORT)/api/anomalies | grep -q '"anomalies"' && echo "   OK 200" || echo "   FAIL"
	@echo "10/12 Models..."
	@curl -sf http://localhost:$(PORT)/api/models | grep -q '"models"' && echo "   OK 200" || echo "   FAIL"
	@echo "11/12 Data Sources..."
	@curl -sf http://localhost:$(PORT)/api/data-sources | grep -q '"sources"' && echo "   OK 200" || echo "   FAIL"
	@echo "12/12 AI Chat..."
	@curl -sf -X POST http://localhost:$(PORT)/api/ai-chat \
		-H "Content-Type: application/json" \
		-d '{"message":"test"}' \
		| grep -q '"message"' && echo "   OK 200" || echo "   FAIL"
	@echo ""
	@echo "=== Tests complete ==="

# ── Data Management ────────────────────────────────────────────
data-seed: ## Trigger data ingestion on running container
	@echo "Ingesting UCI Online Retail dataset..."
	docker exec $(CONTAINER_DATA) bun run /app/server/seed/standaloneSeed.ts

data-reset: ## Reset and re-seed database in data container
	@echo "Resetting and re-seeding database..."
	docker compose -f $(COMPOSE_TEST) exec $(CONTAINER_DATA) /app/docker/entrypoint.sh reset

data-export: ## Export database from running container to host
	@./docker/export-data.sh $(EXPORT_DIR)

data-import: ## Import database into running container from host
	@if [ -z "$(DB_PATH)" ]; then \
		echo "Usage: make data-import DB_PATH=<path_to_db_file>"; \
		echo "Example: make data-import DB_PATH=./db/export/nexus_20250101_120000.db"; \
		exit 1; \
	fi
	@./docker/import-data.sh $(DB_PATH)

data-status: ## Show database status and row counts
	@echo "=== Database Status ==="
	@docker exec $(CONTAINER_DATA) sh -c ' \
		echo "Container: $$(hostname)"; \
		echo "DB file:    $(DATABASE_URL)"; \
		echo "Data file:  /app/data/online_retail.xlsx"; \
		echo "DB exists:  $$( [ -f /app/db/custom.db ] && echo "yes" || echo "no")"; \
		echo "Data exists: $$( [ -f /app/data/online_retail.xlsx ] && echo "yes" || echo "no")"; \
		if [ -f /app/db/custom.db ]; then \
			echo "DB size:    $$(du -h /app/db/custom.db 2>/dev/null || echo "not found")"; \
		fi; \
		echo ""; \
		echo "Table Row Counts:"; \
		echo "------------------"; \
		sqlite3 /app/db/custom.db " \
			SELECT \"  Customers:           \" || COUNT(*) FROM Customer; \
			SELECT \"  Products:            \" || COUNT(*) FROM Product; \
			SELECT \"  Sale Transactions:   \" || COUNT(*) FROM SaleTransaction; \
			SELECT \"  Supply Chain Orders: \" || COUNT(*) FROM SupplyChainOrder; \
			SELECT \"  Financial Actuals:   \" || COUNT(*) FROM FinancialActual; \
			SELECT \"  Production Logs:     \" || COUNT(*) FROM ProductionLog; \
			SELECT \"  Model Versions:      \" || COUNT(*) FROM ModelVersion; \
			SELECT \"  Anomaly Events:      \" || COUNT(*) FROM AnomalyEvent; \
			SELECT \"  Forecast Outputs:    \" || COUNT(*) FROM ForecastOutput; \
		" 2>/dev/null || echo "  (sqlite3 not available - run: apt-get install sqlite3)"; \
	'

data-shell: ## Open SQLite shell in running data container
	@docker exec -it $(CONTAINER_DATA) sh -c ' \
		if command -v sqlite3 > /dev/null 2>&1; then \
			sqlite3 /app/db/custom.db; \
		else \
			echo "sqlite3 not available. Opening shell instead..."; \
			sh; \
		fi \
	'

# ── Linting ───────────────────────────────────────────────────
lint: ## Run ESLint
	bun run lint

# ── Cleanup ───────────────────────────────────────────────────
clean: ## Remove all Docker images, containers, and volumes
	docker compose -f $(COMPOSE_FILE) down -v --rmi local 2>/dev/null || true
	docker compose -f $(COMPOSE_TEST) down -v --rmi local 2>/dev/null || true
	@echo "Cleaned up all Docker resources."
