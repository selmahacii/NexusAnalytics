// ═══════════════════════════════════════════════
// Shared statistical functions
// Extracted from: forecast/revenue, predictions/supply-risk, anomalies
// ═══════════════════════════════════════════════

/**
 * Compute the arithmetic mean of a number array.
 * Returns 0 for empty arrays.
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

/**
 * Compute the sample standard deviation.
 * Uses Bessel's correction (n-1 denominator) for unbiased estimation.
 * Returns 0 for arrays with fewer than 2 elements.
 */
export function stdDev(values: number[], avg?: number): number {
  const m = avg !== undefined ? avg : mean(values);
  if (values.length < 2) return 0;
  const variance = values.reduce((s, v) => s + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * Compute the z-score of a value given the population mean and standard deviation.
 * Returns 0 when standard deviation is 0 (undefined z-score).
 */
export function zScore(value: number, avg: number, sd: number): number {
  if (sd === 0) return 0;
  return (value - avg) / sd;
}

/**
 * Compute Mean Absolute Percentage Error (MAPE) between actual and predicted arrays.
 * Skips entries where actual[i] === 0 to avoid division by zero.
 * Returns the MAPE as a percentage (0–100).
 */
export function mape(actual: number[], predicted: number[]): number {
  let sum = 0;
  let count = 0;
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== 0) {
      sum += Math.abs((actual[i] - predicted[i]) / actual[i]);
      count++;
    }
  }
  return count > 0 ? (sum / count) * 100 : 0;
}

/**
 * Compute Root Mean Squared Error (RMSE) between actual and predicted arrays.
 */
export function rmse(actual: number[], predicted: number[]): number {
  let sum = 0;
  for (let i = 0; i < actual.length; i++) {
    sum += (actual[i] - predicted[i]) ** 2;
  }
  return Math.sqrt(sum / actual.length);
}
