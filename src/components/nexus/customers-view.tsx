"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  Users,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  UserCheck,
  UserMinus,
  Briefcase,
  Layers,
  ChevronRight,
  MoreHorizontal,
  Mail,
  Phone,
  FileText,
  BadgeCheck,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

// ── Types ────────────────────────────────────────────────────────────────────

interface Customer {
  id: string;
  name: string;
  sector: string | null;
  region: string | null;
  country: string;
  size: string | null;
  creditScore: number | null;
  daysToPayAvg: number;
  churnRisk: number;
  lifetimeValue: number | null;
  acquisitionDate: string | null;
  lastOrderDate: string | null;
  totalOrders: number;
  totalRevenue: number;
  isActive: boolean;
}

interface CustomersData {
  customers: Customer[];
  stats: {
    total: number;
    active: number;
    newThisMonth: number;
    avgLtv: number;
    churnRate: number;
  };
}

// ── Loading Skeleton ─────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Card className="border rounded-xl">
        <Skeleton className="h-10 w-full" />
        <div className="p-4 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M DZD`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K DZD`;
  return `${val.toLocaleString()} DZD`;
}

function getChurnColor(risk: number): string {
  if (risk > 0.7) return "text-red-600 dark:text-red-400";
  if (risk > 0.4) return "text-amber-600 dark:text-amber-400";
  return "text-emerald-600 dark:text-emerald-400";
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function CustomersView() {
  const [data, setData] = useState<CustomersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState<string>("all");

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch("/api/customers")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        toast.error("Erreur de chargement", { description: err.message });
      });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  // Derived stats and filters
  const filteredCustomers = useMemo(() => {
    if (!data) return [];
    return data.customers.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.id.toLowerCase().includes(search.toLowerCase());
      const matchSector = sectorFilter === "all" || c.sector === sectorFilter;
      return matchSearch && matchSector;
    });
  }, [data, search, sectorFilter]);

  const sectors = useMemo(() => {
    if (!data) return [];
    const s = new Set<string>();
    data.customers.forEach((c) => { if (c.sector) s.add(c.sector); });
    return Array.from(s).sort();
  }, [data]);

  if (loading) return <SkeletonGrid />;
  if (!data) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Summary Stats ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card shadow-sm border-t-2 border-t-primary/40 stagger-1 animate-slide-up">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="bg-primary/10 p-2 rounded-xl">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-none">
                +12%
              </Badge>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-bold tracking-tight">{data.stats.total}</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Total Customers</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card shadow-sm border-t-2 border-t-emerald-500/40 stagger-2 animate-slide-up">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="bg-emerald-500/10 p-2 rounded-xl">
                <UserCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-none">
                {((data.stats.active / data.stats.total) * 100).toFixed(0)}%
              </Badge>
            </div>
            <div className="mt-3">
              <p className="text-l font-bold tracking-tight">{data.stats.active}</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Active Customers</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card shadow-sm border-t-2 border-t-blue-500/40 stagger-3 animate-slide-up">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="bg-blue-500/10 p-2 rounded-xl">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-l font-bold tracking-tight">{fmtCurrency(data.stats.avgLtv)}</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Avg. LTV</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card shadow-sm border-t-2 border-t-rose-500/40 stagger-4 animate-slide-up">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="bg-rose-500/10 p-2 rounded-xl">
                <UserMinus className="w-5 h-5 text-rose-600" />
              </div>
              <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-none">
                {data.stats.churnRate}%
              </Badge>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-bold tracking-tight">{data.stats.churnRate}%</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Churn Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Search & Filter ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            className="pl-9 rounded-xl bg-card/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-xl gap-2 h-10 px-4 bg-card/50">
                <Layers className="w-4 h-4" />
                Sector: {sectorFilter === "all" ? "All" : sectorFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-xl">
              <DropdownMenuLabel>Filter by sector</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSectorFilter("all")}>All sectors</DropdownMenuItem>
              {sectors.map((s) => (
                <DropdownMenuItem key={s} onClick={() => setSectorFilter(s)}>{s}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="outline" size="icon" className="rounded-xl h-10 w-10 bg-card/50">
            <Filter className="w-4 h-4" />
          </Button>
          
          <Button className="rounded-xl h-10 gap-2 ml-auto sm:ml-0">
            New Customer
          </Button>
        </div>
      </div>

      {/* ── Customers Table ─────────────────────────────────────────── */}
      <Card className="glass-card shadow-lg border-none animate-slide-up stagger-5">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-lg font-bold text-premium-gradient">Customer Database</CardTitle>
            <CardDescription className="text-xs">
              Detailed list of {filteredCustomers.length} customers found
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={() => fetchData()}>
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto natural-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent px-6">
                  <TableHead className="pl-6 w-[280px]">Customer</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[150px]">Sector</TableHead>
                  <TableHead className="w-[150px]">Region</TableHead>
                  <TableHead className="w-[150px] text-right">Total Revenue</TableHead>
                  <TableHead className="w-[120px] text-center">Churn Risk</TableHead>
                  <TableHead className="w-[60px] pr-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="group transition-colors duration-200">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {customer.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm tracking-tight">{customer.name}</span>
                          <span className="text-[10px] text-muted-foreground uppercase">{customer.id}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.isActive ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-none text-[10px] px-2 font-bold uppercase tracking-wider">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground border-none text-[10px] px-2 font-bold uppercase tracking-wider">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-muted-foreground">{customer.sector || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <MapPin className="w-3 h-3 text-primary/60" />
                        {customer.region || "Inconnue"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-bold text-sm tabular-nums tracking-tight">
                        {fmtCurrency(customer.totalRevenue)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                       <span className={cn("text-xs font-bold tabular-nums", getChurnColor(customer.churnRisk))}>
                        {(customer.churnRisk * 100).toFixed(0)}%
                      </span>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredCustomers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Search className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-sm font-medium">No customers found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RefreshCw({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}
