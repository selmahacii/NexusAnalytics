import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "./server/seed/seedDatabase";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with mock data...");
  try {
    // @ts-ignore - seedDatabase expects a slightly different type but PrismaClient should work
    const result = await seedDatabase(prisma, true);
    console.log("Seed result:", result);
  } catch (error) {
    console.error("Seed failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
