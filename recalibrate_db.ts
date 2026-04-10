import { db } from "./src/lib/db";
import { seedDatabase } from "./server/seed/seedDatabase";

async function main() {
  console.log("=== EMERGENCY DATABASE RE-CALIBRATION (2011) ===");
  console.log("Cleaning up 2026-era mock data...");
  
  try {
    // Force re-seed (cleans old data automatically)
    const result = await seedDatabase(db, true);
    
    console.log("Success!");
    console.log("Records Inserted:", result.counts);
    console.log("Target Era: 2010-2011");
  } catch (error) {
    console.error("Calibration failed:", error);
  } finally {
    await db.$disconnect();
  }
}

main();
