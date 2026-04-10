"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  AlertTriangle,
  Activity,
  ShieldAlert,
  Zap,
  RefreshCw,
  FileDown,
  TrendingUp,
  Clock,
  CheckCircle2,
  BarChart3,
  Waves,
  Target,
  Loader2,
  ArrowUpRight,
  ExternalLink,
  FileSearch,
  Calendar,
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ────────────────────────────────────────────────────────────────────

interface AnomalyEvent {
  id: string;
  metricName: string;
  severity: "critical" | "high" | "medium" | "low";
  explanation: string;
  detectedAt: string;
  anomalyScore: number;
  resolved?: boolean;
}

interface AnomalyData {
  anomalies: AnomalyEvent[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    resolvedPct: number;
  };
  detectorStats: {
    name: string;
    detected: number;
    accuracy: number;
  }[];
}

// ── Configuration Visuelle ───────────────────────────────────────────────────

const SEVERITY_STYLES: Record<string, { bg: string; text: string; border: string; color: string }> = {
  critical: {
    bg: "bg-rose-500/10",
    text: "text-rose-600",
    border: "border-rose-500/20",
    color: "#e11d48",
  },
  high: {
    bg: "bg-amber-600/10",
    text: "text-amber-600",
    border: "border-amber-600/20",
    color: "#d97706",
  },
  medium: {
    bg: "bg-blue-600/10",
    text: "text-blue-600",
    border: "border-blue-600/20",
    color: "#2563eb",
  },
  low: {
    bg: "bg-slate-500/10",
    text: "text-slate-500",
    border: "border-slate-500/20",
    color: "#64748b",
  },
};

const chartConfig: ChartConfig = {
  observations: { label: "Observations", color: "#64748b" },
  variance: { label: "System Variance", color: "#94a3b8" },
};

const DETECTOR_INFO = [
  { name: "Variance Check", icon: BarChart3, color: "#94a3b8" },
  { name: "Pattern Match", icon: Target, color: "#64748b" },
  { name: "Growth Trend", icon: TrendingUp, color: "#475569" },
  { name: "Smoothing", icon: Waves, color: "#334155" },
  { name: "Seasonality", icon: Activity, color: "#1e293b" },
];

