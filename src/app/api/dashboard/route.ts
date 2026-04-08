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
        id: "A-1", 
        metricName: "Revenue (UK)", 
        severity: "high", 
        explanation: "Revenue spike detected for 'WHITE HANGING HEART T-LIGHT HOLDER' (+145%) over 24h. Possible viral trend or bulk order.", 
        detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), 
        anomalyScore: 8.5 
      },
      { 
        id: "A-3", 
        metricName: "Carrier Performance", 
        severity: "critical", 
        explanation: "Critical latency detected for 'Carrier-FR-02'. 72% of shipments to France delayed by 48h+.", 
        detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), 
        anomalyScore: 9.1 
      },
      { 
        id: "A-4", 
        metricName: "Order Value Threshold", 
        severity: "critical", 
        explanation: "Single transaction outlier detected: €15,400 for 'VINTAGE SNAP CARDS' (Typical avg: €18.5). Potential fraud or B2B misclassification.", 
        detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), 
        anomalyScore: 9.8 
      }
    ];

    const finalAnomalies = recentAnomalies.length > 0 ? [...recentAnomalies, ...demoAnomalies] : demoAnomalies;

    return NextResponse.json({
      kpi: kpis,
      recentAnomalies: finalAnomalies.slice(0, 5),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
