// ═══════════════════════════════════════════════
// Shared time-series analysis functions
// Extracted from: forecast/revenue, forecast/demand
// ═══════════════════════════════════════════════

export interface TimePoint {
  date: string;
  value: number;
}

/**
 * Compute a simple moving average over a numeric array.
 * For each position i, averages the last `window` values (or fewer at the start).
 */
export function movingAverage(values: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    result.push(slice.reduce((s, v) => s + v, 0) / slice.length);
  }
  return result;
}

/**
 * Fit a simple linear regression y = slope * x + intercept to the values array
 * where x is the array index (0, 1, 2, ...).
 * Returns slope, intercept, and a predict function for extrapolation.
 */
export function linearRegression(values: number[]): {
  slope: number;
  intercept: number;
  predict: (x: number) => number;
} {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] || 0, predict: () => values[0] || 0 };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }

  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n, predict: () => sumY / n };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  return {
    slope,
    intercept,
    predict: (x: number) => slope * x + intercept,
  };
}

/**
 * Compute average value for each day of the week (Sunday=0 … Saturday=6).
 * Uses `startDate` to determine which day of the week index 0 maps to.
 * Returns an array of 7 averages.
 */
export function dayOfWeekAverage(values: number[], startDate: string): number[] {
  const startDay = new Date(startDate).getDay();
  const sums = [0, 0, 0, 0, 0, 0, 0];
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < values.length; i++) {
    const dow = (startDay + i) % 7;
    sums[dow] += values[i];
    counts[dow]++;
  }
  return sums.map((s, i) => (counts[i] > 0 ? s / counts[i] : 0));
}

/**
 * Compute average value for each day-of-year position (0–364).
 * Uses `startDate` to determine which day-of-year index 0 maps to.
 * Returns a 365-element array of normalized seasonal values (deviation from global mean).
 */
export function yearSeasonality(values: number[], startDate: string): number[] {
  const start = new Date(startDate);
  const startOfYear = new Date(start.getFullYear(), 0, 1);
  const startDayOfYear = Math.floor(
    (start.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysPerYear = 365;

  const buckets = new Map<number, number[]>();
  for (let i = 0; i < values.length; i++) {
    const pos = (startDayOfYear + i) % daysPerYear;
    if (!buckets.has(pos)) buckets.set(pos, []);
    buckets.get(pos)!.push(values[i]);
  }

  const seasonal: number[] = new Array(daysPerYear).fill(0);
  for (const [pos, vals] of buckets) {
    seasonal[pos] = vals.reduce((s, v) => s + v, 0) / vals.length;
  }

  // Normalize: subtract global mean
  const globalMean = values.reduce((s, v) => s + v, 0) / values.length;
  return seasonal.map((v) => v - globalMean);
}
