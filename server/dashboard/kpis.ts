import { db } from "@/lib/db";

// ═══════════════════════════════════════════════
// Dashboard KPI Types
// ═══════════════════════════════════════════════

export interface DashboardKpis {
  revenueYtd: number;
  revenueGrowthPct: number;
  revenueTarget: number;
  activeCustomers: number;
  totalCustomers: number;
  newCustomersThisMonth: number;
  customerChurnRate: number;
  avgOrderValue: number;
  totalTransactions: number;
  totalProducts: number;
  productionEfficiency: { avg: number; trend: string };
  pendingOrders: number;
  cashBalance: number;
  ebitdaMargin: number;
  delayedShipments: number;
  anomalyCount: number;
  topProducts: Array<{ name: string; revenue: number; growth: number }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    target: number;
  }>;
  revenueByRegion: Array<{ region: string | null; revenue: number; count: number }>;
  revenueByCategory: Array<{ category: string | null; revenue: number }>;
  revenueByChannel: Array<{ channel: string; revenue: number; pct: number }>;
  topCountries: Array<{ country: string; revenue: number; customers: number }>;
  monthlyCustomers: Array<{
    month: string;
    new: number;
    churned: number;
    total: number;
  }>;
}

// ═══════════════════════════════════════════════
// Main KPI Computation
// ═══════════════════════════════════════════════

