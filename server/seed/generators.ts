import { db } from "@/lib/db";
import { rand, randInt, randFloat, pick, pickWeighted } from "./rng";
import { getSeasonalFactor } from "./calendar";

// ═══════════════════════════════════════════════
// Reference Data
// ═══════════════════════════════════════════════

const PREFIXES = ["SARL", "EURL", "SPA", "SNC", "SAS"];
const COMPANY_WORDS = [
  "Technique", "Métal", "Construct", "Alger", "Indus", "Pro",
  "Plus", "Nova", "Max", "Serv", "Tech", "Global", "Ferro",
  "Acier", "Prod", "Montage", "Soudure", "Plomberie", "Tubaire",
  "Énergie", "Chim", "Agro", "Text", "Bois", "Électrique",
  "Numérique", "Digital", "Avancé", "Prestige", "Royal", "Elite",
  "Premier", "Nord", "Sud", "Est", "Ouest", "Capital", "Atlas",
  "Tell", "Sahara", "Kabylie", "Oranie", "Aurès", "Médéa",
];

const SECTORS = ["BTP", "énergie", "agroalimentaire", "métallurgie", "chimie", "textile"];
const REGIONS = ["Alger", "Oran", "Constantine", "Annaba", "Blida", "Sétif"];

const PRODUCT_CATEGORIES: Record<
  string,
  { code: string; names: string[]; costRange: [number, number]; marginRange: [number, number] }
> = {
  Tuyaux: {
    code: "TU",
    names: ["Tuyau acier DN50", "Tuyau acier DN80", "Tuyau acier DN100", "Tuyau acier DN150", "Tuyau PVC PN10", "Tuyau PVC PN16", "Tuyau cuivre 22mm", "Tuyau cuivre 28mm", "Tuyau galvanisé 1\"", "Tuyau galvanisé 2\""],
    costRange: [1200, 35000],
    marginRange: [20, 40],
  },
  Vannes: {
    code: "VN",
    names: ["Vanne à bille DN50", "Vanne à bille DN80", "Vanne à soupape DN100", "Vanne d'arrêt DN65", "Vanne papillon DN150", "Vanne clapet DN80", "Robinet MM 1/2\"", "Robinet MM 3/4\"", "Vanne 3 voies DN40", "Vanne thermostatique"],
    costRange: [800, 25000],
    marginRange: [25, 45],
  },
  Raccords: {
    code: "RC",
    names: ["Coude 90° DN50", "Coude 45° DN80", "Té DN100", "Réduction DN80-DN50", "Bride plate DN100", "Manchon DN65", "Union DN40", "Nippel DN32", "Bouchon DN80", "Croix DN100"],
    costRange: [500, 12000],
    marginRange: [30, 45],
  },
  Joints: {
    code: "JT",
    names: ["Joint torique DN50", "Joint torique DN80", "Joint caoutchouc DN100", "Joint graphite DN150", "Joint fibre DN65", "Joint PTFE DN40", "Joint nitrile DN80", "Joint silicone DN32", "Joint métal DN100", "Joint spiralé DN150"],
    costRange: [300, 8000],
    marginRange: [35, 50],
  },
  Pompes: {
    code: "PM",
    names: ["Pompe centrifuge 2kW", "Pompe centrifuge 5kW", "Pompe immergée 3kW", "Pompe volumétrique 1.5kW", "Pompe de surface 2.2kW", "Pompe booster 1.1kW", "Pompe à chaleur 5kW", "Pompe doseuse 0.75kW", "Pompe vide 2kW", "Pompe haute pression 7.5kW"],
    costRange: [5000, 45000],
    marginRange: [15, 30],
  },
  Soudures: {
    code: "SD",
    names: ["Électrode E6013 2.5mm", "Électrode E7018 3.2mm", "Fil MIG 0.8mm 15kg", "Fil MIG 1.0mm 15kg", "Baguette TIG ER70S-6", "Flux MIG 5kg", "Masque soudure auto", "Poste soudure MIG/MAG", "Poste soudure TIG", "Bouteille argon 10L"],
    costRange: [600, 30000],
    marginRange: [20, 38],
  },
  Tôles: {
    code: "TL",
    names: ["Tôle acier 3mm 2x1m", "Tôle acier 5mm 2x1m", "Tôle acier 8mm 2x1m", "Tôle inox 2mm 1x2m", "Tôle inox 3mm 1x2m", "Tôle alu 2mm 1x2m", "Tôle alu 3mm 1x2m", "Tôle galvanisée 1mm", "Tôle galvanisée 2mm", "Tôle noire 4mm 2x1m"],
    costRange: [1500, 40000],
    marginRange: [18, 35],
  },
  Profilés: {
    code: "PF",
    names: ["Cornière 40x40x4", "Cornière 50x50x5", "Tube carré 40x40", "Tube carré 60x60", "Tube rond DN50", "IPN 100", "IPN 120", "UPN 80", "UPN 100", "HEA 100"],
    costRange: [2000, 28000],
    marginRange: [22, 40],
  },
};

