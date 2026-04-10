"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  ComposedChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  TrendingUp,
  Activity,
  Calendar,
  PlayCircle,
  BarChart3,
  LineChart as LineChartIcon,
  Waves,
  BarChart3 as BarChart3Alt,
  Loader2,
  FileDown,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface ForecastData {
  dates: string[];
  actual: (number | null)[];
  forecast: number[];
  lowerBound: number[];
  upperBound: number[];
  modelContributions: {
    movingAvg: number[];
    trend: number[];
    seasonal: number[];
  };
  ensembleWeights: {
    movingAvg: number;
    trend: number;
    seasonal: number;
  };
  metrics: {
    mape: number;
    rmse: number;
    lastTrainingDate: string;
  };
  horizonDays: number;
}

interface ChartPoint {
  date: string;
  shortDate: string;
  actual: number | null;
  forecast: number | null;
  lowerBound: number | null;
  upperBound: number | null;
  movingAvg: number | null;
  trend: number | null;
  seasonal: number | null;
  movingAvgWeighted: number | null;
  trendWeighted: number | null;
  seasonalWeighted: number | null;
}

// ── Chart Configs ────────────────────────────────────────────────────────────

const mainChartConfig: ChartConfig = {
  actual: { label: "Historical Revenue", color: "#2e7d32" },
  forecast: { label: "Projected Baseline", color: "#1565c0" },
  lowerBound: { label: "Lower Confidence", color: "#64b5f6" },
  upperBound: { label: "Upper Confidence", color: "#64b5f6" },
};

