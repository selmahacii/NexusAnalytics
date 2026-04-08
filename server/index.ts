/**
 * Barrel export for all public server modules.
 */

// ─── Statistical utilities ──────────────────────
export { mean, stdDev, zScore, mape, rmse } from "./math/statistics";

export {
  movingAverage,
  linearRegression,
  dayOfWeekAverage,
  yearSeasonality,
} from "./math/timeSeries";
export type { TimePoint } from "./math/timeSeries";

// ─── Date utilities ─────────────────────────────
export { daysBetween, formatDate } from "./utils/dateUtils";

// ─── Shared types ───────────────────────────────
export type {
  SupplierRisk,
  ProductRisk,
  CustomerChurnData,
} from "./types/index";

// ─── Forecasting ────────────────────────────────
export { generateRevenueForecast } from "./forecast/revenueForecast";
export { generateDemandForecast } from "./forecast/demandForecast";

// ─── Predictions ────────────────────────────────
export { predictCustomerChurn } from "./predictions/churnScore";
export { computeSupplyRisk } from "./predictions/supplyRiskScore";

// ─── Dashboard ──────────────────────────────────
export { computeDashboardKpis } from "./dashboard/kpis";

// ─── Seeding ────────────────────────────────────
export { seedDatabase } from "./seed/seedDatabase";

// ─── Infrastructure ────────────────────────────
export { getCache, setCache } from "./cache/inMemoryCache";
export { batchInsert } from "./db/batchInsert";
export { log } from "./utils/logger";
