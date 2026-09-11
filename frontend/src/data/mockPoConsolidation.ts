import type { MultiplePoItem, PoConsolidationCadence, PoConsolidationSummary, CadenceSavingsBenefit } from '../types/poConsolidation';
import { PO_CONSOLIDATION_THRESHOLDS } from '../constants/poConsolidation';

const buildCadenceOption = (
  cadence: PoConsolidationCadence,
  label: string,
  targetPos: number,
  discountPct: number,
  annualPos: number,
  spendCr: number
): CadenceSavingsBenefit => {
  const reductionPct = Number((((annualPos - targetPos) / annualPos) * 100).toFixed(1));
  const scaleSavingsCr = Number(((spendCr * discountPct) / 100).toFixed(2));
  const adminSavingsLakhs = Number(
    (((annualPos - targetPos) * PO_CONSOLIDATION_THRESHOLDS.ADMIN_COST_PER_PO_INR) / 100000).toFixed(2)
  );
  const totalBenefitCr = Number((scaleSavingsCr + adminSavingsLakhs / 100).toFixed(2));

  return {
    cadence,
    label,
    target_pos_per_year: targetPos,
    po_reduction_pct: reductionPct,
    scale_discount_pct: discountPct,
    scale_savings_cr: scaleSavingsCr,
    admin_savings_lakhs: adminSavingsLakhs,
    total_benefit_cr: totalBenefitCr
  };
};

const buildCadenceMap = (annualPos: number, spendCr: number): Record<PoConsolidationCadence, CadenceSavingsBenefit> => ({
  MONTHLY: buildCadenceOption('MONTHLY', 'Monthly Single PO', 12, 5.5, annualPos, spendCr),
  QUARTERLY: buildCadenceOption('QUARTERLY', 'Quarterly Blanket PO', 4, 9.5, annualPos, spendCr),
  HALF_YEARLY: buildCadenceOption('HALF_YEARLY', 'Half-Yearly Rate Contract', 2, 12.5, annualPos, spendCr),
  ANNUAL: buildCadenceOption('ANNUAL', 'Annual Master Blanket PO', 1, 16.0, annualPos, spendCr)
});

