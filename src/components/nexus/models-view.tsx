"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Cell,
  Legend,
} from "recharts";
import {
  Brain,
  Cpu,
  History,
  Activity,
  Zap,
  Play,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Search,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Settings2,
  Calendar,
  Clock,
  Terminal,
  Layers,
  Database,
  ArrowRight,
  MonitorCheck,
  Server,
  CloudUpload,
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
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ────────────────────────────────────────────────────────────────────

interface FeatureImportance {
  feature: string;
  importance: number;
}

interface TrainingPoint {
  epoch: number;
  loss: number;
  val_loss: number;
}

interface MLOpsMetrics {
  accuracy: number;
  mape?: number;
  rmse?: number;
  r2Score?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  lastTrainingTime: string;
  trainingRows: number;
  driftStatus: "stable" | "monitoring" | "critical";
  driftScore: number;
  featureImportance: FeatureImportance[];
  trainingHistory?: TrainingPoint[];
  actions?: { trigger: string; outcome: string }[];
}

interface ModelVersion {
  id: string;
  version: string;
  status: "active" | "training" | "archived" | "failed";
  accuracy: number;
  trainedAt: string;
}

interface ModelRegistryEntry {
  id: string;
  name: string;
  type: string;
  description: string;
  status: "active" | "training" | "idle";
  lastTrained: string;
  mlOps: MLOpsMetrics;
  versions: ModelVersion[];
}

// ── Components ───────────────────────────────────────────────────────────────

function StatCard({ title, value, subValue, trend, icon: Icon, color }: any) {
  return (
    <Card className="glass-card border-none shadow-xl bg-card/40 overflow-hidden group">
      <div className={cn("h-1 w-full opacity-60", color)} />
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className={cn("p-2 rounded-xl bg-white/5 group-hover:scale-110 transition-transform", color.replace('bg-', 'text-'))}>
            <Icon className="w-4 h-4" />
          </div>
          {trend && (
            <Badge variant="outline" className="text-[10px] font-bold border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
              {trend}
            </Badge>
          )}
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70 mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <h4 className="text-2xl font-black tracking-tight tabular-nums">{value}</h4>
          {subValue && <span className="text-xs font-semibold text-muted-foreground opacity-50">{subValue}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function PipelineStage({ name, status, duration, isActive }: any) {
  const iconMap: any = {
    completed: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
    in_progress: <RotateCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />,
    pending: <Clock className="w-3.5 h-3.5 text-muted-foreground" />,
  };

  return (
    <div className={cn(
      "flex items-center gap-4 p-3 rounded-2xl border transition-all duration-300",
      isActive ? "bg-primary/5 border-primary/20 scale-[1.02] shadow-lg" : "bg-muted/20 border-transparent opacity-60"
    )}>
      <div className={cn(
        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
        isActive ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground"
      )}>
        {status === "completed" ? <CheckCircle2 className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold truncate">{name}</p>
        <p className="text-[10px] text-muted-foreground font-medium">{duration || "Queued"}</p>
      </div>
      {iconMap[status]}
    </div>
  );
}

// ── Main View ────────────────────────────────────────────────────────────────

export default function ModelsView() {
  const [models, setModels] = useState<ModelRegistryEntry[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelRegistryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRetraining, setIsRetraining] = useState(false);
  const [activeTab, setActiveTab] = useState("performance");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/models");
      const data = await r.json();
      setModels(data);
      if (!selectedModel && data.length > 0) setSelectedModel(data[0]);
    } catch (e) {
      toast.error("ML Registry Offline");
    } finally {
      setLoading(false);
    }
  }, [selectedModel]);

  useEffect(() => {
    fetchData();
  }, []);

  const handleRetrain = async () => {
    if (!selectedModel) return;
    setIsRetraining(true);
    toast.info(`Retraining initialized for ${selectedModel.id}`, {
      description: "Pipeline artifacts generation in progress...",
    });
    
    setTimeout(() => {
      setIsRetraining(false);
      toast.success("Model Weights Saved", {
        description: "New artifact version uploaded to registry.",
      });
    }, 5000);
  };

  const handlePromote = (version: string) => {
    toast.info(`Promoting artifact v${version}`, {
      description: "Initializing canary deployment for selected version...",
    });
    
    setTimeout(() => {
      toast.success("Artifact Promoted", {
        description: `Version ${version} is now active in production environment.`,
      });
    }, 2000);
  };

  if (loading) return <div className="p-8"><Skeleton className="h-full rounded-3xl" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Operational Logic Manager
          </h1>
          <p className="text-sm text-muted-foreground font-medium">Manage automated logic blocks and verified policy outputs.</p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="h-10 px-4 rounded-xl border-white/5 bg-neutral-900 text-emerald-500 font-bold hidden sm:flex items-center gap-2">
            <MonitorCheck className="w-3.5 h-3.5" />
            Operational: 2/2 Engines Healthy
          </Badge>
          <Button
            variant="outline"
            className="h-12 w-12 rounded-2xl bg-card/40 border-white/5 hover:bg-card/60 transition-colors"
            onClick={fetchData}
          >
            <RotateCw className="h-5 w-5 opacity-60" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── Left Sidebar: Registry List ── */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Diagnostic logic blocks</h3>
          <div className="space-y-3">
            {models.map((model) => (
              <motion.div
                key={model.id}
                whileHover={{ x: 4 }}
                onClick={() => setSelectedModel(model)}
                className={cn(
                  "relative p-5 rounded-[2rem] cursor-pointer transition-all border duration-300 group",
                  selectedModel?.id === model.id 
                    ? "bg-slate-950 border-slate-700 shadow-xl ring-1 ring-slate-800 scale-[1.02]" 
                    : "bg-card/30 border-white/5 hover:bg-card/50"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-inner",
                    selectedModel?.id === model.id ? "bg-slate-900 text-white border border-slate-800" : "bg-primary/10 text-primary"
                  )}>
                    <Brain className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={cn("font-bold text-base tracking-tight", selectedModel?.id === model.id ? "text-white" : "text-foreground")}>
                      {model.name}
                    </h4>
                    <p className={cn("text-[10px] font-bold uppercase tracking-wider mb-2", selectedModel?.id === model.id ? "text-white/60" : "text-muted-foreground")}>
                      {model.type}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className={cn("text-[11px] font-medium tabular-nums", selectedModel?.id === model.id ? "text-white/80" : "text-muted-foreground")}>
                        Verification: <strong>{(model.mlOps.accuracy * 100).toFixed(1)}%</strong>
                      </span>
                      <span className={cn("text-[11px] font-medium tabular-nums", selectedModel?.id === model.id ? "text-white/80" : "text-muted-foreground")}>
                        Variance: <strong className={model.mlOps.driftStatus === 'stable' ? 'text-emerald-400' : 'text-amber-400'}>{model.mlOps.driftScore.toFixed(3)}</strong>
                      </span>
                    </div>
                  </div>
                  {selectedModel?.id === model.id && (
                    <motion.div layoutId="active-indicator" className="absolute right-6 top-1/2 -translate-y-1/2">
                      <ChevronRight className="w-6 h-6 text-white/50" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="p-6 rounded-[2.5rem] bg-neutral-950 border border-white/5 mt-8 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-500 to-transparent opacity-50" />
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Inference Runtime Logs</span>
            </div>
            <div className="space-y-1.5 font-mono text-[10px] text-emerald-500/80 leading-relaxed">
              <p className="flex justify-between"><span>[ENG-42] Health Check</span> <span className="text-emerald-400">PASSED</span></p>
              <p className="flex justify-between"><span>[ENG-43] Event Throughput</span> <span className="text-emerald-400 font-bold">OPTIMAL</span></p>
              <p className="flex justify-between text-amber-500/80"><span>[ENG-44] Policy Sync</span> <span className="font-bold font-mono">WARNING</span></p>
              <div className="h-px bg-white/5 my-2" />
              <p className="flex justify-between opacity-50 text-white italic"><span>PORT: 3015/api/decisions</span> <span>ACTIVE</span></p>
            </div>
          </div>
        </div>

        {/* ── Main Detail Content ── */}
        <div className="lg:col-span-8 space-y-8">
          <AnimatePresence mode="wait">
            {selectedModel && (
              <motion.div
                key={selectedModel.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-8 rounded-[3rem] bg-card/20 border border-white/5 ring-1 ring-white/10 shadow-2xl relative overflow-hidden transition-all hover:bg-card/30">
                   <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Brain className="w-32 h-32" />
                   </div>
                   <div className="space-y-4">
                     <div className="flex flex-wrap items-center gap-3">
                       <Badge className="bg-primary/20 text-primary border-primary/30 h-7 rounded-lg text-[10px] font-black uppercase tracking-widest">
                         Build v2.5.2 (Stable)
                       </Badge>
                       <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 h-7 rounded-lg text-[10px] font-black uppercase tracking-widest">
                         Production Verified
                       </Badge>
                       <Badge variant="outline" className="h-7 rounded-lg text-[10px] border-white/5 font-bold uppercase tabular-nums">
                         Validated: 09/12/2011
                       </Badge>
                     </div>
                     <h2 className="text-4xl font-black tracking-tight">{selectedModel.name}</h2>
                     <p className="text-muted-foreground text-sm max-w-xl font-medium leading-relaxed italic opacity-80">
                        {selectedModel.description}
                     </p>
                   </div>
                   <Button 
                    size="lg"
                    disabled={isRetraining}
                    onClick={handleRetrain}
                    className="h-16 px-10 rounded-[2rem] bg-foreground text-background hover:bg-foreground/90 shadow-2xl transition-all hover:scale-[1.03] active:scale-100 group"
                   >
                     {isRetraining ? (
                       <RotateCw className="w-5 h-5 animate-spin" />
                      ) : (
                       <div className="flex items-center font-bold">
                        <RotateCw className="mr-3 w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                        Trigger Pipeline
                       </div>
                      )}
                   </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard 
                    title="Verification Rate" 
                    value="94.2%" 
                    subValue="Confidence" 
                    icon={ShieldCheck} 
                    color="bg-emerald-500"
                    trend="+1.2%"
                  />
                  <StatCard 
                    title="Variance Delta" 
                    value={selectedModel.mlOps.driftScore.toFixed(3)} 
                    subValue={selectedModel.mlOps.driftStatus.toUpperCase()} 
                    icon={Activity} 
                    color={selectedModel.mlOps.driftStatus === 'stable' ? 'bg-blue-500' : 'bg-amber-500'}
                  />
                  <StatCard 
                    title="Train Samples" 
                    value={(selectedModel.mlOps.trainingRows / 1000).toFixed(0) + "K"} 
                    subValue="Observations" 
                    icon={Database} 
                    color="bg-primary"
                  />
                  <StatCard 
                    title="Inference Time" 
                    value="42ms" 
                    subValue="p99 Latency" 
                    icon={Zap} 
                    color="bg-rose-500"
                  />
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="bg-muted/30 p-1.5 rounded-[1.5rem] w-full md:w-auto h-auto grid grid-cols-2 md:inline-flex mb-6">
                    <TabsTrigger value="performance" className="rounded-xl h-10 px-6 font-bold text-xs gap-2">
                       <BarChart3 className="w-3.5 h-3.5" /> Technical Diagnostics
                    </TabsTrigger>
                    <TabsTrigger value="pipeline" className="rounded-xl h-10 px-6 font-bold text-xs gap-2">
                       <CloudUpload className="w-3.5 h-3.5" /> Pipeline Workflow
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="performance" className="space-y-6 outline-none">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      <Card className="lg:col-span-5 rounded-[2.5rem] bg-card/30 border-white/5 shadow-xl overflow-hidden ring-1 ring-white/5">
                        <CardHeader className="p-8 pb-4">
                          <CardTitle className="text-base font-bold flex items-center gap-2">
                             <Layers className="w-4 h-4 text-primary" /> Feature Contribution
                          </CardTitle>
                          <CardDescription className="text-xs font-medium">SHAP / Feature Attribution Scores</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                              data={selectedModel.mlOps.featureImportance} 
                              layout="vertical" 
                              margin={{ left: -20, right: 20 }}
                            >
                              <XAxis type="number" hide />
                              <YAxis 
                                dataKey="feature" 
                                type="category" 
                                width={120} 
                                axisLine={false} 
                                tickLine={false}
                                tick={{ fill: '#888', fontSize: 10, fontWeight: 700 }}
                              />
                              <Tooltip 
                                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '12px', fontSize: '11px' }}
                              />
                              <Bar 
                                dataKey="importance" 
                                radius={[0, 8, 8, 0]} 
                                barSize={20}
                              >
                                {selectedModel.mlOps.featureImportance.map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={index === 0 ? '#3b82f6' : `rgba(59,130,246, ${0.8 - index * 0.15})`} 
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      <Card className="lg:col-span-7 rounded-[2.5rem] bg-neutral-950 border-white/5 shadow-xl overflow-hidden ring-1 ring-white/10">
                        <CardHeader className="p-8 pb-4">
                          <CardTitle className="text-base font-bold flex items-center gap-2 text-white/90">
                             <TrendingUp className="w-4 h-4 text-emerald-500" /> Statistical Persistence
                          </CardTitle>
                          <CardDescription className="text-xs font-medium text-white/40">Loss convergence across 12 epochs</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart key={selectedModel.id} data={selectedModel.mlOps.trainingHistory || []}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                              <XAxis 
                                dataKey="epoch" 
                                stroke="#555" 
                                fontSize={10} 
                                axisLine={false} 
                                tickLine={false} 
                              />
                              <YAxis 
                                stroke="#555" 
                                fontSize={10} 
                                axisLine={false} 
                                tickLine={false} 
                              />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px' }}
                                itemStyle={{ fontSize: '11px' }}
                              />
                              <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                              <Line 
                                type="monotone" 
                                dataKey="loss" 
                                stroke="#3b82f6" 
                                strokeWidth={3} 
                                dot={false} 
                                name="Training Loss" 
                                animationDuration={1500}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="val_loss" 
                                stroke="#f43f5e" 
                                strokeWidth={3} 
                                strokeDasharray="5 5" 
                                dot={false} 
                                name="Validation Loss" 
                                animationDuration={2000}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="rounded-[2.5rem] bg-card/10 border-white/5 shadow-xl glass-card overflow-hidden">
                      <CardHeader className="p-8 border-b border-white/5">
                        <CardTitle className="text-base font-bold">Artifact Provenance Audit</CardTitle>
                        <CardDescription className="text-xs">Immutable trace of model deployment history</CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader className="bg-muted/20">
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="pl-8 text-[10px] font-black uppercase tracking-widest">Logic Build Artifact</TableHead>
                              <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                              <TableHead className="text-[10px] font-black uppercase tracking-widest">Verification</TableHead>
                              <TableHead className="text-[10px] font-black uppercase tracking-widest">Validation Date</TableHead>
                              <TableHead className="pr-8 text-right text-[10px] font-black uppercase tracking-widest">Controls</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedModel.versions.map((ver) => (
                              <TableRow key={ver.id} className="hover:bg-white/[0.02]">
                                <TableCell className="pl-8 py-5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-white/10 flex items-center justify-center">
                                      <History className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <span className="font-mono text-sm font-bold text-white/80">{ver.version}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={cn(
                                    "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border-none",
                                    ver.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-neutral-800 text-neutral-400'
                                  )}>
                                    {ver.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs font-black tabular-nums">{(ver.accuracy * 100).toFixed(2)}%</TableCell>
                                <TableCell className="text-xs text-muted-foreground font-medium">08/12/2011</TableCell>
                                <TableCell className="pr-8 text-right">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 rounded-lg text-[10px] font-black opacity-40 hover:opacity-100"
                                    onClick={() => handlePromote(ver.version)}
                                   >
                                     PROMOTE <ArrowRight className="w-3 h-3 ml-2" />
                                   </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="pipeline" className="outline-none">
                    <Card className="rounded-[3rem] bg-neutral-950 border-white/5 ring-1 ring-white/10 shadow-2xl p-10">
                      <div className="flex flex-col gap-10">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h3 className="text-xl font-bold text-white">Full-Cycle Retraining Pipeline</h3>
                            <p className="text-xs text-white/40 font-medium">Automated CI/CD workflow for model artifact generation</p>
                          </div>
                          <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold px-4 py-2 rounded-xl">
                            Healthy System
                          </Badge>
                        </div>

                        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 py-10">
                          <div className="absolute left-1/2 md:left-0 top-0 md:top-1/2 w-0.5 md:w-full h-full md:h-1 bg-white/5 -translate-x-1/2 md:-translate-y-1/2" />
                          {[
                            { name: "Raw Ingestion", status: "completed", duration: "12s", icon: Database },
                            { name: "ETL / Cleanse", status: "completed", duration: "45s", icon: Settings2 },
                            { name: "Hyper-Tune", status: "completed", duration: "24m", icon: Cpu },
                            { name: "Validation", status: "completed", duration: "5m", icon: ShieldCheck },
                            { name: "Deploy vReg", status: "completed", duration: "2s", icon: Server },
                          ].map((stage, i) => (
                            <div key={`stage-${stage.name}`} className="relative z-10 flex flex-col items-center gap-4 group">
                               <div className={cn(
                                 "w-16 h-16 rounded-[1.5rem] flex items-center justify-center border-2 transition-all duration-500 shadow-2xl",
                                 stage.status === 'completed' ? "bg-emerald-500 border-emerald-400 text-white" : 
                                 stage.status === 'in_progress' ? "bg-blue-600 border-blue-400 text-white animate-pulse" : 
                                 "bg-neutral-900 border-white/10 text-white/20"
                               )}>
                                 <stage.icon className="w-7 h-7" />
                               </div>
                               <div className="text-center">
                                 <p className="text-[10px] font-black uppercase tracking-widest text-white/90 mb-0.5">{stage.name}</p>
                                 <p className="text-[10px] font-medium text-white/30">{stage.status.replace('_', ' ')}</p>
                               </div>
                            </div>
                          ))}
                        </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                            <div className="p-8 rounded-[2rem] bg-white/5 border border-white/5 flex flex-col gap-4">
                               <h4 className="text-xs font-black uppercase tracking-widest text-primary">Automated Policy Execution</h4>
                               <div className="space-y-3">
                                 <p className="text-xs font-medium flex justify-between gap-4">
                                   <span className="text-white/40 italic">Revenue &lt; -10%</span> 
                                   <span className="text-white text-right font-bold uppercase tracking-tighter">Auto-adjust B2C pricing</span>
                                 </p>
                                 <p className="text-xs font-medium flex justify-between gap-4">
                                   <span className="text-white/40 italic">Growth &gt; 20%</span> 
                                   <span className="text-white text-right font-bold uppercase tracking-tighter">Queue Inventory Procurement</span>
                                 </p>
                               </div>
                            </div>
                            <div className="p-8 rounded-[2rem] bg-white/5 border border-white/5 flex flex-col gap-4">
                               <h4 className="text-xs font-black uppercase tracking-widest text-emerald-500">Pipeline Triggers</h4>
                               <div className="space-y-3">
                                 <p className="text-sm font-medium flex justify-between"><span>Ingestion Layer</span> <span className="text-white/60">Redis Event Queue</span></p>
                                 <p className="text-sm font-medium flex justify-between"><span>Sync Priority</span> <span className="text-white/60">High (Queue &gt; DB)</span></p>
                                 <p className="text-sm font-medium flex justify-between"><span>Manual Trigger</span> <span className="text-white/60">Admin Confirmed</span></p>
                               </div>
                            </div>
                         </div>
                      </div>
                    </Card>
                  </TabsContent>
                </Tabs>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
