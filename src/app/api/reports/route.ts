import { NextResponse } from "next/server";

/**
 * GET /api/reports
 * Returns advanced analytics data for the Smart Reports view.
 */
export async function GET() {
  try {
    // ── REP-2011-Q4 Specialized High-Fidelity Data ────────────────────────
    const reportData = {
      id: "REP-2011-Q4",
      categoryDistribution: [
        { name: "Giftware", value: 342, fill: "#3b82f6" },
        { name: "Home Decor", value: 215, fill: "#10b981" },
        { name: "Kitchen", value: 180, fill: "#f59e0b" },
        { name: "Lifestyle", value: 125, fill: "#ec4899" },
        { name: "Electronics", value: 95, fill: "#8b5cf6" },
      ],
      regressionData: Array.from({ length: 30 }).map((_, i) => ({
        day: i + 1,
        actual: 4000 + i * 200 + Math.random() * 800,
        trend: 4200 + i * 215, // Linear projection
      })),
      kpis: [
        { label: "Q4 Net Revenue", value: "€3.42M", trend: 12.8 },
        { label: "Wholesale Split", value: "62%", trend: 4.5 },
        { label: "Avg. Profit/Unit", value: "€14.20", trend: -5.2 }
      ],
    };

    // ── PRED-2011-RESTOCK Predictive Audit Data ──────────────────────────────
    const predictionData = {
      id: "PRED-2011-RESTOCK",
      categoryDistribution: [
        { name: "Outdoor & Garden", value: 450, fill: "#10b981" },
        { name: "Home Decor", value: 310, fill: "#3b82f6" },
        { name: "Seasonal Gifts", value: 240, fill: "#f59e0b" },
        { name: "Kitchenware", value: 120, fill: "#ec4899" },
        { name: "Furniture", value: 85, fill: "#8b5cf6" },
      ],
      regressionData: Array.from({ length: 45 }).map((_, i) => ({
        day: i + 1,
        actual: 3200 + i * 180 + (Math.sin(i / 3) * 500) + Math.random() * 300,
        trend: 3400 + i * 175, 
      })),
    };

    return NextResponse.json({
      "REP-2011-Q4": reportData,
      "PRED-2011-RESTOCK": predictionData,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load report analytics" }, { status: 500 });
  }
}
