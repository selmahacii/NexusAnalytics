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
  { icon: TrendingUp, label: "Rule AUD-12: Execute Distribution Sweep (Shift > 15%)", color: "text-slate-600" },
  { icon: ShieldCheck, label: "Rule INV-04: Enforce Stock Policy (Reserve < 5d)", color: "text-slate-600" },
  { icon: Clock, label: "Rule FIN-09: Variance Audit (> €500 Delta)", color: "text-slate-600" },
  { icon: MessageSquare, label: "Generate RDM Performance Validation Report", color: "text-slate-600" },
];

// ── Main Component ───────────────────────────────────────────────────────────

export default function AiAssistantView() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Diagnostic Engine Online. I have indexed the UCI database (541,909 records) and synchronized live FX rates. Sales velocity for core categories shows a 4.2% seasonal deviation in the UK sector. How would you like to proceed with the tactical analysis?",
      createdAt: new Date().toISOString(),
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
      createdAt: new Date().toISOString(),
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
        createdAt: new Date().toISOString(),
        metadata: data.metadata,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      toast.error("Assistant error", { description: "Failed to communicate with AI engine." });
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I am having trouble connecting to the analytics engine right now. Please check if the server is running correctly.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Assistant</h1>
          <p className="text-sm text-muted-foreground">Directly query your business metrics using natural language.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-xl gap-2 h-9 bg-card/50" onClick={() => setMessages([messages[0]])}>
            <RotateCw className="w-3.5 h-3.5" /> Clear History
          </Button>
          <div className="hidden sm:flex items-center gap-1.5 bg-primary/5 px-2.5 py-1.5 rounded-lg border border-primary/10">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-tight">Nexus GPT-4o Active</span>
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
                  "flex items-start gap-4",
                  message.role === "assistant" ? "" : "flex-row-reverse"
                )}
              >
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
                  message.role === "assistant" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {message.role === "assistant" ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                
                <div className={cn(
                  "flex flex-col gap-2 max-w-[85%]",
                  message.role === "user" ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "p-4 rounded-2xl text-sm leading-relaxed",
                    message.role === "assistant" 
                      ? "bg-card border border-border/60 shadow-sm" 
                      : "bg-primary text-primary-foreground shadow-md"
                  )}>
                    {message.content}

                    {message.metadata && (
                      <div className="mt-4 pt-4 border-t border-border/40 grid grid-cols-1 gap-3">
                        <div className="p-3 bg-muted/40 rounded-xl flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{message.metadata.label}</p>
                            <p className="text-xl font-bold tracking-tight">{message.metadata.value}</p>
                          </div>
                          {message.metadata.gain && (
                            <Badge className={cn(
                              "text-[10px] font-bold h-7 rounded-lg",
                              message.metadata.gain >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                            )}>
                              {message.metadata.gain >= 0 ? "+" : ""}{message.metadata.gain}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter px-1">
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 animate-fade-in stagger-3">
                {SUGGESTIONS.map((s, i) => (
                  <Button 
                    key={i}
                    variant="outline" 
                    onClick={() => handleSendMessage(s.label)}
                    className="rounded-xl h-auto py-3 px-4 text-[10px] font-black uppercase tracking-widest border-border/60 bg-card hover:bg-accent/40 text-left whitespace-normal justify-start shadow-sm flex items-center gap-3"
                  >
                    <s.icon className={cn("w-3.5 h-3.5 shrink-0", s.color)} />
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
        <div className="hidden lg:flex flex-col gap-6 w-80 animate-slide-in-left">
          <Card className="glass-card shadow-lg flex-1 border-none flex flex-col">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                Assistant Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base leading-none">Diagnostic Assistant</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">Operational Support Active</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium italic opacity-80">
                  I have synchronized the distribution ledger. 842 dirty records were automatically scrubbed via <b>Zod Schema Validation</b>. 
                  Rules AUD-12 (Shift &gt; 15%) and INV-04 (Reserve &lt; 5d) are currently enforcing ledger limits. 
                  <b>Diagnostic Recovery Loop:</b> Active (Refining AUD-12 thresholds).
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Capabilities</h4>
                <ul className="space-y-2.5">
                  {[
                    "Transactional Pattern Analysis",
                    "Predictive Inventory Insights",
                    "Customer Sentiment Mapping",
                    "Market Correlation Analysis",
                  ].map(cap => (
                    <li key={cap} className="flex items-center gap-2.5 text-xs font-semibold">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {cap}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto pt-6 border-t">
                <div className="p-4 rounded-xl bg-primary text-primary-foreground shadow-lg flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Director Note</p>
                    <Plus className="w-3 h-3 cursor-pointer" />
                  </div>
                  <p className="text-[11px] font-medium leading-relaxed">
                    AI insights are generated based on historical UK data. Seasonal patterns refer to 2010–2011 context.
                  </p>
                  <Button variant="secondary" size="sm" className="h-8 rounded-lg text-[10px] font-bold gap-1 mt-1">
                    Read Guidelines <ExternalLink className="w-3 h-3" />
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