const SUPPLIER_IDS: string[] = [];
for (let i = 1; i <= 45; i++) {
  SUPPLIER_IDS.push(`SUP-${String(i).padStart(3, "0")}`);
}

const CHANNELS = [
  { item: "direct" as const, weight: 40 },
  { item: "distributor" as const, weight: 35 },
  { item: "online" as const, weight: 25 },
];


// ═══════════════════════════════════════════════
// Batch Insert Helper
// ═══════════════════════════════════════════════

export async function batchInsert(
  data: any[],
  modelName: "customer" | "product" | "saleTransaction",
  batchSize = 5000
): Promise<number> {
  let inserted = 0;
  for (let i = 0; i < data.length; i += batchSize) {
    const chunk = data.slice(i, i + batchSize);
    // Dynamic model access — Prisma does not expose a typed index signature
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (db[modelName as keyof typeof db] as any).createMany({ data: chunk });
    inserted += result.count;
  }
  return inserted;
}

// ═══════════════════════════════════════════════
// Data Generators
// ═══════════════════════════════════════════════

function generateCustomerName(): string {
  const prefix = pick(PREFIXES);
  const w1 = pick(COMPANY_WORDS);
  const w2 = pick(COMPANY_WORDS);
  return `${prefix} ${w1}${w2}`;
}

/** Generate an array of deterministic customer records for AlgérieIndustries SA. */
export function generateCustomers(count: number): any[] {
  const customers: any[] = [];
  const sizeOptions = [
    { item: "SME", weight: 60 },
    { item: "Mid", weight: 25 },
    { item: "Enterprise", weight: 15 },
  ];

  const startDate = new Date("2008-01-01");
  const endDate = new Date("2011-06-30");
  const rangeMs = endDate.getTime() - startDate.getTime();

  for (let i = 0; i < count; i++) {
    const acquisitionDate = new Date(startDate.getTime() + rand() * rangeMs);
    const lastOrderOffset = randInt(0, 90) * 86400000;
    const lastOrderDate = new Date(new Date("2011-12-09T08:00:00Z").getTime() - lastOrderOffset);
    const isActive = rand() > 0.12;

    customers.push({
      name: generateCustomerName(),
      sector: pick(SECTORS),
      region: pick(REGIONS),
      country: "DZ",
      size: pickWeighted(sizeOptions),
      creditScore: randInt(450, 780),
      daysToPayAvg: randFloat(15, 75),
      churnRisk: isActive ? randFloat(0.02, 0.5) : randFloat(0.5, 0.95),
      lifetimeValue: randFloat(50000, 8500000),
      acquisitionDate: acquisitionDate.toISOString(),
      lastOrderDate: lastOrderDate.toISOString(),
      totalOrders: randInt(1, 250),
      totalRevenue: randFloat(15000, 6500000),
      isActive,
    });
  }
  return customers;
}

