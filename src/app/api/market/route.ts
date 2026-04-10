import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/market
 * Returns macroeconomic, weather, forex, and country data for market intelligence.
 * Includes data specifically for Algeria (DZ) as per business context in ARCHITECTURE.md.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all";

    // ── Macroeconomic Indicators (Mocking World Bank Data) ──
    const macroIndicators = [
      { country: "Algeria", gdpGrowth: 3.2, inflation: 9.3, tradeBalance: 12.5e9, year: 2011 },
      { country: "Tunisia", gdpGrowth: 1.5, inflation: 10.2, tradeBalance: -2.1e9, year: 2011 },
      { country: "Morocco", gdpGrowth: 2.8, inflation: 4.5, tradeBalance: -5.4e9, year: 2011 },
      { country: "Italy", gdpGrowth: 0.7, inflation: 5.9, tradeBalance: 4.8e9, year: 2011 },
      { country: "France", gdpGrowth: 0.9, inflation: 5.1, tradeBalance: -8.2e9, year: 2011 },
      { country: "Spain", gdpGrowth: 2.1, inflation: 3.6, tradeBalance: -1.4e9, year: 2011 },
    ];

    // ── Weather Forecast (Historical Mock for Dec 2011) ──
    const today = new Date("2011-12-09T00:00:00Z");
    const weatherForecast = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      return {
        date: date.toISOString().split("T")[0],
        tempMax: 18 + Math.sin(i * 0.5) * 5 + (Math.random() * 2),
        tempMin: 10 + Math.cos(i * 0.5) * 3 + (Math.random() * 2),
        precipitation: Math.random() > 0.7 ? Math.random() * 5 : 0,
        windSpeed: 10 + Math.random() * 15,
        description: Math.random() > 0.8 ? "Rainy" : "Sunny",
      };
    });

    // ── Foreign Exchange Rates (Deterministic Simulated Data) ──
    const exchangeRates = [
      { pair: "USD/DZD", rate: 134.52, change24h: 0.15, lastUpdated: "2011-12-09T10:00:00Z" },
      { pair: "EUR/DZD", rate: 145.88, change24h: -0.22, lastUpdated: "2011-12-09T10:00:00Z" },
      { pair: "GBP/DZD", rate: 170.12, change24h: 0.08, lastUpdated: "2011-12-09T10:00:00Z" },
      { pair: "EUR/USD", rate: 1.0845, change24h: 0.12, lastUpdated: "2011-12-09T10:00:00Z" },
    ];

    // ── Country Risk Profiles (Mocking REST Countries data) ──
    const countryRisks = [
      { country: "Algeria", region: "Africa", population: 45600000, gdpPerCapita: 4200, riskLevel: "medium", tradeOpenness: 0.45 },
      { country: "France", region: "Europe", population: 67800000, gdpPerCapita: 43500, riskLevel: "low", tradeOpenness: 0.65 },
      { country: "China", region: "Asia", population: 1412000000, gdpPerCapita: 12500, riskLevel: "medium", tradeOpenness: 0.38 },
      { country: "USA", region: "Americas", population: 333000000, gdpPerCapita: 70000, riskLevel: "low", tradeOpenness: 0.25 },
      { country: "UAE", region: "Middle East", population: 9400000, gdpPerCapita: 44000, riskLevel: "low", tradeOpenness: 0.95 },
    ];

    return NextResponse.json({
      macro: type === "macro" || type === "all" ? macroIndicators : [],
      weather: type === "weather" || type === "all" ? weatherForecast : [],
      forex: type === "forex" || type === "all" ? exchangeRates : [],
      countries: type === "countries" || type === "all" ? countryRisks : [],
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error in market API";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
