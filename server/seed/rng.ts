// ═══════════════════════════════════════════════
// Seeded Random Number Generator (Mulberry32)
// ═══════════════════════════════════════════════

/** Create a deterministic pseudo-random number generator using the Mulberry32 algorithm. */
export function mulberry32(seed: number) {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Default deterministic RNG instance (seed = 42). Returns values in [0, 1). */
export const rand = mulberry32(42);

/** Return a random integer in [min, max] (inclusive) using the seeded RNG. */
export function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

/** Return a random float in [min, max) using the seeded RNG. */
export function randFloat(min: number, max: number): number {
  return rand() * (max - min) + min;
}

/** Pick a random element from an array using the seeded RNG. */
export function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

/** Pick a random element from a weighted list using the seeded RNG. */
export function pickWeighted<T>(items: { item: T; weight: number }[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = rand() * total;
  for (const { item, weight } of items) {
    r -= weight;
    if (r <= 0) return item;
  }
  return items[items.length - 1].item;
}