function getAnomalyCategory(metric: string): { label: string; color: string; description: string } {
  const m = metric.toLowerCase();
  if (m.includes("revenue") || m.includes("market") || m.includes("order")) {
    return { label: "Revenue Flow", color: "text-slate-600 bg-slate-500/10 border-slate-500/20", description: "Invoicing and regional revenue drift" };
  }
  if (m.includes("inventory") || m.includes("stock") || m.includes("return") || m.includes("unit")) {
    return { label: "Logistics Cluster", color: "text-blue-600 bg-blue-500/10 border-blue-500/20", description: "Stock levels and return unit variances" };
  }
  if (m.includes("carrier") || m.includes("shipping") || m.includes("axis") || m.includes("distribution")) {
    return { label: "Supply Chain", color: "text-orange-600 bg-orange-500/10 border-orange-500/20", description: "Carrier performance and route latency" };
  }
  if (m.includes("sync") || m.includes("latency") || m.includes("traffic") || m.includes("network") || m.includes("compliance")) {
    return { label: "System Integrity", color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20", description: "Telemetry sync and schema compliance" };
  }
  if (m.includes("tax") || m.includes("vat") || m.includes("audit") || m.includes("law")) {
    return { label: "Compliance Tier", color: "text-rose-600 bg-rose-500/10 border-rose-500/20", description: "Regulatory and fiscal discrepancies" };
  }
  return { label: "General Admin", color: "text-slate-500 bg-slate-500/5 border-slate-500/10", description: "Miscellaneous operational markers" };
}

export default function AnomaliesView() {
  const [data, setData] = useState<AnomalyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const demoAnomalies: AnomalyEvent[] = [
        { id: "A-1", metricName: "Revenue (Cluster Sétif)", severity: "high", anomalyScore: 8.5, explanation: "Revenue spike detected in Sétif Hub (+145%) over 24h. Anomalous volume found in SARL TechÉlectrique accounts.", detectedAt: "D-1" },
        { id: "A-4", metricName: "Order Value Threshold", severity: "critical", anomalyScore: 9.8, explanation: "Single transaction outlier: €5,400 for 'Circuit Breaker Batch' (Typical avg: €145). Possible bulk entry without B2B flag.", detectedAt: "D-1" },
        { id: "A-2", metricName: "Inventory: Cluster Alger", severity: "medium", anomalyScore: 6.2, explanation: "Unseasonal stock depletion for 'Bulk Cable Reels' in Algiers WH-12. Possible misclassification of retail vs B2B stock.", detectedAt: "D-4" },
        { id: "A-7", metricName: "Unit Return Rate", severity: "medium", anomalyScore: 5.8, explanation: "Significant increase in returns for 'Control Units' in Blida region. Inspecting batch quality with supplier.", detectedAt: "D-1" },
        { id: "A-3", metricName: "Carrier: Alger-Oran Axis", severity: "critical", anomalyScore: 9.1, explanation: "Critical latency detected for logistics route A1-Oran. 72% of shipments to Oranie delayed by 12h due to hub validation bottlenecks.", detectedAt: "D-1" },
        { id: "A-5", metricName: "Regional Tax Variance", severity: "high", anomalyScore: 7.9, explanation: "Inconsistent tax calculation for 45 invoices in Constantine cluster. Error level exceeding 5% threshold.", detectedAt: "D-1" },
        { id: "A-6", metricName: "Active Sync Sessions", severity: "low", anomalyScore: 3.5, explanation: "Minor drop in active telemetry sessions (-15%) during Algerian peak hours (10:00-12:00).", detectedAt: "D-5" },
        { id: "A-8", metricName: "Network Compliance", severity: "low", anomalyScore: 4.1, explanation: "Partial schema mismatch detected in Annaba endpoint nodes. Handled via Zod catch-all.", detectedAt: "D-2" },
      ];

      setData({
        anomalies: demoAnomalies,
        summary: {
          total: 8,
          critical: 2,
          high: 2,
          medium: 2,
          low: 2,
          resolvedPct: 37.5,
        },
        detectorStats: [
          { name: "Variance Check", detected: 3, accuracy: 95.5 },
          { name: "Pattern Match", detected: 2, accuracy: 94.5 },
          { name: "Growth Trend", detected: 1, accuracy: 94.1 },
          { name: "Smoothing", detected: 1, accuracy: 95.3 },
          { name: "Seasonality", detected: 1, accuracy: 95.7 },
        ],
      });
    } catch (err) {
      toast.error("Telemetry sync failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleResolve = (id: string) => {
    if (!data) return;
    setData({
      ...data,
      anomalies: data.anomalies.map(a => 
        a.id === id ? { ...a, resolved: true } : a
      ),
    });
    toast.success(`Observation ${id} validated and signed off.`);
  };

  const triggerScan = async () => {
    setScanning(true);
    toast.promise(new Promise(res => setTimeout(res, 2000)), {
      loading: "Analyzing data streams...",
      success: () => {
        setScanning(false);
        fetchData();
        return "Scan complete. 8 anomalies detected.";
      },
      error: "Scan failed",
    });
  };

  const timelineData = useMemo(() => {
    const values = [65, 82, 45, 98, 72, 110, 85, 120, 95, 105, 88, 115, 92, 108, 90];
    const variance = [45, 62, 38, 75, 52, 88, 55, 92, 64, 82, 58, 95, 67, 85, 78];
    return Array.from({ length: 15 }).map((_, i) => ({
      date: `D-${15 - i}`,
      observations: values[i],
      variance: variance[i],
    }));
  }, []);

  if (loading) return <div className="p-8 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 pb-20 px-4 sm:px-8 mt-4 animate-in fade-in duration-500">
      {/* ── Minimal Header ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-8 border-border/10">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Registry Status: Nominal</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">Integrity Journal</h1>
          <p className="text-muted-foreground/80 text-sm max-w-xl leading-relaxed">
            A chronological registry of systematic stream observations, audit-ready and validated for regional compliance across North-African distribution hubs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={triggerScan}
            disabled={scanning}
            className="h-11 px-6 rounded-full font-semibold transition-all shadow-sm bg-foreground text-background hover:opacity-90 active:scale-95"
          >
            {scanning ? "Validating..." : "Diagnostic Review"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-full hover:bg-muted/50 transition-colors"
            onClick={fetchData}
          >
            <RefreshCw className={cn("h-4 w-4 opacity-40", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* ── Stats Summary ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(SEVERITY_STYLES).map(([key, style]) => (
          <div key={key} className="bg-card/30 border border-border/10 p-6 rounded-3xl flex flex-col gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">{key} impact</span>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-semibold tracking-tighter">0{data?.summary[key as keyof typeof data.summary]}</span>
              <span className="text-[10px] font-bold text-muted-foreground/40 mb-1.5">Observations</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Workspace ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Simplified Chart (Left Side) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/40">Observation Intensity</h3>
            <div className="h-[340px] w-full pt-4">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <AreaChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/5" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={10} tickMargin={10} stroke="hsl(var(--foreground)/0.6)" fontWeight="600" />
                  <YAxis tickLine={false} axisLine={false} fontSize={10} stroke="hsl(var(--foreground)/0.6)" fontWeight="600" />
                  <ChartTooltip content={<ChartTooltipContent className="bg-background border-border/10 shadow-xl" />} />
                  <Area
                    type="monotone"
                    dataKey="observations"
                    stroke="#3b82f6"
                    fill="url(#obsGrad)"
                    strokeWidth={2.5}
                  />
                  <defs>
                    <linearGradient id="obsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ChartContainer>
            </div>
          </div>

          {/* Detector Badges (Horizontal Inline) */}
          <div className="pt-8 border-t border-border/10">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 mb-6">Internal Precision Audit</h3>
            <div className="flex flex-wrap gap-4">
              {data?.detectorStats.map((stat) => (
                <div key={stat.name} className="flex items-center gap-3 px-5 py-3 rounded-full bg-muted/30 border border-border/5">
                  <span className="text-xs font-semibold text-foreground/70">{stat.name}</span>
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                  <span className="text-[10px] font-bold text-slate-500">{stat.accuracy.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Audit Registry (Right Side) */}
        <div className="lg:col-span-4 border-l border-border/10 pl-0 lg:pl-12 space-y-10">
          <div className="space-y-1">
            <h3 className="text-base font-bold tracking-tight">Observation Archive</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">Chronological trace of regional stream anomalies.</p>
          </div>

          <div className="space-y-10 relative">
             {/* Simple vertical timeline line */}
             <div className="absolute left-4 top-2 bottom-2 w-px bg-border/10 hidden sm:block" />

             {data?.anomalies.map((anomaly, i) => {
               const style = SEVERITY_STYLES[anomaly.severity] || SEVERITY_STYLES.low;
               return (
                 <div key={anomaly.id} className={cn("group relative pl-0 sm:pl-10 space-y-3", anomaly.resolved && "opacity-40")}>
                    {/* Dot on timeline */}
                    <div className={cn(
                      "absolute left-[13px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-background hidden sm:block",
                      anomaly.resolved ? "bg-emerald-500" : "bg-slate-400"
                    )} />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">{anomaly.detectedAt} · LOG-{anomaly.id}</span>
                      </div>
                      <Badge variant="outline" className={cn("text-[9px] font-bold uppercase tracking-widest px-0 h-auto", style.text)}>
                        {anomaly.severity} (x{anomaly.anomalyScore.toFixed(0)})
                      </Badge>
                    </div>

                    <div className="space-y-2">
                       <h4 className="text-sm font-semibold tracking-tight text-foreground">{anomaly.metricName}</h4>
                       <p className="text-[13px] text-muted-foreground leading-relaxed italic pr-4">
                         "{anomaly.explanation}"
                       </p>
                    </div>

                    {!anomaly.resolved && (
                      <button 
                        onClick={() => handleResolve(anomaly.id)}
                        className="text-[10px] font-bold uppercase tracking-widest text-foreground hover:underline underline-offset-4"
                      >
                        Authorize Transition
                      </button>
                    )}
                 </div>
               );
             })}
          </div>

          {/* Audit Signature */}
          <div className="pt-10 border-t border-border/10 mt-10 space-y-6">
            <div className="space-y-2">
              <h5 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Operation Summary</h5>
              <p className="text-[11px] text-muted-foreground leading-relaxed opacity-80">
                Manual authorization is required for high-impact items to maintain ledger consistency and historical audit standards.
              </p>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">SH</div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-foreground">Selma Hacii</span>
                <span className="text-[9px] text-muted-foreground uppercase font-medium">Controller · v2.5.2</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnomaliesSkeleton() {
  return (
    <div className="space-y-8 p-6">
      <Skeleton className="h-16 w-1/2 rounded-l" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Skeleton className="lg:col-span-8 h-[400px] rounded-[3rem]" />
        <Skeleton className="lg:col-span-4 h-[400px] rounded-[3rem]" />
        <div className="lg:col-span-12 grid grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-[2rem]" />
          ))}
        </div>
      </div>
    </div>
  );
}
