import { PrismaClient } from "@prisma/client";
import { daysBetween } from "@server/utils/dateUtils";
import type { CustomerChurnData } from "@server/types/index";

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

export interface ChurnPredictParams {
  db: PrismaClient;
  limit?: number;
}

export interface ChurnPredictResult {
  predictions: CustomerChurnData[];
  totalAnalyzed: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  generatedAt: string;
}

// ═══════════════════════════════════════════════
// Churn Prediction Engine
// ═══════════════════════════════════════════════

/** Compute churn risk scores for all customers using multi-factor analysis. */
export async function predictCustomerChurn(
  params: ChurnPredictParams,
): Promise<ChurnPredictResult> {
  const { db, limit = 50 } = params;

  // ─── Find reference date (latest transaction) ───
  const latestTx = await db.saleTransaction.findFirst({
    orderBy: { date: "desc" },
    select: { date: true },
  });

  const now = latestTx?.date || new Date("2011-12-09T00:00:00Z");

  // Fetch all customers with recent transactions
  const customers = await db.customer.findMany({
    select: {
      id: true,
      name: true,
      sector: true,
      region: true,
      size: true,
      creditScore: true,
      daysToPayAvg: true,
      churnRisk: true,
      lifetimeValue: true,
      acquisitionDate: true,
      lastOrderDate: true,
      totalOrders: true,
      totalRevenue: true,
      isActive: true,
    },
  });

  if (customers.length === 0) {
    return {
      predictions: [],
      totalAnalyzed: 0,
      highRiskCount: 0,
      mediumRiskCount: 0,
      lowRiskCount: 0,
      generatedAt: now.toISOString(),
    };
  }

  // Fetch transaction data for computing risk factors
  const customerIds = customers.map((c) => c.id);

  const recentTx = await db.saleTransaction.findMany({
    where: {
      customerId: { in: customerIds },
      date: { gte: new Date(now.getFullYear() - 1, 0, 1) },
    },
    select: { customerId: true, date: true, revenue: true },
    orderBy: { date: "asc" },
  });

  // Group transactions by customer
  const txByCustomer = new Map<
    string,
    { date: Date; revenue: number }[]
  >();
  for (const tx of recentTx) {
    if (!tx.customerId) continue;
    if (!txByCustomer.has(tx.customerId))
      txByCustomer.set(tx.customerId, []);
    txByCustomer.get(tx.customerId)!.push({
      date: tx.date,
      revenue: tx.revenue || 0,
    });
  }

  // Compute churn risk for each customer
  const predictions: CustomerChurnData[] = customers.map((customer) => {
    const txList = txByCustomer.get(customer.id) || [];
    const riskFactors: string[] = [];

    // ─── Factor 1: Days since last order ───
    let daysSinceLastOrder = 999;
    if (customer.lastOrderDate) {
      daysSinceLastOrder = daysBetween(customer.lastOrderDate, now);
    } else if (txList.length > 0) {
      daysSinceLastOrder = daysBetween(txList[txList.length - 1].date, now);
    }
    if (daysSinceLastOrder > 90) riskFactors.push("No orders in 90+ days");
    else if (daysSinceLastOrder > 60)
      riskFactors.push("No orders in 60-90 days");

    // ─── Factor 2: Average days between orders ───
    let avgDaysBetweenOrders = 60;
    if (txList.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < txList.length; i++) {
        intervals.push(daysBetween(txList[i - 1].date, txList[i].date));
      }
      avgDaysBetweenOrders =
        intervals.reduce((s, v) => s + v, 0) / intervals.length;
    }

    // ─── Factor 3: Order frequency trend (last 3 months vs previous 3 months) ───
    let orderFrequencyTrend = 0;
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentOrders = txList.filter((tx) => tx.date >= threeMonthsAgo)
      .length;
    const prevOrders = txList.filter(
      (tx) => tx.date >= sixMonthsAgo && tx.date < threeMonthsAgo,
    ).length;
    if (prevOrders > 0) {
      orderFrequencyTrend = (recentOrders - prevOrders) / prevOrders;
    }
    if (orderFrequencyTrend < -0.5)
      riskFactors.push("Declining order frequency (>50%)");
    else if (orderFrequencyTrend < -0.2)
      riskFactors.push("Declining order frequency");

    // ─── Factor 4: Revenue trend ───
    let revenueTrend = 0;
    const recentRevenue = txList
      .filter((tx) => tx.date >= threeMonthsAgo)
      .reduce((s, tx) => s + tx.revenue, 0);
    const prevRevenue = txList
      .filter(
        (tx) => tx.date >= sixMonthsAgo && tx.date < threeMonthsAgo,
      )
      .reduce((s, tx) => s + tx.revenue, 0);
    if (prevRevenue > 0) {
      revenueTrend = (recentRevenue - prevRevenue) / prevRevenue;
    }
    if (revenueTrend < -0.4) riskFactors.push("Revenue decline >40%");

    // ─── Factor 5: Low lifetime value ───
    const ltv = customer.lifetimeValue || 0;
    if (ltv < 100000) riskFactors.push("Low lifetime value");

    // ─── Factor 6: High days to pay ───
    if (customer.daysToPayAvg > 60) riskFactors.push("High payment delay");

    // ─── Factor 7: Credit score ───
    if (customer.creditScore !== null && customer.creditScore < 550) {
      riskFactors.push("Low credit score");
    }

    // ─── Factor 8: Region risk (higher churn in distant regions) ───
    const highRiskRegions = ["Constantine", "Annaba", "Sétif"];
    if (
      customer.region &&
      highRiskRegions.includes(customer.region)
    ) {
      riskFactors.push("Higher-risk region");
    }

    // ─── Factor 9: Small business risk ───
    if (customer.size === "SME" && customer.totalOrders < 10) {
      riskFactors.push("Low-activity SME");
    }

    // ─── Compute composite risk score ───
    let score = 0;

    // Base risk from days since last order (0-30 points)
    score += Math.min(30, daysSinceLastOrder / 5);

    // Frequency decline (0-20 points)
    score += Math.min(20, Math.max(0, -orderFrequencyTrend * 25));

    // Revenue decline (0-15 points)
    score += Math.min(15, Math.max(0, -revenueTrend * 20));

    // Days to pay (0-10 points)
    if (customer.daysToPayAvg > 45) {
      score += Math.min(10, (customer.daysToPayAvg - 45) / 5);
    }

    // Credit score (0-10 points)
    if (customer.creditScore !== null && customer.creditScore < 650) {
      score += (650 - customer.creditScore) / 15;
    }

    // Size factor (0-5 points)
    if (customer.size === "SME") score += 3;
    if (!customer.isActive) score += 15;

    // Low LTV (0-10 points)
    if (ltv < 50000) score += 10;
    else if (ltv < 200000) score += 5;

    // Clamp to 0-100
    score = Math.max(0, Math.min(100, Math.round(score)));

    return {
      id: customer.id,
      name: customer.name,
      sector: customer.sector,
      region: customer.region,
      size: customer.size,
      creditScore: customer.creditScore,
      daysToPayAvg: customer.daysToPayAvg,
      churnRisk: customer.churnRisk,
      lifetimeValue: customer.lifetimeValue,
      acquisitionDate: customer.acquisitionDate,
      lastOrderDate: customer.lastOrderDate,
      totalOrders: customer.totalOrders,
      totalRevenue: customer.totalRevenue,
      isActive: customer.isActive,
      avgDaysBetweenOrders: Math.round(avgDaysBetweenOrders),
      daysSinceLastOrder,
      orderFrequencyTrend: Math.round(orderFrequencyTrend * 100) / 100,
      revenueTrend: Math.round(revenueTrend * 100) / 100,
      computedRiskScore: score,
      riskFactors,
    };
  });

  // Sort by computed risk score (highest risk first)
  predictions.sort((a, b) => b.computedRiskScore - a.computedRiskScore);

  const limited = predictions.slice(0, limit);

  return {
    predictions: limited,
    totalAnalyzed: customers.length,
    highRiskCount: predictions.filter(
      (p) => p.computedRiskScore >= 70,
    ).length,
    mediumRiskCount: predictions.filter(
      (p) => p.computedRiskScore >= 40 && p.computedRiskScore < 70,
    ).length,
    lowRiskCount: predictions.filter(
      (p) => p.computedRiskScore < 40,
    ).length,
    generatedAt: now.toISOString(),
  };
}
