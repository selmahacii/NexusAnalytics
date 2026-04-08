import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateRevenueForecast } from "@server/forecast/revenueForecast";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawHorizon = parseInt(searchParams.get("horizon") || "90", 10);
    const horizonDays = Math.max(1, Math.min(365, isNaN(rawHorizon) ? 90 : rawHorizon));
    const result = await generateRevenueForecast({ db, horizonDays });
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
