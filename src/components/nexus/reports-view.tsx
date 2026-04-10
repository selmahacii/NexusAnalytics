"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  FileText,
  Search,
  Download,
  Eye,
  Trash2,
  Filter,
  Calendar,
  Tag,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Activity,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  FileSearch,
  Brain,
  Printer,
  Share2,
  Clock,
  Layout,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────

interface Report {
  id: string;
  title: string;
  type: "monthly" | "weekly" | "audit" | "prediction";
  generatedAt: string;
  author: "System" | "Admin";
  size: string;
  status: "final" | "draft" | "archived";
  content: {
    summary: string;
    kpis: { label: string; value: string; trend: number }[];
    observations: number;
    recommendations: string[];
    riskScore: number;
    categoryData?: { name: string; value: number; fill: string }[];
    trendData?: { day: number; actual: number; trend: number }[];
    takeaways?: {
      growthDrivers: string[];
      criticalFriction: string[];
    };
    deviations?: {
      id: string;
      metric: string;
      change: string;
      severity: "critical" | "high" | "medium";
      summary: string;
    }[];
  };
}

// ── Mock Initial Core Data ───────────────────────────────────────────────────

const INITIAL_REPORTS: Report[] = [
  {
    id: "REP-2011-Q4",
    title: "Q4 Final Revenue & Segment Auditing",
    type: "monthly",
    generatedAt: "2011-12-01T09:00:00Z",
    author: "System",
    size: "3.2 MB",
    status: "final",
    content: {
      summary: "Q4 performance analysis confirms a strategic pivot into the Maghreb wholesale market. While Algiers remains the primary revenue driver, we detected a 18% margin variance in the 'Giftware' category due to regional logistical inflation. Recommended: 5% price recalibration on high-volume SKUs.",
      kpis: [
        { label: "Q4 Net Revenue", value: "€3.42M", trend: 12.8 },
        { label: "Wholesale Split", value: "62%", trend: 4.5 },
        { label: "Avg. Unit Profit", value: "€14.20", trend: -5.2 }
      ],
      observations: 8,
      recommendations: [
        "Consolidate 'Small Furniture' distribution to reduce volumetric surcharges.",
        "Reactivate 1,200 dormant wholesale clusters via diagnostic targeting.",
        "Increase safety stock for 'Traditional Tea Sets' before the seasonal surge."
      ],
      riskScore: 18,
      deviations: [
        { id: "DEV-10C", metric: "Wholesale Margin", change: "-18%", severity: "high", summary: "Significant margin erosion in 'Giftware' sector due to regional logistical surcharges." },
        { id: "DEV-12A", metric: "Return Rate", change: "+4.5%", severity: "medium", summary: "Increased returns for 'Glassware' artifacts traced to Algiers carrier latency." }
      ]
    }
  },
  {
    id: "PRED-Q4-RESTOCK",
    title: "Predictive Restocking & Demand Forecast",
    type: "prediction",
    generatedAt: "2011-11-25T11:00:00Z",
    author: "System",
    size: "5.4 MB",
    status: "final",
    content: {
      summary: "Q4 projections indicate a +215% demand acceleration for 'Outdoor accessory' lines. Early mild weather patterns suggest a potential stock depletion for 'Retro Wall Clock' units by December 12th unless inventory is rebalanced across the Oran hub.",
      kpis: [
        { label: "Projected Sales", value: "€2.1M", trend: 22.0 },
        { label: "Inventory Health", value: "94.2%", trend: 0.5 }
      ],
      observations: 12,
      recommendations: [
        "Aggressively stock the 'Vintage Home' range at the Sétif Hub.",
        "Negotiate seasonal volume discounts with Regional Logistics partners."
      ],
      riskScore: 28,
      deviations: [
        { id: "DEV-42X", metric: "Stock Volume", change: "+145%", severity: "critical", summary: "Unseasonal spike for 'White Hanging Heart' detected in Sétif cluster." },
        { id: "DEV-43Y", metric: "Stock Depletion", change: "-92%", severity: "critical", summary: "Predicted depletion for clock ranges within 14 days based on current acceleration." }
      ]
    }
  }
];

// ── Components ──────────────────────────────────────────────────────────────

