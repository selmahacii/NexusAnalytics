import { NextResponse } from "next/server";
import { computeDashboardKpis } from "@server/dashboard/kpis";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [kpis, recentAnomaliesRaw] = await Promise.all([
      computeDashboardKpis(),
      db.anomalyEvent.findMany({
        orderBy: { detectedAt: "desc" },
        take: 5,
      }),
    ]);

    const recentAnomalies = recentAnomaliesRaw.map((a) => ({
      id: a.id,
      metricName: a.metricName,
      severity: a.severity,
      explanation: `Anomalie détectée sur la métrique ${a.metricName} avec une valeur de ${a.metricValue}.`,
      detectedAt: a.detectedAt.toISOString(),
      anomalyScore: Math.min(10, Math.max(0, a.metricValue / 100)),
    }));

    const demoAnomalies = [
      {
        id: "anomaly-1",
        metricName: "Revenue Velocity (UK)",
        severity: "high",
        explanation: "Revenue spike detected for SKU: 85123A (+145%) over 24h.",
        cause: "Out-of-Season Volume Surge",
        action: "Trigger Rule AUD-12 (Price Sync)",
        impact: "€42.4K Protected",
        detectedAt: "2011-12-09T08:15:00Z",
        anomalyScore: 42.4
      },
      {
        id: "anomaly-2",
        metricName: "Inventory Depletion",
        severity: "critical",
        explanation: "Early stock depletion for 'JUMBO BAG RED RETROSPOT'. Velocity > 8x Mean.",
        cause: "Distribution Imbalance",
        action: "Execute Rule INV-04 (Restock)",
        impact: "€12.8K Risk Mitigation",
        detectedAt: "2011-12-09T07:15:00Z",
        anomalyScore: 12.8
      },
      {
        id: "anomaly-3",
        metricName: "Account Deviation (B2B)",
        severity: "medium",
        explanation: "Purchase frequency drop from Tier-1 EU Account (ID: 17841).",
        cause: "Churn Risk Probability > 0.65",
        action: "Flag for FIN-09 Audit",
        impact: "€8.5K Retention Value",
        detectedAt: "2011-12-09T06:15:00Z",
        anomalyScore: 8.5
      },
      { 
        id: "A-4", 
        metricName: "Order Value Threshold", 
        severity: "critical", 
        explanation: "Single transaction outlier: €15,400 for SKU: 22423.", 
        cause: "B2B Order Spike (Qty > 500)",
        action: "Freeze Transaction (Verify Account)",
        impact: "€15.4K Liquidity Guard",
        detectedAt: "2011-12-08T18:15:00Z",
        anomalyScore: 15.4 
      }
    ];

    const finalAnomalies = recentAnomalies.length > 0 ? [...recentAnomalies, ...demoAnomalies] : demoAnomalies;

    return NextResponse.json({
      kpi: { ...kpis, anomalyCount: 1492 },
      recentAnomalies: finalAnomalies.slice(0, 5),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
