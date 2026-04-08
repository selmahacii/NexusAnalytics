import { PrismaClient } from "@prisma/client";
import { movingAverage, linearRegression } from "@server/math/timeSeries";
import { formatDate } from "@server/utils/dateUtils";

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

export interface DemandForecastParams {
  db: PrismaClient;
  forecastDays?: number;
  categoryId?: string | null;
}

interface CategoryForecast {
  category: string;
  totalHistoricalDemand: number;
  avgDailyDemand: number;
  trend: "up" | "down" | "stable";
  trendPct: number;
  forecast: { date: string; predictedQuantity: number }[];
  stockStatus: string;
}

export interface DemandForecastResult {
  categories: CategoryForecast[];
  forecastDays: number;
  generatedAt: string;
}

// ═══════════════════════════════════════════════
// Demand Forecast Engine
// ═══════════════════════════════════════════════

/** Generate demand forecasts per product category using trend + seasonal decomposition. */
export async function generateDemandForecast(
  params: DemandForecastParams,
): Promise<DemandForecastResult> {
  const { db, categoryId } = params;
  const forecastDays = params.forecastDays ?? 30;

  // Fetch all products grouped by category
  const products = await db.product.findMany({
    where: categoryId ? { category: categoryId } : undefined,
    select: {
      id: true,
      category: true,
      name: true,
      listPrice: true,
      currentStock: true,
      reorderPoint: true,
    },
  });

  const productIdToCategory = new Map(
    products.map((p) => [p.id, p.category || "Uncategorized"]),
  );

  // Fetch transactions — last 365 days
  const now = new Date();
  const startDate = new Date(now);
  startDate.setFullYear(startDate.getFullYear() - 1);

  const transactions = await db.saleTransaction.findMany({
    where: { date: { gte: startDate } },
    select: { date: true, productId: true, quantity: true, revenue: true },
    orderBy: { date: "asc" },
  });

  if (transactions.length < 30) {
    throw new Error(
      `Insufficient transaction data. Need at least 30 transactions. Available: ${transactions.length}`,
    );
  }

  // Aggregate daily demand by category
  const categoryDailyDemand = new Map<string, Map<string, number>>();
  const categoryTotals = new Map<string, number>();

  for (const tx of transactions) {
    const cat =
      productIdToCategory.get(tx.productId || "") || "Unknown";
    const dayKey = formatDate(new Date(tx.date));

    if (!categoryDailyDemand.has(cat))
      categoryDailyDemand.set(cat, new Map());
    const dayMap = categoryDailyDemand.get(cat)!;
    dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + tx.quantity);

    categoryTotals.set(cat, (categoryTotals.get(cat) || 0) + tx.quantity);
  }

  // Sort categories by total demand
  const sortedCategories = [...categoryTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category);

  // Build daily time series per category
  const allDays: string[] = [];
  const d = new Date(startDate);
  while (d <= now) {
    allDays.push(formatDate(d));
    d.setDate(d.getDate() + 1);
  }

  const categorySeries = new Map<string, number[]>();
  for (const cat of sortedCategories) {
    const dayMap = categoryDailyDemand.get(cat)!;
    const series = allDays.map((day) => dayMap.get(day) || 0);
    categorySeries.set(cat, series);
  }

  // Forecast demand for next N days per category
  const forecastDates: string[] = [];
  for (let i = 1; i <= forecastDays; i++) {
    const fd = new Date(now);
    fd.setDate(fd.getDate() + i);
    forecastDates.push(formatDate(fd));
  }

  const categoryForecasts: CategoryForecast[] = [];

  for (const cat of sortedCategories) {
    const series = categorySeries.get(cat)!;
    const totalDemand = series.reduce((s, v) => s + v, 0);
    const avgDemand = totalDemand / series.length;

    // Trend analysis (last 30 vs previous 30)
    const last30 = series.slice(-30);
    const prev30 = series.slice(-60, -30);
    const avgLast30 =
      last30.reduce((s, v) => s + v, 0) / last30.length;
    const avgPrev30 =
      prev30.length > 0
        ? prev30.reduce((s, v) => s + v, 0) / prev30.length
        : avgLast30;

    const { predict } = linearRegression(series);

    let trend: "up" | "down" | "stable" = "stable";
    let trendPct = 0;
    if (avgPrev30 > 0) {
      const changePct = ((avgLast30 - avgPrev30) / avgPrev30) * 100;
      trendPct = Math.round(changePct * 100) / 100;
      if (changePct > 3) trend = "up";
      else if (changePct < -3) trend = "down";
    }

    // Generate forecast using trend + seasonal weekly pattern
    const forecast: { date: string; predictedQuantity: number }[] = [];
    const dayOfWeekAvg = new Array(7).fill(0);
    const dayOfWeekCount = new Array(7).fill(0);
    for (let i = 0; i < series.length; i++) {
      const dow = new Date(allDays[i]).getDay();
      dayOfWeekAvg[dow] += series[i];
      dayOfWeekCount[dow]++;
    }
    for (let i = 0; i < 7; i++) {
      dayOfWeekAvg[i] =
        dayOfWeekCount[i] > 0 ? dayOfWeekAvg[i] / dayOfWeekCount[i] : avgDemand;
    }

    const last30Ma = movingAverage(series, 30);
    const lastMa = last30Ma[last30Ma.length - 1] || avgDemand;

    for (let dd = 0; dd < forecastDays; dd++) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + dd + 1);
      const dow = targetDate.getDay();
      const seasonalFactor = dayOfWeekAvg[dow] / avgDemand;
      const trendVal = predict(series.length + dd);
      const maVal = lastMa * Math.exp(-dd * 0.005);
      const predicted = Math.max(
        0,
        Math.round(
          trendVal * 0.4 +
            maVal * 0.3 +
            avgDemand * seasonalFactor * 0.3,
        ),
      );
      forecast.push({ date: forecastDates[dd], predictedQuantity: predicted });
    }

    // Stock status
    const catProducts = products.filter((p) => p.category === cat);
    const totalStock = catProducts.reduce((s, p) => s + p.currentStock, 0);
    const totalReorder = catProducts.reduce(
      (s, p) => s + p.reorderPoint,
      0,
    );
    const predicted30DayDemand = forecast.reduce(
      (s, f) => s + f.predictedQuantity,
      0,
    );
    let stockStatus = "adequate";
    if (totalStock < totalReorder) stockStatus = "low";
    if (totalStock < predicted30DayDemand * 0.5) stockStatus = "critical";

    categoryForecasts.push({
      category: cat,
      totalHistoricalDemand: totalDemand,
      avgDailyDemand: Math.round(avgDemand),
      trend,
      trendPct,
      forecast,
      stockStatus,
    });
  }

  // Store forecasts in ForecastOutput
  const forecastRecords = categoryForecasts.flatMap((cf) =>
    cf.forecast.map((f, i) => ({
      modelName: "demand_forecaster",
      targetDate: new Date(f.date + "T00:00:00.000Z"),
      predictedValue: f.predictedQuantity,
      confidence: Math.max(0.6, 0.95 - i * 0.01),
      featuresSnapshot: JSON.stringify({
        category: cf.category,
        trend: cf.trend,
        avgDailyDemand: cf.avgDailyDemand,
      }),
    })),
  );

  // Delete existing forecasts to avoid duplicates on repeated calls
  await db.forecastOutput.deleteMany({
    where: { modelName: "demand_forecaster" },
  });

  const BATCH_SIZE = 5000;
  for (let i = 0; i < forecastRecords.length; i += BATCH_SIZE) {
    await db.forecastOutput.createMany({
      data: forecastRecords.slice(i, i + BATCH_SIZE),
    });
  }

  return {
    categories: categoryForecasts,
    forecastDays,
    generatedAt: new Date().toISOString(),
  };
}
