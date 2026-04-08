import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const products = await db.product.findMany({
      orderBy: { currentStock: "asc" },
    });

    let totalProducts = 0;
    let lowStockItems = 0;
    let outOfStockItems = 0;
    let totalStockValue = 0;

    for (const p of products) {
      if (p.isActive) totalProducts++;
      if (p.currentStock <= 0) outOfStockItems++;
      else if (p.currentStock <= p.reorderPoint) lowStockItems++;

      if (p.costPrice) {
        totalStockValue += p.costPrice * Math.max(0, p.currentStock);
      }
    }

    return NextResponse.json({
      products,
      stats: {
        total: totalProducts,
        lowStock: lowStockItems,
        outOfStock: outOfStockItems,
        stockValue: totalStockValue,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
