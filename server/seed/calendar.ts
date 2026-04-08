// ═══════════════════════════════════════════════
// Ramadan helper — approximate Ramadan dates
// ═══════════════════════════════════════════════

const ramadanStartDates: Record<number, string> = {
  2022: "2022-04-02",
  2023: "2023-03-23",
  2024: "2024-03-11",
  2025: "2025-03-01",
  2026: "2026-02-18",
};

/** Return whether a given date falls within the Ramadan fasting period. */
export function isRamadan(date: Date): boolean {
  const y = date.getFullYear();
  const startStr = ramadanStartDates[y];
  if (!startStr) return false;
  const start = new Date(startStr);
  const end = new Date(start);
  end.setDate(end.getDate() + 30);
  return date >= start && date < end;
}

/** Return whether a given date is a weekend (Friday or Saturday in Algeria). */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 5 || day === 6; // Friday & Saturday in Algeria
}

/** Compute a seasonal demand factor for a date (Q4 boost, summer dip, Ramadan dip, weekend dip). */
export function getSeasonalFactor(date: Date): number {
  const month = date.getMonth(); // 0-indexed
  let factor = 1.0;

  // Q4 boost (Oct-Dec): +35%
  if (month >= 9) factor += 0.35;
  else if (month === 8) factor += 0.15; // Sep transition

  // Summer dip (Jun-Aug): -15%
  if (month >= 5 && month <= 7) factor -= 0.15;

  // Ramadan dip: -8%
  if (isRamadan(date)) factor -= 0.08;

  // Weekend dip: -40%
  if (isWeekend(date)) factor -= 0.40;

  return Math.max(factor, 0.3);
}
