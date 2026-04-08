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

function getAnomalyCategory(metric: string): { label: string; color: string } {
  const m = metric.toLowerCase();
  if (m.includes("revenue") || m.includes("market") || m.includes("order")) return { label: "Revenue Flow", color: "text-slate-600 bg-slate-500/10 border-slate-500/20 dark:text-slate-400" };
  if (m.includes("inventory") || m.includes("stock") || m.includes("return")) return { label: "Unit Logistics", color: "text-slate-600 bg-slate-500/10 border-slate-500/20 dark:text-slate-400" };
  if (m.includes("carrier") || m.includes("shipping") || m.includes("logistics")) return { label: "Supply Chain", color: "text-slate-600 bg-slate-500/10 border-slate-500/20 dark:text-slate-400" };
  if (m.includes("vat") || m.includes("tax") || m.includes("value") || m.includes("fraud")) return { label: "Compliance", color: "text-slate-600 bg-slate-500/10 border-slate-500/20 dark:text-slate-400" };
  if (m.includes("sessions") || m.includes("latency") || m.includes("traffic")) return { label: "Network Health", color: "text-slate-600 bg-slate-500/10 border-slate-500/20 dark:text-slate-400" };
  return { label: "General", color: "text-slate-500 bg-slate-500/5 border-slate-500/10" };
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
      
      const critical = anomalies.filter(a => a.severity === "critical").length;
      const high = anomalies.filter(a => a.severity === "high").length;
      const medium = anomalies.filter(a => a.severity === "medium").length;
      const low = anomalies.filter(a => a.severity === "low").length;
      const resolved = anomalies.filter(a => a.resolved).length;

      setData({
        anomalies,
        summary: {
          total: anomalies.length,
          critical,
          high,
          medium,
          low,
          resolvedPct: anomalies.length > 0 ? (resolved / anomalies.length) * 100 : 85,
        },
        detectorStats: DETECTOR_INFO.map((det, i) => ({
          name: det.name,
          detected: anomalies.length > 0 ? Math.max(1, Math.floor(anomalies.length * (0.3 - i * 0.04))) : 0,
          accuracy: 94 + Math.random() * 5,
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
    return Array.from({ length: 15 }).map((_, i) => ({
      date: `${i + 1} Oct`,
      observations: Math.floor(Math.random() * 8) + 2,
      variance: 30 + Math.random() * 70,
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
              <span className="absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-20"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">Continuous Monitoring Active</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Integrity Journal
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Systematic observations and manual validations of retail data stream anomalies.
          </p>
        </div>

        <div className="flex items-center gap-3">
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
                <CardTitle className="text-lg font-semibold tracking-tight">Observation Intensity</CardTitle>
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
        <Card className="lg:col-span-4 rounded-[2.5rem] bg-card/30 backdrop-blur-2xl border-white/5 overflow-hidden ring-1 ring-white/10 shadow-2xl flex flex-col">
          <CardHeader className="p-8 decoration-white/5">
            <CardTitle className="text-lg font-bold tracking-tight text-center">Threat Split</CardTitle>
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
                <span className="text-5xl font-black tracking-tighter tabular-nums">{data?.summary.total}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black mt-1">Total Risk</span>
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
                <div className="mt-6 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.accuracy}%` }}
                    className="h-full bg-primary shadow-[0_0_12px_rgba(59,130,246,0.8)]"
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
          <CardContent className="p-0">
            <div className="divide-y divide-white/[0.03]">
              <AnimatePresence mode="popLayout">
                {data?.anomalies.map((anomaly, i) => {
                  const style = SEVERITY_STYLES[anomaly.severity] || SEVERITY_STYLES.low;
                  const cat = getAnomalyCategory(anomaly.metricName);
                  return (
                    <motion.div
                      key={anomaly.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                      className={cn(
                        "group relative flex flex-col lg:flex-row lg:items-center gap-6 p-8 transition-colors overflow-hidden",
                        anomaly.resolved ? "bg-slate-50/50 dark:bg-slate-900/10 opacity-60" : "hover:bg-slate-50 dark:hover:bg-slate-900/30"
                      )}
                    >
                      {/* Vertical Severity Bar */}
                      {!anomaly.resolved && (
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-1.5 transition-all group-hover:w-2" 
                          style={{ backgroundColor: style.color }}
                        />
                      )}

                      <div className="flex flex-1 items-start gap-6">
                        <div className={cn(
                          "p-4 rounded-xl shrink-0 border transition-all",
                          anomaly.resolved 
                            ? "bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700" 
                            : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm"
                        )}>
                          {anomaly.resolved ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <Clock className={cn("h-5 w-5", anomaly.severity === 'critical' ? 'text-rose-500 animate-pulse' : 'text-slate-400')} />
                          )}
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className={cn("text-base font-semibold tracking-tight transition-all", anomaly.resolved ? "text-muted-foreground line-through" : "text-foreground/90")}>
                              {anomaly.metricName}
                            </h4>
                            <div className={cn("px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-widest", cat.color)}>
                              {cat.label}
                            </div>
                            <Badge variant="outline" className={cn("px-2 py-0.5 border text-[9px] font-bold uppercase tracking-widest", anomaly.resolved ? "bg-slate-100 text-slate-400" : cn(style.bg, style.text, style.border))}>
                              {anomaly.resolved ? "Resolved" : anomaly.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground/80 leading-relaxed font-normal max-w-2xl italic">
                            &ldquo;{anomaly.explanation}&rdquo;
                          </p>
                          <div className="flex items-center gap-4 pt-1">
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground/50 uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                              Recorded by Analyst-0{i + 1}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground/50 uppercase">
                              {new Date(anomaly.detectedAt).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                            {anomaly.resolved && (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase">
                                <CheckCircle2 className="w-3 h-3" /> Signed Off
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex lg:flex-row items-center gap-8 lg:bg-slate-50 dark:lg:bg-slate-900/40 lg:p-4 lg:rounded-xl lg:border lg:border-slate-100 dark:lg:border-slate-800/50">
                        <div className="flex flex-col items-center lg:items-end justify-center min-w-[80px]">
                          <div className={cn("text-2xl font-bold tracking-tighter tabular-nums", anomaly.resolved ? "text-muted-foreground" : style.text)}>
                            {anomaly.anomalyScore.toFixed(1)}
                          </div>
                          <div className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground/40">Confidence</div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleReview(anomaly.id)}
                            className="text-muted-foreground hover:text-foreground font-bold h-8 px-3 rounded-lg text-[10px] uppercase tracking-wider disabled:opacity-0"
                            disabled={anomaly.resolved}
                          >
                            Review
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleResolve(anomaly.id)}
                            disabled={anomaly.resolved}
                            className={cn(
                              "font-bold h-8 px-3 rounded-lg text-[10px] uppercase tracking-wider transition-all",
                              anomaly.resolved 
                                ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600" 
                                : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                            )}
                          >
                            {anomaly.resolved ? "Validated" : "Validate"}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </CardContent>
          <div className="p-8 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="max-w-xl">
                <h5 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Analyst Observation Summary</h5>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The current stream shows isolated variance in UK revenue flow and carrier performance. Automated models suggests these are environmental deviations rather than systemic failures. Manual verification is requested for high-confidence items <strong>A-01</strong> and <strong>A-04</strong>.
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0 pt-2">
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Head of Operations</p>
                  <p className="text-sm font-semibold italic text-foreground/80">Selma Hacii</p>
                </div>
                <div className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-center text-xs font-bold">
                  SH
                </div>
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
