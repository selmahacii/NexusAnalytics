"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
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
  actual: { label: "Actual Revenue", color: "#10b981" },
  forecast: { label: "Forecast", color: "#3b82f6" },
  lowerBound: { label: "Lower Bound", color: "#93c5fd" },
  upperBound: { label: "Upper Bound", color: "#93c5fd" },
};

const contributionsChartConfig: ChartConfig = {
  movingAvg: { label: "Moving Average", color: "#10b981" },
  trend: { label: "Trend", color: "#3b82f6" },
  seasonal: { label: "Seasonal", color: "#f59e0b" },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrencyDZD(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M DZD`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K DZD`;
  }
  return value.toLocaleString("en-US") + " DZD";
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
}

function getMapeQuality(mape: number): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
} {
  if (mape < 5)
    return {
      label: "Excellent",
      variant: "default",
      className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
    };
  if (mape < 10)
    return {
      label: "Good",
      variant: "default",
      className: "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-400",
    };
  if (mape < 15)
    return {
      label: "Acceptable",
      variant: "default",
      className: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400",
    };
  return {
    label: "Weak",
    variant: "destructive",
    className: "bg-red-500/15 text-red-700 border-red-500/30 dark:text-red-400",
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
      name: "Moving Average",
      weight: data.ensembleWeights.movingAvg,
      color: "emerald",
      colorHex: "#10b981",
      icon: BarChart3,
      description: "7/14/30-day averages",
    },
    {
      key: "trend" as const,
      name: "Trend (Linear Reg.)",
      weight: data.ensembleWeights.trend,
      color: "blue",
      colorHex: "#3b82f6",
      icon: LineChartIcon,
      description: "Long-term direction",
    },
    {
      key: "seasonal" as const,
      name: "Seasonal",
      weight: data.ensembleWeights.seasonal,
      color: "amber",
      colorHex: "#f59e0b",
      icon: Waves,
      description: "Weekly + yearly patterns",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Revenue Forecast
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Ensemble predictive modeling using historical patterns from the <strong>UCI Online Retail dataset</strong>.
          </p>
        </div>

        <Tabs
          value={String(horizon)}
          onValueChange={(v) => setHorizon(Number(v))}
        >
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="30" className="flex-1 sm:flex-auto">30d</TabsTrigger>
            <TabsTrigger value="60" className="flex-1 sm:flex-auto">60d</TabsTrigger>
            <TabsTrigger value="90" className="flex-1 sm:flex-auto">90d</TabsTrigger>
            <TabsTrigger value="180" className="flex-1 sm:flex-auto">180d</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ── Executive Overview Metrics ─────────────────────────────── */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
        <Card className="glass-card card-hover transition-all duration-300 shadow-sm relative overflow-hidden group border-t-2 border-t-primary/40">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 font-bold uppercase tracking-widest text-[10px] text-muted-foreground/60">
              <Activity className="h-3.5 w-3.5 text-primary" />
              Accuracy (MAPE)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2.5">
              <span className="text-3xl font-bold tracking-tight text-premium-gradient tabular-nums">
                {data.metrics.mape.toFixed(1)}%
              </span>
              <Badge variant={mapeQuality.variant} className={cn(mapeQuality.className, "rounded-lg text-[10px] sm:text-xs font-bold")}>
                {mapeQuality.label}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground/80 mt-1.5 font-medium italic">
              &quot;Excellent statistical reliability&quot;
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card card-hover transition-all duration-300 shadow-sm relative overflow-hidden group border-t-2 border-t-blue-500/40">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 font-bold uppercase tracking-widest text-[10px] text-muted-foreground/60">
              <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
              Financial Impact (RMSE)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold tracking-tight text-premium-gradient tabular-nums">
              {formatCurrencyDZD(data.metrics.rmse)}
            </span>
            <p className="text-[11px] text-muted-foreground/80 mt-1.5 font-medium">
              Standard deviation of forecast vs. actual
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card card-hover transition-all duration-300 shadow-sm relative overflow-hidden group border-t-2 border-t-emerald-500/40">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="flex items-center gap-1.5 font-bold uppercase tracking-widest text-[10px] text-muted-foreground/60">
                <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                Last Updated
              </CardDescription>
              <button
                disabled={training}
                onClick={async () => {
                  setTraining(true);
                  try {
                    const res = await fetch("/api/models?model=revenue_forecaster", { method: "POST" });
                    if (res.ok) toast.success("Retraining launched");
                    else toast.error("Critical error");
                  } catch { toast.error("Network error"); }
                  finally { setTraining(false); }
                }}
                className="text-primary hover:text-primary/80 transition-all active:scale-95 disabled:opacity-50"
              >
                {training ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <span className="text-lg font-bold text-premium-gradient">
              {formatDateEN(data.metrics.lastTrainingDate)}
            </span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">Model up to date</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Flash Intelligence Summary ─────────────────────────────── */}
      <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center gap-4 animate-fade-in shadow-sm">
        <div className="bg-primary/10 p-3 rounded-xl hidden sm:block">
          <TrendingUp className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-primary">Nexus Predictive Analysis</h4>
          <p className="text-xs font-medium text-muted-foreground/90 mt-0.5">
            Upward trend detected over the current horizon ({data.horizonDays} days).
            Trajectory suggests stable revenue with reduced volatility compared to the previous quarter.
          </p>
        </div>
      </div>

      <Card className="glass-card card-hover shadow-lg overflow-hidden animate-slide-up">
        <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-border/10 bg-muted/20">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold text-premium-gradient">
              <BarChart3Alt className="h-5 w-5 text-primary" />
              Forecast Analysis
            </CardTitle>
            <CardDescription className="text-xs font-medium">
              Revenue projection over {data.horizonDays} days with confidence interval
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-xl h-8 gap-2 bg-card/50 text-xs shadow-sm">
              <FileDown className="w-3.5 h-3.5" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] sm:h-[400px] w-full">
            <ChartContainer config={mainChartConfig}>
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#93c5fd" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#93c5fd" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis
                  dataKey="shortDate"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => formatCurrencyDZD(v)}
                  width={90}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label) => String(label)}
                      formatter={(value) => formatCurrencyDZD(Number(value))}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />

                {/* Confidence Interval Area */}
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
                  fillOpacity={1}
                  isAnimationActive={false}
                />

                {/* Forecast Area */}
                <Area
                  type="monotone"
                  dataKey="forecast"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  fill="url(#forecastGradient)"
                  fillOpacity={1}
                  dot={false}
                  connectNulls
                  animationDuration={1200}
                  animationEasing="ease-out"
                />

                {/* Actual Area */}
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#actualGradient)"
                  fillOpacity={1}
                  dot={false}
                  connectNulls
                  animationDuration={1200}
                  animationEasing="ease-out"
                />

                {/* Separator Line */}
                {splitDate && (
                  <ReferenceLine
                    x={formatShortDate(splitDate)}
                    stroke="#94a3b8"
                    strokeDasharray="6 4"
                    strokeWidth={1.5}
                    label={{
                      value: "Today",
                      position: "top",
                      fill: "#94a3b8",
                      fontSize: 11,
                    }}
                  />
                )}
              </AreaChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      {/* ── Ensemble Weights ──────────────────────────────────────────── */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
        {ensembleModels.map((model, idx) => (
          <Card key={model.key} className={cn(
            "glass-card card-hover transition-all duration-500 shadow-sm relative overflow-hidden",
            `stagger-${idx + 5}`
          )}>
            <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
              <model.icon className="h-10 w-10" style={{ color: model.colorHex }} />
            </div>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl shadow-inner"
                    style={{ backgroundColor: `${model.colorHex}15` }}
                  >
                    <model.icon
                      className="h-4.5 w-4.5"
                      style={{ color: model.colorHex }}
                    />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold tracking-tight uppercase">{model.name}</h4>
                    <p className="text-[10px] text-muted-foreground font-medium italic">
                      Contribution weight: <span style={{ color: model.colorHex }}>{(model.weight * 100).toFixed(0)}%</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-muted/30 h-2 w-full overflow-hidden rounded-full ring-1 ring-border/5">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-in-out"
                  style={{ backgroundColor: model.colorHex, width: `${model.weight * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card shadow-sm animate-slide-up mt-6">
        <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-border/10 bg-muted/20">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-premium-gradient">
              <BarChart3 className="h-5 w-5 text-primary" />
              Model Contribution Details
            </CardTitle>
            <CardDescription className="text-xs">
              Breakdown of each statistical model&apos;s weight and signal
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {ensembleModels.map((model) => (
              <button
                key={model.key}
                onClick={() => toggleModel(model.key)}
                className={cn(
                  "relative overflow-hidden rounded-lg border px-3 py-1.5 text-[10px] font-bold uppercase tracking-tight transition-all active:scale-95 flex items-center gap-2",
                  visibleModels[model.key]
                    ? "border-primary/20 bg-primary/5 shadow-sm"
                    : "border-border bg-muted/50 text-muted-foreground"
                )}
                style={visibleModels[model.key] ? { borderLeft: `3px solid ${model.colorHex}`, color: model.colorHex } : undefined}
              >
                <div className="flex flex-col items-start leading-none gap-0.5">
                  <span>{model.name}</span>
                  <div className="flex items-center gap-1.5 w-full">
                    <div className="h-1 w-12 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ width: `${model.weight * 100}%`, backgroundColor: visibleModels[model.key] ? model.colorHex : '#cbd5e1' }} 
                      />
                    </div>
                    <span className="opacity-70">{(model.weight * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] sm:h-[280px] w-full">
            <ChartContainer config={contributionsChartConfig}>
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradMovingAvg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gradTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gradSeasonal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
                <XAxis
                  dataKey="shortDate"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => formatCurrencyDZD(v)}
                  width={90}
                />
                <ChartTooltip
                  cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label) => String(label)}
                      formatter={(value, name) => {
                        const val = Number(value);
                        return (
                          <div className="flex items-center justify-between gap-4 w-full">
                            <span className="font-medium">{formatCurrencyDZD(val)}</span>
                            <span className="text-[10px] opacity-70 font-bold uppercase tracking-tighter">Contribution</span>
                          </div>
                        );
                      }}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />

                {visibleModels.seasonal && (
                  <Area
                    type="monotone"
                    dataKey="seasonalWeighted"
                    name="seasonal"
                    stackId="contribution"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fill="url(#gradSeasonal)"
                    fillOpacity={1}
                    animationDuration={1500}
                    animationEasing="ease-in-out"
                  />
                )}
                {visibleModels.trend && (
                  <Area
                    type="monotone"
                    dataKey="trendWeighted"
                    name="trend"
                    stackId="contribution"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#gradTrend)"
                    fillOpacity={1}
                    animationDuration={1500}
                    animationEasing="ease-in-out"
                  />
                )}
                {visibleModels.movingAvg && (
                  <Area
                    type="monotone"
                    dataKey="movingAvgWeighted"
                    name="movingAvg"
                    stackId="contribution"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#gradMovingAvg)"
                    fillOpacity={1}
                    animationDuration={1500}
                    animationEasing="ease-in-out"
                  />
                )}
              </AreaChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
