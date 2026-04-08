import { NextResponse } from "next/server";

export async function GET() {
  // Simulating supply chain risk data based on the UCI Online Retail context
  // (Logistics trends between UK, France, Germany, etc.)
  const supplierRisks = [
    { supplierId: "Global Logistics UK", delayRate: 0.32, avgQualityScore: 6.8, avgLeadTime: 14, riskScore: 0.85, status: "high_risk" },
    { supplierId: "EuroParts SAS", delayRate: 0.04, avgQualityScore: 9.2, avgLeadTime: 4, riskScore: 0.15, status: "low_risk" },
    { supplierId: "Nordic Freight AB", delayRate: 0.18, avgQualityScore: 7.9, avgLeadTime: 9, riskScore: 0.45, status: "medium_risk" },
    { supplierId: "Alpine Supplies GmbH", delayRate: 0.28, avgQualityScore: 5.4, avgLeadTime: 13, riskScore: 0.75, status: "high_risk" },
    { supplierId: "Iberica Distribution", delayRate: 0.08, avgQualityScore: 8.8, avgLeadTime: 6, riskScore: 0.22, status: "low_risk" },
    { supplierId: "London Wholesalers", delayRate: 0.12, avgQualityScore: 8.5, avgLeadTime: 7, riskScore: 0.30, status: "low_risk" },
  ];

  const summary = {
    totalSuppliers: supplierRisks.length,
    highRisk: supplierRisks.filter(s => s.status === "high_risk").length,
    mediumRisk: supplierRisks.filter(s => s.status === "medium_risk").length,
    lowRisk: supplierRisks.filter(s => s.status === "low_risk").length,
    avgDelayRate: supplierRisks.reduce((s, r) => s + r.delayRate, 0) / supplierRisks.length,
  };

  return NextResponse.json({
    supplierRisks,
    summary,
  });
}
