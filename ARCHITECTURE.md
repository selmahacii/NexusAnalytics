# Nexus Predictive Intelligence -- System Architecture

## 1. High-Level Architecture

Nexus follows a **monolithic Next.js 16** architecture with the App Router pattern. The frontend, backend API layer, and data access layer coexist in a single process, enabling zero-latency communication between UI components and server-side business logic.

```
+=================================================================+
|                        BROWSER (Client)                        |
|                                                                  |
|  +------------------+  +------------------+  +-----------------+ |
|  |  React 19 SPA    |  |  shadcn/ui       |  |  Recharts        | |
|  |  8 Nexus Views   |  |  45+ Components   |  |  5 Chart Types    | |
|  +--------+---------+  +--------+---------+  +--------+--------+ |
|           |                      |                    |            |
|           +----------+-----------+--------------------+            |
|                      |                                        |
|                   fetch() / POST()                           |
|                      |                                        |
+=================================================================+
                       |
            Next.js API Router (Server-Side)
                       |
+=================================================================+
|                     SERVER (Bun Runtime)                        |
|                                                                  |
|  +----------------------------------------------------------+  |
|  |                   API Route Handlers                      |  |
|  |  11 routes | ML inference | External data fetching      |  |
|  +------+-----------------------------------------------+------+  |
|         |                                               |         |
|  +------+-------+  +----------+  +----------+  +---------+--+  |
|  | Prisma ORM   |  | BI SDK   |  | fetch()  |  | Math/ML  |  |
|  | Query/Write  |  | NLP Chat |  | HTTP API |  | Stats    |  |
|  +------+-------+  +-----+----+  +----+-----+  +---------+--+  |
|         |                 |           |                    |     |
+=================================================================+
          |                 |           |                    |
   +------+-----+    +-----+----+   +---+----+         +----+-----+
   |  SQLite   |    |  NLP API  |   | World  |         | In-Memory|
   |  Database  |    |  Service  |   | Open-  |         | Compute  |
   |  21 Models |    |            |   | Meteo  |         |          |
   |  228K+ Rows|    +------------+   | FX API |         +----------+
   +------------+                      | REST   |
                                      |Countries|
                                      +--------+
```

---

## 2. Frontend Layer

### 2.1 Navigation Architecture

The application uses a **single-page application (SPA)** pattern within Next.js. Navigation is managed entirely client-side via Zustand state -- there are no Next.js file-system routes for views (only API routes).

```
page.tsx (Entry Point)
  |
  +-- Zustand Store (app-store.ts)
  |     |-- activeView: ViewId
  |     |-- sidebarCollapsed: boolean
  |     |-- mobileOpen: boolean
  |     |-- setActiveView() -> closes mobile sidebar
  |
  +-- View Router (VIEW_COMPONENTS map)
        |-- "dashboard"      -> DashboardView
        |-- "forecast"        -> ForecastView
        |-- "market"          -> MarketView
        |-- "predictions"     -> PredictionsView
        |-- "ai-chat"         -> AiChatView
        |-- "anomalies"       -> AnomaliesView
        |-- "data-sources"    -> DataSourcesView
        |-- "models"          -> ModelsView
```

### 2.2 Component Architecture

Each view component follows a consistent pattern:

```
ViewComponent (e.g., dashboard-view.tsx)
  |
  +-- Interfaces (TypeScript)
  |     |-- Data interfaces matching API response shapes
  |     |-- Transform functions (API -> component props)
  |
  +-- State Management
  |     |-- useState for local data, loading, error
  |     |-- useEffect for initial data fetch
  |     |-- useCallback for refresh/action handlers
  |
  +-- Loading State
  |     |-- <Skeleton> components from shadcn/ui
  |
  +-- Error State
  |     |-- Error message display
  |
  +-- Main Render
        |-- <Card> layout with shadcn/ui
        |-- Recharts data visualizations
        |-- <Table> for tabular data
        |-- <Badge> for status indicators
        |-- Framer Motion animations
```

### 2.3 UI Component Library

All UI components come from **shadcn/ui** (New York style variant):

- **45+ components** in `src/components/ui/`
- Built on **Radix UI** primitives for accessibility
- Styled with **Tailwind CSS 4** utility classes
- Icons from **Lucide React** (140+ icons used)

