"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Globe,
  TrendingUp,
  DollarSign,
  Cloud,
  Shield,
  RefreshCw,
  FileDown,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  Loader2,
  Landmark,
  Banknote,
  BarChart3,
  Thermometer,
  Wind,
  Info,
  ExternalLink,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface MacroIndicator {
  country: string;
  gdpGrowth: number;
  inflation: number;
  tradeBalance: number;
  year: number;
}

interface WeatherForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  windSpeed: number;
  description: string;
}

interface ExchangeRate {
  pair: string;
  rate: number;
  change24h: number;
  lastUpdated: string;
}

interface CountryRisk {
  country: string;
  region: string;
  population: number;
  gdpPerCapita: number;
  riskLevel: "low" | "medium" | "high";
  tradeOpenness: number;
}

interface MarketData {
  macro: MacroIndicator[];
  weather: WeatherForecast[];
  forex: ExchangeRate[];
  countries: CountryRisk[];
}

// ── Chart Configs ────────────────────────────────────────────────────────────

const gdpConfig: ChartConfig = {
  gdpGrowth: { label: "GDP Growth %", color: "#10b981" },
  inflation: { label: "Inflation %", color: "#ef4444" },
};

const weatherConfig: ChartConfig = {
  tempMax: { label: "Max Temp", color: "#f59e0b" },
  tempMin: { label: "Min Temp", color: "#3b82f6" },
  precipitation: { label: "Rain (mm)", color: "#8b5cf6" },
};

// ── Data Sources ─────────────────────────────────────────────────────────────

const DATA_SOURCES = [
  {
    name: "World Bank",
    icon: Landmark,
    color: "#3b82f6",
    description: "GDP growth, inflation rates, and trade balance indicators",
    endpoint: "api.worldbank.org",
    refreshRate: "Monthly",
  },
  {
    name: "Open-Meteo",
    icon: Cloud,
    color: "#8b5cf6",
    description: "7-day weather forecasts for logistics and demand planning",
    endpoint: "api.open-meteo.com",
    refreshRate: "Hourly",
  },
  {
    name: "Exchange Rates",
    icon: Banknote,
    color: "#f59e0b",
    description: "Live foreign exchange rates for multi-currency operations",
    endpoint: "open.er-api.com",
    refreshRate: "Daily",
  },
  {
    name: "REST Countries",
    icon: Globe,
    color: "#22c55e",
    description: "Geopolitical data, population, and country risk profiles",
    endpoint: "restcountries.com",
    refreshRate: "Weekly",
  },
];

// ── Skeleton ─────────────────────────────────────────────────────────────────

function MarketSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[380px] rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[300px] rounded-xl" />
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    </div>
  );
}

// ── Risk Level Badge ─────────────────────────────────────────────────────────

function RiskBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    low: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
    medium: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400",
    high: "bg-red-500/15 text-red-700 border-red-500/30 dark:text-red-400",
  };
  return (
    <Badge variant="outline" className={cn("text-[10px] font-bold capitalize", styles[level] || styles.low)}>
      {level}
    </Badge>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function MarketView() {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/market?type=all")
      .then((r) => r.json())
      .then((d) => {
        setData({
          macro: d.macro || d.macroIndicators || [],
          weather: d.weather || d.weatherForecast || [],
          forex: d.forex || d.exchangeRates || [],
          countries: d.countries || d.countryRisks || [],
        });
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        setError(err instanceof Error ? err.message : "Failed to load market intelligence");
      });
  }, []);

  useEffect(() => {
    // Initial fetch of live market telemetry
    const t = setTimeout(fetchData, 0);
    return () => clearTimeout(t);
  }, [fetchData]);

  if (loading) return <MarketSkeleton />;
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="bg-muted mb-4 flex h-14 w-14 items-center justify-center rounded-full">
          <Globe className="text-muted-foreground h-7 w-7" />
        </div>
        <h3 className="text-lg font-semibold">Market Intelligence Unavailable</h3>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">{error}</p>
        <Button variant="outline" className="mt-5 rounded-xl gap-2" onClick={fetchData}>
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Market Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live external data feeds — macroeconomic indicators, weather, FX rates, and geopolitical risk.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 bg-emerald-500/5 px-2.5 py-1.5 rounded-lg border border-emerald-500/10">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">
              4 Live Feeds Active
            </span>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl h-8 gap-1.5 bg-card/50 text-xs">
            <FileDown className="w-3 h-3" />
            Export Report
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl h-9 w-9 bg-card/50"
            onClick={fetchData}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* ── Data Sources Panel ──────────────────────────────────── */}
      <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 animate-fade-in shadow-sm">
        <h4 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4" />
          External Data Sources
        </h4>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {DATA_SOURCES.map((src) => {
            const Icon = src.icon;
            return (
              <div
                key={src.name}
                className="flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-card/60 hover:border-primary/20 transition-all"
              >
                <div
                  className="p-2 rounded-lg shrink-0"
                  style={{ backgroundColor: `${src.color}15` }}
                >
                  <Icon className="h-4 w-4" style={{ color: src.color }} />
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-bold">{src.name}</h5>
                  <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                    {src.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="text-[8px] px-1.5 py-0">
                      {src.refreshRate}
                    </Badge>
                    <span className="text-[9px] text-muted-foreground/70 font-mono truncate">
                      {src.endpoint}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/60 p-1 rounded-xl w-full sm:w-auto mb-4">
          <TabsTrigger value="overview" className="rounded-lg gap-2 text-xs font-bold flex-1 sm:flex-none">
            <BarChart3 className="w-3.5 h-3.5" />
            Macro Overview
          </TabsTrigger>
          <TabsTrigger value="forex" className="rounded-lg gap-2 text-xs font-bold flex-1 sm:flex-none">
            <DollarSign className="w-3.5 h-3.5" />
            FX Rates
          </TabsTrigger>
          <TabsTrigger value="weather" className="rounded-lg gap-2 text-xs font-bold flex-1 sm:flex-none">
            <Cloud className="w-3.5 h-3.5" />
            Weather
          </TabsTrigger>
          <TabsTrigger value="geopolitical" className="rounded-lg gap-2 text-xs font-bold flex-1 sm:flex-none">
            <Shield className="w-3.5 h-3.5" />
            Country Risk
          </TabsTrigger>
        </TabsList>

        {/* ── Macro Overview ───────────────────────────────────── */}
        <TabsContent value="overview" className="outline-none space-y-4">
          {data.macro.length > 0 ? (
            <>
              <Card className="glass-card shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold text-premium-gradient flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-primary" />
                    Macroeconomic Indicators — World Bank
                  </CardTitle>
                  <CardDescription className="text-xs">
                    GDP growth and inflation rates for key trading partners (source: api.worldbank.org)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ChartContainer config={gdpConfig} className="h-full w-full">
                      <BarChart data={data.macro.slice(0, 10)} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="country" tickLine={false} axisLine={false} fontSize={11} />
                        <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v: number) => `${v}%`} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="gdpGrowth" fill="#10b981" radius={[4, 4, 0, 0]} animationDuration={1000} />
                        <Bar dataKey="inflation" fill="#ef4444" radius={[4, 4, 0, 0]} animationDuration={1000} />
                      </BarChart>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Macro Cards */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.macro.slice(0, 6).map((m, i) => (
                  <Card key={i} className="glass-card shadow-sm card-hover">
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          <span className="text-sm font-bold">{m.country}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{m.year}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">GDP</p>
                          <p className={cn("text-sm font-bold tabular-nums", m.gdpGrowth >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                            {m.gdpGrowth >= 0 ? "+" : ""}{m.gdpGrowth.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Inflation</p>
                          <p className="text-sm font-bold tabular-nums text-amber-600 dark:text-amber-400">
                            {m.inflation.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Trade</p>
                          <p className={cn("text-sm font-bold tabular-nums", m.tradeBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                            {m.tradeBalance >= 0 ? "+" : ""}{(m.tradeBalance / 1e9).toFixed(1)}B
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Info className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No macroeconomic data available. Run a market data refresh.</p>
            </div>
          )}
        </TabsContent>

        {/* ── FX Rates ─────────────────────────────────────────── */}
        <TabsContent value="forex" className="outline-none space-y-4">
          <Card className="glass-card shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-premium-gradient flex items-center gap-2">
                <Banknote className="h-4 w-4 text-primary" />
                Foreign Exchange Rates
              </CardTitle>
              <CardDescription className="text-xs">
                Live currency conversion rates — critical for multi-country retail operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.forex.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {data.forex.map((fx, i) => (
                    <div
                      key={fx.pair || i}
                      className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/60 hover:border-primary/20 transition-all"
                    >
                      <div>
                        <p className="font-bold text-sm">{fx.pair}</p>
                        <p className="text-2xl font-bold tabular-nums tracking-tight mt-1">
                          {fx.rate.toFixed(4)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={cn(
                          "flex items-center gap-0.5 text-xs font-bold",
                          fx.change24h >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                        )}>
                          {fx.change24h >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {Math.abs(fx.change24h).toFixed(2)}%
                        </span>
                        <p className="text-[10px] text-muted-foreground mt-1">24h change</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No exchange rate data available.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Weather ──────────────────────────────────────────── */}
        <TabsContent value="weather" className="outline-none space-y-4">
          <Card className="glass-card shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-premium-gradient flex items-center gap-2">
                <Cloud className="h-4 w-4 text-primary" />
                Weather Forecast — Logistics Planning
              </CardTitle>
              <CardDescription className="text-xs">
                7-day forecast from Open-Meteo API — helps optimize delivery and demand planning
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.weather.length > 0 ? (
                <>
                  <div className="h-[260px] mb-4">
                    <ChartContainer config={weatherConfig} className="h-full w-full">
                      <AreaChart data={data.weather} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                        <defs>
                          <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tickLine={false}
                          axisLine={false}
                          fontSize={11}
                          tickFormatter={(v: string) =>
                            new Date(v).toLocaleDateString("en-US", { weekday: "short" })
                          }
                        />
                        <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v: number) => `${v}°`} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="tempMax" stroke="#f59e0b" strokeWidth={2} fill="url(#tempGrad)" animationDuration={1000} />
                        <Area type="monotone" dataKey="tempMin" stroke="#3b82f6" strokeWidth={2} fill="none" strokeDasharray="4 3" animationDuration={1000} />
                      </AreaChart>
                    </ChartContainer>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-7">
                    {data.weather.slice(0, 7).map((w, i) => (
                      <div key={i} className="p-3 rounded-xl border border-border/50 bg-card/60 text-center">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">
                          {new Date(w.date).toLocaleDateString("en-US", { weekday: "short", day: "numeric" })}
                        </p>
                        <div className="flex items-center justify-center gap-1 mt-2">
                          <Thermometer className="h-3 w-3 text-amber-500" />
                          <span className="text-sm font-bold">{w.tempMax}°</span>
                          <span className="text-xs text-muted-foreground">/ {w.tempMin}°</span>
                        </div>
                        {w.precipitation > 0 && (
                          <p className="text-[10px] text-blue-500 font-medium mt-1">{w.precipitation}mm rain</p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No weather data available.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Country Risk ─────────────────────────────────────── */}
        <TabsContent value="geopolitical" className="outline-none space-y-4">
          <Card className="glass-card shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-premium-gradient flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Country Risk Profiles — REST Countries
              </CardTitle>
              <CardDescription className="text-xs">
                Geopolitical data and trade risk assessment for countries in the customer base
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.countries.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {data.countries.map((c, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-border/50 bg-card/60 hover:border-primary/20 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-primary" />
                          <span className="font-bold text-sm">{c.country}</span>
                        </div>
                        <RiskBadge level={c.riskLevel} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Region</p>
                          <p className="text-xs font-medium">{c.region}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Population</p>
                          <p className="text-xs font-medium tabular-nums">{(c.population / 1e6).toFixed(1)}M</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">GDP/Capita</p>
                          <p className="text-xs font-medium tabular-nums">${c.gdpPerCapita.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Trade Open.</p>
                          <p className="text-xs font-medium tabular-nums">{(c.tradeOpenness * 100).toFixed(0)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No country risk data available.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