export const MOCK_MULTIPLE_PO_ITEMS: MultiplePoItem[] = [
  {
    id: 'PO-CONSOL-01',
    vendor_id: 'VEND-JSL-0091',
    vendor_name: 'JINDAL STAINLESS LIMITED',
    category: 'Direct Materials',
    item_description: 'Precision Cold-Rolled Stainless Steel Coils & Slit Strips (AISI 304/316L)',
    material_code: 'MAT-SS-COIL-402',
    total_annual_spend_cr: 64.5,
    annual_po_count: 144,
    avg_pos_per_month: 12,
    avg_po_value_lakhs: 44.79,
    primary_plant: 'Jajpur Central & Gurgaon Processing Plants',
    cadence_options: buildCadenceMap(144, 64.5),
    recommended_cadence: 'ANNUAL',
    best_practice_recommendation:
      'Consolidate 144 fragmented monthly spot POs into 1 Annual Blanket Master Agreement with monthly scheduled release orders. Lock in bulk mill rolling campaigns to capture top-tier 16.0% scale discount.',
    blanket_po_strategy:
      'SAP ME31K Outline Agreement with index-linked LME Nickel/Chrome escalation cap and automated 3-way milestone match.',
    monthly_distribution: [
      { month: 'Apr', po_count: 12, spend_inr_lakhs: 535.0 },
      { month: 'May', po_count: 14, spend_inr_lakhs: 620.0 },
      { month: 'Jun', po_count: 11, spend_inr_lakhs: 490.0 },
      { month: 'Jul', po_count: 13, spend_inr_lakhs: 580.0 },
      { month: 'Aug', po_count: 12, spend_inr_lakhs: 540.0 },
      { month: 'Sep', po_count: 10, spend_inr_lakhs: 450.0 },
      { month: 'Oct', po_count: 14, spend_inr_lakhs: 625.0 },
      { month: 'Nov', po_count: 12, spend_inr_lakhs: 530.0 },
      { month: 'Dec', po_count: 13, spend_inr_lakhs: 585.0 },
      { month: 'Jan', po_count: 11, spend_inr_lakhs: 495.0 },
      { month: 'Feb', po_count: 10, spend_inr_lakhs: 445.0 },
      { month: 'Mar', po_count: 12, spend_inr_lakhs: 555.0 }
    ]
  },
  {
    id: 'PO-CONSOL-02',
    vendor_id: 'VEND-SIGNODE-0044',
    vendor_name: 'SIGNODE INDIA LIMITED',
    category: 'Packaging Materials',
    item_description: 'High-Tensile Steel & Polyester Strapping, Stretch Films & Automated Packaging Tools',
    material_code: 'MAT-PKG-STRP-880',
    total_annual_spend_cr: 32.8,
    annual_po_count: 168,
    avg_pos_per_month: 14,
    avg_po_value_lakhs: 19.52,
    primary_plant: 'Pan-India Multi-Plant Operations (5 Manufacturing Sites)',
    cadence_options: buildCadenceMap(168, 32.8),
    recommended_cadence: 'QUARTERLY',
    best_practice_recommendation:
      'Releasing 14 POs per month across decentralized manufacturing sites dilutes enterprise bargaining. Consolidate into 4 Quarterly Blanket POs with bi-weekly plant release call-offs to unlock 9.5% volume rebate.',
    blanket_po_strategy:
      'Multi-plant Blanket Purchase Agreement (BPA) with centralized price grid and direct vendor delivery replenishment to line-side buffers.',
    monthly_distribution: [
      { month: 'Apr', po_count: 14, spend_inr_lakhs: 270.0 },
      { month: 'May', po_count: 15, spend_inr_lakhs: 295.0 },
      { month: 'Jun', po_count: 13, spend_inr_lakhs: 255.0 },
      { month: 'Jul', po_count: 16, spend_inr_lakhs: 310.0 },
      { month: 'Aug', po_count: 14, spend_inr_lakhs: 275.0 },
      { month: 'Sep', po_count: 13, spend_inr_lakhs: 250.0 },
      { month: 'Oct', po_count: 15, spend_inr_lakhs: 290.0 },
      { month: 'Nov', po_count: 14, spend_inr_lakhs: 270.0 },
      { month: 'Dec', po_count: 16, spend_inr_lakhs: 315.0 },
      { month: 'Jan', po_count: 12, spend_inr_lakhs: 235.0 },
      { month: 'Feb', po_count: 13, spend_inr_lakhs: 255.0 },
      { month: 'Mar', po_count: 13, spend_inr_lakhs: 260.0 }
    ]
  },
  {
    id: 'PO-CONSOL-03',
    vendor_id: 'VEND-TRAF-0012',
    vendor_name: 'TRAFIGURA INDIA PRIVATE LIMITED',
    category: 'Direct Materials',
    item_description: 'High-Purity Electrolytic Copper Cathodes (Grade A LME Registered) & Non-Ferrous Scrap',
    material_code: 'MAT-CU-CATH-109',
    total_annual_spend_cr: 58.2,
    annual_po_count: 96,
    avg_pos_per_month: 8,
    avg_po_value_lakhs: 60.63,
    primary_plant: 'Dahej Smelting Hub & Nhava Sheva Inbound Logistics',
    cadence_options: buildCadenceMap(96, 58.2),
    recommended_cadence: 'HALF_YEARLY',
    best_practice_recommendation:
      'Fragmented monthly copper purchases expose the enterprise to spot market premium premiums. Establish 2 Half-Yearly Rate Contracts (H1/H2) with monthly formula-based benchmark settlement, yielding 12.5% scale gain.',
    blanket_po_strategy:
      'Bi-annual Rate Contract indexed against LME official settlement cash price with fixed conversion premium discount.',
    monthly_distribution: [
      { month: 'Apr', po_count: 8, spend_inr_lakhs: 480.0 },
      { month: 'May', po_count: 9, spend_inr_lakhs: 545.0 },
      { month: 'Jun', po_count: 7, spend_inr_lakhs: 425.0 },
      { month: 'Jul', po_count: 8, spend_inr_lakhs: 485.0 },
      { month: 'Aug', po_count: 9, spend_inr_lakhs: 550.0 },
      { month: 'Sep', po_count: 8, spend_inr_lakhs: 480.0 },
      { month: 'Oct', po_count: 9, spend_inr_lakhs: 540.0 },
      { month: 'Nov', po_count: 7, spend_inr_lakhs: 430.0 },
      { month: 'Dec', po_count: 8, spend_inr_lakhs: 490.0 },
      { month: 'Jan', po_count: 7, spend_inr_lakhs: 420.0 },
      { month: 'Feb', po_count: 8, spend_inr_lakhs: 485.0 },
      { month: 'Mar', po_count: 8, spend_inr_lakhs: 490.0 }
    ]
  },
  {
    id: 'PO-CONSOL-04',
    vendor_id: 'VEND-CORO-0062',
    vendor_name: 'COROMANDEL CHEMICALS & FERTILIZERS',
    category: 'Direct Materials',
    item_description: 'Industrial Grade Sulphuric Acid, Phosphoric Acid & Liquid Caustic Soda',
    material_code: 'MAT-CHEM-ACID-550',
    total_annual_spend_cr: 24.5,
    annual_po_count: 108,
    avg_pos_per_month: 9,
    avg_po_value_lakhs: 22.69,
    primary_plant: 'Visakhapatnam Chemical Complex & Kakinada Plant',
    cadence_options: buildCadenceMap(108, 24.5),
    recommended_cadence: 'QUARTERLY',
    best_practice_recommendation:
      'Continuous monthly tanker POs create demurrage and billing discrepancies. Consolidate into 4 Quarterly Blanket Orders with tanker pipeline dedicated schedules to capture 9.5% bulk discount.',
    blanket_po_strategy:
      'Quarterly delivery schedule line agreement with vendor-managed tank level monitoring and monthly summary self-billing.',
    monthly_distribution: [
      { month: 'Apr', po_count: 9, spend_inr_lakhs: 205.0 },
      { month: 'May', po_count: 10, spend_inr_lakhs: 225.0 },
      { month: 'Jun', po_count: 8, spend_inr_lakhs: 180.0 },
      { month: 'Jul', po_count: 9, spend_inr_lakhs: 205.0 },
      { month: 'Aug', po_count: 10, spend_inr_lakhs: 230.0 },
      { month: 'Sep', po_count: 9, spend_inr_lakhs: 200.0 },
      { month: 'Oct', po_count: 9, spend_inr_lakhs: 205.0 },
      { month: 'Nov', po_count: 8, spend_inr_lakhs: 185.0 },
      { month: 'Dec', po_count: 10, spend_inr_lakhs: 225.0 },
      { month: 'Jan', po_count: 8, spend_inr_lakhs: 180.0 },
      { month: 'Feb', po_count: 9, spend_inr_lakhs: 205.0 },
      { month: 'Mar', po_count: 9, spend_inr_lakhs: 205.0 }
    ]
  },
  {
    id: 'PO-CONSOL-05',
    vendor_id: 'VEND-SKF-0018',
    vendor_name: 'SKF INDIA LIMITED',
    category: 'Indirect & MRO',
    item_description: 'Precision Deep Groove Ball Bearings, Spherical Roller Bearings & Centralized Lubrication Spares',
    material_code: 'MAT-MRO-BRG-221',
    total_annual_spend_cr: 18.9,
    annual_po_count: 132,
    avg_pos_per_month: 11,
    avg_po_value_lakhs: 14.32,
    primary_plant: 'All Production Units (National MRO Spares Consignment)',
    cadence_options: buildCadenceMap(132, 18.9),
    recommended_cadence: 'ANNUAL',
    best_practice_recommendation:
      '132 ad-hoc maintenance POs create excessive storeroom administrative overhead. Replace with 1 Annual Master Blanket Contract with Vendor Managed Inventory (VMI) consignment stock, saving 15.0% + ₹4.6L admin costs.',
    blanket_po_strategy:
      'Annual Consignment Outline Agreement with automated consumption-based replenishment barcodes and quarterly consolidated invoicing.',
    monthly_distribution: [
      { month: 'Apr', po_count: 11, spend_inr_lakhs: 155.0 },
      { month: 'May', po_count: 12, spend_inr_lakhs: 170.0 },
      { month: 'Jun', po_count: 10, spend_inr_lakhs: 145.0 },
      { month: 'Jul', po_count: 12, spend_inr_lakhs: 175.0 },
      { month: 'Aug', po_count: 11, spend_inr_lakhs: 160.0 },
      { month: 'Sep', po_count: 10, spend_inr_lakhs: 140.0 },
      { month: 'Oct', po_count: 12, spend_inr_lakhs: 170.0 },
      { month: 'Nov', po_count: 11, spend_inr_lakhs: 155.0 },
      { month: 'Dec', po_count: 12, spend_inr_lakhs: 175.0 },
      { month: 'Jan', po_count: 10, spend_inr_lakhs: 145.0 },
      { month: 'Feb', po_count: 10, spend_inr_lakhs: 145.0 },
      { month: 'Mar', po_count: 11, spend_inr_lakhs: 155.0 }
    ]
  },
  {
    id: 'PO-CONSOL-06',
    vendor_id: 'VEND-TCI-0087',
    vendor_name: 'TCI FREIGHT & CONTAINER LOGISTICS',
    category: 'Logistics & Freight',
    item_description: 'Multi-Plant Dedicated Full Truckload (FTL) Line-Haul & Regional Inter-Plant Transit',
    material_code: 'MAT-LOG-LINE-770',
    total_annual_spend_cr: 35.9,
    annual_po_count: 120,
    avg_pos_per_month: 10,
    avg_po_value_lakhs: 29.92,
    primary_plant: 'Pan-India Distribution Corridor (West-South-North Lanes)',
    cadence_options: buildCadenceMap(120, 35.9),
    recommended_cadence: 'HALF_YEARLY',
    best_practice_recommendation:
      'Spot trip-by-trip freight POs forfeit dedicated lane volume commitments. Transition to 2 Half-Yearly Rate Contracts with guaranteed diesel escalation/de-escalation formulas, securing 12.0% freight savings.',
    blanket_po_strategy:
      'Bi-annual Master Transportation Services Agreement with weekly electronic proof-of-delivery (e-POD) settlement and fuel price pegs.',
    monthly_distribution: [
      { month: 'Apr', po_count: 10, spend_inr_lakhs: 300.0 },
      { month: 'May', po_count: 11, spend_inr_lakhs: 330.0 },
      { month: 'Jun', po_count: 9, spend_inr_lakhs: 270.0 },
      { month: 'Jul', po_count: 10, spend_inr_lakhs: 300.0 },
      { month: 'Aug', po_count: 11, spend_inr_lakhs: 330.0 },
      { month: 'Sep', po_count: 10, spend_inr_lakhs: 295.0 },
      { month: 'Oct', po_count: 11, spend_inr_lakhs: 330.0 },
      { month: 'Nov', po_count: 9, spend_inr_lakhs: 270.0 },
      { month: 'Dec', po_count: 11, spend_inr_lakhs: 330.0 },
      { month: 'Jan', po_count: 9, spend_inr_lakhs: 270.0 },
      { month: 'Feb', po_count: 9, spend_inr_lakhs: 265.0 },
      { month: 'Mar', po_count: 10, spend_inr_lakhs: 300.0 }
    ]
  }
];