---

## 3. Backend Layer (API Routes)

### 3.1 Route Structure

All API routes are Next.js Route Handlers under `src/app/api/`:

```
src/app/api/
  |-- seed/route.ts              GET (status) | POST (generate)
  |-- dashboard/route.ts         GET
  |-- forecast/
  |     |-- revenue/route.ts     GET (?horizon=90)
  |     |-- demand/route.ts      GET (?categoryId=)
  |-- predictions/
  |     |-- churn/route.ts       GET (?minRisk=0.5)
  |     |-- supply-risk/route.ts GET
  |-- market/route.ts            GET (?type=all)
  |-- anomalies/route.ts         GET | POST
  |-- models/route.ts            GET | POST
  |-- ai-chat/route.ts           POST
  |-- data-sources/route.ts      GET
```

### 3.2 Data Flow Pattern

Every API route follows this pattern:

```typescript
export async function GET(request: NextRequest) {
  // 1. Parse query parameters
  const { searchParams } = new URL(request.url);

  try {
    // 2. Query database via Prisma
    const data = await db.model.findMany({ ... });

    // 3. Run ML/statistical inference
    const result = runModel(data);

    // 4. Store results if needed
    await db.forecastOutput.createMany({ data: result });

    // 5. Return JSON response
    return NextResponse.json({ ... });
  } catch (error) {
    // 6. Error handling
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

### 3.3 External Data Integration

The market API route (`/api/market`) fetches live data from three external APIs:

```
/api/market?type=all
  |
  +-- World Bank API (GDP, inflation, trade for Algeria)
  |     URL: https://api.worldbank.org/v2/country/DZ/indicator/...
  |     Auth: None (public API)
  |
  +-- Open-Meteo API (weather forecasts for Algiers)
  |     URL: https://api.open-meteo.com/v1/forecast?latitude=36.75&longitude=3.06
  |     Auth: None (public API)
  |
  +-- REST Countries API (country profiles)
  |     URL: https://restcountries.com/v3.1/region/africa
  |     Auth: None (public API)
  |
  +-- Simulated FX & Commodity data (deterministic random)
```

### 3.4 Intelligent Assistant Integration

The intelligent assistant route (`/api/ai-chat`) uses a natural language processing service:

```
POST /api/ai-chat
  { message: "..." }
  |
  +-- fetchBusinessContext() -- parallel DB queries
  |     |-- Latest financial KPIs
  |     |-- Active anomaly alerts
  |     |-- Customer metrics
  |     |-- Production efficiency
  |     |-- Supply chain delays
  |
  +-- NLP Service initialization
  |
  +-- Chat completion request
  |     |-- System prompt (Nexus persona + business context)
  |     |-- User message
  |
  +-- Response extraction
  |
  +-- Return { success, message, timing, timestamp }
```

---

## 4. Data Layer

### 4.1 Database: Prisma + SQLite

The database uses **Prisma ORM** with **SQLite** as the storage engine:

```typescript
// src/lib/db.ts -- Singleton pattern
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

### 4.2 Schema Design (21 Models)

```
+------------------+     +------------------+     +------------------+
| MARKET DATA (8)  |     | COMPANY DATA (8) |     | ML META (4)      |
+------------------+     +------------------+     +------------------+
| MarketIndicator  |     | Customer         |     | ModelVersion     |
| CommodityPrice   |     | Product          |     | ForecastOutput   |
| ExchangeRate     |     | SaleTransaction  |     | AnomalyEvent     |
| WeatherData      |     | Employee         |     | DataIngestionLog |
| MacroIndicator   |     | SupplyChainOrder |     +------------------+
| EconomicIndicator|     | FinancialActual  |
| NewsSignal       |     | ProductionLog    |
| CountryReference |     +------------------+
+------------------+
```

### 4.3 Seed Data Architecture

The seed route generates **228K+ records** using a deterministic PRNG (Mulberry32 with seed=42):

