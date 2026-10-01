/**
 * Executive Brief Slides 19 to 24 (Prompt 257)
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import { formatINR, formatINRCrore } from '../utils/moneyModel';
import {
  BRIEF_PCBI_BENCHMARKS,
  BRIEF_SAVINGS_INITIATIVES
} from '../constants/executiveBriefConstants';
import {
  RAW_GROSS_OPP_INR,
  RAW_NET_DEFENSIBLE_INR,
  RAW_APPROVED_MODULE4_INR,
  RAW_REALIZED_INR
} from '../constants/numericalAuditConstants';

export function renderSlide19VolumeAggregation(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Volume Aggregation: National Demand Pooling on Standardized Specs', 'Scale Sourcing', p);

  canvas.rect(40, 90, 880, 400, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('CROSS-PLANT DEMAND POOLING (CATEGORY + ITEM + SPECIFICATION + UOM)', 55, 112, { fontSize: 10, font: 'bold', color: '#38BDF8' });

  const headers = ['Commodity Spec', 'UOM', 'Fragmented Lots', 'Pooled Volume', 'Supplier Base', 'Potential Benefit'];
  const rows = [
    ['Grinding Media Balls High Chrome 70mm', 'MT', '18 Plant POs (200-500 MT each)', '14,200 MT Consolidated', 'Expanded to 12 national mills', '₹14.20 Cr (10% Tier Discount)'],
    ['Double Laminated HDPE Cement Sacks 50kg', 'M Pcs', '24 Local Purchase Orders', '320 Million Pcs Total', 'Direct primary polymer converters', '₹19.20 Cr (Dynamic E-Auction)'],
    ['Synthetic Heavy Industrial Gear Lubricants', 'KL', '14 Fragmented Orders', '1,850 KL National Contract', 'Direct OEM refinery pact', '₹5.60 Cr (Direct Contract)'],
    ['Synthetic Filter Bags for Baghouses', 'Pcs', '12 Replacement Orders', '48,000 Pcs Master Order', 'Direct from technical textile mills', '₹3.00 Cr (Bulk Order)']
  ];

  canvas.table(55, 125, 850, headers, rows, [190, 50, 160, 140, 160, 150], { headerBg: '#0F172A', rowAltBg: '#182234' });

  canvas.rect(55, 340, 850, 130, { fill: '#0F172A', stroke: '#10B981', lineWidth: 1 });
  canvas.text('VOLUME AGGREGATION AUDIT MANDATE', 70, 360, { fontSize: 9.5, font: 'bold', color: '#10B981' });
  canvas.textBlock(
    'Volume aggregation is evaluated strictly on identical technical specifications and UOMs. Demand is never arbitrarily grouped across dissimilar grades. By consolidating fragmented plant orders, the enterprise commands Tier-1 commercial pricing and priority factory allocations.',
    70,
    380,
    820,
    { fontSize: 8.5, color: '#CBD5E1', lineHeight: 13 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}

export function renderSlide20PCBICoverage(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Module 3 — PCBI Benchmark Coverage & Market Alignment', 'Market Intelligence', p);

  // 4 KPI Cards
  canvas.kpiCard(40, 90, 205, 85, 'Benchmarkable Spend', '₹2,450.00 Cr', 'Direct Materials & Fuels', '#2563EB');
  canvas.kpiCard(265, 90, 205, 85, 'Covered PCBI Spend', '₹1,180.00 Cr', '48.2% Effective Coverage', '#38BDF8');
  canvas.kpiCard(490, 90, 205, 85, 'Index Quality Rating', 'GRADE A+', 'Independent Verified Feeds', '#10B981');
  canvas.kpiCard(715, 90, 205, 85, 'Identified Market Gap', '₹12.60 Cr', 'Verified vs Landed Indices', '#F59E0B');

  // Data Quality & Provenance Grid
  canvas.rect(40, 190, 880, 295, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('PCBI INDEPENDENT COMMODITY BENCHMARK ARCHITECTURE', 55, 212, { fontSize: 10, font: 'bold', color: '#38BDF8' });

  const principles = [
    ['Independent Market Sources', 'PCBI benchmarks consume customs clearance filings, port manifests, and commodity exchanges.'],
    ['Strict Technical Isolation', 'Customer purchase transactions NEVER enter PCBI benchmark series. Zero contamination exists.'],
    ['High-Frequency Tracking', 'Commodity prices are tracked on weekly and monthly intervals to capture cyclicality.'],
    ['Unmatched Provenance Integrity', 'Every PCBI point carries explicit checksum provenance, timestamp, and verified specs.']
  ];

  let pY = 235;
  principles.forEach(([title, desc]) => {
    canvas.text(title, 55, pY, { fontSize: 10, font: 'bold', color: '#F8FAFC' });
    canvas.textBlock(desc, 55, pY + 14, 850, { fontSize: 8.5, color: '#CBD5E1', lineHeight: 12 });
    pY += 45;
  });

  canvas.renderFooter(clientName, conf, p, total);
}

export function renderSlide21PCBIFindings(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('PCBI Benchmark Findings: Customer Purchase Rate vs Market Indices', 'Market Benchmarks', p);

  canvas.rect(40, 90, 880, 400, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('COMMODITY INDEX VARIANCE DISCOVERY (PROVENANCE VERIFIED)', 55, 112, { fontSize: 10, font: 'bold', color: '#38BDF8' });

  const headers = ['Commodity & Spec', 'UOM', 'Customer Rate', 'PCBI Ref', 'Variance %', 'Quality Rating', 'Official Data Source'];
  const rows = BRIEF_PCBI_BENCHMARKS.map((bm) => [
    bm.commodity,
    bm.uom,
    formatINR(bm.customerPrice, false),
    formatINR(bm.pcbiReference, false),
    `${bm.variancePercent.toFixed(1)}%`,
    bm.qualityRating,
    bm.source
  ]);

  canvas.table(55, 125, 850, headers, rows, [190, 40, 90, 90, 80, 160, 200], { headerBg: '#0F172A', rowAltBg: '#182234' });

  canvas.rect(55, 340, 850, 130, { fill: '#0F172A', stroke: '#10B981', lineWidth: 1 });
  canvas.text('PCBI OBSERVATION: IMPORTED PETCOKE & RESIN PREMIUMS', 70, 360, { fontSize: 9.5, font: 'bold', color: '#10B981' });
  canvas.textBlock(
    'Analysis reveals customer pricing for imported petroleum coke was 6.28% above port-landed spot indices during Q3 FY24, primarily due to fixed-price quarterly agreements during a softening freight cycle. Transitioning to indexed formulas with fixed conversion spreads captures ₹12.60 Cr.',
    70,
    380,
    820,
    { fontSize: 8.5, color: '#CBD5E1', lineHeight: 13 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}

export function renderSlide22BenchmarkOpportunities(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Benchmark-Guided Sourcing Interventions & Index Contract Formulas', 'Index Contracting', p);

  canvas.rect(40, 90, 880, 400, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('INDEX-LINKED SOURCING MODELS TO MITIGATE RAW MATERIAL PRICE RISK', 55, 112, { fontSize: 10, font: 'bold', color: '#38BDF8' });

  const models = [
    ['Petcoke Index-Linked Formula', 'Price = Argus/Platts CFR West Coast Port Index + Freight Adder + Fixed Handling Spread', 'Protects against supplier margin padding during downward global commodity cycles.'],
    ['Polypropylene Polymer Conversion Spread Contract', 'Price = Reliance/IOCL Domestic PP Polymer Spot Index + Verified Conversion Cost Adder', 'Isolates raw plastic resin market movements from packaging sack manufacturing fabrication margins.'],
    ['Thermal Coal Heat-Value (GCV) Indexation', 'Price = Port Landed Index * (Actual Received GCV / Guaranteed 5000 kcal/kg GCV)', 'Eliminates moisture and ash penalty leakage by tying settlement directly to bomb calorimeter tests.']
  ];

  let mY = 135;
  models.forEach(([title, formula, rationale]) => {
    canvas.text(title.toUpperCase(), 55, mY, { fontSize: 10, font: 'bold', color: '#38BDF8' });
    canvas.rect(55, mY + 12, 850, 26, { fill: '#0F172A', stroke: '#334155', lineWidth: 0.5 });
    canvas.text(`Formula: ${formula}`, 65, mY + 28, { fontSize: 8.5, font: 'bold', color: '#10B981' });
    canvas.textBlock(`Strategic Rationale: ${rationale}`, 55, mY + 45, 850, { fontSize: 8.5, color: '#CBD5E1', lineHeight: 11 });
    mY += 80;
  });

  canvas.renderFooter(clientName, conf, p, total);
}

export function renderSlide23SavingsPipeline(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Module 4 — Savings Execution Pipeline & Downstream Value Handoff', 'Execution Governance', p);

  canvas.rect(40, 90, 880, 115, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('THE SEVEN STAGES OF VALUE CONVERSION', 55, 110, { fontSize: 10, font: 'bold', color: '#38BDF8' });

  const pipeline = [
    ['1. IDENTIFIED', formatINRCrore(RAW_GROSS_OPP_INR), 'Gross potential across 10 levers'],
    ['2. VALIDATED', '₹278.40 Cr', 'Technical spec & supplier checks'],
    ['3. APPROVED', formatINRCrore(RAW_NET_DEFENSIBLE_INR), 'Signed-off defensible baseline'],
    ['4. IN EXECUTION', formatINRCrore(RAW_APPROVED_MODULE4_INR), 'Active Wave 1 handoff packages'],
    ['5. NEGOTIATED', '₹31.20 Cr', 'Agreed vendor revised terms'],
    ['6. REALIZED', formatINRCrore(RAW_REALIZED_INR), 'Audited invoice voucher credits'],
    ['7. SUSTAINED', '₹18.60 Cr', 'Continuous compliance tracking']
  ];

  pipeline.forEach((pl, idx) => {
    const pX = 55 + idx * 122;
    canvas.badge(pX, 125, pl[0], { bgColor: idx >= 5 ? '#065F46' : idx >= 3 ? '#2563EB' : '#1E293B', textColor: '#F8FAFC', fontSize: 7.5 });
    canvas.text(pl[1], pX, 155, { fontSize: 11, font: 'bold', color: '#F8FAFC' });
    canvas.textBlock(pl[2], pX, 170, 115, { fontSize: 7, color: '#94A3B8', lineHeight: 8.5 });
  });

  canvas.rect(40, 220, 880, 270, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('SAVINGS REALIZATION GOVERNANCE & P&L HARDENING', 55, 240, { fontSize: 10, font: 'bold', color: '#10B981' });

  const govSteps = [
    ['Baseline Locking', 'Pre-award contracted volume and unit price frozen to prevent baseline shifting or inflated claims.'],
    ['Cryptographic Token Handoff', 'Module 4 packages consume signed cryptographic tokens from Module 2.'],
    ['Three-Way Invoice Match Audit', 'Realized savings are recognized strictly upon verification of PO, delivery, and payment.'],
    ['EBITDA Reconciliation Cadence', 'Bi-weekly finance steering committee reconciling savings with plant cost sheets.']
  ];

  let gY = 265;
  govSteps.forEach(([title, desc]) => {
    canvas.text(title, 55, gY, { fontSize: 10, font: 'bold', color: '#38BDF8' });
    canvas.textBlock(desc, 55, gY + 14, 850, { fontSize: 8.5, color: '#CBD5E1', lineHeight: 12 });
    gY += 45;
  });

  canvas.renderFooter(clientName, conf, p, total);
}

export function renderSlide24SavingsRealization(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Savings Realization: Wave 1 Initiative Tracking & Milestone Status', 'Initiative Ledger', p);

  canvas.rect(40, 90, 880, 400, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('ACTIVE WAVE 1 IMPLEMENTATION PACKAGES (APPROVED: ' + formatINRCrore(RAW_APPROVED_MODULE4_INR) + ')', 55, 112, { fontSize: 10, font: 'bold', color: '#38BDF8' });

  const headers = ['Initiative ID', 'Strategic Initiative', 'Baseline Spend', 'Target Benefit', 'Realized (Cr)', 'Realized %', 'Status', 'Owner'];
  const rows = BRIEF_SAVINGS_INITIATIVES.map((si) => [
    si.initiativeId,
    si.initiative,
    formatINRCrore(si.baselineSpendInr),
    formatINRCrore(si.approvedBenefitInr),
    formatINRCrore(si.realizedBenefitInr),
    `${si.realizationPercent.toFixed(1)}%`,
    si.status,
    si.owner
  ]);

  canvas.table(55, 125, 850, headers, rows, [70, 240, 90, 85, 80, 65, 110, 110], { headerBg: '#0F172A', rowAltBg: '#182234' });

  canvas.rect(55, 380, 850, 90, { fill: '#0F172A', stroke: '#10B981', lineWidth: 1 });
  canvas.text('EXECUTIVE REALIZATION SUMMARY', 70, 400, { fontSize: 9.5, font: 'bold', color: '#10B981' });
  canvas.textBlock(
    `Across 5 approved Wave-1 initiatives, ${formatINRCrore(RAW_REALIZED_INR)} (44.7% of approved targets) has been contractually secured and reflected in cost vouchers. Remaining initiatives track within timeline tolerances.`,
    70,
    418,
    820,
    { fontSize: 8.5, color: '#CBD5E1', lineHeight: 12 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}
