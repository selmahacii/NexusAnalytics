// ═══════════════════════════════════════════════
// Shared date utility functions
// Extracted from: predictions/churn, forecast/revenue, forecast/demand
// ═══════════════════════════════════════════════

/**
 * Return the absolute number of days between two dates.
 */
export function daysBetween(d1: Date, d2: Date): number {
  return Math.abs(Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
}

/**
 * Format a Date object as an ISO date string (YYYY-MM-DD).
 */
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}
