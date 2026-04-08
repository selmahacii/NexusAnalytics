// ═══════════════════════════════════════════════
// Shared TypeScript interfaces
// Extracted from: predictions/supply-risk, predictions/churn, anomalies,
//                 models, data-sources
// ═══════════════════════════════════════════════

// ─── Supply Chain Risk ───────────────────────
// Source: /src/app/api/predictions/supply-risk/route.ts

export interface SupplierRisk {
  supplierId: string;
  totalOrders: number;
  onTimeRate: number;
  avgDelayDays: number;
  avgQualityScore: number;
  qualityTrend: "improving" | "stable" | "declining";
  avgLeadTimeDays: number;
  avgActualDeliveryDays: number;
  leadTimeVariance: number;
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  riskFactors: string[];
}

export interface ProductRisk {
  productId: string;
  productName: string;
  category: string | null;
  supplierId: string | null;
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  stockStatus: string;
  riskFactors: string[];
}

// ─── Customer Churn ──────────────────────────
// Source: /src/app/api/predictions/churn/route.ts

export interface CustomerChurnData {
  id: string;
  name: string;
  sector: string | null;
  region: string | null;
  size: string | null;
  creditScore: number | null;
  daysToPayAvg: number;
  churnRisk: number;
  lifetimeValue: number | null;
  acquisitionDate: Date | null;
  lastOrderDate: Date | null;
  totalOrders: number;
  totalRevenue: number;
  isActive: boolean;
  // Computed fields
  avgDaysBetweenOrders: number;
  daysSinceLastOrder: number;
  orderFrequencyTrend: number;
  revenueTrend: number;
  computedRiskScore: number;
  riskFactors: string[];
}

// ─── Anomaly Detection ───────────────────────
// Source: /src/app/api/anomalies/route.ts

export interface AnomalyResult {
  metricName: string;
  metricValue: number;
  expectedValue: number;
  deviationPct: number;
  anomalyScore: number;
  severity: "low" | "medium" | "high" | "critical";
  explanation: string;
}

// ─── Model Performance ───────────────────────
// Source: /src/app/api/models/route.ts

export interface ModelMetricsResult {
  metrics: Record<string, number>;
  trainingRows: number;
}

// ─── Data Sources ────────────────────────────
// Source: /src/app/api/data-sources/route.ts

export interface DataSourceStatus {
  name: string;
  displayName: string;
  status: "healthy" | "degraded" | "empty" | "not_configured" | "error";
  lastUpdate: string | null;
  rows: number;
  refreshInterval: string;
  error?: string;
  metadata?: Record<string, unknown>;
}
