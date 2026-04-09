"use client";

import React, { useEffect, useState, useSyncExternalStore, useCallback } from "react";
import {
  Target,
  LayoutDashboard,
  TrendingUp,
  Database,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Menu,
  Loader2,
  AlertTriangle,
  X,
  Users,
  Factory,
  Activity,
  Bell,
  Globe,
  Brain,
  Sparkles,
  Settings2,
  FileText,
} from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useAppStore, type ViewId } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import DashboardView from "@/components/nexus/dashboard-view";
import ForecastView from "@/components/nexus/forecast-view";
import PredictionsView from "@/components/nexus/predictions-view";
import CustomersView from "@/components/nexus/customers-view";
import InventoryView from "@/components/nexus/inventory-view";
import SupplyChainView from "@/components/nexus/supply-chain-view";
import AnomaliesView from "@/components/nexus/anomalies-view";
import MarketView from "@/components/nexus/market-view";
import ModelsView from "@/components/nexus/models-view";
import DataSourcesView from "@/components/nexus/data-sources-view";
import AiAssistantView from "@/components/nexus/ai-assistant-view";
import ReportsView from "@/components/nexus/reports-view";
import SettingsView from "@/components/nexus/settings-view";

// ─── Navigation Items ───────────────────────────────────────────
interface NavItem {
  id: ViewId;
  label: string;
  icon: React.ElementType;
}

const NAV_ANALYTICS: NavItem[] = [
  { id: "dashboard", label: "Operational Telemetry", icon: LayoutDashboard },
  { id: "forecast", label: "Revenue Forecaster", icon: TrendingUp },
  { id: "predictions", label: "Demand Validation", icon: Target },
  { id: "supply-chain", label: "Supply Chain", icon: Factory },
  { id: "anomalies", label: "Pattern Auditor", icon: Activity },
  { id: "reports", label: "Operational Ledger", icon: FileText },
  { id: "market", label: "Sector Intel", icon: Globe },
];

const NAV_MANAGEMENT: NavItem[] = [
  { id: "customers", label: "Customers", icon: Users },
  { id: "inventory", label: "Inventory", icon: Factory },
];

const NAV_ENGINE: NavItem[] = [
  { id: "ai-assistant", label: "Diagnostic Assistant", icon: Sparkles },
  { id: "models", label: "Execution Controller", icon: Brain },
  { id: "data-sources", label: "Data Ingress", icon: Database },
];

const NAV_BOTTOM: NavItem[] = [
  { id: "settings", label: "Settings", icon: Settings2 },
];

// Flatten for easier lookup
const ALL_NAV_ITEMS = [...NAV_ANALYTICS, ...NAV_MANAGEMENT, ...NAV_ENGINE, ...NAV_BOTTOM];

// ─── View Component Map ─────────────────────────────────────────
const VIEW_COMPONENTS: Record<ViewId, React.ComponentType> = {
  dashboard: DashboardView,
  forecast: ForecastView,
  predictions: PredictionsView,
  customers: CustomersView,
  inventory: InventoryView,
  "supply-chain": SupplyChainView,
  anomalies: AnomaliesView,
  market: MarketView,
  models: ModelsView,
  "data-sources": DataSourcesView,
  "ai-assistant": AiAssistantView,
  reports: ReportsView,
  settings: SettingsView,
};

// ─── Seed Check Hook ────────────────────────────────────────────
function useSeedStatus() {
  const [seeded, setSeeded] = useState<boolean | null>(null);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetch("/api/seed?action=status")
      .then((r) => r.json())
      .then((d) => setSeeded(d.seeded))
      .catch(() => setSeeded(false));
  }, []);

  const seed = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/seed?action=ingest", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSeeded(true);
      }
    } catch {
      // Error handled silently
    } finally {
      setSeeding(false);
    }
  };

  return { seeded, seeding, seed };
}

