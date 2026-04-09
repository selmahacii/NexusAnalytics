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
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Projections & Risk Metrics</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl font-medium">
            Method: <strong>Rolling Mean + Seasonal Drift Analysis</strong>. Diagnostic risk scoring for retail distribution hubs.
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
             <ShieldAlert className="w-5 h-5" />
             <span className="text-[10px] font-black uppercase tracking-widest">Total At-Risk</span>
          </div>
          <h2 className="text-5xl font-black tracking-tighter mt-4">532</h2>
        </Card>

        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-rose-500/[0.03] shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-600/70">High Risk</span>
            <Badge className="bg-rose-500 text-white border-none text-[8px] font-black uppercase tracking-widest px-1.5 h-4">Priority 1</Badge>
          </div>
          <h3 className="text-4xl font-black text-rose-600 tracking-tighter">07</h3>
          <p className="text-[10px] font-bold text-rose-600/60 leading-none mt-2">Immediate Action Required</p>
        </Card>

        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-blue-500/[0.03] shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
             <span className="text-[10px] font-black uppercase tracking-widest text-blue-600/70">Medium Risk</span>
             <Badge variant="outline" className="border-blue-500/20 text-blue-600 text-[8px] font-black uppercase tracking-widest px-1.5 h-4">Priority 2</Badge>
          </div>
          <h3 className="text-4xl font-black text-blue-600 tracking-tighter">525</h3>
          <p className="text-[10px] font-bold text-blue-600/60 leading-none mt-2">Monitored Segments</p>
        </Card>

        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-emerald-500/[0.03] shadow-sm p-6">
           <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70">Avg. Churn Score</span>
           <h3 className="text-4xl font-black text-emerald-600 tracking-tighter mt-4">63.7%</h3>
           <p className="text-[10px] text-emerald-600/60 font-bold uppercase tracking-tight mt-2 italic">
             Signal Probability Density
           </p>
        </Card>
      </div>

      <div className="h-px bg-slate-100 dark:bg-slate-900 mx-10 my-2" />

      {/* ── Table Controls ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
           <div className="relative w-72">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input
               placeholder="Search by name or region..."
               className="pl-9 h-10 rounded-xl bg-card/50 border-slate-200 dark:border-slate-800"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
           </div>
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-xl gap-2 h-10 px-4 border-slate-200 dark:border-slate-800 font-bold text-xs uppercase tracking-tight">
                <Layers className="w-4 h-4 text-slate-400" />
                 {sectorFilter === "all" ? "All Sectors" : sectorFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-xl">
              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Market Segmentation</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSectorFilter("all")}>All Sectors</DropdownMenuItem>
              {sectors.map((s) => (
                <DropdownMenuItem key={s} onClick={() => setSectorFilter(s)} className="capitalize">{s}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-40">
             Showing top 25 priority rankings
          </p>
          <div className="group relative">
             <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
             <div className="absolute right-0 bottom-full mb-2 w-48 bg-slate-900 text-white p-2 rounded-lg text-[9px] font-bold invisible group-hover:visible z-50 shadow-xl">
               <p className="mb-1 text-slate-400">ENTITY TYPES:</p>
               <ul className="space-y-1">
                 {Object.entries(ENTITY_LEGEND).map(([k, v]) => (
                   <li key={k} className="flex justify-between"><span>{k}:</span> <span>{v}</span></li>
                 ))}
               </ul>
             </div>
          </div>
        </div>
      </div>

      {/* ── Accounts Ledger ─────────────────────────────────────────── */}
      <Card className="rounded-[2.5rem] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-900">
                  <TableHead className="pl-8 text-[10px] font-black uppercase tracking-widest text-slate-500">Customer Entity</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sector</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Region</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Churn Risk (Score)</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Revenue YTD</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-right pr-8">Inactivity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account, idx) => (
                  <TableRow key={idx} className="group border-slate-100 dark:border-slate-900 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                    <TableCell className="pl-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-[10px] font-black text-slate-600 group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-slate-900 transition-all duration-300">
                          {account.id}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm tracking-tight text-foreground">{account.name}</span>
                          <span className="text-[9px] text-muted-foreground font-black tracking-tighter uppercase">Verified Client Entry</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                       <Badge variant="outline" className="bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-[10px] font-bold px-2 py-0 h-4.5 rounded-lg capitalize">
                         {account.sector}
                       </Badge>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-tight">
                         <MapPin className="w-3 h-3 text-slate-400" />
                         {account.region}
                       </div>
                    </TableCell>
                    <TableCell className="text-center">
                       <div className="flex flex-col items-center">
                          <span className={cn(
                            "text-xs font-black tabular-nums",
                            account.risk === "High" ? "text-rose-600" : "text-amber-600"
                          )}>
                            {account.riskPct}% [{account.risk}]
                          </span>
                       </div>
                    </TableCell>
                    <TableCell className="text-right">
                       <span className="font-black text-sm tabular-nums tracking-tighter text-foreground">
                         {account.revenue}
                       </span>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                       <div className="flex items-center justify-end gap-2 text-xs font-black tabular-nums text-muted-foreground uppercase tracking-tighter">
                          <Calendar className="w-3.5 h-3.5 opacity-40" />
                          {account.inactive}
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
          <span>Regional Cluster: Maghreb</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Encryption: AES-256-GCM</span>
        </div>
      </div>
    </div>
  );
}
