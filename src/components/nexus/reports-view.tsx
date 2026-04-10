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
import { Skeleton } from "@/components/ui/skeleton";
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
    id: "REP-2024-Q3",
    title: "Q3 Final Revenue & Regional Hub Auditing",
    type: "monthly",
    generatedAt: "2024-10-15T09:00:00Z",
    author: "System",
    size: "4.1 MB",
    status: "final",
    content: {
      summary: "Q3 performance analysis confirms a strategic pivot into the Maghreb high-tech distribution network. While Alger remains the primary revenue driver, we detected a 18% margin variance in the 'Power Electronics' category due to Sétif hub logistical overhead. Recommended: 5% price recalibration on high-volume industrial SKUs.",
      kpis: [
        { label: "Q3 Net Revenue", value: "€3.42M", trend: 12.8 },
        { label: "Regional Split", value: "62%", trend: 4.5 },
        { label: "Avg. Asset Margin", value: "€21.50", trend: -5.2 }
      ],
      observations: 8,
      recommendations: [
        "Consolidate 'Power Components' distribution to reduce Oran-hub surcharges.",
        "Reactivate 1,200 dormant wholesale clusters via diagnostic targeting in Annaba.",
        "Increase safety stock for 'Circuit Breaker Batch' before the seasonal peak."
      ],
      riskScore: 18,
      deviations: [
        { id: "DEV-10C", metric: "Industrial Margin", change: "-18%", severity: "high", summary: "Significant margin erosion in 'High-Voltage' sector due to regional logistical surcharges." },
        { id: "DEV-12A", metric: "Return Rate", change: "+4.5%", severity: "medium", summary: "Increased returns for 'Control Units' traced to Algiers carrier latency." }
      ]
    }
  },
  {
    id: "PRED-2025-INV",
    title: "2025 Predictive Logistics & Inventory Balance",
    type: "prediction",
    generatedAt: "2024-11-20T11:00:00Z",
    author: "System",
    size: "5.8 MB",
    status: "final",
    content: {
      summary: "Q1 2025 projections indicate a +215% demand acceleration for 'Fiber Optic bundles' across the Oran hub. Historical weather patterns in the Constantine region suggest potential stock depletion for 'Climate Control modules' by January 15th unless regional inventory is rebalanced through the Blida corridor.",
      kpis: [
        { label: "Projected Sales", value: "€2.1M", trend: 22.0 },
        { label: "Inventory Health", value: "94.2%", trend: 0.5 }
      ],
      observations: 12,
      recommendations: [
        "Aggressively stock the 'High-Voltage' range at the Sétif Hub.",
        "Negotiate seasonal volume discounts with Regional Logistics partners in Skikda."
      ],
      riskScore: 28,
      deviations: [
        { id: "DEV-42X", metric: "Stock Volume", change: "+145%", severity: "critical", summary: "Unseasonal spike for 'Optical Splitters' detected in Sétif cluster." },
        { id: "DEV-43Y", metric: "Stock Depletion", change: "-92%", severity: "critical", summary: "Predicted depletion for climate modules within 14 days based on current acceleration." }
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

  if (loadingAnalytics) return <div className="p-8 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="max-w-[1500px] mx-auto space-y-8 pb-12 px-4 sm:px-8 mt-4 animate-in fade-in duration-500">
      
      {/* ── Minimal Header ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-8 border-border/10">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-slate-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Historical Audit Trail</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">Management Archives</h1>
          <p className="text-muted-foreground/80 text-sm max-w-xl leading-relaxed">
            Detailed intelligence records generated by system audits and manual reviews of the regional distribution network.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group/search hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-40 group-focus-within/search:opacity-100 transition-opacity" />
            <Input 
              placeholder="Search audit trail..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 w-[260px] rounded-full bg-muted/30 border-transparent focus:bg-background focus:border-border/20 transition-all text-xs" 
            />
          </div>
          <Button variant="outline" className="h-11 px-5 rounded-full font-semibold border-border/10">
            Date Filter
          </Button>
          <Button className="h-11 px-6 rounded-full font-semibold bg-foreground text-background hover:opacity-90 active:scale-95">
            Schedule Batch
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Sidebar: Simplified List */}
        <div className="lg:col-span-4 space-y-1">
          {filteredReports.map((report) => (
            <button
              key={report.id}
              onClick={() => setSelectedReportId(report.id)}
              className={cn(
                "w-full text-left p-6 rounded-3xl transition-all flex flex-col gap-4 border",
                selectedReportId === report.id
                  ? "bg-card border-border/20 shadow-sm"
                  : "bg-transparent border-transparent hover:bg-muted/30"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">{report.type}</span>
                <span className="text-[9px] font-mono text-muted-foreground/40">{report.id}</span>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold tracking-tight line-clamp-1">{report.title}</h4>
                <p className="text-[10px] text-muted-foreground/60 font-medium">
                  {new Date(report.generatedAt).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Content: Intelligence Record */}
        <div className="lg:col-span-8 bg-card/10 border border-border/5 rounded-[3rem] p-12 space-y-16">
          
          {/* Record Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-10">
            <div className="space-y-6 flex-1">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-emerald-500/5 text-emerald-600 border-none text-[9px] font-bold tracking-widest px-3 h-6 uppercase">Validated</Badge>
                <Badge variant="outline" className="text-[9px] font-bold tracking-widest h-6 border-border/10 opacity-40 uppercase">Audit Record</Badge>
                <Badge variant="outline" className="text-[9px] font-bold tracking-widest h-6 border-border/10 opacity-40 uppercase">{selectedReport.status}</Badge>
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight">{selectedReport.title}</h2>
                <div className="flex items-center gap-2">
                   <div className="h-px w-8 bg-border/20" />
                   <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/40">Distribution Intelligence Archive</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-border/5 hover:bg-muted transition-colors"><Download className="w-4 h-4 opacity-40" /></Button>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-border/5 hover:bg-muted transition-colors"><Share2 className="w-4 h-4 opacity-40" /></Button>
            </div>
          </div>

          {/* Transcript Section */}
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-muted-foreground/30" />
              <h3 className="text-sm font-bold tracking-[0.1em] uppercase text-muted-foreground/60">System Audit Transcript</h3>
            </div>
            
            <div className="max-w-2xl bg-muted/20 p-8 rounded-[2rem] border border-border/5">
              <p className="text-base text-muted-foreground leading-relaxed italic pr-2">
                "{selectedReport.content.summary}"
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
               <div className="space-y-1">
                 <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Audit Attribution</p>
                 <p className="text-xs font-semibold">Standard Analytical Pipeline</p>
               </div>
               <div className="space-y-1">
                 <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Status</p>
                 <p className="text-xs font-semibold text-emerald-600/80">Certified Logic</p>
               </div>
               <div className="space-y-1">
                 <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Temporal Stamp</p>
                 <p className="text-xs font-semibold">
                   {new Date(selectedReport.generatedAt).toLocaleDateString("en-GB", { 
                     day: 'numeric',
                     month: 'long', 
                     year: 'numeric'
                   })}
                 </p>
               </div>
            </div>
          </div>

          <Separator className="opacity-10" />

          {/* Revenue & Metric Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {selectedReport.content.kpis.slice(0, 2).map((kpi, i) => (
              <div key={i} className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">{kpi.label}</p>
                <div className="flex items-baseline gap-4">
                  <span className="text-4xl font-semibold tracking-tighter tabular-nums">{kpi.value}</span>
                  <div className={cn(
                    "flex items-center gap-1 text-[10px] font-bold mb-1",
                    kpi.trend > 0 ? "text-emerald-500" : "text-rose-500"
                  )}>
                    {kpi.trend > 0 ? "+" : ""}{kpi.trend}% vs Q{selectedReport.id.includes("Q4") ? "4" : "3"}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Signature Area */}
            <div className="flex items-center gap-5 md:justify-end">
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-1.5">Authorized Signature</p>
                <p className="text-sm font-bold opacity-80">Selma Hacii</p>
                <p className="text-[9px] font-mono text-muted-foreground/60">AUTH-99A-XZ</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground opacity-50 border border-border/10">SH</div>
            </div>
          </div>

          {/* Additional Intelligence Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
            <div className="space-y-6">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 border-b border-border/10 pb-4">Growth Drivers identified</h4>
              <ul className="space-y-4">
                {(selectedReport.content.takeaways?.growthDrivers || [
                  "Repeat purchase cycle shortened by 2.3 days across wholesale clusters.",
                  "Regional logistical stabilization in Sétif Hub (+12% efficiency)."
                ]).map((item, i) => (
                  <li key={i} className="text-[13px] text-muted-foreground leading-relaxed flex gap-4">
                    <span className="text-emerald-500/60 font-mono">0{i+1}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 border-b border-border/10 pb-4">Strategic Recalibration</h4>
              <ul className="space-y-4">
                {selectedReport.content.recommendations.slice(0, 2).map((rec, i) => (
                  <li key={i} className="text-[13px] text-muted-foreground leading-relaxed flex gap-4">
                    <span className="text-slate-400 font-mono">REC</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