export async function computeDashboardKpis(): Promise<DashboardKpis> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const startOfYear = new Date(currentYear, 0, 1);
  const startOfPrevYear = new Date(currentYear - 1, 0, 1);
  const endOfPrevYear = new Date(currentYear, 0, 0);

  // ─── Aggregate queries ───
  const [revenueYtdRaw, revenuePrevYearRaw, activeCustomers, totalCustomers, avgOrderRaw, totalTransactions, totalProducts, anomalyCount, pendingOrdersRaw] =
    await Promise.all([
      db.saleTransaction.aggregate({
        where: { date: { gte: startOfYear } },
        _sum: { revenue: true },
      }),
      db.saleTransaction.aggregate({
        where: { date: { gte: startOfPrevYear, lt: endOfPrevYear } },
        _sum: { revenue: true },
      }),
      db.customer.count({ where: { isActive: true } }),
      db.customer.count(),
      db.saleTransaction.aggregate({ _avg: { revenue: true } }),
      db.saleTransaction.count(),
      db.product.count(),
      db.anomalyEvent.count(),
      db.saleTransaction.count({ where: { wasLate: true } }), // Using wasLate as a proxy for pending/issue orders for now
    ]);

  const revenueYtd = revenueYtdRaw._sum.revenue || 0;
  const revenuePrevYear = revenuePrevYearRaw._sum.revenue || 0;
  const revenueGrowthPct = revenuePrevYear > 0 ? ((revenueYtd - revenuePrevYear) / revenuePrevYear) * 100 : 0;

  // ─── Top Products ───
  const topProductsRaw = await db.saleTransaction.groupBy({
    by: ["productId"],
    _sum: { revenue: true, quantity: true },
    orderBy: { _sum: { revenue: "desc" } },
    take: 8,
  });

  const topProductIds = topProductsRaw.map((p) => p.productId).filter((id): id is string => !!id);
  const productNames = await db.product.findMany({
    where: { id: { in: topProductIds } },
    select: { id: true, name: true },
  });
  const productNameMap = new Map(productNames.map((p) => [p.id, p.name]));

  const topProducts = topProductsRaw.map((p) => ({
    name: productNameMap.get(p.productId || "") || "Inconnu",
    revenue: p._sum.revenue || 0,
    growth: (Math.random() * 10) - 2, // Mocking growth for now
  }));

  // ─── Revenue by Month (last 12 months) ───
  const twelveMonthsAgo = new Date(currentYear, currentMonth - 11, 1);
  const monthlyRevenueRaw = await db.saleTransaction.groupBy({
    by: ["date"],
    where: { date: { gte: twelveMonthsAgo } },
    _sum: { revenue: true },
    _count: true,
  });

  const monthlyRevenueMap = new Map<string, { revenue: number; transactions: number }>();
  for (const row of monthlyRevenueRaw) {
    const d = new Date(row.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const existing = monthlyRevenueMap.get(key) || { revenue: 0, transactions: 0 };
    monthlyRevenueMap.set(key, {
      revenue: existing.revenue + (row._sum.revenue || 0),
      transactions: existing.transactions + row._count,
    });
  }

  const revenueByMonth: any[] = [];
  const monthlyCustomers: any[] = [];
  
  for (let i = 11; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("fr-FR", { year: "2-digit", month: "short" });
    const data = monthlyRevenueMap.get(key) || { revenue: 0, transactions: 0 };
    
    revenueByMonth.push({
      month: label,
      revenue: Math.round(data.revenue),
      target: Math.round(data.revenue * 0.95), // Mock target
    });

    // Mocking monthly customers for now based on revenue trends
    monthlyCustomers.push({
      month: label,
      new: Math.round(data.transactions / 10) + Math.floor(Math.random() * 5),
      churned: Math.floor(Math.random() * 3),
      total: activeCustomers - (i * 2), // Mock logic
    });
  }

  // ─── Revenue by Region ───
  const revenueByRegionRaw = await db.saleTransaction.groupBy({
    by: ["region"],
    _sum: { revenue: true },
    _count: true,
    orderBy: { _sum: { revenue: "desc" } },
    take: 10,
  });

  const revenueByRegion = revenueByRegionRaw
    .filter((r): r is typeof revenueByRegionRaw[number] & { region: string } => r.region !== null)
    .map((r) => ({
      region: r.region,
      revenue: r._sum.revenue || 0,
      count: r._count,
    }));

  // ─── Revenue by Category ───
  const revenueByCategoryRaw = await db.saleTransaction.groupBy({
    by: ["productId"],
    _sum: { revenue: true },
    orderBy: { _sum: { revenue: "desc" } },
  });

  const allProductIds = revenueByCategoryRaw.map((p) => p.productId).filter((id): id is string => !!id);
  const allProducts = await db.product.findMany({
    where: { id: { in: allProductIds } },
    select: { id: true, category: true },
  });
  const productCategoryMap = new Map(allProducts.map((p) => [p.id, p.category]));

  const categoryRevenueMap = new Map<string, number>();
  for (const row of revenueByCategoryRaw) {
    const cat = productCategoryMap.get(row.productId || "") || "Autres";
    categoryRevenueMap.set(cat, (categoryRevenueMap.get(cat) || 0) + (row._sum.revenue || 0));
  }

  const revenueByCategory = Array.from(categoryRevenueMap.entries())
    .map(([category, revenue]) => ({ category, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  // ─── Revenue by Channel ───
  const revenueByChannelRaw = await db.saleTransaction.groupBy({
    by: ["channel"],
    _sum: { revenue: true },
  });

  const totalRevForChannels = revenueByChannelRaw.reduce((acc, curr) => acc + (curr._sum.revenue || 0), 0);
  const revenueByChannel = revenueByChannelRaw.map((c) => ({
    channel: c.channel || "direct",
    revenue: c._sum.revenue || 0,
    pct: totalRevForChannels > 0 ? ((c._sum.revenue || 0) / totalRevForChannels) * 100 : 0,
  }));

  // ─── Top Countries ───
  const countryData = await db.customer.groupBy({
    by: ["country"],
    _sum: { totalRevenue: true },
    _count: true,
    orderBy: { _sum: { totalRevenue: "desc" } },
    take: 8,
  });

  const topCountries = countryData.map((c) => ({
    country: c.country,
    revenue: c._sum.totalRevenue || 0,
    customers: c._count,
  }));

  // ─── New customers this month ───
  const currentMonthStart = new Date(currentYear, currentMonth, 1);
  const newCustomersThisMonth = await db.customer.count({
    where: { acquisitionDate: { gte: currentMonthStart } },
  });

  return {
    revenueYtd: Math.round(revenueYtd),
    revenueGrowthPct: Math.round(revenueGrowthPct * 100) / 100,
    revenueTarget: Math.round(revenueYtd * 1.1),
    activeCustomers,
    totalCustomers,
    newCustomersThisMonth,
    customerChurnRate: 2.4, // Mock
    avgOrderValue: Math.round(avgOrderRaw._avg.revenue || 0),
    totalTransactions,
    totalProducts,
    productionEfficiency: { avg: 88.5, trend: "up" }, // Mock
    pendingOrders: pendingOrdersRaw,
    cashBalance: revenueYtd * 0.15, // Mock
    ebitdaMargin: 24.2, // Mock
    delayedShipments: Math.floor(pendingOrdersRaw * 0.1),
    anomalyCount,
    topProducts,
    revenueByMonth,
    revenueByRegion,
    revenueByCategory,
    revenueByChannel,
    topCountries,
    monthlyCustomers,
  };
}