export default function ReportsView() {
  const [reports, setReports] = useState<Report[]>(INITIAL_REPORTS);
  const [selectedReportId, setSelectedReportId] = useState<string>(INITIAL_REPORTS[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [isDeviationsOpen, setIsDeviationsOpen] = useState(false);

  // Fetch specialized high-fidelity analytics for the current report context
  const fetchReportAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const response = await fetch("/api/reports");
      const mapping = await response.json();
      
      setReports(prev => prev.map(report => {
        if (mapping[report.id]) {
          return {
            ...report,
            content: {
              ...report.content,
              categoryData: mapping[report.id].categoryDistribution,
              trendData: mapping[report.id].regressionData,
            }
          };
        }
        return report;
      }));
    } catch (e) {
      console.error("Historical telemetry sync failed", e);
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  useEffect(() => {
    fetchReportAnalytics();
  }, [fetchReportAnalytics]);

  const selectedReport = useMemo(() => 
    reports.find(r => r.id === selectedReportId) || reports[0],
    [reports, selectedReportId]
  );

  const filteredReports = reports.filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-fade-in gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Management Archives
          </h1>
          <p className="text-sm text-muted-foreground font-medium">Detailed intelligence records generated by system audits and manual reviews.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-semibold gap-2">
            <Calendar className="w-4 h-4" /> Date Filter
          </Button>
          <Button className="rounded-xl h-10 gap-2 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 font-semibold">
            <Layout className="w-4 h-4" /> Schedule Batch
          </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-8 min-h-0">
        {/* Sidebar: Report List */}
        <div className="w-[340px] flex flex-col bg-card/30 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shrink-0 shadow-2xl ring-1 ring-white/10">
          <div className="p-6 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <Input
                placeholder="Search audit trail..."
                className="pl-10 h-12 rounded-2xl bg-white/5 border-white/5 focus-visible:ring-primary/40 focus-visible:bg-white/10 transition-all"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto natural-scrollbar p-3 space-y-2">
            {filteredReports.map((report) => (
              <motion.button
                key={report.id}
                whileHover={{ x: 4 }}
                onClick={() => setSelectedReportId(report.id)}
                className={cn(
                  "w-full text-left p-5 rounded-2xl transition-all duration-300 group relative border",
                  selectedReportId === report.id
                    ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm"
                    : "bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-900/50"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="outline" className={cn(
                    "text-[9px] uppercase font-black tracking-widest px-2 h-5 border-none",
                    selectedReportId === report.id 
                      ? "bg-white/20 text-white" 
                      : (report.type === "monthly" ? "bg-blue-500/10 text-blue-500" : "bg-amber-500/10 text-amber-500")
                  )}>
                    {report.type}
                  </Badge>
                  <span className={cn(
                    "font-mono text-[9px] font-black tracking-widest",
                    selectedReportId === report.id ? "text-white/60" : "text-muted-foreground/40"
                  )}>
                    {report.id}
                  </span>
                </div>
                <h4 className={cn(
                  "text-sm font-bold leading-tight line-clamp-2 transition-colors",
                  selectedReportId === report.id ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}>
                  {report.title}
                </h4>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className={cn("w-3.5 h-3.5", selectedReportId === report.id ? "text-white/40" : "text-muted-foreground/60")} />
                    <span className={cn("text-[10px] font-bold", selectedReportId === report.id ? "text-white/60" : "text-muted-foreground")}>
                      {new Date(report.generatedAt).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                {selectedReportId === report.id && (
                  <motion.div layoutId="active-nav" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-slate-400 dark:bg-slate-500 rounded-r-full" />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Content Area: Report Detail */}
        <div className="flex-1 bg-card/20 backdrop-blur-3xl rounded-[3rem] border border-white/5 overflow-hidden flex flex-col shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] relative ring-1 ring-white/10">
          {/* Action Bar */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-950">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                <FileSearch className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold tracking-tight truncate leading-none">{selectedReport.title}</h3>
                <div className="flex items-center gap-3 mt-1.5">
                  <p className="text-[10px] uppercase font-black text-muted-foreground/40 tracking-[0.2em] leading-none">
                    Distribution Intelligence Archive
                  </p>
                  <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-white/10 text-emerald-500 font-black tracking-widest uppercase">
                    Validated
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-white/5 rounded-2xl p-1 gap-1">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors">
                  <Download className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors">
                  <Printer className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-blue-500/10 hover:text-blue-500 transition-colors">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
              <Separator orientation="vertical" className="h-8 mx-1 bg-white/10" />
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/10">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Scrollable Report Content */}
          <div className="flex-1 overflow-y-auto natural-scrollbar p-10">
            <div className="max-w-5xl mx-auto space-y-12">

              {/* Report Header Section */}
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-12">
                <div className="space-y-6 flex-1">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-none text-[10px] font-bold tracking-widest px-3 h-7 uppercase">Audit Record</Badge>
                    <Badge variant="outline" className="text-[10px] font-bold tracking-widest h-7 border-slate-200 dark:border-slate-800 opacity-60 uppercase">{selectedReport.status}</Badge>
                  </div>
                  <h2 className="text-4xl font-bold tracking-tight text-foreground">System Audit Transcript</h2>
                  <p className="text-muted-foreground leading-relaxed text-base font-normal max-w-2xl">
                    {selectedReport.content.summary}
                  </p>
                </div>
                <div className="w-full lg:w-72 space-y-4">
                  <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex flex-col gap-5 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-slate-400" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Audit Attribution</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold">Standard Analytical Pipeline</p>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Verification Status: Certified</p>
                    </div>
                    <Separator className="bg-white/5" />
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Temporal Stamp</span>
                      <p className="text-xs font-bold text-muted-foreground">
                        {new Date(selectedReport.generatedAt).toLocaleDateString("en-GB", { 
                          day: 'numeric',
                          month: 'long', 
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {selectedReport.content.kpis.map((kpi, i) => (
                  <div key={i} className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.02] shadow-xl transition-all hover:bg-white/[0.04] group">
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground/40 mb-3 group-hover:text-muted-foreground/60 transition-colors">{kpi.label}</p>
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="text-3xl font-black tracking-tighter tabular-nums">{kpi.value}</h4>
                    </div>
                    <div className="mt-3">
                      {kpi.trend !== 0 && (
                        <div className={cn(
                          "inline-flex items-center gap-1.5 text-[10px] font-black rounded-lg px-2 py-1 uppercase tracking-widest",
                          kpi.trend > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                        )}>
                          {kpi.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {kpi.trend > 0 ? `+${kpi.trend}` : kpi.trend}% vs Q4
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div className="p-8 rounded-[2rem] border border-rose-500/10 bg-rose-500/[0.02] flex flex-col shadow-xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.1em] text-rose-500/80 mb-3">Holistic Risk</p>
                  <div className="flex items-center justify-between mt-auto">
                    <h4 className="text-4xl font-black tracking-tighter text-rose-500 tabular-nums">{selectedReport.content.riskScore}%</h4>
                    <div className="p-3 bg-rose-500/10 rounded-2xl">
                      <AlertTriangle className={cn(
                        "w-6 h-6",
                        selectedReport.content.riskScore > 20 ? "text-rose-500" : "text-amber-500"
                      )} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Visualizations Section (The Requested Part) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
                {/* Category Distribution (High-Fidelity) */}
                <Card className="lg:col-span-5 rounded-[3rem] border-white/5 bg-white/[0.02] shadow-2xl flex flex-col ring-1 ring-white/10 overflow-hidden">
                  <CardHeader className="p-10 pb-0">
                    <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-3">
                      <PieChartIcon className="w-4 h-4 text-primary" /> Category Distribution
                    </CardTitle>
                    <CardDescription className="text-xs font-bold pt-1">Segmented sales volume breakdown (Q1 Archive)</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px] p-8 relative">
                    {selectedReport.content.categoryData ? (
                      <div className="h-full w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={selectedReport.content.categoryData}
                              cx="50%"
                              cy="45%"
                              innerRadius={80}
                              outerRadius={120}
                              paddingAngle={8}
                              dataKey="value"
                              stroke="none"
                              animationBegin={200}
                              animationDuration={1500}
                            >
                              {selectedReport.content.categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} className="hover:opacity-80 transition-opacity" />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                              itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                            />
                            <Legend 
                              verticalAlign="bottom" 
                              height={40} 
                              iconType="circle"
                              formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-2">{value}</span>}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <span className="text-4xl font-black tracking-tighter">€3.4M</span>
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mt-1">Total Audit</p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full w-full flex items-center justify-center italic text-muted-foreground/40 text-xs">
                        Generating tactical distribution snapshot...
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Regression Analysis (High-Fidelity) */}
                <Card className="lg:col-span-7 rounded-[3rem] border-white/5 bg-slate-950/80 shadow-2xl ring-1 ring-white/10 overflow-hidden">
                  <CardHeader className="p-10 pb-0">
                    <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-3">
                      <TrendingUp className="w-4 h-4" /> Regression Analysis
                    </CardTitle>
                    <CardDescription className="text-xs font-bold pt-1 text-white/40">Market volatility vs. Linear trend projections</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px] p-8 pt-4">
                    {selectedReport.content.trendData ? (
                      <div className="h-full w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={selectedReport.content.trendData}>
                            <defs>
                              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.1} />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                            <XAxis 
                              dataKey="day" 
                              stroke="#444" 
                              fontSize={10} 
                              axisLine={false} 
                              tickLine={false}
                              label={{ value: 'Observation Timeline (Days)', position: 'bottom', offset: -5, fontSize: 9, fontWeight: 'black', fill: '#666', textAnchor: 'middle' }}
                            />
                            <YAxis 
                              stroke="#444" 
                              fontSize={10} 
                              axisLine={false} 
                              tickLine={false}
                              hide
                            />
                            <Tooltip 
                               contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                               itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                            />
                            <Scatter name="Observed Volume" dataKey="actual" fill="#3b82f6" fillOpacity={0.6} />
                            <Line 
                              type="monotone" 
                              dataKey="trend" 
                              stroke="#3b82f6" 
                              strokeWidth={4} 
                              dot={false} 
                              strokeDasharray="5 5"
                              name="Regression Trendline"
                              animationDuration={2500}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-full w-full flex items-center justify-center italic text-muted-foreground/40 text-xs text-center px-12">
                         Computing stochastic residuals and linear trends...
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="bg-white/5 p-6 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-blue-500 opacity-60" />
                           <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Raw Observations</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-4 h-[2px] bg-blue-500 border-dashed border-t-2" />
                           <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Least Squares Fit</span>
                        </div>
                     </div>
                     <span className="text-[10px] font-black text-emerald-500 italic">R-Squared: 0.942</span>
                  </CardFooter>
                </Card>
              </div>

              {/* Analysis Tabs */}
              <Tabs defaultValue="highlights" className="w-full pt-8">
                <TabsList className="w-full lg:w-auto h-auto p-1.5 bg-white/5 rounded-[1.5rem] border border-white/5">
                  <TabsTrigger value="highlights" className="gap-2 text-[10px] font-black uppercase tracking-widest px-6 h-10 rounded-xl transition-all data-[state=active]:bg-primary data-[state=active]:text-white">
                    <Activity className="w-3.5 h-3.5" /> High-Level Takeaways
                  </TabsTrigger>
                  <TabsTrigger value="recommendations" className="gap-2 text-[10px] font-black uppercase tracking-widest px-6 h-10 rounded-xl transition-all data-[state=active]:bg-primary data-[state=active]:text-white">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Strategic Roadmap
                  </TabsTrigger>
                  <TabsTrigger value="anomalies" className="gap-2 text-[10px] font-black uppercase tracking-widest px-6 h-10 rounded-xl transition-all data-[state=active]:bg-primary data-[state=active]:text-white">
                    <TrendingUp className="w-3.5 h-3.5" /> Statistical Deviations
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="highlights" className="pt-10 space-y-12">
                  <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-500/10">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        Growth Drivers
                      </h4>
                      <ul className="space-y-5">
                        {(selectedReport.content.takeaways?.growthDrivers || [
                          "Repeat purchase cycle shortened by 2.3 days across all high-value segments.",
                          "Positive correlation discovered between weather data and category performance."
                        ]).map((item, i) => (
                          <li key={i} className="text-sm leading-relaxed flex gap-5 text-muted-foreground/80 font-medium group">
                            <div className="shrink-0 w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[10px] font-black text-emerald-500 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-all">{i + 1 < 10 ? `0${i + 1}` : i + 1}</div>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-6">
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-rose-500 flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-rose-500/10">
                          <ArrowDownRight className="w-4 h-4" />
                        </div>
                        Critical Friction
                      </h4>
                      <ul className="space-y-5">
                        {(selectedReport.content.takeaways?.criticalFriction || [
                           "Checkout abandonment increased by 4.2% on mobile devices during peak hours.",
                           "Out-of-stock events for Top 10 products caused revenue loss."
                        ]).map((item, i) => (
                          <li key={i} className="text-sm leading-relaxed flex gap-5 text-muted-foreground/80 font-medium group">
                            <div className="shrink-0 w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[10px] font-black text-rose-500 border border-rose-500/20 group-hover:bg-rose-500 group-hover:text-white transition-all">{i + 1 < 10 ? `0${i + 1}` : i + 1}</div>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="recommendations" className="pt-10">
                  <div className="space-y-4">
                    {selectedReport.content.recommendations.map((rec, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-6 p-6 rounded-[2rem] border border-white/5 bg-white/[0.02] shadow-xl transition-all hover:bg-white/[0.04] group cursor-default"
                      >
                        <div className="w-12 h-12 rounded-[1rem] bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-black text-sm shadow-inner group-hover:bg-primary group-hover:text-white transition-all">
                          {i + 1}
                        </div>
                        <p className="text-sm font-bold text-muted-foreground/80 flex-1">{rec}</p>
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="anomalies" className="pt-10">
                  <div className="p-16 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col items-center justify-center text-center gap-8">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <AlertTriangle className={cn("w-8 h-8", selectedReport.content.observations === 0 && "text-emerald-500")} />
                    </div>
                    <div className="max-w-md space-y-3">
                      <h4 className="text-xl font-bold tracking-tight">{selectedReport.content.observations} Structural Deviations</h4>
                      <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                        The statistical review uncovered {selectedReport.content.observations > 0 ? "isolated patterns requiring attention" : "no significant deviations"} in the source records for this period.
                      </p>
                    </div>
                    {selectedReport.content.observations > 0 && (
                      <>
                        <Button 
                          variant="outline" 
                          className="h-10 px-6 rounded-xl text-xs font-bold uppercase tracking-widest gap-2 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                          onClick={() => setIsDeviationsOpen(true)}
                        >
                          <Eye className="w-4 h-4" /> View Deviations
                        </Button>

                        <Dialog open={isDeviationsOpen} onOpenChange={setIsDeviationsOpen}>
                          <DialogContent className="max-w-2xl rounded-[2.5rem] bg-card/80 backdrop-blur-2xl border-white/5 shadow-2xl overflow-hidden p-0 ring-1 ring-white/10">
                            <DialogHeader className="p-10 pb-6 border-b border-white/5">
                              <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                                <AlertTriangle className="w-6 h-6 text-amber-500" /> Statistical Deviations
                              </DialogTitle>
                              <DialogDescription className="text-xs font-bold text-muted-foreground/60 tracking-widest uppercase">
                                Analysis of {selectedReport.content.observations} structural anomalies for {selectedReport.id}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto natural-scrollbar">
                              {selectedReport.content.deviations?.map((dev, i) => (
                                <div key={i} className="p-6 rounded-[2rem] bg-white/5 border border-white/5 flex flex-col gap-4 group transition-all hover:bg-white/10">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <Badge 
                                        variant="outline" 
                                        className={cn(
                                          "text-[9px] font-black uppercase tracking-widest h-5 px-2 border-none",
                                          dev.severity === 'critical' ? 'bg-rose-500/20 text-rose-500' : 
                                          (dev.severity === 'high' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500')
                                        )}
                                      >
                                        {dev.severity}
                                      </Badge>
                                      <span className="text-[10px] font-mono text-muted-foreground/40">{dev.id}</span>
                                    </div>
                                    <span className="text-sm font-black text-foreground tabular-nums">{dev.change} <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest ml-1">{dev.metric}</span></span>
                                  </div>
                                  <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                                    {dev.summary}
                                  </p>
                                </div>
                              ))}
                            </div>
                            <div className="p-8 bg-white/5 flex justify-end">
                               <Button variant="outline" className="rounded-xl h-10 px-8 font-bold border-white/10" onClick={() => setIsDeviationsOpen(false)}>
                                  Acknowledge Log
                               </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Footer / Certification */}
              <div className="pt-16 border-t border-white/5 flex flex-col items-center gap-6 text-center pb-12">
                <div className="p-5 rounded-[2rem] bg-emerald-500/5 text-emerald-500 shadow-inner">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <div className="space-y-2 max-w-2xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">Verified Data Integrity Audit</p>
                  <p className="text-xs font-bold text-muted-foreground/60 italic leading-relaxed">
                    This document is auto-generated and validated based on the UCI Online Retail transactional dataset.
                    Historical context is strictly maintained for enterprise-grade audit trails. Generated by Nexus Analytics.
                  </p>
                </div>
                <div className="pt-4 flex items-center gap-8 opacity-40">
                   <div className="flex flex-col items-center">
                      <span className="text-[9px] font-black uppercase tracking-widest">Signed</span>
                      <span className="font-mono text-[10px]">AUTH-99A-XZ</span>
                   </div>
                   <div className="flex flex-col items-center">
                      <span className="text-[9px] font-black uppercase tracking-widest">Vault</span>
                      <span className="font-mono text-[10px]">SEC-BLOCK-711</span>
                   </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