```
generateCustomers(2400)        -> Customer table
generateProducts(380)           -> Product table
generateSaleTransactions(180000) -> SaleTransaction table
generateEmployees(847)          -> Employee table
generateSupplyChainOrders(45000) -> SupplyChainOrder table
generateFinancialActuals(39)     -> FinancialActual table
generateProductionLogs(731)     -> ProductionLog table
seedModelVersions(7)            -> ModelVersion table
```

All dates are **relative to `new Date()`** (today), ensuring forecasts always have recent data.

Seasonal factors:
- Q4 boost (+35%)
- Summer dip (-15%)
- Ramadan dip (-8%)
- Weekend dip (-40% for Friday/Saturday)

---

## 5. ML/Prediction Layer

### 5.1 Revenue Forecaster (Ensemble)

Three independent models combined with configurable weights:

```
Historical Data (last 365 days)
  |
  +-- Model 1: Moving Average (weights: MA7=0.5, MA14=0.3, MA30=0.2)
  |     Captures short-term momentum
  |
  +-- Model 2: Linear Trend (least-squares regression on 90-day window)
  |     Captures directional growth/decline
  |
  +-- Model 3: Seasonal Decomposition (weekly + yearly patterns)
  |     Captures recurring seasonality
  |
  +-- Ensemble = 0.3 * MA + 0.4 * Trend + 0.3 * Seasonal
  |
  +-- Confidence Intervals: +/-15% expanding with horizon
```

### 5.2 Anomaly Detection (5-Detector Ensemble)

```
Data Stream (revenue, orders, production, FX, supply chain)
  |
  +-- Detector 1: Z-Score (>2 std devs = anomaly)
  +-- Detector 2: IQR (beyond 1.5x IQR fence)
  +-- Detector 3: Percentile (top/bottom 5%)
  +-- Detector 4: Moving Average Deviation
  +-- Detector 5: Seasonal Residual
  |
  +-- Severity Classification:
  |     |z| > 3.0     -> critical
  |     |z| > 2.5     -> high
  |     |z| > 2.0     -> medium
  |     |z| <= 2.0    -> normal (filtered out)
  |
  +-- Store in AnomalyEvent table
```

### 5.3 Customer Churn Scoring

Multi-factor scoring model using customer attributes:

```
For each customer:
  riskScore = f(
    daysToPayAvg,        // Payment behavior
    totalOrders,         // Engagement
    totalRevenue,        // Value
    creditScore,         // Financial health
    lifetimeValue,        // Historical value
    churnRisk            // Pre-seeded base risk
  )

  Risk Classification:
    riskScore >= 0.7  -> HIGH RISK
    riskScore >= 0.5  -> MEDIUM RISK
    riskScore < 0.5   -> LOW RISK
```

### 5.4 Supply Chain Risk Assessment

Per-supplier risk matrix:

```
For each supplier:
  onTimeRate = delivered_on_time / total_orders
  delayRate = 1 - onTimeRate

  Risk Score = weighted(
    delayRate,
    qualityScore (inverted),
    delayDaysAvg
  )

  Risk Level:
    score >= 0.3   -> critical
    score >= 0.2   -> high
    score >= 0.1   -> medium
    score < 0.1    -> low
```

---

## 6. State Management

### 6.1 Zustand Store (`app-store.ts`)

```
AppState
  |-- activeView: ViewId           (8 possible views)
  |-- sidebarCollapsed: boolean     (desktop toggle)
  |-- mobileOpen: boolean           (mobile drawer)
  |
  |-- setActiveView(view)           -> sets view + closes mobile
  |-- toggleSidebar()               -> toggles desktop sidebar
  |-- setMobileOpen(open)           -> controls mobile drawer
```

### 6.2 Component State Pattern

Each view manages its own local state:

```typescript
function ViewComponent() {
  const [data, setData] = useState<DataType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/endpoint")
      .then(r => r.json())
      .then(d => { setData(transform(d)); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return <Skeleton />;
  if (error) return <ErrorDisplay />;
  return <DataDisplay data={data} />;
}
```

---

## 7. Performance Considerations

### 7.1 Database Optimization

- **SQLite** with indexed columns on frequently queried fields (`date`, `symbol`, `country`, `severity`)
- **Prisma batch inserts** (5000 records per batch) for seed data generation
- **`createMany()`** for bulk operations instead of individual inserts

