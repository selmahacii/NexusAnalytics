import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "ok", timestamp: "2011-12-09T08:15:00Z" });
}
