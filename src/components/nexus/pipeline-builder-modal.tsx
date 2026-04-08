"use client";

import { useState, useMemo } from "react";
import {
  X,
  Database,
  Cloud,
  FileText,
  Server,
  ChevronRight,
  ChevronLeft,
  Check,
  Settings2,
  Table,
  ShieldCheck,
  Bell,
  Activity,
  Zap,
  Play,
  RotateCw,
  Search,
  Globe,
  Plus,
  ArrowRight,
  Info,
  Loader2,
  Lock,
  Clock,
  CheckCircle2,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "../ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

type Step = "source" | "configuration" | "transform" | "schedule" | "review";

interface SourceType {
  id: string;
  name: string;
  category: "internal" | "external" | "cloud";
  icon: any;
  description: string;
  complexity: "low" | "medium" | "high";
}

// ── Constants ───────────────────────────────────────────────────────────────

const SOURCE_TYPES: SourceType[] = [
  {
    id: "uci_online",
    name: "UCI Online Retail",
    category: "internal",
    icon: Database,
    description: "Dataset with 540K+ transactions for business intelligence.",
    complexity: "low",
  },
  {
    id: "postgres",
    name: "Remote PostgreSQL",
    category: "external",
    icon: Server,
    description: "Enterprise database connection via JDBC/Prisma.",
    complexity: "medium",
  },
  {
    id: "rest_api",
    name: "REST / JSON API",
    category: "external",
    icon: Globe,
    description: "Generic HTTP endpoint for real-time market data.",
    complexity: "medium",
  },
  {
    id: "aws_s3",
    name: "AWS S3 Bucket",
    category: "cloud",
    icon: Cloud,
    description: "Cloud object storage for parquet or CSV files.",
    complexity: "high",
  },
  {
    id: "excel_csv",
    name: "Excel / CSV Upload",
    category: "internal",
    icon: FileText,
    description: "Manual file ingestion for ad-hoc analysis.",
    complexity: "low",
  },
];

const STEPS: { label: string; value: Step }[] = [
  { label: "Source", value: "source" },
  { label: "Config", value: "configuration" },
  { label: "Transform", value: "transform" },
  { label: "Schedule", value: "schedule" },
  { label: "Review", value: "review" },
];

export function PipelineBuilderModal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>("source");
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  
  // Step State
  const [config, setConfig] = useState({
    name: "",
    url: "",
    credentials: "saved_nexus_vault_01",
    autoSchema: true,
  });

  const [transforms, setTransforms] = useState({
    dedupe: true,
    handleNulls: "fill_mean",
    casting: true,
    securityScan: true,
  });

  const [schedule, setSchedule] = useState({
    frequency: "hourly",
    retryPolicy: "exponential",
    alerts: true,
  });

  const stepIndex = STEPS.findIndex(s => s.value === currentStep);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const handleNext = () => {
    if (stepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[stepIndex + 1].value);
    } else {
      handleDeploy();
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setCurrentStep(STEPS[stepIndex - 1].value);
    }
  };

  const handleDeploy = () => {
    setIsDeploying(true);
    setTimeout(() => {
      setIsDeploying(false);
      setOpen(false);
      setCurrentStep("source");
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-card/60 backdrop-blur-2xl border border-white/5 shadow-2xl rounded-3xl gap-0">
        <div className="flex h-[600px]">
          {/* Sidebar Navigation */}
          <div className="w-1/4 bg-black/5 border-r border-white/5 p-6 space-y-8 flex flex-col">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                <Settings2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground opacity-60 tracking-wider">Engine</p>
                <p className="text-xs font-bold leading-tight">Pipeline Builder</p>
              </div>
            </div>

            <div className="space-y-4">
              {STEPS.map((step, i) => (
                <div 
                  key={step.value}
                  className={cn(
                    "flex items-center gap-3 transition-colors duration-300",
                    stepIndex >= i ? "text-primary" : "text-muted-foreground/40"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold",
                    stepIndex > i ? "bg-primary border-primary text-primary-foreground" : 
                    stepIndex === i ? "border-primary text-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]" : "border-muted-foreground/20"
                  )}>
                    {stepIndex > i ? <Check className="w-3 h-3" /> : i + 1}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">{step.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto space-y-4">
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold text-primary uppercase">Integration Status</p>
                  <Activity className="w-3 h-3 text-primary animate-pulse" />
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Builder active. Validation rules running in sandbox mode.
                </p>
              </div>
            </div>
          </div>

          /* Main Content */
          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-8 pb-0 flex-1 overflow-y-auto natural-scrollbar">
              {/* Header */}
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">
                    {STEPS[stepIndex].label} Configuration
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">Configure your enterprise data ingestion pipeline.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground opacity-60 tracking-widest">Progress</p>
                    <p className="text-sm font-bold tabular-nums text-primary">{Math.round(progress)}%</p>
                  </div>
                  <Progress value={progress} className="w-24 h-1.5" />
                </div>
              </div>

              {/* Step 1: Source */}
              {currentStep === "source" && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {SOURCE_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedSource(type.id)}
                      className={cn(
                        "p-5 rounded-2xl border text-left transition-all duration-300 group hover:scale-[1.02]",
                        selectedSource === type.id 
                          ? "bg-primary/5 border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]" 
                          : "bg-card border-border/60 hover:border-primary/40 hover:shadow-md"
                      )}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={cn(
                          "p-3 rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-110",
                          selectedSource === type.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                          <type.icon className="w-5 h-5" />
                        </div>
                        <Badge variant="outline" className="text-[9px] uppercase tracking-tighter opacity-60">
                          {type.category}
                        </Badge>
                      </div>
                      <h4 className="font-bold text-sm tracking-tight group-hover:text-primary transition-colors">{type.name}</h4>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{type.description}</p>
                      
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Complexity: {type.complexity}</span>
                        </div>
                        {selectedSource === type.id && (
                          <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center animate-scale-in">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 2: Configuration */}
              {currentStep === "configuration" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid gap-6 p-6 bg-primary/5 rounded-2xl border border-primary/10">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pipeline Name</Label>
                      <Input 
                        placeholder="e.g. daily-retail-sync-01" 
                        className="rounded-xl h-11 border-primary/20 focus-visible:ring-primary/30"
                        value={config.name}
                        onChange={e => setConfig({...config, name: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                       <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Source URL / Endpoint</Label>
                       <div className="relative">
                         <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                         <Input 
                           placeholder="https://api.external-feed.com/v1" 
                           className="rounded-xl h-11 pl-10 border-primary/20 focus-visible:ring-primary/30" 
                           value={config.url}
                           onChange={e => setConfig({...config, url: e.target.value})}
                         />
                       </div>
                    </div>

                    <div className="space-y-4 pt-2">
                       <Button 
                         variant="secondary" 
                         size="sm" 
                         className="rounded-xl h-10 w-full gap-2 border border-primary/10 shadow-sm"
                         onClick={(e) => {
                           e.preventDefault();
                           // @ts-ignore
                           toast.promise(new Promise(r => setTimeout(r, 1500)), {
                             loading: "Testing remote connectivity...",
                             success: "Connection established (TLS 1.3)",
                             error: "Target timeout. Check VPC settings."
                           });
                         }}
                       >
                         <Zap className="w-3.5 h-3.5 text-amber-500" /> Test Connection
                       </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Auth Credentials</Label>
                        <Select value={config.credentials}>
                          <SelectTrigger className="rounded-xl h-11 border-primary/20">
                            <SelectValue placeholder="Select secret" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="saved_nexus_vault_01">Nexus Vault (Stored)</SelectItem>
                            <SelectItem value="manual">Enter Manually</SelectItem>
                            <SelectItem value="no_auth">No Authentication</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex flex-col justify-end">
                        <div className="flex items-center space-x-3 mb-2 px-2">
                          <Switch 
                            checked={config.autoSchema} 
                            onCheckedChange={v => setConfig({...config, autoSchema: v})} 
                          />
                          <div className="space-y-0.5">
                            <Label className="text-xs font-bold">Auto-Schema Detection</Label>
                            <p className="text-[10px] text-muted-foreground">Nexus will infer data types.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                    <Info className="w-4 h-4 text-amber-500 shrink-0" />
                    <p className="text-[11px] font-medium leading-relaxed">
                      SSL/TLS encryption is enforced for all external connections. Data will be scanned for SQL injection patterns.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Transform */}
              {currentStep === "transform" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: "dedupe", icon: Plus, title: "Deduplication", desc: "Remove identical transaction records.", checked: transforms.dedupe },
                      { id: "casting", icon: Zap, title: "Type Optimization", desc: "Compress integers and clean dates.", checked: transforms.casting },
                      { id: "securityScan", icon: Lock, title: "Security PII Filter", desc: "Anonymize sensitive customer IDs.", checked: transforms.securityScan },
                      { id: "validation", icon: ShieldCheck, title: "Data Quality Scan", desc: "Flag records outside range.", checked: true },
                    ].map(t => (
                      <div key={t.id} className="p-4 rounded-xl border bg-card flex items-start gap-4 hover:border-primary/40 transition-colors">
                        <div className="p-2 rounded-lg bg-muted border shrink-0">
                          <t.icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold">{t.title}</h4>
                            <Switch checked={t.checked} />
                          </div>
                          <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Missing Data Handling</Label>
                    <Tabs defaultValue={transforms.handleNulls} onValueChange={v => setTransforms({...transforms, handleNulls: v})}>
                      <TabsList className="grid grid-cols-4 w-full h-10 rounded-xl">
                        <TabsTrigger value="ignore" className="text-[10px] font-bold">Ignore</TabsTrigger>
                        <TabsTrigger value="fill_mean" className="text-[10px] font-bold">Fill Mean</TabsTrigger>
                        <TabsTrigger value="fill_zeros" className="text-[10px] font-bold">Fill Zeros</TabsTrigger>
                        <TabsTrigger value="exclude" className="text-[10px] font-bold text-rose-500">Exclude Rows</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <p className="text-[10px] text-muted-foreground italic pl-1">
                      Recommended: <strong>Fill Mean</strong> for numerical UCI retail metrics to maintain trend consistency.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4: Schedule */}
              {currentStep === "schedule" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex gap-8">
                    <div className="flex-1 space-y-6">
                      <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sync Frequency</Label>
                        <Select value={schedule.frequency}>
                          <SelectTrigger className="rounded-xl h-11 border-primary/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="real_time">Real-time Ingestion</SelectItem>
                            <SelectItem value="hourly">Every Hour</SelectItem>
                            <SelectItem value="daily">Once a Day (Midnight)</SelectItem>
                            <SelectItem value="weekly">Every Sunday</SelectItem>
                            <SelectItem value="manual">Manual Trigger Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Retry Policy</Label>
                        <Select value={schedule.retryPolicy}>
                          <SelectTrigger className="rounded-xl h-11 border-primary/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="exponential">Exponential Backoff (3 retries)</SelectItem>
                            <SelectItem value="fixed">Fixed Interval (5s)</SelectItem>
                            <SelectItem value="none">Fail Immediately</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="w-1/3 p-5 rounded-2xl bg-card border flex flex-col items-center justify-center text-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Bell className="w-6 h-6 text-primary animate-bounce-soft" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold">Notifications</h4>
                        <div className="flex items-center gap-3 mt-4">
                          <Switch 
                            checked={schedule.alerts} 
                            onCheckedChange={v => setSchedule({...schedule, alerts: v})} 
                          />
                          <span className="text-[10px] font-bold text-muted-foreground">Notify on Failure</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/40 rounded-xl border border-dashed border-border/80 flex items-center gap-4">
                    <Clock className="w-8 h-8 text-muted-foreground opacity-20" />
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold">Calculated Cron Expression</p>
                      <code className="text-[10px] bg-background px-2 py-1 rounded border text-primary">0 0 * * *</code>
                      <p className="text-[10px] text-muted-foreground">Next run: Tomorrow at 00:00:00 UTC</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Review */}
              {currentStep === "review" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="p-6 rounded-2xl bg-primary text-primary-foreground shadow-2xl relative overflow-hidden group">
                     <div className="absolute right-[-20px] top-[-20px] w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors" />
                     <div className="relative z-10 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/20">
                              <Play className="w-5 h-5 fill-current" />
                            </div>
                            <div>
                               <h3 className="text-lg font-bold tracking-tight">{config.name || "Untitled Pipeline"}</h3>
                               <p className="text-white/60 text-xs font-medium uppercase tracking-widest">{selectedSource}</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-white/20 text-white border-none text-[10px] font-bold">READY TO DEPLOY</Badge>
                        </div>

                        <Separator className="bg-white/20" />

                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-2">
                             <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Engine Directives</p>
                             <ul className="space-y-1.5">
                               {transforms.dedupe && <li className="flex items-center gap-2 text-[11px] font-medium"><Check className="w-3 h-3" /> Deduplication Active</li>}
                               {transforms.casting && <li className="flex items-center gap-2 text-[11px] font-medium"><Check className="w-3 h-3" /> Optimization Enabled</li>}
                               <li className="flex items-center gap-2 text-[11px] font-medium"><Check className="w-3 h-3" /> TLS Ingestion</li>
                             </ul>
                           </div>
                           <div className="space-y-2">
                             <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Ingestion Frequency</p>
                             <p className="text-xl font-bold tracking-tight capitalize">{schedule.frequency.replace("_", " ")}</p>
                             <p className="text-[10px] font-medium opacity-80">Failover: {schedule.retryPolicy}</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Storage Target</p>
                      <p className="text-xs font-bold">PostgreSQL / InfluxDB</p>
                    </div>
                    <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Estimated Load</p>
                      <p className="text-xs font-bold">Low impact</p>
                    </div>
                    <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-1 text-emerald-600">
                      <p className="text-[10px] font-bold uppercase">Pipeline Health</p>
                      <p className="text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3" /> Validated
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-8 pt-4 border-t border-white/5 bg-card/40 flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={handleBack}
                disabled={stepIndex === 0 || isDeploying}
                className="rounded-xl h-11 px-6 text-xs font-bold gap-2 uppercase tracking-widest"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
              
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setOpen(false)}
                  disabled={isDeploying}
                  className="rounded-xl h-11 px-6 text-xs font-bold uppercase tracking-widest"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleNext}
                  disabled={(currentStep === "source" && !selectedSource) || (currentStep === "configuration" && !config.name) || isDeploying}
                  className="rounded-xl h-11 px-8 text-xs font-bold gap-2 uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isDeploying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Deploying...
                    </>
                  ) : currentStep === "review" ? (
                    <>
                      <Play className="w-3.5 h-3.5" /> Deploy Pipeline
                    </>
                  ) : (
                    <>
                      Next <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
