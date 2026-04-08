import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const customers = await db.customer.findMany({
      orderBy: { totalRevenue: "desc" },
    });

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentMonthStart = new Date(currentYear, currentMonth, 1);

    let activeCount = 0;
    let newThisMonthCount = 0;
    let churnCount = 0;
    let totalLtvObj = 0;
    let ltvCount = 0;

    for (const c of customers) {
      if (c.isActive) activeCount++;
      else churnCount++;

      if (c.acquisitionDate && new Date(c.acquisitionDate) >= currentMonthStart) {
        newThisMonthCount++;
      }
      if (c.lifetimeValue) {
        totalLtvObj += c.lifetimeValue;
        ltvCount++;
      }
    }

    const avgLtv = ltvCount > 0 ? totalLtvObj / ltvCount : 0;
    const churnRate = customers.length > 0 ? (churnCount / customers.length) * 100 : 0;

    return NextResponse.json({
      customers: customers.map(c => ({
        ...c,
        acquisitionDate: c.acquisitionDate ? c.acquisitionDate.toISOString() : null,
        lastOrderDate: c.lastOrderDate ? c.lastOrderDate.toISOString() : null,
      })),
      stats: {
        total: customers.length,
        active: activeCount,
        newThisMonth: newThisMonthCount,
        avgLtv: Math.round(avgLtv),
        churnRate: Math.round(churnRate * 10) / 10,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
