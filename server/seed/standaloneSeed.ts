#!/usr/bin/env bun
// ═══════════════════════════════════════════════════════════════
// Standalone data ingestion — runs outside Next.js via Bun directly
// Usage: bun run server/seed/standaloneSeed.ts [--force]
//
// Loads real data from UCI Online Retail dataset (data/online_retail.xlsx)
// into the SQLite database.
// ═══════════════════════════════════════════════════════════════

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["error", "warn"],
});

// Parse CLI arguments
const args = process.argv.slice(2);
const forceFlag = args.includes("--force");

async function main() {
  console.log("=== Nexus Predictive Intelligence - Data Ingestion ===");
  console.log(`  Force re-ingest: ${forceFlag ? "YES" : "NO"}`);
  console.log(`  DATABASE_URL:    ${process.env.DATABASE_URL || "file:./db/custom.db"}`);
  console.log("");

  const startTime = Date.now();

  try {
    const { ingestOnlineRetail } = await import("@server/ingestion/ingestOnlineRetail");
    const result = await ingestOnlineRetail(prisma, forceFlag);

    const elapsed = Date.now() - startTime;

    console.log("");
    console.log("=== Ingestion Complete ===");
    console.log(`  Success:  ${result.success}`);
    console.log(`  Source:   ${result.source}`);
    console.log(`  Message:  ${result.message}`);
    console.log("");

    if (result.counts && Object.keys(result.counts).length > 0) {
      console.log("  Table counts:");
      for (const [table, count] of Object.entries(result.counts)) {
        console.log(`    ${table}: ${Number(count).toLocaleString()}`);
      }
      console.log("");
    }

    console.log(`  Total time: ${(elapsed / 1000).toFixed(1)}s`);

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error("");
    console.error("=== Ingestion FAILED ===");
    console.error(`  Error: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof Error && error.stack) {
      console.error("");
      console.error("Stack trace:");
      console.error(error.stack);
    }
    console.error(`  Time before failure: ${(elapsed / 1000).toFixed(1)}s`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
