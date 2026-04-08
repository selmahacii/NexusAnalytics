# ── Integration test script ──────────────────────────────────
# Runs against a running container to validate all API endpoints.
# Usage: bash docker/test-api.sh [BASE_URL]

set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
PASS=0
FAIL=0
TOTAL=0
RESULTS=""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

header() {
  echo ""
  echo "═══════════════════════════════════════════════════"
  echo "  Nexus Predictive Intelligence — API Integration Tests"
  echo "  Target: $BASE_URL"
  echo "  Date: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
  echo "═══════════════════════════════════════════════════"
  echo ""
}

test_endpoint() {
  local name="$1"
  local method="$2"
  local url="$3"
  local body="${4:-}"
  local expected_field="$5"

  TOTAL=$((TOTAL + 1))

  # Build curl command
  local curl_cmd="curl -sf --max-time 30"
  curl_cmd="$curl_cmd -X $method"

  if [ -n "$body" ]; then
    curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$body'"
  fi

  curl_cmd="$curl_cmd '$url'"

  # Run test
  local response
  response=$(eval "$curl_cmd" 2>/dev/null) || true

  if [ -z "$response" ]; then
    echo -e "  ${RED}✗ $name${NC} — No response (timeout or server down)"
    FAIL=$((FAIL + 1))
    RESULTS="${RESULTS}${RED}FAIL${NC}|$name|No response\n"
    return 1
  fi

  # Check if it's JSON
  if ! echo "$response" | python3 -c "import sys,json; json.load(sys.stdin)" 2>/dev/null; then
    echo -e "  ${RED}✗ $name${NC} — Invalid JSON response"
    FAIL=$((FAIL + 1))
    RESULTS="${RESULTS}${RED}FAIL${NC}|$name|Invalid JSON\n"
    return 1
  fi

  # Check expected field
  if [ -n "$expected_field" ]; then
    if echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print('ok' if '$expected_field' in str(d) else 'fail')" 2>/dev/null | grep -q "ok"; then
      echo -e "  ${GREEN}✓ $name${NC}"
      PASS=$((PASS + 1))
      RESULTS="${RESULTS}${GREEN}PASS${NC}|$name|OK\n"
      return 0
    else
      echo -e "  ${YELLOW}⚠ $name${NC} — Response OK but missing expected field '$expected_field'"
      FAIL=$((FAIL + 1))
      RESULTS="${RESULTS}${YELLOW}WARN${NC}|$name|Missing '$expected_field'\n"
      return 1
    fi
  fi

  # No field check, just verify it's valid JSON
  echo -e "  ${GREEN}✓ $name${NC} — Valid JSON response"
  PASS=$((PASS + 1))
  RESULTS="${RESULTS}${GREEN}PASS${NC}|$name|OK\n"
  return 0
}

# ── Run Tests ──────────────────────────────────────────────────
header

echo "── HTTP Layer ─────────────────────────────────────────"
test_endpoint "Health Check"        "GET"  "$BASE_URL/api"                           "status"
test_endpoint "Seed Status"         "GET"  "$BASE_URL/api/seed?action=status"    "seeded"

echo "── Data Layer ───────────────────────────────────────────"
test_endpoint "Executive Dashboard" "GET"  "$BASE_URL/api/dashboard"               "revenueYtd"
test_endpoint "Revenue Forecast"    "GET"  "$BASE_URL/api/forecast/revenue"         "forecast"
test_endpoint "Demand Forecast"    "GET"  "$BASE_URL/api/forecast/demand"          "categories"
test_endpoint "Churn Prediction"   "GET"  "$BASE_URL/api/predictions/churn"       "totalAnalyzed"
test_endpoint "Supply Risk"         "GET"  "$BASE_URL/api/predictions/supply-risk"  "totalSuppliers"
test_endpoint "Market Intelligence"  "GET"  "$BASE_URL/api/market"                "data"

echo "── ML Layer ─────────────────────────────────────────────"
test_endpoint "Anomaly Events"     "GET"  "$BASE_URL/api/anomalies"               "anomalies"
test_endpoint "Model Registry"      "GET"  "$BASE_URL/api/models"                 "models"
test_endpoint "Data Sources"        "GET"  "$BASE_URL/api/data-sources"            "sources"

echo "── NLP Layer ─────────────────────────────────────────────"
test_endpoint "AI Chat"             "POST" "$BASE_URL/api/ai-chat" \
  '{"message":"What is the current revenue?"}' \
  "message"

echo ""
echo "═══════════════════════════════════════════════════"
echo "  Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC} / $TOTAL total"
echo "═══════════════════════════════════════════════════"
echo ""
echo "Details:"
echo -e "  $RESULTS"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