### 7.2 Frontend Optimization

- **Skeleton loading states** for all views (no layout shift)
- **Framer Motion** for smooth transitions (not layout thrashing)
- **`useCallback`** for stable function references
- **`AnimatePresence`** for mount/unmount animations

### 7.3 External API Caching

- Market data results are stored in the database (WeatherData, MacroIndicator, etc.)
- Subsequent calls serve from cache with fallback to live fetch
- No rate limiting issues with World Bank/Open-Meteo public APIs

---

## 8. Security Considerations

- The natural language processing service is used exclusively in server-side API routes (never client-side)
- **Input validation** on all POST endpoints (message length, type checking)
- **Prisma ORM** prevents SQL injection through parameterized queries
- **No exposed secrets** in client-side code
- **CORS** handled by Next.js default configuration

---

## 9. Deployment Architecture

```
                    +------------------+
                    |   Caddy Proxy    |
                    |   (reverse proxy)|
                    +--------+---------+
                             |
                    +--------v---------+
                    |   Next.js App    |
                    |   Port 3000      |
                    +--------+---------+
                             |
                    +--------v---------+
                    |   SQLite DB      |
                    |   /db/custom.db  |
                    +------------------+

Production: bun run start (standalone mode)
Development: bun run dev (Turbopack hot reload)
```

---

## 10. Data Flow Summary

```
User Action
  |
  v
React Component (useState + useEffect)
  |
  v
fetch("/api/endpoint")
  |
  v
Next.js API Route Handler
  |
  +-- Prisma Query (database)
  +-- Statistical Computation (ML inference)
  +-- External API Call (World Bank, Open-Meteo, etc.)
  +-- NLP Service
  |
  v
JSON Response
  |
  v
React Component State Update
  |
  v
UI Re-render (Recharts + shadcn/ui + Framer Motion)
```

---

## 11. Module Dependency Graph

```
page.tsx
  |-- app-store.ts (Zustand)
  |-- dashboard-view.tsx  --> /api/dashboard
  |-- forecast-view.tsx   --> /api/forecast/revenue
  |-- market-view.tsx      --> /api/market
  |-- predictions-view.tsx --> /api/predictions/churn, /api/predictions/supply-risk
  |-- ai-chat-view.tsx     --> /api/ai-chat
  |-- anomalies-view.tsx   --> /api/anomalies
  |-- data-sources-view.tsx --> /api/data-sources
  |-- models-view.tsx      --> /api/models

API Routes
  |-- All routes --> db.ts (Prisma client)
  |-- market/route.ts --> World Bank, Open-Meteo, REST Countries (fetch)
  |-- ai-chat/route.ts --> NLP Service
  |-- seed/route.ts --> db.ts (bulk insert)

Shared
  |-- lib/utils.ts (cn helper)
  |-- components/ui/* (shadcn/ui)
  |-- components/theme-provider.tsx (next-themes)
```

---

## 12. Codebase Statistics

| Category | Files | Total Lines |
|----------|-------|-------------|
| Frontend Views | 8 | 5,094 |
| API Routes | 11 | 3,771 |
| UI Components | 45+ | ~5,500 |
| Core/Config | 5 | ~100 |
| **Total** | **70+** | **~15,341** |

---

## 13. Testing Strategy

The platform is designed for **manual exploratory testing** via the Preview Panel:

1. **Seed the database** via the onboarding modal
2. **Navigate all 8 views** to verify data rendering
3. **Test AI chat** with business questions
4. **Run anomaly scan** and verify detection
5. **Verify live market data** (World Bank, weather, countries)

All API endpoints return structured JSON and can be tested with `curl`.

---

## 14. Future Extensibility

The architecture supports several extension points:

- **New data sources**: Add a new connector function in `market/route.ts` and a new Prisma model
- **New ML models**: Add a new route handler and store results in `ModelVersion` / `ForecastOutput`
- **Real-time updates**: The WebSocket infrastructure is available for live data streaming
- **Authentication**: NextAuth.js v4 is pre-installed and can be configured
- **PostgreSQL migration**: Change the Prisma datasource provider from `sqlite` to `postgresql`
- **Celery/Redis**: Mini-service architecture supports adding background task queues
