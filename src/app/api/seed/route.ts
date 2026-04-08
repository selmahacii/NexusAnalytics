import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ═══════════════════════════════════════════════
// GET — Check data status
// ═══════════════════════════════════════════════

export async function GET() {
  try {
    const [customerCount, productCount, transactionCount, forecastCount] =
      await Promise.all([
        db.customer.count(),
        db.product.count(),
        db.saleTransaction.count(),
        db.forecastOutput.count(),
      ]);

    const seeded = customerCount > 0;

    return NextResponse.json({
      seeded,
      source: seeded ? "real_data" : "empty",
      counts: {
        customers: customerCount,
        products: productCount,
        transactions: transactionCount,
        forecasts: forecastCount,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════
// POST — Ingest real data from UCI Online Retail dataset
// ═══════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "ingest";

    if (action !== "ingest") {
      return NextResponse.json({ error: "Unknown action. Use ?action=ingest" }, { status: 400 });
    }

    const force = searchParams.get("force") === "true";

    // Dynamic import to avoid loading xlsx on every request.
    // @server/* path alias is resolved by Turbopack at build time.
    // In Docker standalone, the Dockerfile copies server/ files alongside
    // the compiled output so the resolved path remains valid.
    const { ingestOnlineRetail } = await import("@server/ingestion/ingestOnlineRetail");
    const result = await ingestOnlineRetail(db, force);

    if (!result.success && !force) {
      return NextResponse.json({
        message: result.message,
        hint: "Use ?action=ingest&force=true to re-ingest",
      });
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";

    try {
      await db.dataIngestionLog.create({
        data: {
          sourceName: "uci_online_retail",
          status: "failed",
          errorMessage: message,
        },
      });
    } catch {
      // non-critical
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
