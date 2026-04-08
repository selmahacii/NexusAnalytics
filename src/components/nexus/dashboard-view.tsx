"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as _Tooltip,
  Line,
  ComposedChart,
} from "recharts";
import {
  TrendingUp,
  TrendingDown as _TrendingDown,
  Users,
  UserMinus,
  ShoppingCart,
  Factory,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  ShieldAlert,
  FileDown,
  RefreshCw,
  Calendar,
  Filter,
  FileSearch,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────────

interface KpiData {
  revenueYtd: number;
  revenueGrowthPct: number;
  activeCustomers: number;
  customerChurnRate: number;
  avgOrderValue: number;
  productionEfficiency: { avg: number; trend: string };
  pendingOrders: number;
  cashBalance: number;
  ebitdaMargin: number;
  delayedShipments: number;
  anomalyCount: number;
  topProducts: { name: string; revenue: number; growth: number }[];
  revenueByMonth: {
    month: string;
    revenue: number;
    target: number;
  }[];
  revenueByRegion: { region: string; revenue: number }[];
  revenueByChannel: { channel: string; revenue: number; pct: number }[];
  monthlyCustomers: {
    month: string;
    new: number;
    churned: number;
    total: number;
  }[];
}

interface Anomaly {
  id: string;
  metricName: string;
  severity: "critical" | "high" | "medium" | "low";
  explanation: string;
  detectedAt: string;
  anomalyScore: number;
}

interface DashboardData {
  kpi: KpiData;
  recentAnomalies?: Anomaly[];
}

// ── Chart Configs ───────────────────────────────────────────────────────────

const revenueChartConfig: ChartConfig = {
  revenue: { label: "Revenue", color: "hsl(var(--chart-1))" },
  target: { label: "Target", color: "hsl(var(--chart-4))" },
};

const regionChartConfig: ChartConfig = {
  Alger: { label: "Alger", color: "hsl(var(--chart-1))" },
  Oran: { label: "Oran", color: "hsl(var(--chart-2))" },
  Constantine: { label: "Constantine", color: "hsl(var(--chart-3))" },
  Annaba: { label: "Annaba", color: "hsl(var(--chart-5))" },
  Sétif: { label: "Sétif", color: "hsl(var(--chart-6))" },
  "Blida": { label: "Blida", color: "hsl(var(--chart-7))" },
};

const channelChartConfig: ChartConfig = {
  revenue: { label: "Revenue", color: "hsl(var(--chart-1))" },
};

const customerChartConfig: ChartConfig = {
  new: { label: "New Customers", color: "hsl(var(--chart-1))" },
  churned: { label: "Churned", color: "hsl(var(--chart-5))" },
};

const REGION_COLORS = [
  "hsl(160, 84%, 39%)",
  "hsl(38, 92%, 50%)",
  "hsl(217, 91%, 60%)",
  "hsl(346, 77%, 50%)",
  "hsl(262, 83%, 58%)",
  "hsl(187, 85%, 53%)",
];

// ── Intersection Observer Hook ──────────────────────────────────────────────

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

// ── Sparkline ───────────────────────────────────────────────────────────────

function MiniSparkline({
  data,
  color,
  height = 32,
}: {
  data: number[];
  color: string;
  height?: number;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={height} className="shrink-0 opacity-60">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

// ── KPI Card ────────────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  rawValue?: number;
  change?: number;
  trend?: "up" | "down" | "neutral";
  sparkData?: number[];
  sparkColor?: string;
  index: number;
  negativeIsBad?: boolean;
  animated?: boolean;
}

function KpiCard({
  icon,
  title,
  value,
  change,
  sparkData,
  sparkColor = "hsl(160, 84%, 39%)",
  index,
  negativeIsBad = true,
  animated = false,
}: KpiCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  const trendColor =
    negativeIsBad
      ? isPositive
        ? "text-emerald-600 dark:text-emerald-400"
        : isNegative
          ? "text-rose-600 dark:text-rose-400"
          : "text-muted-foreground"
      : isPositive
        ? "text-rose-600 dark:text-rose-400"
        : isNegative
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-muted-foreground";

  const changeAnimClass = animated ? "animate-count-up" : "";

  return (
    <Card className={cn(
      "glass-card card-hover transition-all duration-300 shadow-sm relative overflow-hidden",
      "animate-slide-up h-full flex flex-col",
      `stagger-${index + 1}`
    )}>
      <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-10 transition-opacity">
        {icon}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-sm font-medium truncate">{title}</span>
        </div>
        {sparkData && sparkData.length > 1 && (
          <MiniSparkline data={sparkData} color={sparkColor} />
        )}
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <span className={cn("text-2xl font-bold tracking-tight", changeAnimClass)}>
          {value}
        </span>
        {change !== undefined && (
          <span className={cn(
            "flex items-center gap-0.5 text-xs font-medium transition-colors duration-200",
            trendColor
          )}>
            {isPositive && <ArrowUpRight className="h-3 w-3" />}
            {isNegative && <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
    </Card>
  );
}

// ── Severity Badge ──────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, { label: string; className: string }> = {
    critical: {
      label: "Critical",
      className: "border-rose-500/50 bg-rose-500/15 text-rose-700 dark:text-rose-400",
    },
    high: {
      label: "High",
      className: "border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-400",
    },
    medium: {
      label: "Medium",
      className: "border-blue-500/50 bg-blue-500/15 text-blue-700 dark:text-blue-400",
    },
    low: {
      label: "Low",
      className: "border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    },
  };
  const cfg = map[severity] ?? map.low;
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  );
}

// ── Chart Card Wrapper ──────────────────────────────────────────────────────

function ChartCard({
  title,
  children,
  className,
  delay = 0,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, inView } = useInView(0.1);

  return (
    <Card
      ref={ref}
      className={cn(
        "glass-card card-hover transition-all duration-300 shadow-md animate-slide-up h-full flex flex-col",
        `stagger-${delay + 7}`,
        className
      )}
    >
      {title && (
        <CardHeader className="flex flex-row items-center justify-between pb-3 px-6 pt-6">
          <CardTitle className="text-base font-bold tracking-tight text-premium-gradient">
            {title}
          </CardTitle>
          <div className="flex items-center gap-1.5 translate-x-2">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg opacity-40 hover:opacity-100 transition-opacity">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg opacity-40 hover:opacity-100 transition-opacity">
              <FileDown className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
      )}
      <CardContent className={cn("flex-1 px-3 sm:px-6 pb-6 pt-0", title ? "" : "pt-6")}>
        {children}
      </CardContent>
    </Card>
  );
}

// ── Loading Skeletons ───────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border rounded-xl p-4 sm:p-6">
            <Skeleton className="mb-3 h-4 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="mt-2 h-3 w-12" />
          </Card>
        ))}
      </div>
      {/* Charts row 1 */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-5">
        <Card className="border rounded-xl p-4 sm:p-6 lg:col-span-3">
          <Skeleton className="mb-4 h-5 w-40" />
          <Skeleton className="h-[280px] sm:h-[300px] w-full rounded-md" />
        </Card>
        <Card className="border rounded-xl p-4 sm:p-6 lg:col-span-2">
          <Skeleton className="mb-4 h-5 w-40" />
          <Skeleton className="h-[280px] sm:h-[300px] w-full rounded-md" />
        </Card>
      </div>
      {/* Charts row 2 */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card className="border rounded-xl p-4 sm:p-6">
          <Skeleton className="mb-4 h-5 w-40" />
          <Skeleton className="h-[280px] sm:h-[300px] w-full rounded-md" />
        </Card>
        <Card className="border rounded-xl p-4 sm:p-6">
          <Skeleton className="mb-4 h-5 w-40" />
          <Skeleton className="h-[280px] sm:h-[300px] w-full rounded-md" />
        </Card>
      </div>
      {/* Alerts */}
      <div>
        <Skeleton className="mb-4 h-5 w-36" />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Formatters ──────────────────────────────────────────────────────────────

function fmtCurrency(value: number): string {
  return `${(value / 1e6).toFixed(1)}M DZD`;
}

function fmtNumber(value: number): string {
  return value.toLocaleString("fr-DZ");
}

function fmtK(value: number): string {
  return `${(value / 1000).toFixed(0)}K DZD`;
}

function fmtPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function DashboardView() {
  const { setActiveView } = useAppStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/dashboard")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP Error: ${r.status}`);
        return r.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        setError(err instanceof Error ? err.message : "Failed to load data");
      });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  if (loading) return <DashboardSkeleton />;
  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p className="font-medium">{error}</p>
        <Button variant="outline" className="mt-4 rounded-xl" onClick={() => { setError(null); fetchData(); }}>Retry</Button>
      </div>
    );
  }
  if (!data?.kpi) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        No data available. Please run the database seed.
      </div>
    );
  }

  const kpi = data.kpi;

  // Sparkline data derived from monthly revenue
  const revenueSpark = kpi.revenueByMonth.map((m) => m.revenue);
  const customerSpark = kpi.monthlyCustomers.map((m) => m.total);

  // Region data for donut with fill property
  const regionData = kpi.revenueByRegion.map((r) => ({
    name: r.region,
    value: r.revenue,
    fill: REGION_COLORS[
      kpi.revenueByRegion.indexOf(r) % REGION_COLORS.length
    ],
  }));

  // Channel data
  const channelData = kpi.revenueByChannel.map((c) => ({
    name: c.channel.charAt(0).toUpperCase() + c.channel.slice(1),
    revenue: c.revenue,
    pct: c.pct,
  }));

  // Anomalies (max 5)
  const alerts = (data.recentAnomalies ?? []).slice(0, 5);

  return (
    <section className="space-y-6" aria-label="Executive Dashboard">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-premium-gradient">Executive Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time business intelligence and KPI monitoring for enterprise operations.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="rounded-xl h-9 gap-1.5 bg-card/50 text-xs shadow-sm">
            <Calendar className="w-4 h-4" /> Last 30 Days
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl h-9 gap-1.5 bg-card/50 text-xs shadow-sm">
            <FileDown className="w-4 h-4" /> Export Report
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl h-9 w-9 bg-card/50 shadow-sm"
            onClick={() => fetchData()}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

        


      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <KpiCard
          icon={<TrendingUp className="h-4 w-4" />}
          title="Revenue (YTD)"
          value={fmtCurrency(kpi.revenueYtd)}
          change={kpi.revenueGrowthPct}
          trend={kpi.revenueGrowthPct >= 0 ? "up" : "down"}
          sparkData={revenueSpark}
          index={0}
          animated
        />
        <KpiCard
          icon={<Users className="h-4 w-4" />}
          title="Active Customers"
          value={fmtNumber(kpi.activeCustomers)}
          change={
            kpi.monthlyCustomers.length >= 2
              ? kpi.monthlyCustomers[kpi.monthlyCustomers.length - 1].new -
                kpi.monthlyCustomers[kpi.monthlyCustomers.length - 2].new
              : undefined
          }
          sparkData={customerSpark}
          index={1}
          animated
        />
        <KpiCard
          icon={<UserMinus className="h-4 w-4" />}
          title="Churn Rate"
          value={fmtPct(kpi.customerChurnRate)}
          change={kpi.customerChurnRate}
          trend="down"
          sparkData={kpi.monthlyCustomers.map((m) => m.churned)}
          sparkColor="hsl(346, 77%, 50%)"
          negativeIsBad={false}
          index={2}
          animated
        />
        <KpiCard
          icon={<ShoppingCart className="h-4 w-4" />}
          title="Avg. Order Value"
          value={fmtK(kpi.avgOrderValue)}
          sparkData={revenueSpark}
          index={3}
          animated
        />
        <KpiCard
          icon={<Factory className="h-4 w-4" />}
          title="Prod. Efficiency"
          value={fmtPct(kpi.productionEfficiency.avg)}
          change={kpi.productionEfficiency.avg}
          trend={kpi.productionEfficiency.trend === "up" ? "up" : "down"}
          negativeIsBad={false}
          index={4}
          animated
        />
        <KpiCard
          icon={<Activity className="h-4 w-4" />}
          title="Orders"
          value={fmtNumber(kpi.pendingOrders)}
          change={kpi.delayedShipments}
          trend="down"
          negativeIsBad
          sparkColor="oklch(var(--chart-5))"
          index={5}
          animated
        />
        <KpiCard
          icon={<AlertTriangle className="h-4 w-4" />}
          title="Pending Orders"
          value={fmtNumber(kpi.pendingOrders)}
          change={kpi.delayedShipments}
          trend="down"
          sparkColor="hsl(346, 77%, 50%)"
          negativeIsBad={false}
          index={5}
          animated
        />
      </div>

      {/* ── Revenue Trend + Region Donut ───────────────────────────────── */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-5">
        {/* Revenue Trend */}
        <ChartCard title="Revenue Trend" className="lg:col-span-3" delay={0}>
          <div className="h-[280px] sm:h-[300px]">
            <ChartContainer config={revenueChartConfig} className="h-full w-full">
              <ComposedChart data={kpi.revenueByMonth} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  tickFormatter={(v: number) => `${(v / 1e6).toFixed(0)}M`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(160, 84%, 39%)"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="hsl(215, 14%, 45%)"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={false}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
              </ComposedChart>
            </ChartContainer>
          </div>
        </ChartCard>

        {/* Revenue by Region Donut */}
        <ChartCard title="Revenue by Region" className="lg:col-span-2" delay={1}>
          <div className="h-[280px] sm:h-[300px]">
            <ChartContainer config={regionChartConfig} className="h-full w-full">
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) =>
                        `${(Number(value) / 1e6).toFixed(1)}M DZD`
                      }
                    />
                  }
                />
                <Pie
                  data={regionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  animationDuration={1000}
                  animationEasing="ease-out"
                >
                  {regionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend
                  content={<ChartLegendContent nameKey="name" />}
                />
              </PieChart>
            </ChartContainer>
          </div>
        </ChartCard>
      </div>

      {/* ── Channel Bar + Customers Area ───────────────────────────────── */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Revenue by Channel */}
        <ChartCard title="Revenue by Channel" delay={2}>
          <div className="h-[280px] sm:h-[300px]">
            <ChartContainer config={channelChartConfig} className="h-full w-full">
              <BarChart
                data={channelData}
                layout="vertical"
                margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  tickFormatter={(v: number) => `${(v / 1e6).toFixed(0)}M`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  width={100}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) =>
                        `${(Number(value) / 1e6).toFixed(1)}M DZD`
                      }
                    />
                  }
                />
                <Bar
                  dataKey="revenue"
                  radius={[0, 6, 6, 0]}
                  animationDuration={1000}
                  animationEasing="ease-out"
                >
                  {channelData.map((_, index) => (
                    <Cell
                      key={`bar-${index}`}
                      fill={REGION_COLORS[index % REGION_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        </ChartCard>

        {/* Monthly Customers */}
        <ChartCard title="Customer Trends" delay={3}>
          <div className="h-[280px] sm:h-[300px]">
            <ChartContainer config={customerChartConfig} className="h-full w-full">
              <AreaChart data={kpi.monthlyCustomers} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="newCustGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="churnedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(346, 77%, 50%)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(346, 77%, 50%)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  type="monotone"
                  dataKey="new"
                  stackId="customers"
                  stroke="hsl(160, 84%, 39%)"
                  strokeWidth={2}
                  fill="url(#newCustGrad)"
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
                <Area
                  type="monotone"
                  dataKey="churned"
                  stackId="customers"
                  stroke="hsl(346, 77%, 50%)"
                  strokeWidth={2}
                  fill="url(#churnedGrad)"
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </ChartCard>
      </div>

      {/* ── Recent Alerts ──────────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="animate-slide-up opacity-0 stagger-10">
          <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            Recent Alerts
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {alerts.map((a, i) => (
              <Card key={a.id ?? i} className="border rounded-xl p-4 card-hover">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Activity
                        className={cn(
                          "h-3.5 w-3.5 shrink-0 transition-colors duration-200",
                          a.severity === "critical"
                            ? "text-rose-500"
                            : a.severity === "high"
                              ? "text-amber-500"
                              : "text-blue-500"
                        )}
                      />
                      <span className="text-xs font-bold leading-tight">
                        {a.metricName}
                      </span>
                    </div>
                  </div>
                  <SeverityBadge severity={a.severity} />
                <p className="mt-2 text-sm leading-snug">{a.explanation}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Score: {a.anomalyScore.toFixed(1)} &middot;{" "}
                  {a.detectedAt
                    ? new Date(a.detectedAt).toLocaleString("en-US", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </p>
              </Card>
            ))}
          </div>

          <div className="mt-6 flex justify-center">
            <Button 
              variant="outline" 
              className="rounded-xl border-dashed border-muted-foreground/30 h-11 text-xs font-bold gap-2 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all px-8 shadow-sm"
              onClick={() => setActiveView("anomalies")}
            >
              <FileSearch className="w-4 h-4" /> View Full Intelligence Archive & Active Streams
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
