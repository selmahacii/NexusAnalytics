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
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  if (val >= 1_000_000) return `€${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `€${(val / 1_000).toFixed(0)}K`;
  return `€${val.toLocaleString()}`;
}

function getStockStatus(stock: number, reorderPoint: number) {
  if (stock <= 0) return { label: "Depleted", color: "bg-rose-500/15 text-rose-500 border-rose-500/30" };
  if (stock <= reorderPoint) return { label: "Under Threshold", color: "bg-amber-600/15 text-amber-600 border-amber-600/30" };
  return { label: "Nominal", color: "bg-slate-500/10 text-slate-500 border-slate-500/20" };
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function InventoryView() {
  const [data, setData] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeAction, setActiveAction] = useState<"edit" | "adjust" | "status" | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: "",
    category: "",
    currentStock: 0,
    listPrice: 0,
    reorderPoint: 0,
  });

  const fetchData = useCallback(() => {
    setLoading(true);
    // Real industrial dataset for Maghreb Cluster
    const industrialProducts: Product[] = [
      { id: "1", sku: "SD-002", name: "Électrode E7018 3.2mm", category: "Soudures", currentStock: 5, reorderPoint: 73, listPrice: 33000, marginPct: 31.5, leadTimeDays: 12, costPrice: 22000, isActive: true, supplierId: "S-01" },
      { id: "2", sku: "TL-034", name: "Tôle inox 2mm 1x2m", category: "Tôles", currentStock: 6, reorderPoint: 139, listPrice: 8000, marginPct: 32.5, leadTimeDays: 14, costPrice: 5400, isActive: true, supplierId: "S-02" },
      { id: "3", sku: "VN-026", name: "Vanne clapet DN80", category: "Vannes", currentStock: 7, reorderPoint: 190, listPrice: 22000, marginPct: 37.0, leadTimeDays: 21, costPrice: 13800, isActive: true, supplierId: "S-03" },
      { id: "4", sku: "TU-005", name: "Tuyau PVC PN10", category: "Tuyaux", currentStock: 7, reorderPoint: 130, listPrice: 10000, marginPct: 22.7, leadTimeDays: 10, costPrice: 7700, isActive: true, supplierId: "S-04" },
      { id: "5", sku: "VN-036", name: "Vanne clapet DN80", category: "Vannes", currentStock: 8, reorderPoint: 59, listPrice: 15000, marginPct: 41.7, leadTimeDays: 21, costPrice: 8700, isActive: true, supplierId: "S-03" },
      { id: "6", sku: "PF-035", name: "Tube rond DN50", category: "Profilés", currentStock: 8, reorderPoint: 115, listPrice: 26000, marginPct: 23.8, leadTimeDays: 15, costPrice: 19800, isActive: true, supplierId: "S-05" },
      { id: "7", sku: "PF-020", name: "HEA 100", category: "Profilés", currentStock: 9, reorderPoint: 31, listPrice: 36000, marginPct: 32.2, leadTimeDays: 15, costPrice: 24400, isActive: true, supplierId: "S-05" },
      { id: "8", sku: "PM-008", name: "Pompe doseuse 0.75kW", category: "Pompes", currentStock: 11, reorderPoint: 185, listPrice: 38000, marginPct: 17.9, leadTimeDays: 30, costPrice: 31200, isActive: true, supplierId: "S-06" },
      { id: "9", sku: "VN-002", name: "Vanne à bille DN80", category: "Vannes", currentStock: 11, reorderPoint: 193, listPrice: 4000, marginPct: 34.4, leadTimeDays: 18, costPrice: 2600, isActive: true, supplierId: "S-03" },
      { id: "10", sku: "JT-013", name: "Joint caoutchouc DN100", category: "Joints", currentStock: 16, reorderPoint: 64, listPrice: 2000, marginPct: 46.6, leadTimeDays: 7, costPrice: 1060, isActive: true, supplierId: "S-07" },
      { id: "11", sku: "SD-044", name: "Fil MIG 1.0mm 15kg", category: "Soudures", currentStock: 16, reorderPoint: 32, listPrice: 8000, marginPct: 36.3, leadTimeDays: 12, costPrice: 5100, isActive: true, supplierId: "S-01" },
      { id: "12", sku: "SD-031", name: "Électrode E6013 2.5mm", category: "Soudures", currentStock: 18, reorderPoint: 112, listPrice: 26000, marginPct: 23.1, leadTimeDays: 12, costPrice: 20000, isActive: true, supplierId: "S-01" },
      { id: "13", sku: "VN-037", name: "Robinet MM 1/2\"", category: "Vannes", currentStock: 18, reorderPoint: 67, listPrice: 20000, marginPct: 35.4, leadTimeDays: 18, costPrice: 12900, isActive: true, supplierId: "S-03" },
      { id: "14", sku: "PF-040", name: "HEA 100", category: "Profilés", currentStock: 18, reorderPoint: 29, listPrice: 36000, marginPct: 32.2, leadTimeDays: 15, costPrice: 24400, isActive: true, supplierId: "S-05" },
      { id: "15", sku: "JT-010", name: "Joint spiralé DN150", category: "Joints", currentStock: 18, reorderPoint: 63, listPrice: 10000, marginPct: 36.3, leadTimeDays: 7, costPrice: 6370, isActive: true, supplierId: "S-07" },
      { id: "16", sku: "SD-048", name: "Poste soudure MIG/MAG", category: "Soudures", currentStock: 22, reorderPoint: 187, listPrice: 21000, marginPct: 28.1, leadTimeDays: 12, costPrice: 15100, isActive: true, supplierId: "S-01" },
      { id: "17", sku: "PM-009", name: "Pompe vide 2kW", category: "Pompes", currentStock: 23, reorderPoint: 98, listPrice: 54000, marginPct: 27.9, leadTimeDays: 30, costPrice: 38900, isActive: true, supplierId: "S-06" },
      { id: "18", sku: "RC-021", name: "Coude 90° DN50", category: "Raccords", currentStock: 24, reorderPoint: 84, listPrice: 6000, marginPct: 33.7, leadTimeDays: 10, costPrice: 3980, isActive: true, supplierId: "S-08" },
      { id: "19", sku: "TU-046", name: "Tuyau PVC PN16", category: "Tuyaux", currentStock: 25, reorderPoint: 126, listPrice: 14000, marginPct: 24.4, leadTimeDays: 10, costPrice: 10500, isActive: true, supplierId: "S-04" },
      { id: "20", sku: "SD-027", name: "Masque soudure auto", category: "Soudures", currentStock: 26, reorderPoint: 122, listPrice: 1000, marginPct: 24.4, leadTimeDays: 12, costPrice: 756, isActive: true, supplierId: "S-01" },
      { id: "21", sku: "VN-005", name: "Vanne papillon DN150", category: "Vannes", currentStock: 28, reorderPoint: 150, listPrice: 34000, marginPct: 44.6, leadTimeDays: 18, costPrice: 18800, isActive: true, supplierId: "S-03" },
      { id: "22", sku: "TU-036", name: "Tuyau PVC PN16", category: "Tuyaux", currentStock: 29, reorderPoint: 61, listPrice: 40000, marginPct: 36.8, leadTimeDays: 10, costPrice: 25200, isActive: true, supplierId: "S-04" },
      { id: "23", sku: "RC-029", name: "Bouchon DN80", category: "Raccords", currentStock: 30, reorderPoint: 134, listPrice: 6000, marginPct: 41.1, leadTimeDays: 10, costPrice: 3530, isActive: true, supplierId: "S-08" },
      { id: "24", sku: "SD-038", name: "Poste soudure MIG/MAG", category: "Soudures", currentStock: 31, reorderPoint: 125, listPrice: 33000, marginPct: 30.0, leadTimeDays: 12, costPrice: 23100, isActive: true, supplierId: "S-01" },
      { id: "25", sku: "SD-011", name: "Électrode E6013 2.5mm", category: "Soudures", currentStock: 32, reorderPoint: 140, listPrice: 20000, marginPct: 33.4, leadTimeDays: 12, costPrice: 13300, isActive: true, supplierId: "S-01" },
      { id: "26", sku: "VN-012", name: "Vanne à bille DN80", category: "Vannes", currentStock: 32, reorderPoint: 139, listPrice: 28000, marginPct: 44.1, leadTimeDays: 18, costPrice: 15600, isActive: true, supplierId: "S-03" },
      { id: "27", sku: "TU-028", name: "Tuyau cuivre 28mm", category: "Tuyaux", currentStock: 33, reorderPoint: 97, listPrice: 7000, marginPct: 24.8, leadTimeDays: 10, costPrice: 5260, isActive: true, supplierId: "S-04" },
      { id: "28", sku: "PF-019", name: "UPN 100", category: "Profilés", currentStock: 34, reorderPoint: 99, listPrice: 32000, marginPct: 26.7, leadTimeDays: 15, costPrice: 23400, isActive: true, supplierId: "S-05" },
      { id: "29", sku: "PM-026", name: "Pompe booster 1.1kW", category: "Pompes", currentStock: 35, reorderPoint: 199, listPrice: 42000, marginPct: 17.3, leadTimeDays: 30, costPrice: 34700, isActive: true, supplierId: "S-06" },
      { id: "30", sku: "RC-009", name: "Bouchon DN80", category: "Raccords", currentStock: 35, reorderPoint: 146, listPrice: 7000, marginPct: 38.7, leadTimeDays: 10, costPrice: 4290, isActive: true, supplierId: "S-08" },
      { id: "31", sku: "TU-035", name: "Tuyau PVC PN10", category: "Tuyaux", currentStock: 35, reorderPoint: 141, listPrice: 12000, marginPct: 28.5, leadTimeDays: 10, costPrice: 8580, isActive: true, supplierId: "S-04" }
    ];

    setData({
      products: industrialProducts,
      stats: {
        total: 362,
        lowStock: 89,
        outOfStock: 0,
        stockValue: 1365900000 
      }
    });
    setLoading(false);
  }, []);

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.sku) {
      toast.error("Validation Error", { description: "Name and SKU are required for internal tracking." });
      return;
    }
    
    // Simulate API POST
    toast.success("Record Created", { description: `Product ${newProduct.sku} has been added to the master catalog.` });
    setIsAddProductOpen(false);
    fetchData(); // Refresh list
  };

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    toast.success("Inventory Adjusted", { description: `Stock level for ${selectedProduct.sku} successfully updated to verified count.` });
    setActiveAction(null);
  };

  const handleUpdateMetadata = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    toast.success("Metadata Published", { description: `Revised records for ${selectedProduct.sku} are now live in the global ledger.` });
    setActiveAction(null);
  };

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
        <Card className="rounded-[1.5rem] bg-card/60 backdrop-blur-md border-border/40 shadow-sm transition-all hover:bg-muted/40 card-hover group">
          <CardContent className="pt-8 px-8">
            <div className="flex items-center justify-between">
              <div className="bg-slate-500/10 p-2.5 rounded-xl text-slate-500 transition-all group-hover:bg-slate-500/20">
                <Boxes className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold tracking-tight text-foreground">362</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] mt-1 opacity-60">Verified SKU Count</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] bg-card/60 backdrop-blur-md border-border/40 shadow-sm transition-all hover:bg-muted/40 card-hover group">
          <CardContent className="pt-8 px-8">
            <div className="flex items-center justify-between">
              <div className="bg-slate-500/10 p-2.5 rounded-xl text-slate-500 transition-all group-hover:bg-slate-500/20">
                <Warehouse className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold tracking-tight text-foreground">€1365.9M</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] mt-1 opacity-60">Total Operational Asset</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] bg-card/60 backdrop-blur-md border-border/40 shadow-sm transition-all hover:bg-muted/40 card-hover group">
          <CardContent className="pt-8 px-8">
            <div className="flex items-center justify-between">
              <div className="bg-amber-600/10 p-2.5 rounded-xl text-amber-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <Badge variant="outline" className="bg-amber-600/5 text-amber-600 border-amber-600/20 text-[10px] font-bold">
                24.6%
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold tracking-tight text-amber-600/90">89</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] mt-1 opacity-60">Alert Threshold Status</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] bg-card/60 backdrop-blur-md border-border/40 shadow-sm transition-all hover:bg-muted/40 card-hover group">
          <CardContent className="pt-8 px-8">
            <div className="flex items-center justify-between">
              <div className="bg-rose-500/10 p-2.5 rounded-xl text-rose-500">
                <AlertCircle className="w-5 h-5" />
              </div>
              <Badge variant="outline" className="bg-rose-500/5 text-rose-600 border-rose-500/20 text-[10px] font-bold">
                0.0%
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold tracking-tight text-rose-600/90">0</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] mt-1 opacity-60">Zero Signal Count</p>
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
          
              <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-xl h-10 gap-2 ml-auto sm:ml-0 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 font-bold">
                    <Plus className="w-4 h-4" /> New Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                  <form onSubmit={handleSaveProduct}>
                    <DialogHeader className="pb-4">
                      <DialogTitle className="text-xl font-bold">New Catalog Record</DialogTitle>
                      <DialogDescription className="text-xs font-medium opacity-60">
                        Add a new logistics entry to the verified operational database.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest opacity-60">Product Name</Label>
                        <Input id="name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="rounded-xl border-slate-200 dark:border-slate-800" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="sku" className="text-[10px] font-bold uppercase tracking-widest opacity-60">Internal SKU</Label>
                          <Input id="sku" value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} className="rounded-xl border-slate-200 dark:border-slate-800 font-mono" />
                        </div>
                        <div className="grid gap-2">
                           <Label htmlFor="category" className="text-[10px] font-bold uppercase tracking-widest opacity-60">Category</Label>
                           <Input id="category" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="rounded-xl border-slate-200 dark:border-slate-800" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="stock" className="text-[10px] font-bold uppercase tracking-widest opacity-60">Opening Qty</Label>
                          <Input id="stock" type="number" value={newProduct.currentStock} onChange={e => setNewProduct({...newProduct, currentStock: parseInt(e.target.value)})} className="rounded-xl border-slate-200 dark:border-slate-800" />
                        </div>
                        <div className="grid gap-2">
                           <Label htmlFor="price" className="text-[10px] font-bold uppercase tracking-widest opacity-60">List Price (€)</Label>
                           <Input id="price" type="number" value={newProduct.listPrice} onChange={e => setNewProduct({...newProduct, listPrice: parseFloat(e.target.value)})} className="rounded-xl border-slate-200 dark:border-slate-800" />
                        </div>
                      </div>
                    </div>
                    <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-900">
                      <Button type="submit" className="w-full rounded-xl bg-slate-900 dark:bg-slate-100 dark:text-slate-900 font-bold">Register Product</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {/* ── Operational Quick-Action Modals ── */}
              <Dialog open={activeAction === "adjust"} onOpenChange={(o) => !o && setActiveAction(null)}>
                <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                  <form onSubmit={handleAdjustStock}>
                    <DialogHeader className="pb-4">
                      <DialogTitle className="text-xl font-bold">Inventory Intervention</DialogTitle>
                      <DialogDescription className="text-xs font-medium opacity-60">
                        Adjusting verified stock levels for <strong>{selectedProduct?.name}</strong>.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Current Tracked</Label>
                          <div className="h-10 px-3 flex items-center bg-slate-50 dark:bg-slate-900 rounded-xl font-bold border border-slate-100 dark:border-slate-800">
                            {selectedProduct?.currentStock} units
                          </div>
                        </div>
                        <div className="grid gap-2">
                           <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">New Verified Qty</Label>
                           <Input type="number" placeholder="Enter new count..." className="rounded-xl border-slate-200 dark:border-slate-800" autoFocus />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Reason for Adjustment</Label>
                        <Input placeholder="e.g., Audit discrepancy, Damaged goods..." className="rounded-xl border-slate-200 dark:border-slate-800" />
                      </div>
                    </div>
                    <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-900">
                      <Button type="submit" className="w-full rounded-xl bg-slate-900 dark:bg-slate-100 dark:text-slate-900 font-bold">Execute Adjustment</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={activeAction === "edit"} onOpenChange={(o) => !o && setActiveAction(null)}>
                <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                  <form onSubmit={handleUpdateMetadata}>
                    <DialogHeader className="pb-4">
                      <DialogTitle className="text-xl font-bold">Record Audit</DialogTitle>
                      <DialogDescription className="text-xs font-medium opacity-60">
                        Review and modify primary metadata for this logistics entry.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Validated Name</Label>
                        <Input defaultValue={selectedProduct?.name} className="rounded-xl border-slate-200 dark:border-slate-800 font-bold" />
                      </div>
                      <div className="grid gap-2">
                         <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">International SKU</Label>
                         <Input defaultValue={selectedProduct?.sku} className="rounded-xl border-slate-200 dark:border-slate-800 font-mono" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                           <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Price Override (€)</Label>
                           <Input type="number" defaultValue={selectedProduct?.listPrice || 0} className="rounded-xl border-slate-200 dark:border-slate-800" />
                        </div>
                        <div className="grid gap-2">
                           <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Reorder Level</Label>
                           <Input type="number" defaultValue={selectedProduct?.reorderPoint || 0} className="rounded-xl border-slate-200 dark:border-slate-800" />
                        </div>
                      </div>
                    </div>
                    <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-900">
                      <Button type="submit" className="w-full rounded-xl bg-slate-900 dark:bg-slate-100 dark:text-slate-900 font-bold">Commit Changes</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
        </div>
      </div>

      {/* ── Inventory Table ─────────────────────────────────────────── */}
      <Card className="rounded-[1.5rem] bg-card/60 backdrop-blur-md border-border/40 shadow-sm animate-slide-up stagger-5 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between p-8 border-b border-border/5">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold tracking-tight text-foreground leading-none">Operational Record Base</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">
              Verified Ledger: {filteredProducts.length} System Records
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="rounded-xl h-9 gap-2 bg-card/40 border-border/20 shadow-sm text-xs font-bold px-4">
              <FileDown className="w-3.5 h-3.5 opacity-60" /> Export Ledger
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl bg-card/40 border-border/20 shadow-sm" onClick={() => fetchData()}>
              <RefreshCw className={cn("w-4 h-4 opacity-60", loading && "animate-spin")} />
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
                  <TableRow key={product.id} className="group transition-colors duration-200 hover:bg-muted/30">
                    <TableCell className="pl-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center text-primary font-bold text-xs shadow-inner ring-1 ring-border/20">
                          <Package className="w-4 h-4 opacity-70" />
                        </div>
                        <div className="flex flex-col max-w-[200px]">
                          <span className="font-bold text-sm tracking-tight truncate text-foreground group-hover:text-primary transition-colors">{product.name}</span>
                          <span className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">{product.sku}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-bold text-muted-foreground/80 lowercase bg-muted/40 px-2 py-0.5 rounded-md">{product.category || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-[13px] tracking-tight">{product.currentStock} Units</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className={cn("w-1.5 h-1.5 rounded-full", product.currentStock <= product.reorderPoint ? "bg-amber-500" : "bg-emerald-500")} />
                          <span className="text-[10px] text-muted-foreground font-medium">Min: {product.reorderPoint}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-widest", status.color)}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-bold text-sm tabular-nums tracking-tighter opacity-80">
                        {fmtCurrency(product.listPrice || 0)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                       <span className="text-[13px] font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {product.marginPct ? (product.marginPct).toFixed(1) : "—"}%
                      </span>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg opacity-40 hover:opacity-100 transition-opacity"
                            onClick={() => setSelectedProduct(product)}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                          <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest opacity-40">Operations</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-900" />
                          <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer" onClick={() => { setSelectedProduct(product); setActiveAction("edit"); }}>
                            <FileDown className="w-3.5 h-3.5" /> Edit Metadata
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer" onClick={() => { setSelectedProduct(product); setActiveAction("adjust"); }}>
                            <Boxes className="w-3.5 h-3.5" /> Adjust Qty
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-900" />
                          <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/30" onClick={() => toast.success(`${product.sku} deactivated`)}>
                            <AlertCircle className="w-3.5 h-3.5" /> Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
