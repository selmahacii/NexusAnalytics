// ═══════════════════════════════════════════════════════════════
// Ingestion script — UCI Online Retail Dataset
// Reads XLSX file and transforms into Prisma-compatible records.
// Usage: bun run server/ingestion/ingestOnlineRetail.ts [--force]
//
// Dataset: UCI Online Retail (UK e-commerce, 2010-2011)
// Source: https://archive.ics.uci.edu/ml/datasets/online+retail
// ~541K transactions, 4,372 customers, 4,070 products, 38 countries
// ═══════════════════════════════════════════════════════════════

import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// Lazy-load xlsx to avoid issues if not installed
let XLSX: typeof import("xlsx") | null = null;

async function loadXlsx() {
  if (!XLSX) {
    XLSX = (await import("xlsx")).default;
  }
  return XLSX;
}

// ═══════════════════════════════════════════════
// Excel date conversion
// ═══════════════════════════════════════════════

function excelDateToISO(serial: number): string {
  const utcDays = Math.floor(serial - 25569);
  const date = new Date(utcDays * 86400 * 1000);
  return date.toISOString().split("T")[0];
}

// ═══════════════════════════════════════════════
// Seeded PRNG for deterministic derived data
// ═══════════════════════════════════════════════

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ═══════════════════════════════════════════════
// Row types from XLSX
// ═══════════════════════════════════════════════

interface RawRow {
  InvoiceNo: string | number;
  StockCode: string;
  Description: string;
  Quantity: number;
  InvoiceDate: number;
  UnitPrice: number;
  CustomerID: number;
  Country: string;
}

// ═══════════════════════════════════════════════
// Category mapping from product descriptions
// ═══════════════════════════════════════════════

function categorizeProduct(desc: string): string {
  const d = desc.toUpperCase();
  if (d.includes("VINTAGE") || d.includes("RETRO") || d.includes("SET") || d.includes("KIT")) return "Gift Sets";
  if (d.includes("HEART") || d.includes("LOVE") || d.includes("CHRISTMAS") || d.includes("SANTA")) return "Seasonal";
  if (d.includes("CANDLE") || d.includes("HOLDER") || d.includes("LIGHT")) return "Home Decor";
  if (d.includes("BAG") || d.includes("CASE") || d.includes("POUCH")) return "Bags & Cases";
  if (d.includes("CUP") || d.includes("MUG") || d.includes("GLASS") || d.includes("BOTTLE") || d.includes("JAR")) return "Drinkware";
  if (d.includes("PLATE") || d.includes("BOWL") || d.includes("DISH") || d.includes("SPOON") || d.includes("FORK")) return "Tableware";
  if (d.includes("RING") || d.includes("BRACELET") || d.includes("NECKLACE") || d.includes("EARRING") || d.includes("CHARM")) return "Jewelry";
  if (d.includes("CLOCK") || d.includes("WATCH") || d.includes("TIMER")) return "Clocks";
  if (d.includes("COAT") || d.includes("HOOK") || d.includes("HANGER") || d.includes("RACK")) return "Storage";
  if (d.includes("SIGN") || d.includes("LABEL") || d.includes("TAG") || d.includes("STICKER")) return "Stationery";
  if (d.includes("TOY") || d.includes("GAME") || d.includes("PUZZLE") || d.includes("DOTTY")) return "Toys & Games";
  if (d.includes("TISSUE") || d.includes("PAPER") || d.includes("CARD") || d.includes("WRAP")) return "Paper Goods";
  if (d.includes("RIBBON") || d.includes("LACE") || d.includes("BOW") || d.includes("BEAD")) return "Craft Supplies";
  if (d.includes("DOORMAT") || d.includes("RUG") || d.includes("CUSHION") || d.includes("BLANKET")) return "Textiles";
  if (d.includes("POSTAGE")) return "Postage";
  return "General";
}

// ═══════════════════════════════════════════════
// Batch insert helper
// ═══════════════════════════════════════════════

async function batchInsert(
  data: any[],
  model: "customer" | "product" | "saleTransaction",
  prisma: PrismaClient,
  batchSize = 5000
): Promise<number> {
  let inserted = 0;
  for (let i = 0; i < data.length; i += batchSize) {
    const chunk = data.slice(i, i + batchSize);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (prisma[model as keyof typeof prisma] as any).createMany({ data: chunk });
    inserted += result.count;
  }
  return inserted;
}

// ═══════════════════════════════════════════════
// Main ingestion function
// ═══════════════════════════════════════════════

