"use client";

import { useState, useMemo } from "react";
import {
  Users,
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
import { cn } from "@/lib/utils";

// ── Legend for Entity Types ──────────────────────────────────────────────────
const ENTITY_LEGEND: Record<string, string> = {
  SA: "SARL / SAS",
  EU: "EURL",
  SP: "SPA",
  SN: "SNC",
};

// ── Dataset: 50 Algerian Retail Accounts (Top 25 shown for readability) ────────

const ACCOUNTS = [
  { id: "SA", name: "SARL TechÉlectrique", sector: "énergie", region: "Sétif", risk: "High", riskPct: 75, revenue: "€5.7M", inactive: "78 Days" },
  { id: "EU", name: "EURL PlusBois", sector: "BTP", region: "Constantine", risk: "High", riskPct: 75, revenue: "€3.7M", inactive: "73 Days" },
  { id: "SA", name: "SAS EstOuest", sector: "BTP", region: "Constantine", risk: "High", riskPct: 74, revenue: "€3.5M", inactive: "57 Days" },
  { id: "SA", name: "SAS Tubaire", sector: "BTP", region: "Alger", risk: "High", riskPct: 71, revenue: "€6.0M", inactive: "80 Days" },
  { id: "EU", name: "EURL SaharaBois", sector: "métallurgie", region: "Sétif", risk: "High", riskPct: 71, revenue: "€0.6M", inactive: "89 Days" },
  { id: "EU", name: "EURL AgroTechnique", sector: "BTP", region: "Constantine", risk: "Medium", riskPct: 70, revenue: "€3.5M", inactive: "82 Days" },
  { id: "SP", name: "SPA RoyalTech", sector: "agroalimentaire", region: "Blida", risk: "Medium", riskPct: 70, revenue: "€1.7M", inactive: "91 Days" },
  { id: "SA", name: "SARL NumériqueSoudure", sector: "métallurgie", region: "Sétif", risk: "Medium", riskPct: 69, revenue: "€4.8M", inactive: "43 Days" },
  { id: "SA", name: "SAS PlomberieRoyal", sector: "BTP", region: "Constantine", risk: "Medium", riskPct: 68, revenue: "€4.5M", inactive: "78 Days" },
  { id: "SA", name: "SARL MédéaTech", sector: "énergie", region: "Oran", risk: "Medium", riskPct: 67, revenue: "€3.7M", inactive: "91 Days" },
  { id: "EU", name: "EURL TubairePlus", sector: "chimie", region: "Oran", risk: "Medium", riskPct: 67, revenue: "€4.3M", inactive: "84 Days" },
  { id: "EU", name: "EURL MaxÉnergie", sector: "métallurgie", region: "Oran", risk: "Medium", riskPct: 67, revenue: "€3.4M", inactive: "84 Days" },
  { id: "EU", name: "EURL AvancéAlger", sector: "énergie", region: "Constantine", risk: "Medium", riskPct: 66, revenue: "€4.8M", inactive: "54 Days" },
  { id: "SP", name: "SPA DigitalProd", sector: "agroalimentaire", region: "Annaba", risk: "Medium", riskPct: 66, revenue: "€6.4M", inactive: "89 Days" },
  { id: "SA", name: "SAS MédéaConstruct", sector: "chimie", region: "Alger", risk: "Medium", riskPct: 65, revenue: "€3.8M", inactive: "84 Days" },
  { id: "SA", name: "SARL PrestigeChim", sector: "métallurgie", region: "Blida", risk: "Medium", riskPct: 65, revenue: "€2.0M", inactive: "65 Days" },
  { id: "SN", name: "SNC ConstructBois", sector: "textile", region: "Blida", risk: "Medium", riskPct: 65, revenue: "€1.3M", inactive: "78 Days" },
  { id: "EU", name: "EURL GlobalSoudure", sector: "textile", region: "Alger", risk: "Medium", riskPct: 65, revenue: "€1.4M", inactive: "72 Days" },
  { id: "SA", name: "SARL DigitalAgro", sector: "chimie", region: "Blida", risk: "Medium", riskPct: 65, revenue: "€1.1M", inactive: "92 Days" },
  { id: "SA", name: "SAS ÉnergieAvancé", sector: "textile", region: "Sétif", risk: "Medium", riskPct: 64, revenue: "€0.3M", inactive: "38 Days" },
  { id: "SA", name: "SAS EliteBois", sector: "textile", region: "Oran", risk: "Medium", riskPct: 64, revenue: "€0.9M", inactive: "69 Days" },
  { id: "EU", name: "EURL GlobalAtlas", sector: "énergie", region: "Sétif", risk: "Medium", riskPct: 64, revenue: "€4.3M", inactive: "82 Days" },
  { id: "SP", name: "SPA DigitalPremier", sector: "chimie", region: "Constantine", risk: "Medium", riskPct: 63, revenue: "€3.2M", inactive: "91 Days" },
  { id: "SA", name: "SAS PrestigeTech", sector: "agroalimentaire", region: "Sétif", risk: "Medium", riskPct: 63, revenue: "€3.8M", inactive: "22 Days" },
  { id: "SN", name: "SNC FerroPrestige", sector: "agroalimentaire", region: "Alger", risk: "Medium", riskPct: 63, revenue: "€1.6M", inactive: "81 Days" },
];

export default function CustomersView() {
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");

  const filteredAccounts = useMemo(() => {
    return ACCOUNTS.filter(acc => {
      const matchesSearch = acc.name.toLowerCase().includes(search.toLowerCase()) || 
                             acc.region.toLowerCase().includes(search.toLowerCase());
      const matchesSector = sectorFilter === "all" || acc.sector === sectorFilter;
      return matchesSearch && matchesSector;
    });
  }, [search, sectorFilter]);

  const sectors = useMemo(() => {
    return Array.from(new Set(ACCOUNTS.map(a => a.sector))).sort();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 px-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-500 opacity-20"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60">Registry Health Nominal</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Projections & Risk Metrics</h1>
          <p className="text-sm text-muted-foreground font-medium italic opacity-70">
            Method: Rolling Mean + Seasonal Drift Analysis. Diagnostic risk scoring for retail distribution hubs.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-card/40 backdrop-blur-md border border-border/20 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground shadow-sm">
             <Activity className="w-3.5 h-3.5 text-emerald-500 mr-1.5" />
             Diagnostic Sync Active
           </div>
           <Button variant="outline" size="sm" className="rounded-xl h-11 gap-2 border-border/40 bg-card/40 text-[10px] font-bold uppercase tracking-widest px-6 shadow-sm card-hover">
             <Download className="w-4 h-4 opacity-50" /> Export Registry
           </Button>
        </div>
      </div>

      {/* ── Summary Stats ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-4">
        <Card className="rounded-[1.5rem] bg-card/60 backdrop-blur-md border-border/40 shadow-sm p-8 flex flex-col justify-between transition-all hover:bg-muted/40 card-hover group">
          <div className="flex items-center gap-3 text-muted-foreground/60">
             <ShieldAlert className="w-5 h-5 opacity-50 group-hover:text-primary transition-colors" />
             <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Total At-Risk</span>
          </div>
          <h2 className="text-5xl font-bold tracking-tighter mt-6 text-foreground">532</h2>
        </Card>

        <Card className="rounded-[1.5rem] bg-rose-500/5 backdrop-blur-md border-rose-500/20 shadow-sm p-8 flex flex-col justify-between card-hover group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-600/70">Critical Tier</span>
            <Badge className="bg-rose-500 text-white border-none text-[8px] font-bold uppercase tracking-widest px-2 h-5 rounded-lg">Priority I</Badge>
          </div>
          <h3 className="text-5xl font-bold text-rose-600 tracking-tighter mt-4">07</h3>
          <p className="text-[10px] font-bold text-rose-600/40 uppercase tracking-widest mt-4">Manual Sweep Required</p>
        </Card>

        <Card className="rounded-[1.5rem] bg-blue-500/5 backdrop-blur-md border-blue-500/20 shadow-sm p-8 flex flex-col justify-between card-hover group">
          <div className="flex items-center justify-between mb-2">
             <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600/70">Observation Tier</span>
             <Badge variant="outline" className="border-blue-500/20 text-blue-600 text-[8px] font-bold uppercase tracking-widest px-2 h-5 rounded-lg">Priority II</Badge>
          </div>
          <h3 className="text-5xl font-bold text-blue-600 tracking-tighter mt-4">525</h3>
          <p className="text-[10px] font-bold text-blue-600/40 uppercase tracking-widest mt-4">Passive Monitoring</p>
        </Card>

        <Card className="rounded-[1.5rem] bg-emerald-500/5 backdrop-blur-md border-emerald-500/20 shadow-sm p-8 flex flex-col justify-between card-hover group">
           <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600/70">Avg. Signal Density</span>
           <h3 className="text-5xl font-bold text-emerald-600 tracking-tighter mt-4">63.7%</h3>
           <p className="text-[10px] text-emerald-600/40 font-bold uppercase tracking-widest mt-4 italic">
             Probabilistic Distribution
           </p>
        </Card>
      </div>

      <div className="h-px bg-slate-100 dark:bg-slate-900 mx-10 my-2" />

      {/* ── Table Controls ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-6 px-4">
        <div className="flex items-center gap-4">
           <div className="relative w-80 group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
             <Input
               placeholder="Filter by entity or regional hub..."
               className="pl-11 h-12 rounded-[1.2rem] bg-card/40 backdrop-blur-md border-border/20 shadow-inner ring-1 ring-border/5 focus-visible:ring-primary/20"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
           </div>
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-[1.2rem] gap-3 h-12 px-6 border-border/20 bg-card/40 font-bold text-[10px] uppercase tracking-widest shadow-sm card-hover">
                <Layers className="w-4 h-4 opacity-40" />
                 {sectorFilter === "all" ? "Strategic Sectors" : sectorFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 rounded-2xl p-2 bg-card/95 backdrop-blur-xl border-border/20 shadow-2xl">
              <DropdownMenuLabel className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/50 border-b border-border/5 mb-1.5">Market Segmentation</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSectorFilter("all")} className="rounded-xl h-10 px-4 text-xs font-bold transition-all focus:bg-primary focus:text-white">All Strategic Sectors</DropdownMenuItem>
              {sectors.map((s) => (
                <DropdownMenuItem key={s} onClick={() => setSectorFilter(s)} className="rounded-xl h-10 px-4 text-xs font-bold transition-all focus:bg-primary focus:text-white capitalize">{s}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/40 italic">
             Displaying top 25 priority rankings
          </p>
          <div className="group relative">
             <Info className="w-4 h-4 text-muted-foreground opacity-30 cursor-help hover:opacity-100 transition-opacity" />
             <div className="absolute right-0 bottom-full mb-3 w-64 bg-slate-800 text-white p-6 rounded-[1.5rem] text-[10px] font-medium invisible group-hover:visible z-50 shadow-2xl animate-slide-up border border-border/10 ring-1 ring-black/20">
               <p className="mb-4 text-[9px] font-bold uppercase tracking-[0.3em] text-white/40 border-b border-white/5 pb-2">ENTITY TYPES:</p>
               <ul className="space-y-2.5">
                 {Object.entries(ENTITY_LEGEND).map(([k, v]) => (
                   <li key={k} className="flex justify-between items-center"><span className="font-bold opacity-60 bg-white/5 px-2 py-0.5 rounded-md">{k}</span> <span className="text-right opacity-90">{v}</span></li>
                 ))}
               </ul>
             </div>
          </div>
        </div>
      </div>

      {/* ── Accounts Ledger ─────────────────────────────────────────── */}
      <Card className="rounded-[1.5rem] bg-card/60 backdrop-blur-md border-border/40 shadow-sm overflow-hidden mx-4">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/5">
                  <TableHead className="pl-10 h-16 text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground/50">Customer Entity</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground/50">Strategic Sector</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground/50 text-center">Inactivity Hub (Days)</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground/50 text-center">Diagnostic Score</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground/50 text-right pr-10">Revenue YTD</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account, idx) => (
                  <TableRow key={idx} className="group border-border/5 transition-all duration-300 hover:bg-muted/30">
                    <TableCell className="pl-10 py-6">
                      <div className="flex items-center gap-5">
                        <div className="w-11 h-11 rounded-2xl bg-slate-500/10 flex items-center justify-center text-[11px] font-bold text-slate-500 group-hover:bg-slate-800 group-hover:text-white transition-all shadow-inner ring-1 ring-border/5">
                          {account.id}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-base tracking-tight text-foreground truncate">{account.name}</span>
                          <span className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-widest mt-1">Verified Distribution Agent</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground/80 capitalize">{account.sector} Cluster</span>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                            <MapPin className="w-3 h-3 opacity-40 text-blue-500" />
                            {account.region}
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="text-center">
                       <div className="flex items-center justify-center gap-2 text-[13px] font-bold tabular-nums text-foreground/80 lowercase bg-muted/40 w-fit mx-auto px-4 py-1 rounded-xl border border-border/5">
                          <Calendar className="w-4 h-4 opacity-30" />
                          {account.inactive}
                       </div>
                    </TableCell>
                    <TableCell className="text-center">
                       <div className="flex flex-col items-center">
                          <span className={cn(
                            "text-base font-bold tabular-nums tracking-tighter",
                            account.risk === "High" ? "text-rose-600" : "text-blue-600"
                          )}>
                            {account.riskPct}%
                          </span>
                          <Badge variant="outline" className={cn(
                            "text-[8px] font-bold uppercase tracking-widest h-4 px-2 mt-1.5 border-none",
                            account.risk === "High" ? "bg-rose-500/10 text-rose-600" : "bg-blue-500/10 text-blue-600"
                          )}>
                             {account.risk === "High" ? "Immediate Sync" : "Nominal Data"}
                          </Badge>
                       </div>
                    </TableCell>
                    <TableCell className="text-right pr-10">
                       <span className="font-bold text-base tabular-nums tracking-tighter text-foreground opacity-80">
                         {account.revenue}
                       </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex items-center justify-between px-10 py-6 border-t border-border/5 mt-8 opacity-40">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground/60">
          Industrial Registry Suite v2.1.2 
        </p>
        <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
          <span className="flex items-center gap-2"><MapPin className="w-3 h-3"/> Regional Hub: Sétif</span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span>AES-256 Verified Ledger</span>
        </div>
      </div>
    </div>
  );
}
