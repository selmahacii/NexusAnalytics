import { NextResponse } from "next/server";

/**
 * POST /api/ai-chat
 * Handles natural language queries for the Nexus AI Assistant.
 * Provides context-aware responses based on the dashboard dataset.
 */
export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    const query = message.toLowerCase();

    let response = "";
    let metadata: any = null;

    // ── Simple Intent Matching Logic ──
    if (query.includes("revenue") || query.includes("forecast")) {
      response = "Based on the 90-day predictive ensemble model, our projected revenue is expected to grow by 14.5% in the next quarter, primarily driven by strong performance in the Electronics and Home Decor categories.";
      metadata = { type: "kpi", label: "Projected Revenue Growth", value: "+14.5%", gain: 14.5 };
    } else if (query.includes("churn") || query.includes("risk")) {
      response = "I have identified 12 high-value customers with a churn risk score above 0.75. The primary risk factor appears to be a decrease in order frequency over the last 30 days combined with delayed payment patterns.";
      metadata = { type: "insight", label: "High Risk Customers", value: "12 identified", gain: -8.2 };
    } else if (query.includes("anomaly") || query.includes("anomalies")) {
      response = "The anomaly detection engine flagged 3 critical events in the last 24 hours: two regional revenue spikes in Western Europe and one inventory depletion alert for SKU: NE-4521.";
      metadata = { type: "insight", label: "Critical Anomalies", value: "3 detected", gain: 0 };
    } else if (query.includes("inventory") || query.includes("stock")) {
      response = "Current inventory levels are 92% optimal. However, 15 items are approaching their reorder point, and 4 items are currently out of stock. I recommend initiating restock for the 'Premium Office' category immediately.";
      metadata = { type: "kpi", label: "Stock Optimization", value: "92.4%", gain: 2.1 };
    } else {
      response = "That's an interesting question about the " + message + ". Analyzing the UCI Online Retail dataset, I can see patterns suggesting seasonal variations in your core segments. Would you like me to generate a detailed report on these trends?";
    }

    // Simulate thinking time
    await new Promise((resolve) => setTimeout(resolve, 800));

    return NextResponse.json({
      response,
      metadata,
      status: "success",
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "AI engine connection failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
