import { db } from "@/lib/db";
import {
  batchInsert,
  generateCustomers,
  generateProducts,
  generateSaleTransactions,
} from "./generators";

// ═══════════════════════════════════════════════
// Seed Result Type
// ═══════════════════════════════════════════════

export interface SeedResult {
  success: boolean;
  message: string;
  counts: Record<string, number>;
  elapsedMs: number;
}

// ═══════════════════════════════════════════════
// Main Seed Function
// ═══════════════════════════════════════════════

/**
 * Seed the database with realistic demo data.
 * Generates customers, products, and transactions.
 */
export async function seedDatabase(
  dbClient: typeof import("@/lib/db").db,
  force?: boolean
): Promise<SeedResult> {
  // Check if already seeded
  const existing = await db.customer.count();
  if (existing > 0 && !force) {
    return {
      success: false,
      message: "Database already seeded",
      counts: { existingCustomers: existing },
      elapsedMs: 0,
    };
  }

  if (existing > 0 && force) {
    // Delete all data in reverse dependency order
    await db.forecastOutput.deleteMany();
    await db.anomalyEvent.deleteMany();
    await db.dataIngestionLog.deleteMany();
    await db.modelVersion.deleteMany();
    await db.saleTransaction.deleteMany();
    await db.product.deleteMany();
    await db.customer.deleteMany();
  }


  const startTime = Date.now();
  const counts: Record<string, number> = {};

  // 1. Generate Customers (2,400)
  const customerData = generateCustomers(2400);
  counts.customers = await batchInsert(customerData, "customer");

  // Get generated customer IDs
  const customers = await db.customer.findMany({ select: { id: true } });
  const customerIds = customers.map((c) => c.id);

  // 2. Generate Products (380)
  const productData = generateProducts(380);
  counts.products = await batchInsert(productData, "product");

  const products = await db.product.findMany({ select: { id: true } });
  const productIds = products.map((p) => p.id);

  // 3. Generate SaleTransactions (180,000)
  counts.transactions = await generateSaleTransactions(
    180000,
    customerIds,
    productIds
  );

  const elapsed = Date.now() - startTime;

  // Log ingestion
  await db.dataIngestionLog.create({
    data: {
      sourceName: "seed_generator",
      status: "completed",
      rowsStored: Object.values(counts).reduce((a, b) => a + b, 0),
      durationMs: elapsed,
      metadata: JSON.stringify({ counts }),
      completedAt: new Date(),
    },
  });

  return {
    success: true,
    message: "Database seeded successfully",
    counts,
    elapsedMs: elapsed,
  };
}