export const calculatePoConsolidationSummary = (
  items: MultiplePoItem[] = MOCK_MULTIPLE_PO_ITEMS,
  activeCadence: PoConsolidationCadence = 'QUARTERLY'
): PoConsolidationSummary => {
  let totalSpend = 0;
  let totalCurrentPos = 0;
  let totalTargetPos = 0;
  let totalAdminSavings = 0;
  let totalScaleSavings = 0;

  items.forEach((item) => {
    totalSpend += item.total_annual_spend_cr;
    totalCurrentPos += item.annual_po_count;
    const option = item.cadence_options[activeCadence];
    totalTargetPos += option.target_pos_per_year;
    totalAdminSavings += option.admin_savings_lakhs;
    totalScaleSavings += option.scale_savings_cr;
  });

  const avgReduction =
    totalCurrentPos > 0 ? Number((((totalCurrentPos - totalTargetPos) / totalCurrentPos) * 100).toFixed(1)) : 0;

  return {
    totalFragmentedSpendCr: Number(totalSpend.toFixed(2)),
    totalCurrentPos,
    totalTargetPos,
    totalAdminCostSavingsLakhs: Number(totalAdminSavings.toFixed(1)),
    totalScaleSavingsCr: Number(totalScaleSavings.toFixed(2)),
    avgPoReductionPct: avgReduction,
    qualifiedSuppliersCount: items.length
  };
};
