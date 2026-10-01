/**
 * Executive Brief Slides 13 to 18 (Prompt 257)
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import { formatINRCrore } from '../utils/moneyModel';
import {
  BRIEF_FINDING_CARDS,
  BRIEF_PRICE_DISPERSIONS,
  BRIEF_E_AUCTIONS,
  BRIEF_CONSOLIDATION_PLANS
} from '../constants/executiveBriefConstants';

export function renderSlide13SpendFindings(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Module 1 Findings: Forensic Spend Observations & Root Causes', 'Forensic Findings', p);

  const findings = BRIEF_FINDING_CARDS;
  findings.forEach((f, idx) => {
    const fX = 40 + idx * 300;
    canvas.rect(fX, 90, 280, 400, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
    canvas.rect(fX, 90, 280, 4, { fill: '#2563EB' });

    canvas.badge(fX + 16, 105, f.findingId, { bgColor: '#2563EB', textColor: '#FFFFFF', fontSize: 8 });
    canvas.badge(fX + 75, 105, `CONFIDENCE: ${f.confidence}`, { bgColor: '#065F46', textColor: '#A7F3D0', fontSize: 8 });

    canvas.textBlock(f.title, fX + 16, 135, 248, { fontSize: 10, font: 'bold', color: '#F8FAFC', lineHeight: 13 });

    const details = [
      ['BACKGROUND', f.background],
      ['OBJECTIVE', f.objective],
      ['EVIDENCE', f.evidence],
      ['POTENTIAL VALUE', f.potentialValueDisplay],
      ['NEXT STEP', f.nextStep]
    ];

    let dY = 195;
    details.forEach(([lbl, val]) => {
      canvas.text(lbl, fX + 16, dY, { fontSize: 8, font: 'bold', color: '#38BDF8' });
      canvas.textBlock(val, fX + 16, dY + 12, 248, { fontSize: 8, font: 'regular', color: '#CBD5E1', lineHeight: 10 });
      dY += 40;
    });

    canvas.text(f.detailedAnalysisRef, fX + 16, 475, { fontSize: 7.5, font: 'italic', color: '#94A3B8' });
  });

  canvas.renderFooter(clientName, conf, p, total);
}

export function renderSlide14OpportunityMap(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Module 2 — Strategic Sourcing Opportunity Map across 42 Categories', 'Opportunity Matrix', p);

  canvas.rect(40, 90, 880, 400, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('STRATEGIC PRIORITY MATRIX: EASE OF IMPLEMENTATION VS VALUE IMPACT', 55, 112, { fontSize: 10, font: 'bold', color: '#38BDF8' });

  const qW = 410;
  const qH = 160;

  // Q1: Top Left - Quick Wins
  canvas.rect(60, 130, qW, qH, { fill: '#064E3B', stroke: '#059669', lineWidth: 1 });
  canvas.text('QUADRANT 1: QUICK WINS (HIGH VALUE, RAPID EXECUTION)', 75, 150, { fontSize: 9.5, font: 'bold', color: '#34D399' });
  canvas.text('• HDPE Packaging Bags E-Auction (Opp: ₹36.00 Cr | 0-30 Days)', 75, 175, { fontSize: 8.5, color: '#F8FAFC' });
  canvas.text('• Direct Early Payment Discounts (Opp: ₹35.60 Cr | 0-30 Days)', 75, 195, { fontSize: 8.5, color: '#F8FAFC' });
  canvas.text('• Grinding Media High-Chrome Harmonization (Opp: ₹24.60 Cr)', 75, 215, { fontSize: 8.5, color: '#F8FAFC' });
  canvas.text('• Secondary Inbound Freight E-Auction Lots (Opp: ₹16.80 Cr)', 75, 235, { fontSize: 8.5, color: '#F8FAFC' });
  canvas.text('ACTION: Immediate execution in Wave 1 tender cycle', 75, 265, { fontSize: 8, font: 'bold', color: '#A7F3D0' });

  // Q2: Top Right - Strategic Levers
  canvas.rect(490, 130, qW, qH, { fill: '#1E3A8A', stroke: '#2563EB', lineWidth: 1 });
  canvas.text('QUADRANT 2: STRATEGIC LEVERS (HIGH VALUE, DEEPER COMPLEXITY)', 505, 150, { fontSize: 9.5, font: 'bold', color: '#93C5FD' });
  canvas.text('• Petcoke & Coal PCBI Benchmark Indexing (Opp: ₹71.00 Cr | 60-90 Days)', 505, 175, { fontSize: 8.5, color: '#F8FAFC' });
  canvas.text('• MRO Tail Vendor Base Consolidation (Opp: ₹47.20 Cr | 60-90 Days)', 505, 195, { fontSize: 8.5, color: '#F8FAFC' });
  canvas.text('• Multi-Plant Volume Aggregation (Opp: ₹42.00 Cr | 90+ Days)', 505, 215, { fontSize: 8.5, color: '#F8FAFC' });
  canvas.text('• Category Specialization Carve-outs (Opp: ₹23.00 Cr | 90+ Days)', 505, 235, { fontSize: 8.5, color: '#F8FAFC' });
  canvas.text('ACTION: Cross-functional engineering & procurement roadmap', 505, 265, { fontSize: 8, font: 'bold', color: '#BFDBFE' });

  // Q3: Bottom Left - Operational Policies
  canvas.rect(60, 310, qW, qH, { fill: '#1F2937', stroke: '#4B5563', lineWidth: 1 });
  canvas.text('QUADRANT 3: OPERATIONAL POLICIES (MODERATE VALUE, RAPID EXECUTION)', 75, 330, { fontSize: 9.5, font: 'bold', color: '#E5E7EB' });
  canvas.text('• Contract Price Leakage Elimination (Opp: ₹11.40 Cr | 30 Days)', 75, 355, { fontSize: 8.5, color: '#D1D5DB' });
  canvas.text('• Plant Mechanical Fastener Consolidations (Opp: ₹7.70 Cr | 30 Days)', 75, 375, { fontSize: 8.5, color: '#D1D5DB' });
  canvas.text('• Warehouse Consignment Stocking Agreements (Opp: ₹6.50 Cr | 60 Days)', 75, 395, { fontSize: 8.5, color: '#D1D5DB' });
  canvas.text('ACTION: Standardize ERP purchasing controls and automated 3-way match', 75, 435, { fontSize: 8, font: 'bold', color: '#9CA3AF' });

  // Q4: Bottom Right - Structural Value
  canvas.rect(490, 310, qW, qH, { fill: '#312E81', stroke: '#4338CA', lineWidth: 1 });
  canvas.text('QUADRANT 4: STRUCTURAL VALUE (MODERATE VALUE, HIGH COMPLEXITY)', 505, 330, { fontSize: 9.5, font: 'bold', color: '#C7D2FE' });
  canvas.text('• Refractory Castable Harmonization (Opp: ₹16.50 Cr | 90+ Days)', 505, 355, { fontSize: 8.5, color: '#E0E7FF' });
  canvas.text('• Lubricant Grade Rationalization (Opp: ₹8.40 Cr | 90+ Days)', 505, 375, { fontSize: 8.5, color: '#E0E7FF' });
  canvas.text('• Conveyor Belt Technical Harmonization (Opp: ₹5.20 Cr | 90+ Days)', 505, 395, { fontSize: 8.5, color: '#E0E7FF' });
  canvas.text('ACTION: Joint technical steering committee with Technical Directors', 505, 435, { fontSize: 8, font: 'bold', color: '#A5B4FC' });

  canvas.renderFooter(clientName, conf, p, total);
}

export function renderSlide15PriceDispersion(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Price Improvement Opportunities: Statistical Percentile Dispersion', 'Price Dispersion', p);

  canvas.rect(40, 90, 880, 400, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('UNIT RATE DISPERSION BENCHMARKS ACROSS 6 REGIONAL MANUFACTURING CLUSTERS', 55, 112, { fontSize: 10, font: 'bold', color: '#38BDF8' });

  const headers = ['Category & Item', 'UOM', 'Min', 'P10', 'P25', 'Median', 'Wt Avg', 'P75', 'P90', 'Max', 'Opp (Cr)', 'Confidence'];
  const rows = BRIEF_PRICE_DISPERSIONS.map((disp) => [
    disp.item,
    disp.uom,
    disp.min.toFixed(1),
    disp.p10.toFixed(1),
    disp.p25.toFixed(1),
    disp.median.toFixed(1),
    disp.weightedAvg.toFixed(1),
    disp.p75.toFixed(1),
    disp.p90.toFixed(1),
    disp.max.toFixed(1),
    formatINRCrore(disp.potentialOppInr),
    disp.confidence
  ]);

  canvas.table(55, 125, 850, headers, rows, [210, 40, 45, 45, 45, 50, 55, 45, 45, 45, 90, 135], { headerBg: '#0F172A', rowAltBg: '#182234' });

  canvas.rect(55, 320, 850, 150, { fill: '#0F172A', stroke: '#334155', lineWidth: 1 });
  canvas.text('DISPERSION METHODOLOGY & AUDIT TRAIL', 70, 340, { fontSize: 9.5, font: 'bold', color: '#10B981' });
  canvas.textBlock(
    'Dispersion targets are calculated using historical P10–P25 boundary as the realistic achievable target rate, rather than an unachievable theoretical minimum (Min). This preserves supplier viability while capturing inter-plant variance.',
    70,
    360,
    820,
    { fontSize: 8.5, color: '#CBD5E1', lineHeight: 13 }
  );
  canvas.textBlock(
    'All price comparisons are normalized for technical specification, manufacturer credentials, and verified delivery terms (ex-works vs FOR destination). Supporting transaction ledgers are fully traceable in the Appendix.',
    70,
    395,
    820,
    { fontSize: 8.5, color: '#94A3B8', lineHeight: 13 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}

export function renderSlide16EAuction(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('E-Auction Opportunities: Dynamic Competitive Price Discovery Events', 'Dynamic Sourcing', p);

  canvas.rect(40, 90, 880, 400, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('RECOMMENDED ELECTRONIC TENDER LOTS (POTENTIAL BENEFIT SUBJECT TO EVENT)', 55, 112, { fontSize: 10, font: 'bold', color: '#38BDF8' });

  const headers = ['Category Lot', 'Eligible Spend', 'Vendor Pool', 'Auction Format', 'Reserve Logic', 'Benefit Range', 'Confidence'];
  const rows = BRIEF_E_AUCTIONS.map((ea) => [
    ea.category,
    formatINRCrore(ea.eligibleSpendInr),
    `${ea.supplierCount} Verified Bidders`,
    ea.recommendedAuctionType,
    ea.reserveLogic,
    formatINRCrore(ea.potentialBenefitInr),
    ea.confidence
  ]);

  canvas.table(55, 125, 850, headers, rows, [140, 100, 100, 160, 170, 95, 85], { headerBg: '#0F172A', rowAltBg: '#182234' });

  canvas.rect(55, 340, 850, 130, { fill: '#0F172A', stroke: '#F59E0B', lineWidth: 1 });
  canvas.text('CRITICAL E-AUCTION GOVERNANCE RULES', 70, 360, { fontSize: 9.5, font: 'bold', color: '#F59E0B' });
  canvas.textBlock(
    '1. Mandatory Pre-Qualification: Zero unverified or financially distressed suppliers permitted in dynamic rooms.',
    70,
    380,
    820,
    { fontSize: 8.5, color: '#CBD5E1', lineHeight: 12 }
  );
  canvas.textBlock(
    '2. Strict Lot Indexing: Logistics and packaging lots must feature transparent indexing mechanisms.',
    70,
    400,
    820,
    { fontSize: 8.5, color: '#CBD5E1', lineHeight: 12 }
  );
  canvas.textBlock(
    '3. Business Allocation Split: Maximum 60/40 or 70/30 L1/L2 volume allocation to safeguard business continuity.',
    70,
    420,
    820,
    { fontSize: 8.5, color: '#CBD5E1', lineHeight: 12 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}

export function renderSlide17VendorConsolidation(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Vendor Base Consolidation: Tail Spend Rationalization & Panelling', 'Vendor Rationalization', p);

  canvas.rect(40, 90, 880, 400, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('RATIONALIZATION TARGETS: CURRENT FRAGMENTED STATE VS TARGET MASTER PANELLING', 55, 112, { fontSize: 10, font: 'bold', color: '#38BDF8' });

  const headers = ['Category Scope', 'Current State', 'Target Consolidated State', 'Eligible Spend', 'Potential Value', 'Mitigated Risk'];
  const rows = BRIEF_CONSOLIDATION_PLANS.map((cp) => [
    cp.category,
    cp.currentState,
    cp.targetState,
    formatINRCrore(cp.eligibleSpendInr),
    formatINRCrore(cp.potentialBenefitInr),
    cp.risk
  ]);

  canvas.table(55, 125, 850, headers, rows, [140, 180, 180, 90, 90, 170], { headerBg: '#0F172A', rowAltBg: '#182234' });

  canvas.rect(55, 340, 850, 130, { fill: '#0F172A', stroke: '#334155', lineWidth: 1 });
  canvas.text('CONSOLIDATION EXECUTION FRAMEWORK', 70, 360, { fontSize: 9.5, font: 'bold', color: '#10B981' });
  canvas.textBlock(
    'Consolidating 912 tail vendors into 180 certified master channel partners eliminates thousands of individual monthly purchase orders, reduces AP processing drag, and enables tier volume rebates of 8% to 12%.',
    70,
    380,
    820,
    { fontSize: 8.5, color: '#CBD5E1', lineHeight: 13 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}

export function renderSlide18MultiCategory(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Multi-Category Supplier Analysis: Category Specialization Opportunities', 'Supplier Realignment', p);

  canvas.rect(40, 90, 880, 400, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('SUPPLIERS PROVIDING ITEMS OUTSIDE THEIR PRIMARY CORE COMPETENCY', 55, 112, { fontSize: 10, font: 'bold', color: '#38BDF8' });

  const headers = ['Supplier Name', 'Core Category Specialization', 'Non-Core Supplied', 'Non-Core Spend', 'Recommended Route', 'Opportunity'];
  const rows = [
    ['Apex Industrial Services Ltd', 'Civil Structural Fabrication', 'Electrical Switchgear Spares', '₹18.40 Cr', 'Route to OEM distributor', '₹2.40 Cr'],
    ['Balaji Heavy Logistics Corp', 'Bulk Clinker Transport', 'Packaging Sacks', '₹14.20 Cr', 'Carve out into packaging RFP', '₹1.80 Cr'],
    ['Shree Ganesh Steels', 'Structural Steel Angles', 'Safety PPE Equipment', '₹9.80 Cr', 'Consolidate into national PPE contract', '₹1.20 Cr'],
    ['Western Mining & Minerals', 'High Grade Limestone Mining', 'Conveyor Belting & Fasteners', '₹8.60 Cr', 'Route directly to conveyor OEM', '₹1.10 Cr']
  ];

  canvas.table(55, 125, 850, headers, rows, [150, 160, 160, 90, 180, 110], { headerBg: '#0F172A', rowAltBg: '#182234' });

  canvas.rect(55, 340, 850, 130, { fill: '#0F172A', stroke: '#2563EB', lineWidth: 1 });
  canvas.text('CATEGORY SPECIALIZATION VALUE PROPOSITION', 70, 360, { fontSize: 9.5, font: 'bold', color: '#38BDF8' });
  canvas.textBlock(
    'When contractors supply non-core products, they act as intermediaries, adding 12% to 18% trading margins. Re-routing these non-core orders directly to specialized manufacturers captures margin while improving engineering support.',
    70,
    380,
    820,
    { fontSize: 8.5, color: '#CBD5E1', lineHeight: 13 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}
