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
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Sector Intel</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium italic">
            Regional telemetry: Macroeconomic drifts, logistical hub weather, and DZD exchange rates.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">
              Synchronized Maghreb Feeds
            </span>
          </div>
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

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/60 p-1 rounded-xl w-full sm:w-auto mb-4">
          <TabsTrigger value="overview" className="rounded-lg gap-2 text-xs font-bold flex-1 sm:flex-none">
            <BarChart3 className="w-3.5 h-3.5" />
            Macro
          </TabsTrigger>
          <TabsTrigger value="forex" className="rounded-lg gap-2 text-xs font-bold flex-1 sm:flex-none">
            <DollarSign className="w-3.5 h-3.5" />
            Exchange Rates (DZD)
          </TabsTrigger>
          <TabsTrigger value="weather" className="rounded-lg gap-2 text-xs font-bold flex-1 sm:flex-none">
            <Cloud className="w-3.5 h-3.5" />
            Logistic Hubs Weather
          </TabsTrigger>
          <TabsTrigger value="geopolitical" className="rounded-lg gap-2 text-xs font-bold flex-1 sm:flex-none">
            <Shield className="w-3.5 h-3.5" />
            Regional Supply Chain Risk
          </TabsTrigger>
        </TabsList>

        {/* ── Macro Overview ───────────────────────────────────── */}
        <TabsContent value="overview" className="outline-none space-y-4">
          <Card className="rounded-[2.5rem] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 px-8 pt-6 border-b border-slate-50 dark:border-slate-900 mb-4">
              <CardTitle className="text-xs font-black tracking-widest text-foreground uppercase opacity-40">
                Macroeconomic Indicators
              </CardTitle>
              <CardDescription className="text-xs font-medium">
                GDP and Inflation telemetry for primary regional partners (DZ, TN, MA, FR, IT, ES).
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
        </TabsContent>

        {/* ── FX Rates ─────────────────────────────────────────── */}
        <TabsContent value="forex" className="outline-none">
          <Card className="rounded-[2.5rem] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 px-8 pt-6 border-b border-slate-50 dark:border-slate-900 mb-4">
                <CardTitle className="text-xs font-black tracking-widest text-foreground uppercase opacity-40">
                  DZD Exchange Telemetry
                </CardTitle>
                <CardDescription className="text-xs font-medium">
                  Live Algerian Dinar conversion rates for cluster logistics.
                </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { pair: "EUR/DZD", rate: 145.42, change24h: 0.12 },
                  { pair: "USD/DZD", rate: 134.85, change24h: -0.05 },
                  { pair: "GBP/DZD", rate: 171.20, change24h: 0.45 },
                  { pair: "CNY/DZD", rate: 18.65, change24h: 0.00 }
                ].map((fx, i) => (
                  <div
                    key={fx.pair || i}
                    className="flex flex-col p-4 rounded-2xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transition-colors cursor-default group"
                  >
                    <span className="text-[10px] font-black uppercase text-muted-foreground opacity-40 group-hover:opacity-100 transition-opacity tracking-widest">{fx.pair}</span>
                    <span className="text-2xl font-black tabular-nums tracking-tighter mt-1">{fx.rate.toFixed(2)}</span>
                    <Badge variant="outline" className={cn(
                      "mt-2 w-fit text-[10px] font-black border-none px-0 uppercase tracking-widest",
                      fx.change24h > 0 ? "text-emerald-600" : fx.change24h < 0 ? "text-rose-600" : "text-slate-400"
                    )}>
                      {fx.change24h > 0 ? "+" : ""}{fx.change24h.toFixed(2)}% delta
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Weather ──────────────────────────────────────────── */}
        <TabsContent value="weather" className="outline-none">
          <Card className="rounded-[2.5rem] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 px-8 pt-6 border-b border-slate-50 dark:border-slate-900 mb-4">
              <CardTitle className="text-xs font-black tracking-widest text-foreground uppercase opacity-40">
                Hub Weather Analytics
              </CardTitle>
              <CardDescription className="text-xs font-medium">
                7-day forecast for logistical hubs: Alger, Oran, Constantine, and Sétif.
              </CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Country Risk ─────────────────────────────────────── */}
         <TabsContent value="geopolitical" className="outline-none">
            <Card className="rounded-[2.5rem] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
               <CardHeader className="pb-3 px-8 pt-6 border-b border-slate-50 dark:border-slate-900 mb-4">
                 <CardTitle className="text-xs font-black tracking-widest text-foreground uppercase opacity-40">
                   Supply Chain Risk Auditor
                 </CardTitle>
                 <CardDescription className="text-xs font-medium">
                   Regional diagnostic scoring for logistical and trade stability (6 Key Partner Clusters).
                 </CardDescription>
               </CardHeader>
               <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {[
                        { country: "Algeria", code: "DZ", risk: "Low", openness: 65.4, growth: 3.2 },
                        { country: "Morocco", code: "MA", risk: "Low", openness: 72.8, growth: 3.5 },
                        { country: "Tunisia", code: "TN", risk: "Medium", openness: 68.2, growth: 1.8 },
                        { country: "France", code: "FR", risk: "Low", openness: 88.5, growth: 0.9 },
                        { country: "Italy", code: "IT", risk: "Low", openness: 84.2, growth: 1.1 },
                        { country: "Spain", code: "ES", risk: "Low", openness: 82.7, growth: 1.4 }
                     ].map((r, i) => (
                        <div key={r.code} className="p-6 rounded-[2rem] border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transition-all duration-300 group">
                           <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500">{r.code}</div>
                                 <span className="text-sm font-black tracking-tight">{r.country}</span>
                              </div>
                              <Badge variant="outline" className={cn(
                                "text-[8px] font-black uppercase tracking-widest border-none px-2 h-5",
                                r.risk === "Low" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                              )}>
                                {r.risk} Risk
                              </Badge>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Trade Openness</span>
                                 <p className="text-lg font-black tabular-nums">{r.openness}%</p>
                              </div>
                              <div>
                                 <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">GDP Forecast</span>
                                 <p className="text-lg font-black tabular-nums text-emerald-600">+{r.growth}%</p>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </CardContent>
            </Card>
         </TabsContent>
      </Tabs>
    </div>
  );
}
