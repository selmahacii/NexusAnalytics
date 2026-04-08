import { NextResponse } from "next/server";

/**
 * GET /api/reports
 * Returns advanced analytics data for the Smart Reports view.
 */
export async function GET() {
  try {
    // ── REP-2026-03-A Specialized High-Fidelity Data ────────────────────────
    const reportData = {
      id: "REP-2026-03-A",
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
        { label: "Q1 Net Revenue", value: "€3.42M", trend: 12.8 },
        { label: "Wholesale Split", value: "62%", trend: 4.5 },
        { label: "Avg. Profit/Unit", value: "€14.20", trend: -5.2 }
      ],
    };

    return NextResponse.json({
      "REP-2026-03-A": reportData,
      // We could add more reports here if needed
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load report analytics" }, { status: 500 });
  }
}
