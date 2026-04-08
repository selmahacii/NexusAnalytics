import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateDemandForecast } from "@server/forecast/demandForecast";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId") || null;
    const result = await generateDemandForecast({ db, categoryId });
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