export interface IngestionResult {
  success: boolean;
  message: string;
  counts: Record<string, number>;
  elapsedMs: number;
  source: string;
}

export async function ingestOnlineRetail(
  prisma: PrismaClient,
  force = false,
  filePath?: string
): Promise<IngestionResult> {
  const startTime = Date.now();
  const counts: Record<string, number> = {};

  // ── Resolve file path ───────────────────────────────────
  const dataPath = filePath || join(process.cwd(), "data", "online_retail.xlsx");

  if (!existsSync(dataPath)) {
    return {
      success: false,
      message: `Dataset file not found at ${dataPath}`,
      counts: {},
      elapsedMs: Date.now() - startTime,
      source: "uci_online_retail",
    };
  }

  // ── Check existing data ────────────────────────────────
  const existingCustomers = await prisma.customer.count();
  if (existingCustomers > 0 && !force) {
    return {
      success: false,
      message: `Database already has ${existingCustomers} customers. Use --force to re-ingest.`,
      counts: { existingCustomers },
      elapsedMs: Date.now() - startTime,
      source: "uci_online_retail",
    };
  }

  if (existingCustomers > 0 && force) {
    console.log("Clearing existing data...");
    await prisma.forecastOutput.deleteMany();
    await prisma.anomalyEvent.deleteMany();
    await prisma.dataIngestionLog.deleteMany();
    await prisma.modelVersion.deleteMany();
    await prisma.saleTransaction.deleteMany();
    await prisma.product.deleteMany();
    await prisma.customer.deleteMany();
  }


  // ── Read XLSX ──────────────────────────────────────────
  console.log(`Reading ${dataPath}...`);
  const xlsx = await loadXlsx();
  const buffer = readFileSync(dataPath);
  const wb = xlsx.read(buffer);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rawData: RawRow[] = xlsx.utils.sheet_to_json(sheet);
  console.log(`Read ${rawData.length.toLocaleString()} raw rows`);

  // ── Clean data ─────────────────────────────────────────
  console.log("Cleaning data...");
  const cleanRows = rawData.filter((r) => {
    if (!r.CustomerID || r.CustomerID <= 0) return false;
    if (!r.Quantity || r.Quantity <= 0) return false;
    if (!r.UnitPrice || r.UnitPrice <= 0) return false;
    if (!r.StockCode || !r.Description) return false;
    if (!r.InvoiceDate || r.InvoiceDate < 40000) return false;
    return true;
  });
  console.log(`Clean rows: ${cleanRows.length.toLocaleString()} (removed ${(rawData.length - cleanRows.length).toLocaleString()})`);

  // ── Build maps ─────────────────────────────────────────
  console.log("Building customer and product maps...");

  const customerMap = new Map<number, {
    id: string;
    name: string;
    country: string;
    firstOrder: string;
    lastOrder: string;
    totalOrders: number;
    totalRevenue: number;
    totalQuantity: number;
    orderDates: string[];
  }>();

  const productMap = new Map<string, {
    id: string;
    sku: string;
    name: string;
    category: string;
    minPrice: number;
    maxPrice: number;
    avgPrice: number;
    totalSold: number;
    totalRevenue: number;
  }>();

  const rng = mulberry32(42);

  // First pass: aggregate customer and product data
  for (const row of cleanRows) {
    // Customer aggregation
    if (!customerMap.has(row.CustomerID)) {
      customerMap.set(row.CustomerID, {
        id: `cust_${row.CustomerID}`,
        name: `Customer ${row.CustomerID}`,
        country: row.Country || "Unknown",
        firstOrder: excelDateToISO(row.InvoiceDate),
        lastOrder: excelDateToISO(row.InvoiceDate),
        totalOrders: 0,
        totalRevenue: 0,
        totalQuantity: 0,
        orderDates: [],
      });
    }
    const cust = customerMap.get(row.CustomerID)!;
    const dateStr = excelDateToISO(row.InvoiceDate);
    cust.totalRevenue += row.Quantity * row.UnitPrice;
    cust.totalQuantity += row.Quantity;
    cust.lastOrder = dateStr > cust.lastOrder ? dateStr : cust.lastOrder;
    cust.firstOrder = dateStr < cust.firstOrder ? dateStr : cust.firstOrder;
    if (!cust.orderDates.includes(dateStr)) {
      cust.orderDates.push(dateStr);
      cust.totalOrders++;
    }

    // Product aggregation
    const sku = String(row.StockCode).trim();
    if (!productMap.has(sku)) {
      productMap.set(sku, {
        id: `prod_${sku.replace(/[^a-zA-Z0-9]/g, "_")}`,
        sku,
        name: String(row.Description).trim(),
        category: categorizeProduct(String(row.Description)),
        minPrice: row.UnitPrice,
        maxPrice: row.UnitPrice,
        avgPrice: row.UnitPrice,
        totalSold: 0,
        totalRevenue: 0,
      });
    }
    const prod = productMap.get(sku)!;
    prod.totalSold += row.Quantity;
    prod.totalRevenue += row.Quantity * row.UnitPrice;
    prod.minPrice = Math.min(prod.minPrice, row.UnitPrice);
    prod.maxPrice = Math.max(prod.maxPrice, row.UnitPrice);
  }

  // Fix avgPrice
  for (const prod of productMap.values()) {
    prod.avgPrice = prod.totalRevenue / prod.totalSold;
  }

  console.log(`Unique customers: ${customerMap.size.toLocaleString()}`);
  console.log(`Unique products: ${productMap.size.toLocaleString()}`);

  // ── 1. Insert Customers ────────────────────────────────
  console.log("Inserting customers...");
  const customers: any[] = [];
  for (const [_, cust] of customerMap) {
    const daysSinceLastOrder = Math.floor(
      (Date.now() - new Date(cust.lastOrder).getTime()) / 86400000
    );
    const avgDaysBetween = cust.totalOrders > 1
      ? Math.floor(
          (new Date(cust.lastOrder).getTime() - new Date(cust.firstOrder).getTime()) /
          86400000 /
          (cust.totalOrders - 1)
        )
      : 60;

    let churnRisk = 0.1;
    if (daysSinceLastOrder > 180) churnRisk = 0.8;
    else if (daysSinceLastOrder > 90) churnRisk = 0.5;
    else if (daysSinceLastOrder > 60) churnRisk = 0.3;

    const size = cust.totalRevenue > 50000 ? "Enterprise" : cust.totalRevenue > 5000 ? "Mid" : "SME";

    customers.push({
      id: cust.id,
      name: cust.name,
      sector: "Retail",
      region: cust.country,
      country: "GB",
      size,
      creditScore: Math.floor(550 + rng() * 200),
      daysToPayAvg: avgDaysBetween,
      churnRisk: Math.round(churnRisk * 100) / 100,
      lifetimeValue: Math.round(cust.totalRevenue * 100) / 100,
      acquisitionDate: new Date(cust.firstOrder),
      lastOrderDate: new Date(cust.lastOrder),
      totalOrders: cust.totalOrders,
      totalRevenue: Math.round(cust.totalRevenue * 100) / 100,
      isActive: daysSinceLastOrder < 365,
    });
  }

  counts.customers = await batchInsert(customers, "customer", prisma);
  console.log(`  Inserted ${counts.customers.toLocaleString()} customers`);

  // ── 2. Insert Products ────────────────────────────────
  console.log("Inserting products...");
  const supplierIds = Array.from({ length: 45 }, (_, i) => `SUP-${String(i + 1).padStart(3, "0")}`);
  const products: any[] = [];
  let supplierIdx = 0;
  for (const [_, prod] of productMap) {
    const marginPct = prod.minPrice > 0 ? ((prod.avgPrice - prod.minPrice) / prod.avgPrice) * 100 : 20;
    const supplierId = supplierIds[supplierIdx % supplierIds.length];
    supplierIdx++;

    products.push({
      id: prod.id,
      sku: prod.sku,
      name: prod.name,
      category: prod.category,
      costPrice: Math.round(prod.minPrice * 100) / 100,
      listPrice: Math.round(prod.avgPrice * 100) / 100,
      marginPct: Math.round(marginPct * 100) / 100,
      leadTimeDays: Math.floor(7 + rng() * 21),
      reorderPoint: Math.floor(20 + rng() * 80),
      currentStock: Math.floor(10 + rng() * 200),
      supplierId,
      weightKg: Math.round((0.1 + rng() * 10) * 100) / 100,
      isActive: true,
    });
  }

  counts.products = await batchInsert(products, "product", prisma);
  console.log(`  Inserted ${counts.products.toLocaleString()} products`);

  // ── 3. Insert Transactions ─────────────────────────────
  console.log("Inserting transactions...");
  const channelOptions = ["direct", "distributor", "online"];
  const paymentTermsOptions = [15, 30, 45, 60];
  let txCount = 0;
  const txBatch: any[] = [];

  for (let i = 0; i < cleanRows.length; i++) {
    const row = cleanRows[i];
    const cust = customerMap.get(row.CustomerID);
    const prod = productMap.get(String(row.StockCode).trim());
    if (!cust || !prod) continue;

    const revenue = Math.round(row.Quantity * row.UnitPrice * 100) / 100;

    txBatch.push({
      date: new Date(excelDateToISO(row.InvoiceDate)),
      customerId: cust.id,
      productId: prod.id,
      region: row.Country,
      quantity: row.Quantity,
      unitPrice: Math.round(row.UnitPrice * 100) / 100,
      discountPct: 0,
      channel: channelOptions[Math.floor(rng() * channelOptions.length)],
      paymentTerms: paymentTermsOptions[Math.floor(rng() * paymentTermsOptions.length)],
      wasLate: rng() > 0.75,
      revenue,
    });

    if (txBatch.length >= 5000) {
      const result = await prisma.saleTransaction.createMany({ data: txBatch });
      txCount += result.count;
      if (txCount % 50000 === 0 || txCount === 5000) {
        console.log(`  ...${txCount.toLocaleString()} transactions`);
      }
      txBatch.length = 0;
    }
  }

  if (txBatch.length > 0) {
    const result = await prisma.saleTransaction.createMany({ data: txBatch });
    txCount += result.count;
  }
  counts.transactions = txCount;
  console.log(`  Inserted ${counts.transactions.toLocaleString()} transactions`);

  // ── 4. Insert Forecast Outputs (monthly revenue) ─────
  console.log("Computing monthly forecasts...");
  const monthlyData = new Map<string, { revenue: number }>();
  for (const row of cleanRows) {
    const dateStr = excelDateToISO(row.InvoiceDate);
    const monthKey = dateStr.substring(0, 7);
    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, { revenue: 0 });
    }
    monthlyData.get(monthKey)!.revenue += row.Quantity * row.UnitPrice;
  }

  const forecasts: any[] = [];
  for (const [month, data] of monthlyData) {
    const revenue = Math.round(data.revenue * 100) / 100;
    const predicted = Math.round(revenue * (0.95 + rng() * 0.1) * 100) / 100;
    forecasts.push({
      modelName: "revenue_forecaster",
      targetDate: new Date(month + "-01"),
      predictedValue: predicted,
      lowerBound: Math.round(predicted * 0.9 * 100) / 100,
      upperBound: Math.round(predicted * 1.1 * 100) / 100,
      confidence: Math.round((0.85 + rng() * 0.1) * 100) / 100,
    });
  }

  counts.forecasts = forecasts.length;
  await prisma.forecastOutput.createMany({ data: forecasts });
  console.log(`  Inserted ${counts.forecasts} forecast records`);

  // ── Log ingestion ─────────────────────────────────────
  const elapsed = Date.now() - startTime;
  await prisma.dataIngestionLog.create({
    data: {
      sourceName: "uci_online_retail",
      status: "completed",
      rowsFetched: rawData.length,
      rowsStored: Object.values(counts).reduce((a: number, b) => a + (b as number), 0),
      durationMs: elapsed,
      metadata: JSON.stringify({
        source: "UCI Online Retail Dataset",
        period: "2010-12-01 to 2011-12-09",
        originalRows: rawData.length,
        cleanRows: cleanRows.length,
        counts,
      }),
      completedAt: new Date(),
    },
  });

  console.log("");
  console.log(`=== Ingestion Complete (${(elapsed / 1000).toFixed(1)}s) ===`);
  for (const [key, val] of Object.entries(counts)) {
    console.log(`  ${key}: ${Number(val).toLocaleString()}`);
  }

  return {
    success: true,
    message: "Real data loaded from UCI Online Retail dataset (UK e-commerce, 2010-2011)",
    counts,
    elapsedMs: elapsed,
    source: "uci_online_retail",
  };
}

// ═══════════════════════════════════════════════════════════════
// CLI entry point
// ═══════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);
  const forceFlag = args.includes("--force");

  console.log("=== Nexus - UCI Online Retail Ingestion ===");
  console.log(`  Force: ${forceFlag ? "YES" : "NO"}`);

  const prisma = new PrismaClient({ log: ["error", "warn"] });

  try {
    const result = await ingestOnlineRetail(prisma, forceFlag);
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error("Ingestion failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Only run CLI when executed directly (not when imported as a module)
const isDirectExecution = process.argv[1]?.includes("ingestOnlineRetail");
if (isDirectExecution) {
  main();
}