/** Generate an array of deterministic product records across 8 categories. */
export function generateProducts(count: number): any[] {
  const products: any[] = [];
  const categories = Object.entries(PRODUCT_CATEGORIES);
  const skusPerCategory = Math.ceil(count / categories.length);

  for (const [category, config] of categories) {
    for (let i = 0; i < skusPerCategory && products.length < count; i++) {
      const sku = `${config.code}-${String(i + 1).padStart(3, "0")}`;
      const name = config.names[i % config.names.length] || `${category} variante ${i + 1}`;
      const cost = randFloat(config.costRange[0], config.costRange[1]);
      const margin = randFloat(config.marginRange[0], config.marginRange[1]) / 100;
      const listPrice = Math.round(cost * (1 + margin));

      products.push({
        sku,
        name,
        category,
        costPrice: Math.round(cost),
        listPrice,
        marginPct: Math.round(margin * 10000) / 100,
        leadTimeDays: randInt(7, 28),
        reorderPoint: randInt(20, 200),
        currentStock: randInt(5, 500),
        supplierId: pick(SUPPLIER_IDS),
        weightKg: randFloat(0.5, 250),
        isActive: rand() > 0.05,
      });
    }
  }
  return products;
}

/** Generate and insert sale transactions in batches, using seasonal and priority-product weighting. */
export async function generateSaleTransactions(
  count: number,
  customerIds: string[],
  productIds: string[]
): Promise<number> {
  const endDate = new Date("2011-12-09T08:00:00Z");
  const startDate = new Date(endDate.getTime() - 2 * 365 * 86400000);
  const rangeMs = endDate.getTime() - startDate.getTime();

  // Pre-fetch product list prices
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, listPrice: true, category: true },
  });

  // Identify top 20% SKUs by price (proxy for revenue generators)
  const sortedProducts = [...products].sort((a, b) => (b.listPrice || 0) - (a.listPrice || 0));
  const top20Count = Math.ceil(sortedProducts.length * 0.2);
  const top20Ids = new Set(sortedProducts.slice(0, top20Count).map((p) => p.id));

  const productMap = new Map(products.map((p) => [p.id, p]));
  let inserted = 0;
  const batchSize = 5000;
  const batch: any[] = [];

  for (let i = 0; i < count; i++) {
    const date = new Date(startDate.getTime() + rand() * rangeMs);
    const seasonalFactor = getSeasonalFactor(date);

    // 70% chance to pick a top-20% product
    let productId: string;
    if (rand() < 0.7 && top20Ids.size > 0) {
      const arr = Array.from(top20Ids);
      productId = pick(arr);
    } else {
      productId = pick(productIds);
    }

    const product = productMap.get(productId);
    const unitPrice = product?.listPrice || randFloat(500, 25000);
    const quantity = randInt(8, 45);
    const discountPct = rand() > 0.7 ? randFloat(0.02, 0.15) : 0;
    const revenue = Math.round(unitPrice * quantity * (1 - discountPct) * seasonalFactor);
    const customerId = pick(customerIds);
    const customerRegion = rand() > 0.3 ? pick(REGIONS) : null;

    batch.push({
      date: date.toISOString(),
      customerId,
      productId,
      region: customerRegion,
      quantity,
      unitPrice,
      discountPct: Math.round(discountPct * 1000) / 1000,
      channel: pickWeighted(CHANNELS),
      paymentTerms: pick([15, 30, 45, 60, 90]),
      wasLate: rand() > 0.75,
      revenue,
    });

    if (batch.length >= batchSize) {
      const result = await db.saleTransaction.createMany({ data: batch });
      inserted += result.count;
      batch.length = 0;
    }
  }

  // Flush remaining
  if (batch.length > 0) {
    const result = await db.saleTransaction.createMany({ data: batch });
    inserted += result.count;
  }

  return inserted;
}


