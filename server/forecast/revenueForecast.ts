import { PrismaClient } from "@prisma/client";
import { mean, stdDev, mape, rmse } from "@server/math/statistics";
import {
  movingAverage,
  linearRegression,
  dayOfWeekAverage,
  yearSeasonality,
} from "@server/math/timeSeries";
import { formatDate } from "@server/utils/dateUtils";

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

export interface RevenueForecastParams {
  db: PrismaClient;
  horizonDays: number;
  startDate?: Date;
  endDate?: Date;
}

export interface RevenueForecastResult {
  dates: string[];
  actual: number[];
  forecast: number[];
  lowerBound: number[];
  upperBound: number[];
  modelContributions: {
    movingAvg: number[];
    trend: number[];
    seasonal: number[];
  };
  ensembleWeights: {
    movingAvg: number;
    trend: number;
    seasonal: number;
  };
  metrics: {
    mape: number;
    rmse: number;
    lastTrainingDate: string;
  };
  horizonDays: number;
}

// ═══════════════════════════════════════════════
// Revenue Forecast Engine
// ═══════════════════════════════════════════════

/** Generate an ensemble revenue forecast (MA + trend + seasonal) for the given horizon. */
export async function generateRevenueForecast(
  params: RevenueForecastParams,
): Promise<RevenueForecastResult> {
  const { db, horizonDays } = params;
  // ─── Find reference date (latest transaction) ───
  const latestTx = await db.saleTransaction.findFirst({
    orderBy: { date: "desc" },
    select: { date: true },
  });

  const endDate = params.endDate || latestTx?.date || new Date("2011-12-09T00:00:00Z");
  const startDate =
    params.startDate ||
    (() => {
      const d = new Date(endDate);
      d.setDate(d.getDate() - 365);
      return d;
    })();

  // Fetch daily revenue data — last 365 days of actuals
  // Since timestamps might be granular (HH:mm:ss.SSS), we fetch raw and aggregate in-memory
  // for absolute precision across days.
  const rawData = await db.saleTransaction.findMany({
    where: { date: { gte: startDate, lt: endDate } },
    select: { date: true, revenue: true },
    orderBy: { date: "asc" },
  });

  if (rawData.length < 30) {
    throw new Error(`Insufficient historical data for forecasting block. Available points: ${rawData.length}`);
  }

  // Build daily time series
  const dailyMap = new Map<string, number>();
  for (const t of rawData) {
    const key = formatDate(new Date(t.date));
    dailyMap.set(key, (dailyMap.get(key) || 0) + (t.revenue || 0));
  }

  // Fill gaps for the time series
  const values: number[] = [];
  const dates: string[] = [];
  const current = new Date(startDate);
  while (current < endDate) {
    const key = formatDate(current);
    values.push(dailyMap.get(key) || 0);
    dates.push(key);
    current.setDate(current.getDate() + 1);
  }

  const n = values.length;
  const startDateStr = formatDate(startDate);

  // ─── Model 1: Moving Averages (7, 14, 30 day) ───
  const ma7 = movingAverage(values, 7);
  const ma14 = movingAverage(values, 14);
  const ma30 = movingAverage(values, 30);

  // Combined moving average: weighted average of 3 windows
  const movingAvgCombined: number[] = values.map((_, i) => {
    return ma7[i] * 0.5 + ma14[i] * 0.3 + ma30[i] * 0.2;
  });

  // ─── Model 2: Trend (linear regression on last 90 days) ───
  const trendWindow = Math.min(90, n);
  const trendValues = values.slice(-trendWindow);
  const { predict } = linearRegression(trendValues);
  const trendSeries: number[] = new Array(n - trendWindow)
    .fill(0)
    .concat(trendValues.map((_, i) => predict(i)));

  // ─── Model 3: Seasonal Decomposition ───
  const startDay = startDate.getDay();
  const startOfYear = new Date(startDate.getFullYear(), 0, 1);
  const startDayOfYear = Math.floor(
    (startDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24),
  );

  const weeklySeasonal = dayOfWeekAverage(values, startDateStr);
  const yearlySeasonal = yearSeasonality(values, startDateStr);
  const lastAvg = mean(values.slice(-30));
  const seasonalSeries: number[] = values.map((_, i) => {
    const dow = (startDay + i) % 7;
    const weeklyFactor =
      weeklySeasonal[dow] /
      (weeklySeasonal.reduce((s, v) => s + v, 0) / 7);
    const doy = (startDayOfYear + i) % 365;
    const yearlyFactor = (yearlySeasonal[doy] + lastAvg) / lastAvg;
    return lastAvg * weeklyFactor * yearlyFactor;
  });

  // ─── Ensemble Forecast ───
  const weights = { movingAvg: 0.3, trend: 0.4, seasonal: 0.3 };
  const ensembleHistorical: number[] = values.map((_, i) => {
    return (
      movingAvgCombined[i] * weights.movingAvg +
      trendSeries[i] * weights.trend +
      seasonalSeries[i] * weights.seasonal
    );
  });

  // ─── In-sample Metrics (last 30 days) ───
  const actualLast30 = values.slice(-30);
  const predictedLast30 = ensembleHistorical.slice(-30);
  const mapeValue = mape(actualLast30, predictedLast30);
  const rmseValue = rmse(actualLast30, predictedLast30);

  // ─── Generate Forecast ───
  const forecast: number[] = [];
  const lowerBound: number[] = [];
  const upperBound: number[] = [];
  const forecastDates: string[] = [];
  const movingAvgForecast: number[] = [];
  const trendForecast: number[] = [];
  const seasonalForecast: number[] = [];

  // Last values for continuation
  const lastMa7 = ma7[n - 1];
  const lastMa14 = ma14[n - 1];
  const lastMa30 = ma30[n - 1];
  const _residualStd = stdDev(
    values.slice(-30).map((v, i) => v - ensembleHistorical[n - 30 + i]),
  );

  for (let d = 0; d < horizonDays; d++) {
    const targetDate = new Date(endDate);
    targetDate.setDate(targetDate.getDate() + d);
    forecastDates.push(formatDate(targetDate));

    const dayIndex = n + d;

    // Moving avg continuation (decaying toward overall mean)
    const overallMean = mean(values);
    const maDecay = Math.exp(-d * 0.02);
    const maVal =
      (lastMa7 * 0.5 + lastMa14 * 0.3 + lastMa30 * 0.2) * maDecay +
      overallMean * (1 - maDecay);
    movingAvgForecast.push(maVal);

    // Trend continuation
    const trendVal = predict(trendWindow + d);
    trendForecast.push(trendVal);

    // Seasonal continuation
    const dow = (startDay + dayIndex) % 7;
    const weeklyFactor =
      weeklySeasonal[dow] /
      (weeklySeasonal.reduce((s, v) => s + v, 0) / 7);
    const doy = (startDayOfYear + dayIndex) % 365;
    const yearlyFactor = (yearlySeasonal[doy] + lastAvg) / lastAvg;
    const seasonVal = lastAvg * weeklyFactor * yearlyFactor;
    seasonalForecast.push(seasonVal);

    // Ensemble
    const ensemble =
      maVal * weights.movingAvg +
      trendVal * weights.trend +
      seasonVal * weights.seasonal;
    forecast.push(ensemble);

    // Confidence interval: ±15% expanding with horizon
    const expansion = 1 + d / horizonDays;
    const confidence = 1.15 * expansion;
    lowerBound.push(ensemble / confidence);
    upperBound.push(ensemble * confidence);
  }

  const adjustedForecast = forecast;

  // ─── Store in ForecastOutput ───
  const forecastEntries = forecastDates.map((date, i) => ({
    modelName: "revenue_forecaster",
    targetDate: new Date(date + "T00:00:00.000Z"),
    predictedValue: Math.round(adjustedForecast[i]),
    lowerBound: Math.round(lowerBound[i]),
    upperBound: Math.round(upperBound[i]),
    confidence:
      Math.round((1 - 0.15 * (1 + i / horizonDays)) * 100) / 100,
    featuresSnapshot: JSON.stringify({
      movingAvg: Math.round(movingAvgForecast[i]),
      trend: Math.round(trendForecast[i]),
      seasonal: Math.round(seasonalForecast[i]),
    }),
  }));

  // Delete existing forecasts to avoid duplicates on repeated calls
  await db.forecastOutput.deleteMany({
    where: { modelName: "revenue_forecaster" },
  });

  // Store in batches
  const BATCH_SIZE = 5000;
  for (let i = 0; i < forecastEntries.length; i += BATCH_SIZE) {
    const chunk = forecastEntries.slice(i, i + BATCH_SIZE);
    await db.forecastOutput.createMany({ data: chunk });
  }

  return {
    dates: forecastDates,
    actual: values.slice(-Math.min(90, n)).map((v) => Math.round(v)),
    forecast: adjustedForecast.map((v) => Math.round(v)),
    lowerBound: lowerBound.map((v) => Math.round(v)),
    upperBound: upperBound.map((v) => Math.round(v)),
    modelContributions: {
      movingAvg: movingAvgForecast.map((v) => Math.round(v)),
      trend: trendForecast.map((v) => Math.round(v)),
      seasonal: seasonalForecast.map((v) => Math.round(v)),
    },
    ensembleWeights: weights,
    metrics: {
      mape: Math.round(mapeValue * 100) / 100,
      rmse: Math.round(rmseValue),
      lastTrainingDate: formatDate(endDate),
    },
    horizonDays,
  };
}