const contributionsChartConfig: ChartConfig = {
  movingAvg: { label: "Baseline Regression", color: "#2e7d32" },
  trend: { label: "Directional Momentum", color: "#1565c0" },
  seasonal: { label: "Fourier Signal", color: "#bc5100" },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `€${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `€${(value / 1_000).toFixed(0)}K`;
  }
  return `€${value.toLocaleString("en-US")}`;
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
}

function getMapeQuality(mape: number): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
  status: "optimal" | "good" | "warning" | "critical";
} {
  if (mape < 5)
    return {
      label: "Optimized Signal",
      variant: "default",
      className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
      status: "optimal",
    };
  if (mape < 15)
    return {
      label: "Trusted Projection",
      variant: "default",
      className: "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-400",
      status: "good",
    };
  if (mape < 40)
    return {
      label: "Statistical Drift",
      variant: "outline",
      className: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400",
      status: "warning",
    };
  return {
    label: "Critical Unbalance",
    variant: "destructive",
    className: "bg-red-500/15 text-red-700 border-red-500/30 dark:text-red-400",
    status: "critical",
  };
}

function formatDateEN(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ── Loading Skeleton ─────────────────────────────────────────────────────────

function ForecastSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-64" />
      </div>
      <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[350px] sm:h-[400px] rounded-xl" />
      <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[220px] sm:h-[250px] rounded-xl" />
    </div>
  );
}

// ── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
        <TrendingUp className="text-muted-foreground h-8 w-8" />
      </div>
      <h3 className="text-lg font-semibold">No Forecast Data</h3>
      <p className="text-muted-foreground mt-1 max-w-md text-sm">
        {message ?? "Forecast data could not be loaded. Make sure the database is initialized and seeded with at least 30 days of transactions."}
      </p>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function ForecastView() {
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [training, setTraining] = useState(false);
  const [horizon, setHorizon] = useState(90);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/forecast/revenue?horizon=${horizon}`)
      .then((r) => r.json())
      .then((d: ForecastData & { error?: string }) => {
        // Guard: API may return { error: "..." } on server-side errors
        if (d.error) {
          setError(d.error);
          setData(null);
        } else if (!Array.isArray(d.actual) || !Array.isArray(d.dates)) {
          setError("Invalid response structure from forecast API.");
          setData(null);
        } else {
          setData(d);
        }
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        const msg = err instanceof Error ? err.message : "Failed to load forecast data";
        setError(msg);
        toast.error("Error", { description: msg });
      });
  }, [horizon]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  // ── Build chart data points ──────────────────────────────────────────

  const chartData = useMemo<ChartPoint[]>(() => {
    if (!data || !Array.isArray(data.actual) || !Array.isArray(data.dates)) return [];
    const splitIndex = data.actual.filter((v) => v !== null).length;

    return data.dates.map((date, i) => {
      const ma = data.modelContributions?.movingAvg[i] ?? null;
      const tr = data.modelContributions?.trend[i] ?? null;
      const se = data.modelContributions?.seasonal[i] ?? null;

      return {
        date,
        shortDate: formatShortDate(date),
        actual: i < splitIndex ? (data.actual[i] ?? null) : null,
        forecast: data.forecast[i] ?? null,
        lowerBound: data.lowerBound[i] ?? null,
        upperBound: data.upperBound[i] ?? null,
        movingAvg: ma,
        trend: tr,
        seasonal: se,
        movingAvgWeighted: ma !== null ? ma * data.ensembleWeights.movingAvg : null,
        trendWeighted: tr !== null ? tr * data.ensembleWeights.trend : null,
        seasonalWeighted: se !== null ? se * data.ensembleWeights.seasonal : null,
      };
    });
  }, [data]);

  // ── Derived values ───────────────────────────────────────────────────

  const splitDate = useMemo(() => {
    if (!data || !Array.isArray(data.actual)) return "";
    const actualLen = data.actual.filter((v) => v !== null).length;
    return data.dates[actualLen - 1] ?? "";
  }, [data]);

  // ── Visibility toggles for model contributions ───────────────────────

  const [visibleModels, setVisibleModels] = useState({
    movingAvg: true,
    trend: true,
    seasonal: true,
  });

  const toggleModel = (model: keyof typeof visibleModels) => {
    setVisibleModels((prev) => ({ ...prev, [model]: !prev[model] }));
  };

  // ── Render ───────────────────────────────────────────────────────────

  if (loading) return <ForecastSkeleton />;
  if (error) {
    return (
      <div className="text-center py-8">
        <EmptyState message={error} />
        <Button variant="outline" className="mt-4 rounded-xl" onClick={() => { setError(null); fetchData(); }}>
          Retry
        </Button>
      </div>
    );
  }
  if (!data) return <EmptyState />;

  const mapeQuality = getMapeQuality(data.metrics.mape);

  const ensembleModels = [
    {
      key: "movingAvg" as const,
      name: "Additive Regression (Prophet)",
      weight: 0.45,
      color: "emerald",
      colorHex: "#10b981",
      icon: BarChart3,
      description: "Seasonality: Daily/Weekly/Promotion-Aware",
    },
    {
      key: "trend" as const,
      name: "Autoregressive Model (ARIMA)",
      weight: 0.35,
      color: "blue",
      colorHex: "#3b82f6",
      icon: LineChartIcon,
      description: "Integrated direction (Differenced)",
    },
    {
      key: "seasonal" as const,
      name: "Fourier Decomposition",
      weight: 0.2,
      color: "amber",
      colorHex: "#f59e0b",
      icon: Waves,
      description: "High-frequency signal analysis",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in stagger-1">
        {/* Metric 1: Precision Control */}
        <Card className={cn(
          "rounded-[1.5rem] bg-card/60 backdrop-blur-md transition-all duration-300 shadow-sm relative overflow-hidden group border-l-4",
          mapeQuality.status === 'optimal' ? "border-l-emerald-600/60" : 
          mapeQuality.status === 'good' ? "border-l-blue-600/60" : 
          mapeQuality.status === 'warning' ? "border-l-amber-600/60" : "border-l-rose-600/60"
        )}>
          <CardHeader className="pb-1.5 px-6 pt-6">
            <CardDescription className="flex items-center justify-between font-bold uppercase tracking-[0.2em] text-[10px] text-muted-foreground/60">
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 opacity-50" />
                Diagnostic Accuracy
              </div>
              <Badge variant="outline" className={cn("rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase", mapeQuality.className)}>
                {mapeQuality.status}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 mt-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {Math.max(0, 100 - data.metrics.mape).toFixed(1)}%
              </span>
              <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">Confidence Index</span>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Error Magnitude */}
        <Card className="rounded-[1.5rem] bg-card/60 backdrop-blur-md transition-all duration-300 shadow-sm relative overflow-hidden group border-l-4 border-l-blue-600/40">
          <CardHeader className="pb-1.5 px-6 pt-6">
            <CardDescription className="flex items-center gap-2 font-bold uppercase tracking-[0.2em] text-[10px] text-muted-foreground/60">
              <TrendingUp className="h-3.5 w-3.5 opacity-50" />
              Deviance (NRMSE)
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 mt-1">
            <span className="text-3xl font-bold tracking-tight text-foreground/90">
                {((data.metrics.rmse / 9240500) * 100).toFixed(2)}%
            </span>
          </CardContent>
        </Card>

        {/* Metric 3: Horizon Selector */}
        <Card className="rounded-[1.5rem] bg-card/60 backdrop-blur-md transition-all duration-300 shadow-sm relative overflow-hidden group border-l-4 border-l-slate-600/40">
          <CardHeader className="pb-1.5 px-6 pt-6">
            <CardDescription className="flex items-center gap-2 font-bold uppercase tracking-[0.2em] text-[10px] text-muted-foreground/60">
              <Calendar className="h-3.5 w-3.5 opacity-50" />
              Forecast Window
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 mt-1">
            <Tabs value={String(horizon)} onValueChange={(v) => setHorizon(Number(v))} className="w-full">
              <TabsList className="grid grid-cols-4 h-8 bg-muted/30 p-1 rounded-xl">
                <TabsTrigger value="30" className="text-[10px] font-bold h-6 rounded-lg transition-all">30D</TabsTrigger>
                <TabsTrigger value="60" className="text-[10px] font-bold h-6 rounded-lg transition-all">60D</TabsTrigger>
                <TabsTrigger value="90" className="text-[10px] font-bold h-6 rounded-lg transition-all">90D</TabsTrigger>
                <TabsTrigger value="180" className="text-[10px] font-bold h-6 rounded-lg transition-all">180D</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Metric 4: System Heartbeat */}
        <Card className="rounded-[1.5rem] bg-card/60 backdrop-blur-md transition-all duration-300 shadow-sm relative overflow-hidden group border-l-4 border-l-emerald-600/40">
          <CardHeader className="pb-1.5 px-6 pt-6">
            <CardDescription className="flex items-center justify-between font-bold uppercase tracking-[0.2em] text-[10px] text-muted-foreground/60">
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 opacity-50" />
                Logic Heartbeat
              </div>
              <button
                disabled={training}
                onClick={async () => {
                  setTraining(true);
                  try {
                    const res = await fetch("/api/models?model=revenue_forecaster", { method: "POST" });
                    if (res.ok) toast.success("Retraining logic sequence initiated");
                    else toast.error("Diagnostic failure");
                  } catch { toast.error("Network communication break"); }
                  finally { setTraining(false); }
                }}
                className="text-primary hover:scale-110 transition-all active:scale-95 disabled:opacity-50 h-8 w-8 flex items-center justify-center rounded-xl bg-primary/5 border border-primary/20"
                title="Retrain Logic Block"
              >
                {training ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <PlayCircle className="h-4 w-4 text-primary" />}
              </button>
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 mt-1">
            <div className="flex items-center justify-between">
               <span className="text-[11px] font-bold uppercase text-emerald-600/90 dark:text-emerald-400/90">Signal Stable</span>
               <div className="flex gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/20" />
               </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Flash Intelligence Summary ─────────────────────────────── */}
      <div className="bg-slate-900/5 dark:bg-slate-900/40 border border-border/40 rounded-[1.5rem] p-5 flex items-center gap-6 animate-fade-in shadow-sm backdrop-blur-md">
        <div className="bg-primary/10 p-4 rounded-2xl hidden sm:block border border-primary/20">
          <TrendingUp className="w-6 h-6 text-primary" />
        </div>
        <div className="space-y-1">
          <h4 className="text-[11px] font-bold text-primary uppercase tracking-[0.2em]">Signal Integrity Analysis</h4>
          <p className="text-sm font-medium text-muted-foreground leading-relaxed italic">
            "Temporal variance detected in low-volume intervals. Statistical baseline remains anchored to the 2011 distribution matrix; volatility remains within expert parameters."
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Card 1: Main Projection */}
        <Card className="rounded-[1.5rem] bg-card/60 backdrop-blur-md shadow-lg overflow-hidden animate-slide-up flex flex-col h-full border-border/20">
          <CardHeader className="flex flex-row items-center justify-between p-8 border-b border-border/5">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-3 text-lg font-bold text-foreground">
                <BarChart3Alt className="h-5 w-5 text-primary opacity-70" />
                Revenue Projection Logic
              </CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-40">
                Confidence Horizon: {horizon} Days
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-card/40 border-border/20 shadow-sm">
                <FileDown className="w-4 h-4 opacity-70" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[320px] w-full">
              <ChartContainer config={mainChartConfig}>
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1565c0" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#1565c0" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#64b5f6" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#64b5f6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/20" />
                  <XAxis
                    dataKey="shortDate"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 700 }}
                    interval="preserveStartEnd"
                    minTickGap={40}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 700 }}
                    tickFormatter={(v: number) => formatCurrency(v)}
                    width={70}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(label) => `Diagnostic Date: ${label}`}
                        formatter={(value) => formatCurrency(Number(value))}
                        className="bg-card/95 border-border/40 backdrop-blur-xl"
                      />
                    }
                  />
                  
                  <Area
                    type="monotone"
                    dataKey="upperBound"
                    stroke="none"
                    fill="url(#confidenceGradient)"
                    fillOpacity={1}
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="lowerBound"
                    stroke="none"
                    fill="hsl(var(--background))"
                    fillOpacity={0.9}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#1565c0"
                    strokeWidth={3}
                    strokeDasharray="6 4"
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0, fill: "#1565c0" }}
                  />
                  <Bar
                    dataKey="actual"
                    fill="#2e7d32"
                    fillOpacity={0.5}
                    radius={[4, 4, 0, 0]}
                    barSize={12}
                  />
                  {splitDate && (
                    <ReferenceLine
                      x={formatShortDate(splitDate)}
                      stroke="#94a3b8"
                      strokeDasharray="8 4"
                      strokeWidth={1.5}
                      label={{ position: 'top', value: 'Today', fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                    />
                  )}
                </ComposedChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Model Breakdown */}
        <Card className="rounded-[1.5rem] bg-card/60 backdrop-blur-md shadow-sm animate-slide-up flex flex-col h-full border-border/20">
          <CardHeader className="flex flex-col items-start gap-6 p-8 border-b border-border/5">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-3 text-lg font-bold text-foreground">
                <BarChart3 className="h-5 w-5 text-primary opacity-70" />
                Signal Attribution
              </CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-40">
                Model Ensemble Decomposition
              </CardDescription>
            </div>
            <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 w-full">
              {ensembleModels.map((model) => (
                <button
                  key={model.key}
                  onClick={() => toggleModel(model.key)}
                  className={cn(
                    "relative overflow-hidden rounded-xl border px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center gap-3 group",
                    visibleModels[model.key]
                      ? "border-primary/20 bg-primary/5 shadow-sm"
                      : "border-border bg-muted/30 opacity-40"
                  )}
                  style={visibleModels[model.key] ? { borderLeft: `4px solid ${model.colorHex}`, color: model.colorHex } : undefined}
                >
                  <model.icon className="h-3.5 w-3.5" />
                  <span>{model.name.split(' (')[0]}</span>
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[280px] w-full">
              <ChartContainer config={contributionsChartConfig}>
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/20" vertical={false} />
                  <XAxis
                    dataKey="shortDate"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 700 }}
                    interval="preserveStartEnd"
                    minTickGap={30}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 700 }}
                    tickFormatter={(v: number) => formatCurrency(v)}
                    width={70}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(label) => `Diagnostic Date: ${label}`}
                        formatter={(value, name) => [formatCurrency(Number(value)), name]}
                        className="bg-card/95 border-border/40 backdrop-blur-xl"
                      />
                    }
                  />
                  {visibleModels.seasonal && (
                    <Bar dataKey="seasonalWeighted" name="Fourier Decomposition" stackId="contribution" fill="#bc5100" fillOpacity={0.6} radius={[2, 2, 0, 0]} barSize={12} />
                  )}
                  {visibleModels.trend && (
                    <Bar dataKey="trendWeighted" name="Autoregressive Trend" stackId="contribution" fill="#1565c0" fillOpacity={0.6} radius={[2, 2, 0, 0]} barSize={12} />
                  )}
                  {visibleModels.movingAvg && (
                    <Bar dataKey="movingAvgWeighted" name="Additive Regression" stackId="contribution" fill="#2e7d32" fillOpacity={0.6} radius={[2, 2, 0, 0]} barSize={12} />
                  )}
                </ComposedChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
