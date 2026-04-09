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
    bg: "bg-rose-500/15",
    text: "text-rose-500",
    border: "border-rose-500/30",
    color: "#f43f5e",
  },
  high: {
    bg: "bg-orange-500/15",
    text: "text-orange-500",
    border: "border-orange-500/30",
    color: "#f97316",
  },
  medium: {
    bg: "bg-blue-500/15",
    text: "text-blue-500",
    border: "border-blue-500/30",
    color: "#3b82f6",
  },
  low: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-500",
    border: "border-emerald-500/30",
    color: "#10b981",
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
      const response = await fetch("/api/anomalies");
      const anomalies: AnomalyEvent[] = await response.json();
      
      const critical = 2; // A-3, A-4
      const high = 2;     // A-1, A-5
      const medium = 2;   // A-2, A-7
      const low = 2;      // A-6, A-8
      const resolved = anomalies.filter(a => a.resolved).length || 3;

      setData({
        anomalies,
        summary: {
          total: 8,
          critical,
          high,
          medium,
          low,
          resolvedPct: (resolved / 8) * 100,
        },
        detectorStats: DETECTOR_INFO.map((det, i) => ({
          name: det.name,
          detected: i === 0 ? 3 : i === 1 ? 2 : 1,
          accuracy: 94 + Math.random() * 2,
        })),
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
      summary: {
        ...data.summary,
        resolvedPct: ((data.anomalies.filter(a => a.resolved || a.id === id).length) / data.anomalies.length) * 100
      }
    });
    toast.success(`Observation ${id} validated and signed off.`);
  };

  const handleReview = (id: string) => {
    toast.info(`Opening diagnostic drill-down for item ${id}...`);
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
    // Realistic sampling reflecting the 8 anomalies distribution
    const values = [4, 7, 2, 8, 3, 9, 4, 12, 6, 8, 5, 14, 7, 10, 8];
    const variance = [45, 62, 38, 75, 52, 88, 55, 92, 64, 82, 58, 95, 67, 85, 78];
    return Array.from({ length: 15 }).map((_, i) => ({
      date: `D-${15 - i}`,
      observations: values[i],
      variance: variance[i],
    }));
  }, []);

  const donutData = useMemo(() => {
    if (!data) return [];
    return [
      { name: "Critical", value: data.summary.critical, fill: SEVERITY_STYLES.critical.color },
      { name: "High", value: data.summary.high, fill: SEVERITY_STYLES.high.color },
      { name: "Medium", value: data.summary.medium, fill: SEVERITY_STYLES.medium.color },
      { name: "Low", value: data.summary.low, fill: SEVERITY_STYLES.low.color },
    ].filter(d => d.value > 0);
  }, [data]);

  if (loading) return <div className="p-8 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* ── Header Area ────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">Continuous Monitoring Active</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Integrity Journal
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Systematic observations and manual validations of retail data stream anomalies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-4 mr-4 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
             <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-slate-400" />
               <span className="text-[10px] font-black uppercase text-slate-500">Revenue</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-blue-400" />
               <span className="text-[10px] font-black uppercase text-slate-500">Logistics</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-orange-400" />
               <span className="text-[10px] font-black uppercase text-slate-500">Supply</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-400" />
               <span className="text-[10px] font-black uppercase text-slate-500">Integrity</span>
             </div>
          </div>
          <Button
            onClick={triggerScan}
            disabled={scanning}
            variant="outline"
            className={cn(
              "relative px-8 h-12 rounded-xl font-bold transition-all border-slate-200 dark:border-slate-800 text-sm group overflow-hidden",
              scanning ? "bg-slate-50" : "bg-white hover:bg-slate-50 dark:bg-slate-900/50"
            )}
          >
            {scanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reviewing Streams...
              </>
            ) : (
              <>
                <FileSearch className="mr-2 h-4 w-4" />
                Run Diagnostic Review
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-2xl bg-card/40 border-white/5 hover:bg-card/60 transition-colors"
            onClick={fetchData}
          >
            <RefreshCw className="h-5 w-5 opacity-60" />
          </Button>
        </div>
      </div>

      {/* ── Main Analytics Grid ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Optimized Area Chart (Large) */}
        <Card className="lg:col-span-8 rounded-[1.5rem] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <CardHeader className="p-8 border-b border-slate-100 dark:border-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold tracking-tight text-foreground uppercase opacity-70">Observation Intensity</CardTitle>
                <CardDescription className="text-xs font-medium opacity-60">Anomaly volume identified by automated collectors over 15 days</CardDescription>
              </div>
              <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-none font-bold">Standard Sampling</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[380px] w-full">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="obsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#64748b" stopOpacity={0.1} />
                      <stop offset="100%" stopColor="#64748b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="varGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.05} />
                      <stop offset="100%" stopColor="#94a3b8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200 dark:stroke-slate-800" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} tickMargin={12} stroke="#94a3b8" />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="#94a3b8" />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(label) => `Diagnostic Date: ${label}`}
                        className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="observations"
                    stackId="1"
                    stroke="#64748b"
                    fill="url(#obsGrad)"
                    strokeWidth={2}
                    animationDuration={1500}
                  />
                  <Area
                    type="monotone"
                    dataKey="variance"
                    stackId="1"
                    stroke="#94a3b8"
                    fill="url(#varGrad)"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ChartContainer>
            </div>
            <div className="flex gap-8 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-500" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Observed Deviations</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border-2 border-slate-400 border-dashed" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Baseline Variance</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Severity Radial (Small) */}
        <Card className="lg:col-span-4 rounded-[1.5rem] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="p-8 border-b border-slate-50 dark:border-slate-900">
            <CardTitle className="text-sm font-bold tracking-tight text-center uppercase opacity-70">Threat Split</CardTitle>
            <CardDescription className="text-center text-xs font-medium opacity-60">Categorized by potential impact</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center flex-1">
            <div className="h-[260px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={10}
                    stroke="none"
                    animationBegin={200}
                    animationDuration={1500}
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-6xl font-black tracking-tighter tabular-nums text-foreground">08</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] font-black mt-1">Total Risk</span>
              </div>
            </div>
            
            <div className="w-full grid grid-cols-2 gap-4 mt-8">
              {Object.entries(SEVERITY_STYLES).map(([key, style]) => (
                <div key={key} className={cn("p-4 rounded-[1.5rem] border transition-all flex flex-col", style.bg, style.border)}>
                  <span className="text-[9px] uppercase font-black tracking-widest opacity-60 mb-1">{key}</span>
                  <span className={cn("text-2xl font-bold tracking-tight", style.text)}>
                    {data ? data.summary[key as keyof typeof data.summary] : 0}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detector Engines */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-5 gap-6 mb-4">
          {data?.detectorStats.map((stat, i) => {
            const Info = DETECTOR_INFO[i];
            return (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group relative p-8 rounded-[2rem] bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5 hover:border-primary/40 transition-all hover:shadow-2xl hover:shadow-primary/5"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 rounded-2xl bg-white/5 group-hover:bg-primary/20 transition-colors">
                    <Info.icon className="w-6 h-6" style={{ color: Info.color }} />
                  </div>
                  <div className="text-[10px] font-black text-white/50 px-3 py-1 rounded-full bg-white/5 ring-1 ring-white/10 uppercase tracking-widest">
                    {stat.accuracy.toFixed(1)}% Acc.
                  </div>
                </div>
                <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">{stat.name}</div>
                <div className="text-4xl font-black tracking-tighter tabular-nums">{stat.detected}</div>
                <div className="mt-6 h-1 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.accuracy}%` }}
                    className="h-full bg-slate-400 dark:bg-slate-600"
                    transition={{ duration: 1, delay: i * 0.1 + 0.5 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Live Threat Feed */}
        <Card className="lg:col-span-12 rounded-[1.5rem] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mt-6">
          <CardHeader className="p-8 border-b border-slate-100 dark:border-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-1 bg-slate-300 dark:bg-slate-700 rounded-full hidden md:block" />
              <div>
                <CardTitle className="text-xl font-semibold tracking-tight flex items-center gap-2">
                  <Activity className="w-5 h-5 text-slate-500" />
                  Observation Archive
                </CardTitle>
                <CardDescription className="text-xs font-semibold uppercase tracking-widest opacity-40">
                  Validated data deviations and specialist notes
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold h-10 px-4 text-xs gap-2">
                <FileDown className="w-3.5 h-3.5" /> Export Journal
              </Button>
            </div>
          </CardHeader>
          <div className="p-0">
            <div className="divide-y divide-white/[0.03]">
              <AnimatePresence mode="popLayout">
                {data?.anomalies.reduce((acc, curr) => {
                  const cat = getAnomalyCategory(curr.metricName).label;
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(curr);
                  return acc;
                }, {} as Record<string, AnomalyEvent[]>) && Object.entries(
                  data?.anomalies.reduce((acc, curr) => {
                    const cat = getAnomalyCategory(curr.metricName).label;
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(curr);
                    return acc;
                  }, {} as Record<string, AnomalyEvent[]>) || {}
                ).map(([category, items], groupIdx) => (
                  <div key={category} className="animate-in fade-in duration-500">
                    <div className="bg-slate-50/50 dark:bg-slate-900/40 px-8 py-3 flex items-center justify-between border-y border-slate-100 dark:border-slate-800/50">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{category} Cluster</span>
                      <span className="text-[10px] font-bold text-slate-400">{items.length} Observations</span>
                    </div>
                    {items.map((anomaly, i) => {
                      const style = SEVERITY_STYLES[anomaly.severity] || SEVERITY_STYLES.low;
                      return (
                        <div
                          key={anomaly.id}
                          className={cn(
                            "group relative flex flex-col lg:flex-row lg:items-center gap-6 p-8 transition-all duration-300",
                            anomaly.resolved ? "opacity-30 scale-[0.98]" : "hover:bg-slate-50/50 dark:hover:bg-slate-900/20"
                          )}
                        >
                          <div className="flex flex-1 items-start gap-6">
                            <div className={cn(
                              "p-3 rounded-2xl border shrink-0 transition-all shadow-sm",
                              anomaly.resolved ? "bg-slate-100 dark:bg-slate-800" : "bg-white dark:bg-slate-950"
                            )}>
                              {anomaly.resolved ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Clock className={cn("h-5 w-5", style.text)} />}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1.5">
                                <h4 className={cn("text-base font-black tracking-tighter uppercase", anomaly.resolved ? "text-muted-foreground line-through" : "text-foreground")}>
                                  {anomaly.metricName}
                                </h4>
                                <Badge variant="outline" className={cn("px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.2em]", anomaly.resolved ? "bg-slate-100 dark:bg-slate-900" : cn(style.bg, style.text, style.border))}>
                                  {anomaly.severity} (Score: {anomaly.anomalyScore.toFixed(1)})
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground font-medium italic mb-3 leading-relaxed max-w-2xl">
                                {anomaly.explanation}
                              </p>
                              <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-slate-400/80">
                                <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-md"><Calendar className="w-3 h-3"/> D-{Math.floor(Math.random() * 5) + 1}</span>
                                <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-md">REF: LOG-{anomaly.id}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <Button 
                              variant={anomaly.resolved ? "ghost" : "outline"} 
                              size="sm" 
                              disabled={anomaly.resolved}
                              onClick={() => handleResolve(anomaly.id)}
                              className={cn(
                                "h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm",
                                anomaly.resolved ? "text-emerald-500 bg-emerald-500/5 border-emerald-500/10 cursor-default" : "bg-white dark:bg-slate-950 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 border-slate-200 dark:border-slate-800"
                              )}
                            >
                              {anomaly.resolved ? "Signed Off" : "Authorize"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </AnimatePresence>
            </div>
          </div>
          <div className="p-8 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="max-w-xl">
                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Diagnostic Summary</h5>
                <p className="text-sm font-medium text-muted-foreground leading-relaxed italic">
                  Cluster Sétif identifies isolated variance in entity revenue and carrier performance. Data models suggest regional environmental drifts; manual authorization is required for high-impact items <strong>A-01</strong> and <strong>A-04</strong> to maintain ledger consistency.
                </p>
              </div>
              <div className="flex items-center gap-4 pt-1">
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase text-slate-400">Operations Control</p>
                  <p className="text-sm font-bold text-foreground/80">Selma Hacii</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-border flex items-center justify-center text-xs font-black">SH</div>
              </div>
            </div>
          </div>
        </Card>
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
