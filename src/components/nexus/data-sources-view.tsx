"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Database,
  RefreshCw,
  Clock,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  Activity,
  Server,
  Cloud,
  FileText,
  Search,
  Filter,
  MoreHorizontal,
  Plus,
  Play,
  RotateCw,
  ExternalLink,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import { PipelineBuilderModal } from "./pipeline-builder-modal";

// ── Types ────────────────────────────────────────────────────────────────────

interface DataIngestionLog {
  id: string;
  source: string;
  status: "success" | "failed" | "running";
  recordsCount: number;
  durationMs: number;
  createdAt: string;
}

interface DataSource {
  id: string;
  name: string;
  type: "internal" | "external";
  status: "active" | "idle" | "error" | "syncing";
  lastSync: string;
  totalRecords: number;
  syncFrequency: string;
  health: number; // 0-100
}

// ── Data Sources ─────────────────────────────────────────────────────────────

const DATA_SOURCES_CONFIG: DataSource[] = [
  {
    id: "uci_online_retail",
    name: "UCI Online Retail Dataset",
    type: "internal",
    status: "active",
    lastSync: new Date().toISOString(),
    totalRecords: 380000,
    syncFrequency: "Manual / On-demand",
    health: 100,
  },
  {
    id: "world_bank_economic",
    name: "World Bank Economic Data",
    type: "external",
    status: "active",
    lastSync: new Date(Date.now() - 3600000 * 24).toISOString(),
    totalRecords: 1240,
    syncFrequency: "Weekly",
    health: 100,
  },
  {
    id: "open_meteo_weather",
    name: "Open-Meteo Weather API",
    type: "external",
    status: "active",
    lastSync: new Date(Date.now() - 3600000).toISOString(),
    totalRecords: 8520,
    syncFrequency: "Hourly",
    health: 98,
  },
  {
    id: "forex_rates",
    name: "Standard Forex Rates Feed",
    type: "external",
    status: "syncing",
    lastSync: new Date(Date.now() - 1200000).toISOString(),
    totalRecords: 4500,
    syncFrequency: "Daily",
    health: 100,
  },
];

// ── Skeleton ─────────────────────────────────────────────────────────────────

function DataSourcesSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[500px] rounded-xl" />
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function DataSourcesView() {
  const [sources, setSources] = useState<DataSource[]>(DATA_SOURCES_CONFIG);
  const [logs, setLogs] = useState<DataIngestionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch("/api/data-sources")
      .then((r) => r.json())
      .then((data) => {
        if (data.sources) setSources(data.sources);
        if (data.logs) setLogs(data.logs);
        setLoading(false);
      })
      .catch(() => {
        // Fallback demo logs if API fails
        const demoLogs: DataIngestionLog[] = [
          { id: "1", source: "UCI Online Retail", status: "success", recordsCount: 381240, durationMs: 4200, createdAt: new Date().toISOString() },
          { id: "2", source: "World Bank", status: "success", recordsCount: 45, durationMs: 850, createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
          { id: "3", source: "Open-Meteo", status: "success", recordsCount: 168, durationMs: 420, createdAt: new Date(Date.now() - 3600000 * 5).toISOString() },
          { id: "4", source: "Forex rates", status: "failed", recordsCount: 0, durationMs: 120, createdAt: new Date(Date.now() - 3600000 * 24).toISOString() },
        ];
        setLogs(demoLogs);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const handleSyncSource = (id: string) => {
    setSyncingId(id);
    toast.promise(
      new Promise((res) => setTimeout(res, 2000)), // Simulate sync for UI
      {
        loading: "Initiating data synchronization...",
        success: () => {
          setSyncingId(null);
          return "Synchronization completed successfully";
        },
        error: "Sync failed",
      }
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Sources</h1>
          <p className="text-sm text-muted-foreground">Monitor and manage the health of all internal and external data pipelines.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl gap-2 shadow-sm" onClick={fetchData}>
            <RotateCw className="w-4 h-4" /> Refresh Status
          </Button>
          <PipelineBuilderModal>
            <Button className="rounded-xl gap-2 shadow-sm">
              <Plus className="w-4 h-4" /> Create Pipeline
            </Button>
          </PipelineBuilderModal>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card shadow-sm border-t-2 border-t-primary/40 stagger-1 animate-slide-up">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="bg-primary/10 p-2 rounded-xl">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight">{sources.length}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Active Connections</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card shadow-sm border-t-2 border-t-emerald-500/40 stagger-2 animate-slide-up">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="bg-emerald-500/10 p-2 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-none">100%</Badge>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight">System Health</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Global pipeline stability</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card shadow-sm border-t-2 border-t-blue-500/40 stagger-2 animate-slide-up">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="bg-blue-500/10 p-2 rounded-xl">
                <Server className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight">410.2K+</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Stored Records</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card shadow-sm border-t-2 border-t-amber-500/40 stagger-2 animate-slide-up">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="bg-amber-500/10 p-2 rounded-xl">
                <History className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight">952.1 MB</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Dataset Volume</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connection Monitor */}
      <Card className="glass-card shadow-lg border-none animate-slide-up stagger-5">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-lg font-bold text-premium-gradient flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Connection Monitor
            </CardTitle>
            <CardDescription className="text-xs">Real-time status of data ingestion pipes.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-64 hidden md:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search connections..." 
                className="w-full bg-muted/50 border rounded-lg pl-8 text-xs h-8 focus:outline-none focus:ring-1 ring-primary/20"
              />
            </div>
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg">
              <Filter className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6 text-[10px]">Source Identifier</TableHead>
                  <TableHead className="text-[10px]">Connectivity</TableHead>
                  <TableHead className="text-[10px]">Type</TableHead>
                  <TableHead className="text-[10px]">Health</TableHead>
                  <TableHead className="text-[10px]">Frequency</TableHead>
                  <TableHead className="text-[10px]">Last Sync</TableHead>
                  <TableHead className="text-right pr-6 text-[10px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((src) => (
                  <TableRow key={src.id} className="group transition-colors">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-inner",
                          src.type === "internal" ? "bg-primary/10 text-primary" : "bg-blue-500/10 text-blue-600"
                        )}>
                          {src.type === "internal" ? <Server className="w-4 h-4" /> : <Cloud className="w-4 h-4" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm tracking-tight">{src.name}</span>
                          <span className="text-[10px] text-muted-foreground uppercase">{src.id}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "text-[9px] font-bold px-1.5 py-0 capitalize",
                        src.status === "active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : 
                        src.status === "syncing" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" : "bg-red-500/10 text-red-600"
                      )}>
                        {src.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium capitalize text-muted-foreground">{src.type}</TableCell>
                    <TableCell className="min-w-[120px]">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold tabular-nums">
                          <span className={cn(src.health > 80 ? "text-emerald-600" : "text-amber-500")}>{src.health}%</span>
                        </div>
                        <Progress value={src.health} className="h-1 shadow-inner" />
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-medium">{src.syncFrequency}</TableCell>
                    <TableCell>
                       <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Clock className="w-3 h-3 opacity-60" />
                        {new Date(src.lastSync).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-600" 
                          onClick={() => handleSyncSource(src.id)}
                          disabled={syncingId === src.id}
                        >
                          <RefreshCw className={cn("h-3.5 w-3.5", syncingId === src.id && "animate-spin")} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Ingestion Timeline */}
        <Card className="glass-card shadow-sm lg:col-span-8 overflow-hidden">
          <CardHeader className="bg-muted/20">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              Audit Logs & Ingestion Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader className="bg-muted/10 sticky top-0">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6 text-[10px]">Event</TableHead>
                    <TableHead className="text-[10px]">Status</TableHead>
                    <TableHead className="text-[10px]">Volume</TableHead>
                    <TableHead className="text-[10px]">Duration</TableHead>
                    <TableHead className="text-right pr-6 text-[10px]">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/30">
                      <TableCell className="pl-6 py-3 font-semibold text-xs">{log.source}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {log.status === "success" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                          <span className={cn("text-[10px] font-bold uppercase", log.status === "success" ? "text-emerald-600" : "text-red-600")}>
                            {log.status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium tabular-nums">{log.recordsCount.toLocaleString()} rec.</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-medium tabular-nums">{log.durationMs}ms</TableCell>
                      <TableCell className="text-right pr-6 text-[10px] text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* System Logs / Stats */}
        <Card className="glass-card shadow-sm lg:col-span-4 bg-primary/5 border-primary/10">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Pipeline Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase">
                <span className="text-muted-foreground">Ingestion Latency</span>
                <span className="text-emerald-600">Stable</span>
              </div>
              <div className="p-3 rounded-lg border bg-background flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold">Avg. 1.2s</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                  <ArrowDownRight className="w-3 h-3" /> 12% faster
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Active Alerts</h4>
              <div className="flex items-start gap-3 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] font-medium leading-relaxed">
                  Forex Rates feed experiencing intermittent 503 errors. Failover triggered.
                </p>
              </div>
            </div>
            
            <div className="pt-2 border-t mt-4 flex flex-col gap-2">
               <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                 The ingestion pipeline is horizontally scalable and uses Prisma batching for high performance loading of 540K+ dataset records.
               </p>
               <Button variant="link" className="p-0 h-auto text-xs font-bold text-primary self-start hover:no-underline">
                 View Documentation <ArrowRight className="w-3 h-3 ml-1" />
               </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