// ─── Nav Item Button ────────────────────────────────────────────
function NavItemButton({ item, collapsed, onClose }: { item: NavItem; collapsed?: boolean; onClose?: () => void }) {
  const { activeView, setActiveView } = useAppStore();
  const Icon = item.icon;
  const isActive = activeView === item.id;

  const handleClick = () => {
    setActiveView(item.id);
    onClose?.();
  };

  const button = (
    <button
      onClick={handleClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ease-out relative",
        "hover:bg-accent/60 active:scale-[0.98]",
        isActive
          ? "bg-accent text-accent-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className={cn(
        "w-[18px] h-[18px] flex-shrink-0 transition-transform duration-200",
        isActive && "scale-110"
      )} />
      {!collapsed && (
        <span className={cn(
          "truncate transition-all duration-200",
          isActive && "font-semibold"
        )}>
          {item.label}
        </span>
      )}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary transition-all duration-300" />
      )}
    </button>
  );

  if (collapsed) {
    return (
      <TooltipProvider key={item.id} delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            {item.label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}

// ─── Desktop Sidebar ─────────────────────────────────────────────
function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card/80 backdrop-blur-sm border-r flex flex-col transition-all duration-300 ease-out hidden md:flex",
        sidebarCollapsed ? "w-[64px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-foreground flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm transition-transform duration-200 hover:scale-105 font-black text-background text-sm">
          RDM
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold tracking-tight">Distribution</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Manager</p>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav aria-label="Navigation principale" className="flex-1 py-4 px-2 space-y-6 overflow-y-auto overflow-x-hidden natural-scrollbar">
        <div className="space-y-1">
          {!sidebarCollapsed && <p className="px-3 text-[10px] font-bold text-muted-foreground/60 tracking-widest uppercase mb-2">Analytics</p>}
          {NAV_ANALYTICS.map((item) => (
            <NavItemButton key={item.id} item={item} collapsed={sidebarCollapsed} />
          ))}
        </div>

        <div className="space-y-1">
          {!sidebarCollapsed && <p className="px-3 text-[10px] font-bold text-muted-foreground/60 tracking-widest uppercase mb-2">Business</p>}
          {NAV_MANAGEMENT.map((item) => (
            <NavItemButton key={item.id} item={item} collapsed={sidebarCollapsed} />
          ))}
        </div>

        <div className="space-y-1">
          {!sidebarCollapsed && <p className="px-3 text-[10px] font-bold text-muted-foreground/60 tracking-widest uppercase mb-2">Engine</p>}
          {NAV_ENGINE.map((item) => (
            <NavItemButton key={item.id} item={item} collapsed={sidebarCollapsed} />
          ))}
        </div>

        <div className="space-y-1 pt-4 border-t border-border/10">
          {NAV_BOTTOM.map((item) => (
            <NavItemButton key={item.id} item={item} collapsed={sidebarCollapsed} />
          ))}
        </div>

        {/* Operational Hub Status (Desktop only) */}
        {!sidebarCollapsed && (
          <div className="mt-auto px-4 pb-4 animate-fade-in">
            <div className="p-3.5 rounded-[1.25rem] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Operational Hub</span>
              </div>
              
              <div className="space-y-2">
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">Dataset Source</p>
                  <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100 italic">UCI Online Retail</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">Active Policy</p>
                  <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tighter">Rule AUD-12 Force</p>
                </div>
                <div className="flex items-center justify-between pt-1 mt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">Compliance</span>
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">PASSED</span>
                </div>
                <p className="text-[8px] text-muted-foreground/60 font-mono text-right mt-0.5">CYCLE: 42ms</p>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Bottom */}
      <div className="border-t p-2 flex-shrink-0">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 active:scale-[0.98]"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 transition-transform duration-200" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 transition-transform duration-200" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

// ─── Mobile Sidebar ─────────────────────────────────────────────
function MobileSidebar({ onClose }: { onClose: () => void }) {
  return (
    <aside className="h-full w-[280px] bg-card border-r flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-foreground flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm font-black text-background text-sm">
            RDM
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Distribution</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Manager</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
        >
          <X className="w-5 h-5" />
          <span className="sr-only">Close menu</span>
        </button>
      </div>

      {/* Nav */}
      <nav aria-label="Navigation mobile" className="flex-1 py-4 px-2 space-y-6 overflow-y-auto natural-scrollbar">
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-muted-foreground/60 tracking-widest uppercase mb-2">Analytics</p>
          {NAV_ANALYTICS.map((item) => (
            <NavItemButton key={item.id} item={item} onClose={onClose} />
          ))}
        </div>
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-muted-foreground/60 tracking-widest uppercase mb-2">Business</p>
          {NAV_MANAGEMENT.map((item) => (
            <NavItemButton key={item.id} item={item} onClose={onClose} />
          ))}
        </div>
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-muted-foreground/60 tracking-widest uppercase mb-2">Engine</p>
          {NAV_ENGINE.map((item) => (
            <NavItemButton key={item.id} item={item} onClose={onClose} />
          ))}
        </div>
        <div className="pt-4 border-t border-border/10">
          {NAV_BOTTOM.map((item) => (
            <NavItemButton key={item.id} item={item} onClose={onClose} />
          ))}
        </div>
      </nav>
    </aside>
  );
}

// ─── Top Header ──────────────────────────────────────────────────
function TopHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const { activeView } = useAppStore();
  const currentNav = ALL_NAV_ITEMS.find((n) => n.id === activeView);
  const { theme, setTheme } = useTheme();

  return (
    <header className="h-16 border-b bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 transition-all duration-300">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden rounded-xl"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
          <span className="sr-only">Menu</span>
        </Button>

        {currentNav && (
          <div className="flex flex-col animate-fade-in -space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-bold sm:block hidden">DISTRIBUTION TELEMETRY</span>
            <div className="flex items-center gap-2.5">
              <currentNav.icon className="w-4 h-4 text-primary sm:block hidden" />
              <h2 className="text-base font-bold tracking-tight">{currentNav.label}</h2>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 sm:gap-3">
        {/* Global Search Bar (Desktop only) */}
        <div className="hidden lg:flex items-center gap-2 bg-accent/40 hover:bg-accent/60 transition-colors border rounded-xl px-3 py-1.5 w-64 group cursor-pointer">
          <Menu className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span className="text-[13px] text-muted-foreground group-hover:text-foreground flex-1">Search...</span>
          <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl relative hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 group"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
          <span className="sr-only">Notifications</span>
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl transition-all duration-200 hover:bg-accent"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0 absolute" />
          <Moon className="h-[18px] w-[18px] rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <div className="w-[1px] h-6 bg-border mx-1 hidden sm:block" />

        {/* User Account Account Dropdown (Simplified for now) */}
        <div className="flex items-center gap-3 pl-1 group cursor-pointer">
          <div className="hidden sm:flex flex-col items-end -space-y-0.5">
            <span className="text-[13px] font-bold tracking-tight">Director</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase">Admin</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] shadow-sm">
            DZ
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── Animated View Wrapper ──────────────────────────────────────
function AnimatedView({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-fade-in">
      {children}
    </div>
  );
}

// ─── Seed Overlay ───────────────────────────────────────────────
function SeedOverlay({ seeded, seeding, onSeed }: { seeded: boolean | null; seeding: boolean; onSeed: () => void }) {
  if (seeded === null || seeded) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <Card className="max-w-md w-full animate-scale-in shadow-2xl">
        <CardContent className="pt-6 space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4 shadow-inner">
              <Database className="w-7 h-7 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold">Database Initialization</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mt-1">
              Loading the UCI Online Retail dataset (540K+ transactions, UK e-commerce 2010–2011) into the database.
            </p>
          </div>

          <div className="space-y-2.5 text-sm bg-muted/50 rounded-xl p-4">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Customers</span>
              <span className="font-mono">4,372</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Transactions</span>
              <span className="font-mono">~380,000</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Products</span>
              <span className="font-mono">4,070</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Orders</span>
              <span className="font-mono">25,900</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Countries</span>
              <span className="font-mono">38</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Period</span>
              <span className="font-mono">Dec 2010 – Dec 2011</span>
            </div>
          </div>

          <Button
            onClick={onSeed}
            disabled={seeding}
            className="w-full rounded-xl h-11 text-sm font-medium transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
            size="lg"
          >
            {seeding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Load Dataset"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Error Boundary ───────────────────────────────────────────
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onReset?: () => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; onReset?: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center flex-1 p-8">
          <Card className="max-w-md w-full animate-scale-in">
            <CardContent className="pt-6 text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
              <h2 className="text-lg font-semibold">An error occurred</h2>
              <p className="text-sm text-muted-foreground">
                {this.state.error?.message || "An unexpected error occurred."}
              </p>
              <Button onClick={() => this.setState({ hasError: false, error: null })} className="rounded-xl">
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Main App ────────────────────────────────────────────────────
export default function NexusApp() {
  const { activeView, mobileOpen, setMobileOpen, sidebarCollapsed } = useAppStore();
  const { seeded, seeding, seed } = useSeedStatus();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const ActiveView = VIEW_COMPONENTS[activeView];

  const openMobile = useCallback(() => setMobileOpen(true), [setMobileOpen]);
  const closeMobile = useCallback(() => setMobileOpen(false), [setMobileOpen]);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background flex">
        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden animate-fade-in"
            onClick={closeMobile}
          />
        )}

        {/* Mobile sidebar */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-out md:hidden",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <MobileSidebar onClose={closeMobile} />
        </div>

        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Main Content */}
        <main
          className={cn(
            "flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 ease-out",
            sidebarCollapsed ? "md:ml-[64px]" : "md:ml-[240px]"
          )}
        >
          <TopHeader onMenuClick={openMobile} />

          <div className="flex-1 p-4 sm:p-6 overflow-x-hidden">
            {mounted && (
              <AnimatedView>
                <ErrorBoundary>
                  <ActiveView />
                </ErrorBoundary>
              </AnimatedView>
            )}
          </div>

          {/* Footer */}
          <footer className="border-t bg-card/80 backdrop-blur-sm px-4 sm:px-6 py-3 flex items-center justify-between text-xs text-muted-foreground mt-auto transition-all duration-300">
            <span className="truncate">RDM Distribution Controller v4.2.0</span>
            <span className="flex items-center gap-1.5 shrink-0">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">System Integrated</span>
            </span>
          </footer>
        </main>

        {/* Seed Overlay */}
        <SeedOverlay seeded={seeded} seeding={seeding} onSeed={seed} />
      </div>
    </TooltipProvider>
  );
}
