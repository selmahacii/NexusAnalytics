"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  Brain,
  Send,
  Bot,
  User,
  Sparkles,
  Command,
  Loader2,
  TrendingUp,
  Target,
  BarChart3,
  Search,
  MessageSquare,
  ShieldCheck,
  Zap,
  RotateCw,
  Clock,
  ExternalLink,
  ChevronRight,
  Plus,
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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  metadata?: {
    type: "kpi" | "chart" | "insight" | "recommendation";
    value?: string;
    label?: string;
    gain?: number;
  };
}

// ── Initial Suggestions ──────────────────────────────────────────────────────

const SUGGESTIONS = [
  { icon: TrendingUp, label: "Rule AUD-12: Execute Distribution Sweep", color: "text-slate-500" },
  { icon: ShieldCheck, label: "Rule INV-04: Enforce Stock Policy", color: "text-blue-500" },
  { icon: Clock, label: "Rule FIN-09: Variance Audit Delta", color: "text-amber-600" },
  { icon: MessageSquare, label: "Generate RDM Performance Ledger", color: "text-emerald-600" },
];

// ── Main Component ───────────────────────────────────────────────────────────

export default function AiAssistantView() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Diagnostic Engine Online. I have indexed the UCI database (541,909 records) and synchronized live FX rates. Sales velocity for core categories shows a 4.2% seasonal deviation in the UK sector. How would you like to proceed with the tactical analysis?",
      createdAt: "2011-12-09T08:00:00Z",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async (text: string = input) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      createdAt: "2011-12-09T08:01:00Z",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "I processed your request, but I couldn't generate a specific response. Please try again with a more detailed query.",
        createdAt: "2011-12-09T08:01:05Z",
        metadata: data.metadata,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      toast.error("Assistant error", { description: "Failed to communicate with AI engine." });
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I am having trouble connecting to the analytics engine right now. Please check if the server is running correctly.",
        createdAt: "2011-12-09T08:01:05Z",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-4">
        <div className="space-y-1.5 line-height-none">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60">Diagnostic Engine Synchronized</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground leading-tight">AI Assistant</h1>
          <p className="text-sm text-muted-foreground font-medium italic opacity-70">Directly query tactical business metrics using natural language.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="rounded-xl gap-2 h-11 bg-card/40 border-border/40 shadow-sm text-[10px] font-bold uppercase tracking-widest px-6" onClick={() => setMessages([messages[0]])}>
            <RotateCw className="w-3.5 h-3.5 opacity-50" /> Reset Session
          </Button>
          <div className="hidden sm:flex items-center gap-2.5 bg-slate-500/10 px-4 py-2.5 rounded-xl border border-border/20 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-slate-500" />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">Nexus RDM-L Stable</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Chat Interface */}
        <div className="flex-1 flex flex-col bg-card/40 backdrop-blur-md rounded-2xl border border-border shadow-2xl overflow-hidden animate-slide-up stagger-1">
          {/* Main Chat Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 natural-scrollbar"
          >
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={cn(
                  "flex items-start gap-5",
                  message.role === "assistant" ? "" : "flex-row-reverse"
                )}
              >
                <div className={cn(
                  "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ring-1 ring-border/20",
                  message.role === "assistant" ? "bg-slate-800 text-white" : "bg-white dark:bg-slate-900 text-foreground border border-border/40"
                )}>
                  {message.role === "assistant" ? <Bot className="w-6 h-6" /> : <User className="w-6 h-6" />}
                </div>
                
                <div className={cn(
                  "flex flex-col gap-2.5 max-w-[80%]",
                  message.role === "user" ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "px-6 py-5 rounded-[1.5rem] text-sm leading-relaxed shadow-sm",
                    message.role === "assistant" 
                      ? "bg-card/70 border border-border/20 backdrop-blur-md text-foreground" 
                      : "bg-slate-800 text-white shadow-lg"
                  )}>
                    {message.content}

                    {message.metadata && (
                      <div className="mt-6 pt-6 border-t border-border/10 grid grid-cols-1 gap-4">
                        <div className="p-4 bg-muted/30 rounded-2xl flex items-center justify-between gap-6 border border-border/5">
                          <div className="min-w-0">
                            <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-[0.3em] mb-1.5 opacity-60">{message.metadata.label}</p>
                            <p className="text-2xl font-bold tracking-tighter text-foreground">{message.metadata.value}</p>
                          </div>
                          {message.metadata.gain && (
                            <Badge className={cn(
                              "text-[10px] font-bold h-8 rounded-xl px-4",
                              message.metadata.gain >= 0 ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                            )}>
                              {message.metadata.gain >= 0 ? "+" : ""}{message.metadata.gain}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest px-1">
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Diagnostic Sync
                  </span>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex items-start gap-4 animate-pulse">
                <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <div className="p-4 rounded-2xl bg-muted/40 text-[11px] font-mono text-muted-foreground border border-dashed border-border/80">
                    <span className="text-primary font-bold">{">"} NEXUS_QUERY_ENGINE:</span> Executing vector search on transactional history...
                    <br />
                    <span className="text-emerald-500 font-bold">{">"} STATS_EXTRACTOR:</span> Correlating list price fluctuations with seasonal demand...
                    <br />
                    <span className="animate-pulse">_</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic px-1">Analyzing cross-module dependencies and external market feeds...</p>
                </div>
              </div>
            )}
            
            {/* Initial suggestions if only system message */}
            {messages.length === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12 animate-fade-in stagger-3">
                {SUGGESTIONS.map((s, i) => (
                  <Button 
                    key={i}
                    variant="outline" 
                    onClick={() => handleSendMessage(s.label)}
                    className="rounded-[1.5rem] h-auto py-5 px-6 text-[11px] font-bold uppercase tracking-[0.2em] border-border/30 bg-card/60 backdrop-blur-md hover:bg-muted/40 text-left whitespace-normal justify-start shadow-sm flex items-center gap-4 transition-all hover:scale-[1.02] group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-500/5 flex items-center justify-center shrink-0 group-hover:bg-slate-500/10 transition-colors">
                      <s.icon className={cn("w-4 h-4", s.color)} />
                    </div>
                    <span>{s.label}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-muted/40 border-t border-border/60">
            <div className="flex gap-2 p-2 bg-card rounded-2xl border border-border shadow-inner ring-1 ring-black/5">
              <Input
                placeholder="Ask Nexus assistant anything about your data..."
                className="flex-1 bg-transparent border-none focus-visible:ring-0 text-sm h-11"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <Button 
                onClick={() => handleSendMessage()}
                disabled={loading || !input.trim()}
                className={cn(
                  "rounded-xl h-11 px-4 shadow-lg transition-all duration-300",
                  !input.trim() ? "opacity-50" : "scale-105"
                )}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex items-center justify-center gap-4 mt-2">
              <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                <Command className="w-3 h-3" /> Type &apos;/&apos; for commands
              </span>
              <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" /> Real-time mode active
              </span>
            </div>
          </div>
        </div>

        {/* Info Sidebar (Desktop only) */}
        <div className="hidden lg:flex flex-col gap-6 w-[320px] animate-slide-in-left">
          <Card className="rounded-[1.5rem] bg-card/60 backdrop-blur-md border-border/40 shadow-xl overflow-hidden flex flex-col">
            <CardHeader className="p-8 border-b border-border/5">
              <CardTitle className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground/60 flex items-center gap-3">
                <Brain className="w-5 h-5 text-slate-500" />
                Intelligence Registry
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 flex-1 flex flex-col gap-10">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-500/10 flex items-center justify-center text-slate-500 border border-border/20 shadow-inner">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-none tracking-tight">Diagnostic Agent</h3>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-2 opacity-60 italic">"Operational Loop Standard"</p>
                  </div>
                </div>
                <p className="text-[13px] text-muted-foreground leading-relaxed font-medium italic opacity-80 border-l-2 border-border/20 pl-4 py-1">
                  Synchronized distribution ledger. 842 dirty records scrubbed via Zod Schema Validation. Rules AUD-12 and INV-04 active.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-[0.3em]">Operational Surface</h4>
                <ul className="space-y-4">
                  {[
                    "Transactional Pattern Analysis",
                    "Predictive Inventory Insights",
                    "Customer Sentiment Mapping",
                    "Market Correlation Analysis",
                  ].map(cap => (
                    <li key={cap} className="flex items-center gap-3 text-xs font-bold text-foreground/70 group cursor-default">
                      <div className="w-2 h-2 rounded-full border border-primary/20 bg-primary/10 group-hover:scale-125 transition-transform" />
                      {cap}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto pt-8 border-t border-border/5">
                <div className="p-6 rounded-[1.5rem] bg-slate-800 text-white shadow-xl flex flex-col gap-4 group">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-bold uppercase tracking-[0.4em] opacity-40">Director Registry</p>
                    <Plus className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-[12px] font-medium leading-relaxed opacity-80">
                    "AI insights are grounded in 2011 UK historical ledger. Seasonal variances refer to UCI baseline standards only."
                  </p>
                  <Button variant="secondary" size="sm" className="h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest gap-2 mt-2 bg-white/10 hover:bg-white/20 border-white/5 text-white active:scale-95 transition-all">
                    View Audit Rails <ExternalLink className="w-3.5 h-3.5 opacity-40" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
