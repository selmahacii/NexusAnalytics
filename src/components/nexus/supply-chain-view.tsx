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
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            Supply Chain Diagnostics
            <Badge variant="outline" className="bg-rose-500/5 text-rose-600 border-rose-500/20 text-[10px] font-black uppercase">
              2 Critical Items detected
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl font-medium">
            Operational reliability ranked by risk index · 6 clusters in Maghreb network.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <div className="flex items-center gap-2 px-4 h-9 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500">
             <Activity className="w-3 h-3 text-emerald-500" />
             Diagnostic Sync Active
           </div>
           <Button variant="outline" size="sm" className="rounded-xl h-9 gap-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs shadow-sm font-bold">
             <Download className="w-4 h-4" /> Export Report
           </Button>
        </div>
      </div>

      {/* ── Summary Stats ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3 text-muted-foreground">
             <Factory className="w-5 h-5" />
             <span className="text-[10px] font-black uppercase tracking-widest">Total Suppliers</span>
          </div>
          <h2 className="text-5xl font-black tracking-tighter mt-4">06</h2>
        </Card>

        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-rose-500/[0.03] shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-600/70">High Risk</span>
            <Badge className="bg-rose-500 text-white border-none text-[8px] font-black uppercase tracking-widest px-1.5 h-4 text-center">Act Now</Badge>
          </div>
          <h3 className="text-4xl font-black text-rose-600 tracking-tighter">02</h3>
          <p className="text-[10px] font-bold text-rose-600/60 leading-none mt-2 italic">Immediate intervention required</p>
        </Card>

        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-blue-500/[0.03] shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
             <span className="text-[10px] font-black uppercase tracking-widest text-blue-600/70">Medium Risk</span>
          </div>
          <h3 className="text-4xl font-black text-blue-600 tracking-tighter">01</h3>
          <p className="text-[10px] font-bold text-blue-600/60 leading-none mt-2">Active Monitoring active</p>
        </Card>

        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-emerald-500/[0.03] shadow-sm p-6">
           <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70">Avg. Delay Rate</span>
           <h3 className="text-4xl font-black text-emerald-600 tracking-tighter mt-4">17.0%</h3>
           <p className="text-[10px] text-emerald-600/60 font-bold uppercase tracking-tight mt-2">
             Cluster Average Variance
           </p>
        </Card>
      </div>

      {/* ── Risk Matrix ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-[2.5rem] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 px-8 pt-6 border-b border-slate-50 dark:border-slate-900 mb-4">
             <CardTitle className="text-xs font-black tracking-widest text-foreground uppercase opacity-40">
                Supply Chain Risk Matrix
             </CardTitle>
             <CardDescription className="text-xs font-medium">
                Delay rate vs. quality score across 6 regional entities.
             </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center p-8">
             <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis 
                    type="number" 
                    dataKey="delay" 
                    name="Delay Rate" 
                    unit="%" 
                    label={{ value: 'Delay %', position: 'insideBottom', offset: -10, fontSize: 10, fontWeight: 800 }} 
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="quality" 
                    name="Quality Score" 
                    unit="%" 
                    label={{ value: 'Quality %', angle: -90, position: 'insideLeft', fontSize: 10, fontWeight: 800 }} 
                    domain={[0, 100]}
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ZAxis type="number" dataKey="score" range={[100, 400]} />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }} 
                    content={({ active, payload }) => {
                       if (active && payload && payload.length) {
                         const d = payload[0].payload;
                         return (
                           <div className="bg-slate-900 text-white p-3 rounded-xl border border-white/10 shadow-2xl">
                             <p className="text-[10px] font-black uppercase mb-1">{d.name}</p>
                             <div className="space-y-0.5">
                               <p className="text-[9px] flex justify-between gap-4"><span>Delay:</span> <span>{d.delay}%</span></p>
                               <p className="text-[9px] flex justify-between gap-4"><span>Quality:</span> <span>{d.quality}%</span></p>
                               <p className="text-[9px] flex justify-between gap-4 font-black"><span>Risk Score:</span> <span>{d.score}</span></p>
                             </div>
                           </div>
                         );
                       }
                       return null;
                    }}
                  />
                  <Scatter name="Suppliers" data={matrixData}>
                    {matrixData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.score > 70 ? '#f43f5e' : entry.score > 40 ? '#3b82f6' : '#10b981'} />
                    ))}
                  </Scatter>
                </ScatterChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Diagnostic Legend / Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="rounded-[1.5rem] bg-slate-50/50 dark:bg-slate-900/10 border-slate-100 dark:border-slate-800 p-6 flex flex-col justify-center">
             <div className="flex items-center gap-3 text-rose-600 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Critical Vulnerability</span>
             </div>
             <p className="text-xs font-bold text-foreground">Skikda axis shows 32% delay rate due to port congestion models.</p>
             <div className="mt-4 flex items-center gap-2">
                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest text-rose-600 border-rose-500/20">High Priority Action</Badge>
             </div>
          </Card>
          <Card className="rounded-[1.5rem] bg-slate-50/50 dark:bg-slate-900/10 border-slate-100 dark:border-slate-800 p-6 flex flex-col justify-center">
             <div className="flex items-center gap-3 text-blue-600 mb-2">
                <ShieldAlert className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Optimal Performance</span>
             </div>
             <p className="text-xs font-bold text-foreground">Blida & Annaba hubs maintaining 94%+ quality consistency.</p>
             <div className="mt-4 flex items-center gap-2">
                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest text-emerald-600 border-emerald-500/20">System Healthy</Badge>
             </div>
          </Card>
          <Card className="col-span-1 sm:col-span-2 rounded-[1.5rem] bg-slate-900 border-slate-800 p-6 text-white relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap className="w-24 h-24" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Diagnostic Insight</p>
             <h4 className="text-xl font-black tracking-tight mb-2">Lead-Time Volatility Detected</h4>
             <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-sm">
                Rail logistics in Algiers Cluster are currently underperforming against seasonal benchmarks. Suggested intervention: **Cycle Shift to Oran Bulk Hub**.
             </p>
          </Card>
        </div>
      </div>

      {/* ── Supplier Ledger ─────────────────────────────────────────── */}
      <Card className="rounded-[2.5rem] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-slide-up">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-900">
                  <TableHead className="pl-8 text-[10px] font-black uppercase tracking-widest text-slate-500">Service Entity</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Region</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Delay Rate</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Quality Score</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Active Items</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-right pr-8">Lead Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((s, idx) => (
                  <TableRow key={idx} className="group border-slate-100 dark:border-slate-900 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                    <TableCell className="pl-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-[10px] font-black text-slate-600 group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-slate-900 transition-all duration-300">
                          {s.id}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm tracking-tight text-foreground">{s.name}</span>
                          <span className="text-[9px] text-muted-foreground font-black tracking-tighter uppercase">RDM Supplier Record</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                         <MapPin className="w-3.5 h-3.5 text-slate-400" />
                         {s.region}
                       </div>
                    </TableCell>
                    <TableCell className="text-center">
                       <span className={cn(
                         "text-xs font-black tabular-nums",
                         s.delay > 20 ? "text-rose-600" : s.delay > 10 ? "text-amber-600" : "text-emerald-600"
                       )}>
                         {s.delay}%
                       </span>
                    </TableCell>
                    <TableCell className="text-center">
                       <span className={cn(
                         "text-xs font-black tabular-nums",
                         s.quality > 90 ? "text-emerald-600" : s.quality > 70 ? "text-amber-600" : "text-rose-600"
                       )}>
                         {s.quality}%
                       </span>
                    </TableCell>
                    <TableCell className="text-right">
                       <span className="font-black text-sm tabular-nums tracking-tighter text-foreground">
                         {s.items}
                       </span>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                       <div className="flex items-center justify-end gap-2 text-xs font-black tabular-nums text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
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
      
      <div className="flex items-center justify-between py-2 border-t border-slate-100 dark:border-slate-900 mt-4 opacity-30">
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">
          RDM Distribution Controller v4.2.0
        </p>
        <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-slate-500">
          <span>Diagnostic Mode: ORI-v2</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>System Stable</span>
        </div>
      </div>
    </div>
  );
}
