"use client";

import { useState, useMemo } from "react";
import {
  Factory,
  Search,
  ArrowUpRight,
  TrendingDown,
  MapPin,
  Calendar,
  Layers,
  MoreHorizontal,
  Mail,
  UserMinus,
  ShieldAlert,
  Activity,
  Download,
  Info,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

// ── Dataset: 6 Supply Chain Entities (Maghreb Cluster) ────────────────────────

const SUPPLIERS = [
  { id: "SD", name: "Sonatrach Dynamics", region: "Skikda", risk: "High", riskScore: 88, delay: 32, quality: 45, items: 12, leadTime: "14 Days" },
  { id: "AR", name: "Algeria Rail Logistics", region: "Alger", risk: "High", riskScore: 82, delay: 28, quality: 55, items: 4, leadTime: "8 Days" },
  { id: "OB", name: "Oran Bulk Solutions", region: "Oran", risk: "Medium", riskScore: 64, delay: 18, quality: 78, items: 8, leadTime: "10 Days" },
  { id: "SD", name: "Sétif Distribution Hub", region: "Sétif", risk: "Medium", riskScore: 45, delay: 12, quality: 82, items: 15, leadTime: "5 Days" },
  { id: "BA", name: "Blida Agri-Systems", region: "Blida", risk: "Low", riskScore: 22, delay: 6, quality: 94, items: 3, leadTime: "3 Days" },
  { id: "AP", name: "Annaba Port Terminal", region: "Annaba", risk: "Low", riskScore: 18, delay: 6, quality: 96, items: 7, leadTime: "12 Days" },
];

export default function SupplyChainView() {
  const [search, setSearch] = useState("");

  const filteredSuppliers = useMemo(() => {
    return SUPPLIERS.filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase()) || 
      s.region.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  // Risk Matrix Data
  const matrixData = SUPPLIERS.map(s => ({
    name: s.name,
    delay: s.delay,
    quality: s.quality,
    score: s.riskScore,
    risk: s.risk,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            Supply Network Operational Matrix
            <Badge className="bg-rose-500/10 text-rose-500 border-none text-[9px] font-bold px-2 py-0">
               2 CRITICAL VULNERABILITIES
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl font-medium tracking-tight">
            Comprehensive audit of 6 regional clusters across north-Africa distribution hubs.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/50 border border-border/50 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
             Network Integrity: Active
           </div>
           <Button variant="outline" size="sm" className="rounded-xl h-9 gap-2 bg-card/50 backdrop-blur-sm border-border/40 text-xs font-bold shadow-sm transition-all hover:bg-muted">
             <Download className="w-4 h-4 opacity-70" /> 
             Operational Report
           </Button>
        </div>
      </div>

      {/* ── Summary Stats ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card card-hover shadow-sm p-6 flex flex-col items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
             <Factory className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Total Operational Hubs</span>
            <h2 className="text-4xl font-bold tracking-tighter">06</h2>
          </div>
        </Card>

        <Card className="glass-card card-hover shadow-sm p-6 flex flex-col items-start gap-4 border-l-4 border-l-rose-500/50">
          <div className="flex w-full items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
               <ShieldAlert className="w-5 h-5" />
            </div>
            <Badge className="bg-rose-500/20 text-rose-500 border-none text-[8px] font-bold px-1.5">URGENT ACTION</Badge>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 text-rose-500">Critical High-Risk</span>
            <h2 className="text-4xl font-bold tracking-tighter text-rose-500">02</h2>
          </div>
        </Card>

        <Card className="glass-card card-hover shadow-sm p-6 flex flex-col items-start gap-4 border-l-4 border-l-blue-500/50">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
             <Activity className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 text-blue-500">Standard Monitoring</span>
            <h2 className="text-4xl font-bold tracking-tighter text-blue-500">01</h2>
          </div>
        </Card>

        <Card className="glass-card card-hover shadow-sm p-6 flex flex-col items-start gap-4 border-l-4 border-l-emerald-500/50">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
             <Clock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 text-emerald-500">Mean Lead Variance</span>
            <h2 className="text-4xl font-bold tracking-tighter text-emerald-600">17.0%</h2>
          </div>
        </Card>
      </div>

      {/* ── Risk Matrix ────────────────────────────────────────────── */}
      {/* ── Correlation Analysis Zone ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card className="glass-card shadow-lg p-0 overflow-hidden animate-slide-up">
          <div className="p-6 border-b border-border/10 bg-muted/5">
             <CardTitle className="text-xs font-bold tracking-[0.2em] uppercase opacity-40">
                Supply Efficiency Correlation
             </CardTitle>
             <CardDescription className="text-xs font-medium text-muted-foreground">
                Distribution Delay vs. Quality Reliability across hubs.
             </CardDescription>
          </div>
          <div className="h-[320px] p-4">
             <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.05} vertical={false} />
                  <XAxis 
                    type="number" 
                    dataKey="delay" 
                    name="Delay" 
                    unit="%" 
                    tick={{ fontSize: 10, opacity: 0.5 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="quality" 
                    name="Quality" 
                    unit="%" 
                    domain={[0, 100]}
                    tick={{ fontSize: 10, opacity: 0.5 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ZAxis type="number" dataKey="score" range={[80, 450]} />
                  <Tooltip 
                    cursor={{ strokeDasharray: '4 4' }} 
                    content={({ active, payload }) => {
                       if (active && payload?.[0]) {
                         const d = payload[0].payload;
                         return (
                           <div className="glass-card !bg-slate-900/90 text-white p-3 rounded-2xl border-white/10 shadow-2xl backdrop-blur-xl">
                             <p className="text-[10px] font-bold uppercase opacity-50 mb-1.5">{d.name}</p>
                             <div className="space-y-1">
                               <p className="text-sm font-bold flex justify-between gap-6"><span>Quality Score:</span> <span>{d.quality}%</span></p>
                               <p className="text-[10px] flex justify-between gap-6 opacity-70"><span>Risk Index:</span> <span>{d.score}pts</span></p>
                             </div>
                           </div>
                         );
                       }
                       return null;
                    }}
                  />
                  <Scatter name="Clusters" data={matrixData}>
                    {matrixData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.score > 70 ? '#c62828' : entry.score > 40 ? '#1565c0' : '#2e7d32'} className="filter drop-shadow-sm transition-all duration-500" />
                    ))}
                  </Scatter>
                </ScatterChart>
             </ResponsiveContainer>
          </div>
        </Card>

        {/* Diagnostic Insight Logic */}
        <div className="grid gap-6 h-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="glass-card shadow-sm p-5 border-t-2 border-t-rose-500/20">
               <div className="flex items-center gap-2 text-rose-500 mb-3">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">System Vulnerability</span>
               </div>
               <p className="text-xs font-semibold leading-relaxed">Skikda axis reports persistent 32% delay due to fuel-line structural breaks.</p>
            </Card>
            <Card className="glass-card shadow-sm p-5 border-t-2 border-t-emerald-500/20">
               <div className="flex items-center gap-2 text-emerald-500 mb-3">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Model Stability</span>
               </div>
               <p className="text-xs font-semibold leading-relaxed">Blida & Annaba regional centers maintaining 95%+ service continuity.</p>
            </Card>
          </div>
          <Card className="glass-card shadow-sm p-8 bg-slate-900 border-none text-white relative flex-1 min-h-[160px] overflow-hidden">
             <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                <Zap className="w-48 h-48" />
             </div>
             <div className="relative z-10 space-y-4">
               <div>
                  <Badge variant="outline" className="text-[9px] font-bold border-white/20 text-white/50 mb-2">OPERATIONAL INSIGHT</Badge>
                  <h4 className="text-2xl font-bold tracking-tight">Supply Path Inefficiency</h4>
               </div>
               <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-sm">
                  Algeria Rail Logistics detected structural latency during peak seasonal transitions. **Recommended optimization: Pivot to Oran Multi-Modal Hub**.
               </p>
               <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold bg-white/5 border-white/10 text-white hover:bg-white/10">Execute Model Swap</Button>
             </div>
          </Card>
        </div>
      </div>

      {/* ── Supplier Ledger ─────────────────────────────────────────── */}
      <Card className="glass-card shadow-sm overflow-hidden animate-slide-up">
        <div className="p-6 border-b border-border/10 bg-muted/5">
           <CardTitle className="text-xs font-bold tracking-[0.2em] uppercase opacity-40">
              Operational Hub Ledger
           </CardTitle>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/10">
                  <TableHead className="pl-8 text-[9px] font-bold uppercase tracking-widest opacity-50">Regional Asset</TableHead>
                  <TableHead className="text-[9px] font-bold uppercase tracking-widest opacity-50">Region</TableHead>
                  <TableHead className="text-[9px] font-bold uppercase tracking-widest opacity-50 text-center">Delay</TableHead>
                  <TableHead className="text-[9px] font-bold uppercase tracking-widest opacity-50 text-center">Quality</TableHead>
                  <TableHead className="text-[9px] font-bold uppercase tracking-widest opacity-50 text-right">Items</TableHead>
                  <TableHead className="text-[9px] font-bold uppercase tracking-widest opacity-50 text-right pr-8">Lead Interval</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((s, idx) => (
                  <TableRow key={idx} className="group border-border/5 transition-colors hover:bg-muted/50">
                    <TableCell className="pl-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-card border border-border/50 flex items-center justify-center text-[10px] font-bold text-muted-foreground group-hover:scale-105 transition-transform duration-300 shadow-inner">
                          {s.id}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm tracking-tight">{s.name}</span>
                          <span className="text-[9px] text-muted-foreground font-bold tracking-tighter uppercase opacity-50">Asset Record</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                         <MapPin className="w-3 h-3 opacity-40" />
                         {s.region}
                       </div>
                    </TableCell>
                    <TableCell className="text-center">
                       <span className={cn(
                         "text-xs font-bold tabular-nums",
                         s.delay > 20 ? "text-rose-500" : s.delay > 10 ? "text-amber-500" : "text-emerald-500"
                       )}>
                         {s.delay}%
                       </span>
                    </TableCell>
                    <TableCell className="text-center">
                       <span className={cn(
                         "text-xs font-bold tabular-nums",
                         s.quality > 90 ? "text-emerald-500" : s.quality > 70 ? "text-amber-500" : "text-rose-500"
                       )}>
                         {s.quality}%
                       </span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-xs tabular-nums">
                       {s.items}
                    </TableCell>
                    <TableCell className="text-right pr-8">
                       <div className="flex items-center justify-end gap-2 text-[10px] font-bold tabular-nums opacity-60">
                          <Clock className="w-3 h-3" />
                          {s.leadTime}
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex items-center justify-between py-4 border-t border-border/10 mt-6 opacity-30">
        <p className="text-[9px] font-bold uppercase tracking-[0.3em]">
          Supply Compliance Framework v2.11.0 (2011 Stable)
        </p>
        <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest">
          <span>Dec 09, 2011 08:31</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Operational Stability</span>
        </div>
      </div>
    </div>
  );
}
