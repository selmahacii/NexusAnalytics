"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  Package,
  Search,
  Filter,
  AlertTriangle,
  AlertCircle,
  TrendingDown,
  Percent,
  Warehouse,
  Boxes,
  RefreshCw,
  MoreHorizontal,
  Plus,
  FileDown,
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

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  costPrice: number | null;
  listPrice: number | null;
  marginPct: number | null;
  leadTimeDays: number;
  reorderPoint: number;
  currentStock: number;
  supplierId: string | null;
  isActive: boolean;
}

interface InventoryData {
  products: Product[];
  stats: {
    total: number;
    lowStock: number;
    outOfStock: number;
    stockValue: number;
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

function getStockStatus(stock: number, reorderPoint: number) {
  if (stock <= 0) return { label: "Rupture", color: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30" };
  if (stock <= reorderPoint) return { label: "Critique", color: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30" };
  return { label: "En Stock", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" };
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function InventoryView() {
  const [data, setData] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch("/api/inventory")
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
  const filteredProducts = useMemo(() => {
    if (!data) return [];
    return data.products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === "all" || p.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [data, search, categoryFilter]);

  const categories = useMemo(() => {
    if (!data) return [];
    const s = new Set<string>();
    data.products.forEach((p) => { if (p.category) s.add(p.category); });
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
                <Boxes className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-bold tracking-tight">{data.stats.total}</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Referenced Products</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card shadow-sm border-t-2 border-t-emerald-500/40 stagger-2 animate-slide-up">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="bg-emerald-500/10 p-2 rounded-xl">
                <Warehouse className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-bold tracking-tight">{fmtCurrency(data.stats.stockValue)}</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Stock Value</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card shadow-sm border-t-2 border-t-amber-500/40 stagger-3 animate-slide-up">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="bg-amber-500/10 p-2 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-none">
                {((data.stats.lowStock / data.stats.total) * 100).toFixed(1)}%
              </Badge>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-500">{data.stats.lowStock}</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Critical Stock</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card shadow-sm border-t-2 border-t-rose-500/40 stagger-4 animate-slide-up">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="bg-rose-500/10 p-2 rounded-xl">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-none">
                {((data.stats.outOfStock / data.stats.total) * 100).toFixed(1)}%
              </Badge>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-500">{data.stats.outOfStock}</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Out of Stock</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Search & Filter ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU..."
            className="pl-9 rounded-xl bg-card/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-xl gap-2 h-10 px-4 bg-card/50">
                <Package className="w-4 h-4" />
                Category: {categoryFilter === "all" ? "All" : categoryFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-xl">
              <DropdownMenuLabel>Filter by category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCategoryFilter("all")}>All categories</DropdownMenuItem>
              {categories.map((c) => (
                <DropdownMenuItem key={c} onClick={() => setCategoryFilter(c)}>{c}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="outline" size="icon" className="rounded-xl h-10 w-10 bg-card/50">
            <Filter className="w-4 h-4" />
          </Button>
          
          <Button className="rounded-xl h-10 gap-2 ml-auto sm:ml-0">
             <Plus className="w-4 h-4" /> Nouveau Produit
          </Button>
        </div>
      </div>

      {/* ── Inventory Table ─────────────────────────────────────────── */}
      <Card className="glass-card shadow-lg border-none animate-slide-up stagger-5">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-lg font-bold text-premium-gradient">Current Stock</CardTitle>
            <CardDescription className="text-xs">
              Detailed list of {filteredProducts.length} products found
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-xl h-8 gap-2 bg-card/50 text-xs">
              <FileDown className="w-3.5 h-3.5" />
              Export
            </Button>
            <Button variant="ghost" size="icon" onClick={() => fetchData()}>
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto natural-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent px-6">
                  <TableHead className="pl-6 w-[280px]">Product</TableHead>
                  <TableHead className="w-[120px]">SKU</TableHead>
                  <TableHead className="w-[150px]">Category</TableHead>
                  <TableHead className="w-[120px]">Stock</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[120px] text-right">List Price</TableHead>
                  <TableHead className="w-[100px] text-right">Margin</TableHead>
                  <TableHead className="w-[60px] pr-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const status = getStockStatus(product.currentStock, product.reorderPoint);
                  return (
                  <TableRow key={product.id} className="group transition-colors duration-200">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-primary font-bold text-xs shadow-inner">
                          <Package className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col max-w-[200px]">
                          <span className="font-bold text-sm tracking-tight truncate">{product.name}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs font-semibold text-muted-foreground">{product.sku}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-muted-foreground">{product.category || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">Qty: {product.currentStock}</span>
                        <span className="text-[10px] text-muted-foreground">Reorder: {product.reorderPoint}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px] px-2 font-bold uppercase tracking-wider", status.color)}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-bold text-sm tabular-nums tracking-tight">
                        {fmtCurrency(product.listPrice || 0)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                       <span className="text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {product.marginPct ? (product.marginPct).toFixed(1) : "—"}%
                      </span>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
            {filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Search className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-sm font-medium">No products found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
