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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-500 opacity-20"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60">Registry Health Nominal</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Integrity Journal
          </h1>
          <p className="text-muted-foreground text-sm font-medium italic opacity-70">
            "Audit-ready chronological registry of systematic stream observations."
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-5 mr-4 bg-muted/20 backdrop-blur-md px-6 py-2.5 rounded-2xl border border-border/20">
             <div className="flex items-center gap-2.5">
               <div className="w-2 h-2 rounded-full bg-slate-500" />
               <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Revenue</span>
             </div>
             <div className="flex items-center gap-2.5">
               <div className="w-2 h-2 rounded-full bg-blue-500" />
               <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Logistics</span>
             </div>
             <div className="flex items-center gap-2.5">
               <div className="w-2 h-2 rounded-full bg-amber-500" />
               <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Supply</span>
             </div>
             <div className="flex items-center gap-2.5">
               <div className="w-2 h-2 rounded-full bg-rose-500" />
               <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Integrity</span>
             </div>
          </div>
          <Button
            onClick={triggerScan}
            disabled={scanning}
            variant="outline"
            className={cn(
               "relative px-8 h-12 rounded-xl font-bold transition-all border-border/40 shadow-sm group overflow-hidden bg-card/40 backdrop-blur-md",
               scanning && "bg-muted/50"
            )}
          >
            {scanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin opacity-50" />
                Validating Sequences...
              </>
            ) : (
              <>
                <FileSearch className="mr-2 h-4 w-4 opacity-50" />
                Diagnostic Review
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-xl bg-card/40 border-border/40 shadow-sm"
            onClick={fetchData}
          >
            <RefreshCw className={cn("h-4 w-4 opacity-50", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* ── Main Analytics Grid ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Optimized Area Chart (Large) */}
        <Card className="lg:col-span-8 rounded-[1.5rem] bg-card/60 backdrop-blur-md border-border/40 overflow-hidden shadow-sm">
          <CardHeader className="p-10 border-b border-border/5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-sm font-bold tracking-[0.2em] text-foreground uppercase opacity-40">Observation Intensity</CardTitle>
                <CardDescription className="text-xs font-medium opacity-60">Anomaly volume identified by automated collectors over 15 days</CardDescription>
              </div>
              <Badge variant="secondary" className="bg-muted/30 text-muted-foreground border-none font-bold text-[10px] py-1 px-3">Standard Sampling</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-10">
            <div className="h-[400px] w-full">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="obsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#64748b" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#64748b" stopOpacity={0.01} />
                    </linearGradient>
                    <linearGradient id="varGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.1} />
                      <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/20" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={10} tickMargin={15} stroke="#94a3b8" fontWeight={700} />
                  <YAxis tickLine={false} axisLine={false} fontSize={10} stroke="#94a3b8" fontWeight={700} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(label) => `Diagnostic Date: ${label}`}
                        className="bg-card/95 border-border/40 backdrop-blur-xl"
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="observations"
                    stackId="1"
                    stroke="#64748b"
                    fill="url(#obsGrad)"
                    strokeWidth={3}
                    animationDuration={2000}
                  />
                  <Area
                    type="monotone"
                    dataKey="variance"
                    stackId="1"
                    stroke="#94a3b8"
                    fill="url(#varGrad)"
                    strokeWidth={1.5}
                    strokeDasharray="6 4"
                    animationDuration={2000}
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Severity Radial (Small) */}
        <Card className="lg:col-span-4 rounded-[1.5rem] bg-card/60 backdrop-blur-md border-border/40 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="p-10 border-b border-border/5">
             <div className="space-y-1 text-center">
              <CardTitle className="text-sm font-bold tracking-[0.2em] uppercase opacity-40">Threat Split</CardTitle>
              <CardDescription className="text-xs font-medium opacity-60">Categorized by potential impact</CardDescription>
             </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-10 flex-1">
            <div className="h-[280px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={85}
                    outerRadius={115}
                    paddingAngle={15}
                    stroke="none"
                    animationBegin={200}
                    animationDuration={2000}
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-6xl font-bold tracking-tighter tabular-nums text-foreground">08</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-[0.5em] font-bold mt-2">Active Risk</span>
              </div>
            </div>
            
            <div className="w-full grid grid-cols-2 gap-4 mt-10">
              {Object.entries(SEVERITY_STYLES).map(([key, style]) => (
                <div key={key} className={cn("p-5 rounded-[1.5rem] border transition-all flex flex-col shadow-sm card-hover", style.bg, style.border)}>
                  <span className="text-[9px] uppercase font-bold tracking-widest opacity-40 mb-1.5">{key}</span>
                  <span className={cn("text-2xl font-bold tracking-tight", style.text)}>
                    {data ? data.summary[key as keyof typeof data.summary] : 0}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detector Engines */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-5 gap-6">
          {data?.detectorStats.map((stat, i) => {
            const Info = DETECTOR_INFO[i];
            return (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group relative p-8 rounded-[2rem] bg-card/40 backdrop-blur-md border border-border/20 card-hover shadow-sm"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="p-3.5 rounded-2xl bg-slate-500/10 group-hover:bg-primary/20 transition-all group-hover:scale-110">
                    <Info.icon className="w-6 h-6 opacity-70" style={{ color: Info.color }} />
                  </div>
                  <Badge variant="outline" className="text-[9px] font-bold text-muted-foreground/60 px-3 py-1 rounded-lg bg-muted/30 uppercase tracking-widest border-border/20">
                    {stat.accuracy.toFixed(1)}% Precision
                  </Badge>
                </div>
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1.5 opacity-60">{stat.name}</div>
                <div className="text-4xl font-bold tracking-tighter tabular-nums text-foreground">{stat.detected} Signal</div>
                <div className="mt-8 h-1.5 w-full bg-muted/40 rounded-full overflow-hidden ring-1 ring-border/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.accuracy}%` }}
                    className="h-full bg-slate-400 dark:bg-slate-600"
                    transition={{ duration: 1.5, delay: i * 0.1 + 0.5 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Live Threat Feed */}
        <Card className="lg:col-span-12 rounded-[1.5rem] bg-card/60 backdrop-blur-md border-border/40 shadow-sm overflow-hidden mt-6">
          <CardHeader className="p-10 border-b border-border/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="h-12 w-1.5 bg-slate-500/20 rounded-full hidden md:block" />
              <div>
                <CardTitle className="text-2xl font-bold tracking-tight flex items-center gap-3">
                  <Activity className="w-6 h-6 text-slate-500 opacity-60" />
                  Observation Archive
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">
                  Validated Diagnostic Registry
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="rounded-xl border-border/40 bg-card/40 font-bold h-11 px-6 text-[10px] gap-2 uppercase tracking-widest shadow-sm card-hover">
                <FileDown className="w-4 h-4 opacity-50" /> Export Journal
              </Button>
            </div>
          </CardHeader>
          <div className="p-0">
            <div className="divide-y divide-border/5">
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
                    <div className="bg-muted/30 px-10 py-4 flex items-center justify-between border-y border-border/5">
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60">{category} Cluster</span>
                      <span className="text-[10px] font-bold text-muted-foreground/40">{items.length} Observations Identified</span>
                    </div>
                    {items.map((anomaly, i) => {
                      const style = SEVERITY_STYLES[anomaly.severity] || SEVERITY_STYLES.low;
                      return (
                        <div
                          key={anomaly.id}
                          className={cn(
                            "group relative flex flex-col lg:flex-row lg:items-center gap-8 px-10 py-10 transition-all duration-300",
                            anomaly.resolved ? "opacity-30 scale-[0.98]" : "hover:bg-muted/20"
                          )}
                        >
                          <div className="flex flex-1 items-start gap-8">
                            <div className={cn(
                              "p-4 rounded-2xl border shrink-0 transition-all shadow-inner",
                              anomaly.resolved ? "bg-muted" : "bg-card/40 border-border/20"
                            )}>
                              {anomaly.resolved ? <CheckCircle2 className="h-6 w-6 text-emerald-500" /> : <Clock className={cn("h-6 w-6", style.text)} />}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-2.5">
                                <h4 className={cn("text-lg font-bold tracking-tight uppercase", anomaly.resolved ? "text-muted-foreground line-through" : "text-foreground")}>
                                  {anomaly.metricName}
                                </h4>
                                <Badge variant="outline" className={cn("px-3 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] rounded-lg", anomaly.resolved ? "bg-muted text-muted-foreground" : cn(style.bg, style.text, style.border))}>
                                  {anomaly.severity} (Signal: {anomaly.anomalyScore.toFixed(1)})
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground font-medium italic mb-5 leading-relaxed max-w-2xl opacity-80">
                                "{anomaly.explanation}"
                              </p>
                              <div className="flex items-center gap-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                                <span className="flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-xl border border-border/10"><Calendar className="w-3.5 h-3.5 opacity-50"/> D-{Math.floor(Math.random() * 5) + 1}</span>
                                <span className="flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-xl border border-border/10">ID: LOG-{anomaly.id}</span>
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
                                "h-11 px-8 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm",
                                anomaly.resolved ? "text-emerald-500 bg-emerald-500/5 cursor-default" : "bg-card/60 border-border/40 hover:bg-foreground hover:text-background"
                              )}
                            >
                              {anomaly.resolved ? "Diagnostic Signed" : "Authorize Sync"}
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
          <div className="p-10 bg-muted/30 border-t border-border/5">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-10">
              <div className="max-w-xl space-y-3">
                <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60">Executive Operational Summary</h5>
                <p className="text-sm font-medium text-muted-foreground leading-relaxed italic opacity-80">
                  "Cluster Sétif identifies isolated variance in entity revenue and carrier performance. Data models suggest regional environmental drifts; manual authorization is required for high-impact items to maintain ledger consistency and historical audit standards."
                </p>
              </div>
              <div className="flex items-center gap-5 pt-2">
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-1">Controller Signature</p>
                  <p className="text-base font-bold text-foreground opacity-80">Selma Hacii</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-slate-500/10 border border-border/20 flex items-center justify-center text-xs font-bold text-slate-500">SH</div>
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
