// ═══════════════════════════════════════════════
// Shared structured logger for server modules
// ═══════════════════════════════════════════════

type LogLevel = "error" | "warn" | "info";

const LOG_PREFIX = "[nexus]";

/**
 * Log a structured message with consistent formatting.
 *
 * @param level   - Severity: "error", "warn", or "info".
 * @param context - A short subsystem identifier (e.g. "weather", "fx").
 * @param message - Human-readable description of the event.
 * @param error   - Optional error object; its `.message` is appended when an Error instance.
 */
export function log(level: LogLevel, context: string, message: string, error?: unknown): void {
  const entry = `${LOG_PREFIX} [${level.toUpperCase()}] ${context}: ${message}`;
  if (error instanceof Error) {
    console.error(entry, error.message);
  } else if (level === "error") {
    console.error(entry);
  } else if (level === "warn") {
    console.warn(entry);
  } else {
    console.info(entry);
  }
}
