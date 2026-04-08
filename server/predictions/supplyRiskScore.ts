import { PrismaClient } from "@prisma/client";
import type { SupplierRisk, ProductRisk } from "@server/types/index";

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

export interface SupplyRiskParams {
  db: PrismaClient;
}

export interface RiskMatrix {
  critical: number;
  high: number;
  medium: number;
  low: number;
  criticalProducts: number;
  highProducts: number;
  lowStockProducts: number;
}

export interface SupplyRiskResult {
  suppliers: SupplierRisk[];
  products: ProductRisk[];
  riskMatrix: RiskMatrix;
  totalOrdersAnalyzed: number;
  totalSuppliers: number;
  generatedAt: string;
}

// ═══════════════════════════════════════════════
// Supply Chain Risk Scoring Engine
// ═══════════════════════════════════════════════

/** Compute supply chain risk scores from product stock levels and transaction patterns. */
export async function computeSupplyRisk(
  params: SupplyRiskParams,
): Promise<SupplyRiskResult> {
  const { db } = params;

  // ─── Fetch all products ───
  const products = await db.product.findMany({
    select: {
      id: true,
      name: true,
      category: true,
      currentStock: true,
      reorderPoint: true,
      supplierId: true,
      leadTimeDays: true,
      marginPct: true,
    },
  });

  if (products.length === 0) {
    return {
      suppliers: [],
      products: [],
      riskMatrix: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        criticalProducts: 0,
        highProducts: 0,
        lowStockProducts: 0,
      },
      totalOrdersAnalyzed: 0,
      totalSuppliers: 0,
      generatedAt: new Date().toISOString(),
    };
  }

  // ─── Fetch recent transaction summary per product ───
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000);
  const transactions = await db.saleTransaction.findMany({
    where: { date: { gte: ninetyDaysAgo } },
    select: {
      productId: true,
      quantity: true,
      revenue: true,
      wasLate: true,
    },
  });

  // Aggregate per product
  const txByProduct = new Map<string, { qty: number; revenue: number; orders: number; lateOrders: number }>();
  for (const tx of transactions) {
    const pid = tx.productId || "unknown";
    if (!txByProduct.has(pid)) txByProduct.set(pid, { qty: 0, revenue: 0, orders: 0, lateOrders: 0 });
    const entry = txByProduct.get(pid)!;
    entry.qty += tx.quantity;
    entry.revenue += tx.revenue || 0;
    entry.orders++;
    if (tx.wasLate) entry.lateOrders++;
  }

  // ─── Compute Supplier Risk from product aggregation ───
  const supplierProducts = new Map<string, typeof products>();
  for (const p of products) {
    const sid = p.supplierId || "unknown";
    if (!supplierProducts.has(sid)) supplierProducts.set(sid, []);
    supplierProducts.get(sid)!.push(p);
  }

  const supplierRisks: SupplierRisk[] = [];

  for (const [supplierId, supplierProductList] of supplierProducts) {
    const riskFactors: string[] = [];
    const totalProducts = supplierProductList.length;

    // Average lead time
    const leadTimes = supplierProductList.map((p) => p.leadTimeDays || 14);
    const avgLeadTimeDays = Math.round(leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length);

    // Lead time risk
    if (avgLeadTimeDays > 21) {
      riskFactors.push(`High average lead time (${avgLeadTimeDays} days)`);
    }

    // Stock health across products
    const lowStockCount = supplierProductList.filter((p) => p.currentStock < p.reorderPoint).length;
    const criticalStockCount = supplierProductList.filter((p) => p.currentStock < p.reorderPoint * 0.5).length;
    const lowStockPct = lowStockCount / totalProducts;

    if (lowStockPct > 0.5) {
      riskFactors.push(`Poor stock health (${Math.round(lowStockPct * 100)}% below reorder)`);
    }
    if (criticalStockCount > totalProducts * 0.3) {
      riskFactors.push(`Critical stock levels (${criticalStockCount} products)`);
    }

    // Margin pressure
    const avgMargin = supplierProductList.reduce((a, p) => a + (p.marginPct || 20), 0) / totalProducts;
    if (avgMargin < 15) {
      riskFactors.push(`Low margin portfolio (${Math.round(avgMargin)}%)`);
    }

    // Quality proxy: high late-delivery rate from transactions
    let lateDeliveryPct = 0;
    for (const p of supplierProductList) {
      const tx = txByProduct.get(p.id);
      if (tx && tx.orders > 0) {
        lateDeliveryPct += tx.lateOrders / tx.orders;
      }
    }
    lateDeliveryPct /= totalProducts;
    if (lateDeliveryPct > 0.3) {
      riskFactors.push(`High late-delivery rate (${Math.round(lateDeliveryPct * 100)}%)`);
    }

    // Compute risk score (0-100)
    let score = 0;
    score += Math.min(25, avgLeadTimeDays * 1.0);
    score += lowStockPct * 30;
    score += criticalStockCount > 0 ? 15 : 0;
    if (avgMargin < 15) score += (15 - avgMargin) * 1.5;
    score += lateDeliveryPct * 30;

    score = Math.max(0, Math.min(100, Math.round(score)));

    let riskLevel: "low" | "medium" | "high" | "critical" = "low";
    if (score >= 75) riskLevel = "critical";
    else if (score >= 50) riskLevel = "high";
    else if (score >= 25) riskLevel = "medium";

    // Lead time variance
    const leadTimeVariance = Math.round(
      Math.sqrt(leadTimes.reduce((sum, lt) => sum + Math.pow(lt - avgLeadTimeDays, 2), 0) / leadTimes.length) * 10
    ) / 10;

    supplierRisks.push({
      supplierId,
      totalOrders: supplierProductList.reduce((sum, p) => {
        const tx = txByProduct.get(p.id);
        return sum + (tx?.orders || 0);
      }, 0),
      onTimeRate: Math.round((1 - lateDeliveryPct) * 1000) / 1000,
      avgDelayDays: Math.round(lateDeliveryPct * avgLeadTimeDays * 10) / 10,
      avgQualityScore: Math.round(Math.max(5, 10 - lateDeliveryPct * 5) * 100) / 100,
      qualityTrend: "stable" as const,
      avgLeadTimeDays,
      avgActualDeliveryDays: avgLeadTimeDays + Math.round(lateDeliveryPct * avgLeadTimeDays),
      leadTimeVariance,
      riskScore: score,
      riskLevel,
      riskFactors,
    });
  }

  supplierRisks.sort((a, b) => b.riskScore - a.riskScore);

  // ─── Compute Product Risk ───
  const productRisks: ProductRisk[] = [];

  for (const product of products) {
    const riskFactors: string[] = [];

    // Supplier risk
    const supplierId = product.supplierId || "unknown";
    const supplierRisk = supplierRisks.find((sr) => sr.supplierId === supplierId);
    if (supplierRisk && supplierRisk.riskScore >= 50) {
      riskFactors.push(`High-risk supplier (${supplierId})`);
    }

    // Stock status
    const currentStock = product.currentStock || 0;
    const reorderPoint = product.reorderPoint || 50;
    let stockStatus = "adequate";
    if (currentStock < reorderPoint * 0.5) {
      stockStatus = "critical";
      riskFactors.push("Critical stock level");
    } else if (currentStock < reorderPoint) {
      stockStatus = "low";
      riskFactors.push("Below reorder point");
    }

    // Transaction patterns
    const tx = txByProduct.get(product.id);
    const latePct = tx && tx.orders > 0 ? tx.lateOrders / tx.orders : 0;
    if (latePct > 0.3) riskFactors.push("High late-delivery rate");

    // Lead time risk
    if (product.leadTimeDays && product.leadTimeDays > 21) {
      riskFactors.push(`Long lead time (${product.leadTimeDays} days)`);
    }

    // Compute risk score
    let score = 0;
    if (supplierRisk) score += supplierRisk.riskScore * 0.35;
    if (currentStock < reorderPoint * 0.5) score += 20;
    else if (currentStock < reorderPoint) score += 10;
    score += latePct * 20;
    if (product.leadTimeDays && product.leadTimeDays > 21) score += 10;

    score = Math.max(0, Math.min(100, Math.round(score)));

    let riskLevel: "low" | "medium" | "high" | "critical" = "low";
    if (score >= 75) riskLevel = "critical";
    else if (score >= 50) riskLevel = "high";
    else if (score >= 25) riskLevel = "medium";

    productRisks.push({
      productId: product.id,
      productName: product.name,
      category: product.category || null,
      supplierId,
      riskScore: score,
      riskLevel,
      stockStatus,
      riskFactors,
    });
  }

  productRisks.sort((a, b) => b.riskScore - a.riskScore);

  // ─── Risk Matrix Summary ───
  const riskMatrix: RiskMatrix = {
    critical: supplierRisks.filter((s) => s.riskLevel === "critical").length,
    high: supplierRisks.filter((s) => s.riskLevel === "high").length,
    medium: supplierRisks.filter((s) => s.riskLevel === "medium").length,
    low: supplierRisks.filter((s) => s.riskLevel === "low").length,
    criticalProducts: productRisks.filter((p) => p.riskLevel === "critical").length,
    highProducts: productRisks.filter((p) => p.riskLevel === "high").length,
    lowStockProducts: productRisks.filter(
      (p) => p.stockStatus === "low" || p.stockStatus === "critical",
    ).length,
  };

  return {
    suppliers: supplierRisks,
    products: productRisks.slice(0, 50),
    riskMatrix,
    totalOrdersAnalyzed: transactions.length,
    totalSuppliers: supplierRisks.length,
    generatedAt: new Date().toISOString(),
  };
}
