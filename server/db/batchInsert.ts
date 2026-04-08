// ═══════════════════════════════════════════════
// Batch insert helper for Prisma models
// Extracted from: /src/app/api/seed/route.ts
// ═══════════════════════════════════════════════

/**
 * Insert a large array of records into a Prisma model in batches.
 * Uses createMany for efficient bulk inserts.
 *
 * @param model - A Prisma model delegate with a `createMany` method (e.g. `db.customer`)
 * @param data  - Array of records to insert
 * @param batchSize - Number of records per batch (default 5000)
 */
export async function batchInsert<T>(
  model: { createMany: (args: { data: T[] }) => Promise<{ count: number }> },
  data: T[],
  batchSize: number = 5000
): Promise<void> {
  for (let i = 0; i < data.length; i += batchSize) {
    const chunk = data.slice(i, i + batchSize);
    await model.createMany({ data: chunk });
  }
}
