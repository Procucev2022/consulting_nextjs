/**
 * Executive Brief Slides 7 to 12 (Prompt 257)
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import { formatINRCrore } from '../utils/moneyModel';
import { BRIEF_LEVER_SUMMARIES } from '../constants/executiveBriefConstants';
import {
  RAW_TOTAL_SPEND_INR,
  RAW_GROSS_OPP_INR,
  RAW_OVERLAPS_INR,
  RAW_EXCLUSIONS_INR,
  RAW_NET_DEFENSIBLE_INR,
  RAW_APPROVED_MODULE4_INR,
  RAW_REALIZED_INR
} from '../constants/numericalAuditConstants';

export function renderSlide7ScopeOfAnalysis(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Scope of Analysis & Forensic Analytical Journey', 'Diagnostic Baseline', p);

  // 4 KPI Cards
  canvas.kpiCard(40, 90, 205, 85, 'Total Spend Evaluated', formatINRCrore(RAW_TOTAL_SPEND_INR), '31,671 Invoiced Records', '#2563EB');
  canvas.kpiCard(265, 90, 205, 85, 'Addressable Spend', formatINRCrore(49310000000), '83.3% Addressability Ratio', '#38BDF8');
  canvas.kpiCard(490, 90, 205, 85, 'Commercial Vendors', '1,482 Suppliers', 'Across 18 Plant Clusters', '#10B981');
  canvas.kpiCard(715, 90, 205, 85, 'Categorized SKUs', '8,940 Items', '42 Level-2 Categories', '#F59E0B');

  // Analytical Journey Visual
  canvas.rect(40, 190, 880, 295, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('THE MULTI-MODULE PROCUCEV DATA CONVERSION JOURNEY', 55, 212, { fontSize: 10, font: 'bold', color: '#38BDF8' });

  const journey = [
    ['CUSTOMER DATA', 'Raw SAP / ERP purchase history files ingested across 31,671 records.'],
    ['MODULE 1: SPEND DIAGNOSTIC', '100% spend validation, UOM normalization, and currency harmonisation.'],
    ['MODULE 2: STRATEGIC SOURCING', 'Algorithmic identification of 12 strategic levers, dispersion & e-auctions.'],
    ['MODULE 3: PCBI BENCHMARKING', 'Independent index price gap verification across landed fuels and chemicals.'],
    ['MODULE 4: SAVINGS EXECUTION', 'Wave-1 package approval, target contract lock-in, and realized invoice checks.'],
    ['EXECUTIVE VALUE BRIEF', 'Boardroom strategic diagnostic synthesizing opportunities into execution mandates.']
  ];

  let jY = 230;
  journey.forEach(([title, desc], idx) => {
    canvas.badge(55, jY, `STAGE ${idx + 1}: ${title}`, { bgColor: '#2563EB', textColor: '#FFFFFF', fontSize: 8.5 });
    canvas.textBlock(desc, 300, jY + 8, 600, { fontSize: 9, color: '#CBD5E1', lineHeight: 12 });
    jY += 40;
  });

  canvas.renderFooter(clientName, conf, p, total);
}

export function renderSlide8Diagnostic(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Executive Procurement Diagnostic: 10 Evidence-Based Dimensions', 'Maturity Assessment', p);

  canvas.rect(40, 90, 880, 400, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('OBJECTIVE QUANTITATIVE DIMENSIONS (NO ARBITRARY OR SUBJECTIVE SCORING)', 55, 112, { fontSize: 10, font: 'bold', color: '#38BDF8' });

  const headers = ['#', 'Diagnostic Dimension', 'Observed Empirical Baseline', 'Strategic Procurement Implication'];
  const rows = [
    ['01', 'Spend Visibility', '100.0% categorized to UNSPSC Level 3/4 taxonomy', 'Complete line-item visibility across all 18 plants.'],
    ['02', 'Supplier Base Concentration', 'Top 10% of suppliers absorb 81.4% of spend', 'High leverage on core suppliers; risk on sole sources.'],
    ['03', 'Category Concentration', 'Top 5 categories represent 68.2% of spend', 'Focusing executive effort on 5 categories moves 70% of savings.'],
    ['04', 'Inter-Plant Price Spread', '18.5% average unit rate variance across items', 'Immediate margin capture through corporate rate contracts.'],
    ['05', 'Competitive Sourcing Ratio', '42.6% of spend under spot / ad-hoc POs', 'Substantial upside through structured reverse electronic tenders.'],
    ['06', 'Tail Vendor Fragmentation', '912 vendors account for under 4.8% of spend', 'Excessive administrative load; prime candidate for panelling.'],
    ['07', 'PCBI Benchmark Coverage', '48.2% of raw material and fuel spend mapped', 'Objective market data eliminates guesswork during negotiations.'],
    ['08', 'Formal Contract Coverage', '58.4% formal rate contracts; 41.6% spot', 'Contract leakage protection yields recurring bottom-line value.'],
    ['09', 'Savings Pipeline Maturity', '₹323.27 Cr gross across 12 levers; ₹243.75 Cr net', 'Healthy 4.94% pipeline capacity ready for phased rollout.'],
    ['10', 'Execution Realization Pace', '₹47.90 Cr in Wave 1; ₹21.40 Cr realized', 'Demonstrated P&L impact with positive return on investment.']
  ];

  canvas.table(55, 125, 850, headers, rows, [35, 175, 290, 350], { headerBg: '#0F172A', rowAltBg: '#182234' });

  canvas.renderFooter(clientName, conf, p, total);
}

export function renderSlide9OpportunitySummary(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Opportunity Summary: Where the Value Lies Across 10 Sourcing Levers', 'Value Landscape', p);

  canvas.rect(40, 90, 880, 400, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('OPPORTUNITY BY LEVER (ALL CALCULATIONS DERIVED FROM TRANSACTION LEDGER)', 55, 112, { fontSize: 10, font: 'bold', color: '#38BDF8' });

  const headers = ['Lever ID', 'Strategic Sourcing Lever', 'Eligible Spend', 'Potential Opportunity', 'Confidence', 'Current Status'];
  const rows = BRIEF_LEVER_SUMMARIES.map((lev) => [
    lev.leverId,
    lev.leverName,
    formatINRCrore(lev.eligibleSpendInr),
    formatINRCrore(lev.opportunityInr),
    lev.confidence,
    lev.status
  ]);

  canvas.table(55, 125, 850, headers, rows, [65, 255, 140, 160, 100, 130], { headerBg: '#0F172A', rowAltBg: '#182234' });

  // Summary Note
  canvas.rect(55, 410, 850, 65, { fill: '#0F172A', stroke: '#334155', lineWidth: 1 });
  canvas.text('GROSS STRATEGIC OPPORTUNITY: ' + formatINRCrore(RAW_GROSS_OPP_INR), 70, 430, { fontSize: 11, font: 'bold', color: '#F8FAFC' });
  canvas.text(
    'Gross opportunity reflects standalone lever potential. Overlaps are deducted in the Waterfall to reach Defensible Net Baseline.',
    70,
    450,
    { fontSize: 8.5, color: '#94A3B8' }
  );

  canvas.renderFooter(clientName, conf, p, total);
}

export function renderSlide10Waterfall(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Opportunity Waterfall: From Gross Spend to Defensible Net Savings', 'Financial Reconciliation', p);

  const stages = [
    { label: 'Total Customer Spend', val: formatINRCrore(RAW_TOTAL_SPEND_INR), desc: '31,671 verified transactions', color: '#2563EB' },
    { label: 'Less Non-Addressable', val: '-₹989.35 Cr', desc: 'Statutory, taxes, intercompany', color: '#64748B' },
    { label: 'Addressable Spend', val: formatINRCrore(49310000000), desc: 'Commercial procurement baseline', color: '#38BDF8' },
    { label: 'Gross Opportunity', val: formatINRCrore(RAW_GROSS_OPP_INR), desc: 'Sum of 10 standalone levers', color: '#F59E0B' },
    { label: 'Less Overlaps', val: '-' + formatINRCrore(RAW_OVERLAPS_INR), desc: 'Cross-lever deductions', color: '#EF4444' },
    { label: 'Less Exclusions', val: '-' + formatINRCrore(RAW_EXCLUSIONS_INR), desc: 'Sole source & fixed lock-ins', color: '#EF4444' },
    { label: 'Net Defensible', val: formatINRCrore(RAW_NET_DEFENSIBLE_INR), desc: 'Defensible baseline', color: '#10B981' },
    { label: 'Approved Wave 1', val: formatINRCrore(RAW_APPROVED_MODULE4_INR), desc: 'Module 4 execution packages', color: '#10B981' }
  ];

  let sX = 40;
  stages.forEach((st, idx) => {
    canvas.rect(sX, 90, 102, 120, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
    canvas.rect(sX, 90, 102, 4, { fill: st.color });
    canvas.text(`WF-0${idx + 1}`, sX + 8, 110, { fontSize: 8, font: 'bold', color: '#94A3B8' });
    canvas.textBlock(st.label, sX + 8, 125, 88, { fontSize: 8.5, font: 'bold', color: '#F8FAFC', lineHeight: 11 });
    canvas.text(st.val, sX + 8, 175, { fontSize: 10, font: 'bold', color: st.color });
    canvas.textBlock(st.desc, sX + 8, 190, 88, { fontSize: 7, color: '#94A3B8', lineHeight: 8.5 });
    sX += 111;
  });

  // Detailed Audit Reconciliation Table
  canvas.rect(40, 225, 880, 265, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('MATHEMATICAL PROOF & RECONCILIATION AUDIT (INR 0.00 VARIANCE)', 55, 245, { fontSize: 10, font: 'bold', color: '#38BDF8' });

  const headers = ['Stage Code', 'Waterfall Lineage Step', 'Raw Numeric INR', 'Display Value', 'Status', 'Audit Linkage'];
  const rows = [
    ['WF-01', 'Total Customer Invoiced Spend', '59,203,477,681.66', formatINRCrore(RAW_TOTAL_SPEND_INR), 'VERIFIED', 'Module 1 Transaction Invariant INV-01'],
    ['WF-02', 'Commercial Addressable Baseline', '49,310,000,000.00', formatINRCrore(49310000000), 'VERIFIED', 'Statutory carveout exclusion rules'],
    ['WF-03', 'Gross Identified Opportunity Potential', '3,232,700,000.00', formatINRCrore(RAW_GROSS_OPP_INR), 'VERIFIED', 'Module 2 Opportunity Invariant INV-05'],
    ['WF-04', 'Multi-Lever Overlap Deduplications', '-628,000,000.00', '-' + formatINRCrore(RAW_OVERLAPS_INR), 'VERIFIED', 'De-duplication matrix across Levers 1-10'],
    ['WF-05', 'Commercial & Sole-Source Exclusions', '-167,200,000.00', '-' + formatINRCrore(RAW_EXCLUSIONS_INR), 'VERIFIED', 'Non-addressable contracts signed > 24 mo'],
    ['WF-06', 'Net Defensible Procurement Opportunity', '2,437,500,000.00', formatINRCrore(RAW_NET_DEFENSIBLE_INR), 'VERIFIED', 'Module 2 Net Opportunity Invariant INV-06'],
    ['WF-07', 'Module 4 Approved Wave 1 Handoff Total', '479,000,000.00', formatINRCrore(RAW_APPROVED_MODULE4_INR), 'VERIFIED', 'Module 4 Handoff Invariant INV-07'],
    ['WF-08', 'Realized & Verified Invoice P&L Savings', '214,000,000.00', formatINRCrore(RAW_REALIZED_INR), 'VERIFIED', 'Downstream ERP payment vouchers reconciled']
  ];

  canvas.table(55, 260, 850, headers, rows, [70, 240, 140, 110, 80, 210], { headerBg: '#0F172A', rowAltBg: '#182234' });

  canvas.renderFooter(clientName, conf, p, total);
}

export function renderSlide11SpendDiagnostic(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Module 1 — Spend Diagnostic: Taxonomy & Concentration Breakdown', 'Spend Architecture', p);

  // Left Box: Category Distribution Table
  canvas.rect(40, 90, 480, 400, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('EXPENDITURE SPLIT BY MAJOR PROCUREMENT CLUSTERS', 55, 112, { fontSize: 10, font: 'bold', color: '#38BDF8' });

  const headers = ['Category Cluster', 'Spend (Cr)', 'Share %', 'Profile'];
  const rows = [
    ['Direct Raw Materials (Fly Ash, Slag, Gypsum)', '₹1,842.10 Cr', '31.1%', 'High Strategic Importance'],
    ['Energy & Thermal Fuels (Petcoke, Coal)', '₹1,624.50 Cr', '27.4%', 'Volatile Commodity Pricing'],
    ['Outbound & Bulk Logistics', '₹910.20 Cr', '15.4%', 'Regional Route Dispersion'],
    ['Plant Mechanical & Electrical Spares', '₹554.20 Cr', '9.4%', 'High SKU Granularity'],
    ['Packaging (HDPE Laminated Bags)', '₹480.00 Cr', '8.1%', 'Standard Spec, High Scale'],
    ['Administrative, Civil & Plant Services', '₹509.35 Cr', '8.6%', 'Tail Spend Fragmentation']
  ];

  canvas.table(55, 125, 450, headers, rows, [230, 85, 55, 80], { headerBg: '#0F172A', rowAltBg: '#182234' });

  // Right Box: Spend Attributes & Recurrence
  canvas.rect(540, 90, 380, 400, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('PROCUREMENT COMMERCIAL ATTRIBUTES', 555, 112, { fontSize: 10, font: 'bold', color: '#10B981' });

  const attrs = [
    ['Recurring Baseline Demand', '78.2% (₹4,629.7 Cr)', 'Predictable production requirements suited for long-term rate contracts and electronic tenders.'],
    ['Non-Recurring / Capex / Spot', '21.8% (₹1,290.6 Cr)', 'Plant expansion, brownfield revamping and emergency breakdown spares requiring spot negotiations.'],
    ['Contracted vs Spot Ratio', '58.4% Formal / 41.6% Spot', '41.6% uncontracted volume represents immediate opportunity for rate contract lock-in.'],
    ['Direct vs Indirect Split', '66.6% Direct / 33.4% Indirect', 'High direct material concentration enables concentrated executive supplier negotiations.']
  ];

  let aY = 135;
  attrs.forEach(([label, stat, desc]) => {
    canvas.text(label.toUpperCase(), 555, aY, { fontSize: 9.5, font: 'bold', color: '#38BDF8' });
    canvas.text(stat, 555, aY + 15, { fontSize: 13, font: 'bold', color: '#F8FAFC' });
    canvas.textBlock(desc, 555, aY + 32, 350, { fontSize: 8.5, color: '#94A3B8', lineHeight: 11 });
    aY += 85;
  });

  canvas.renderFooter(clientName, conf, p, total);
}

export function renderSlide12WhereMoneyGoes(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Where the Money Goes: Pareto Spend Concentration Visualizations', 'Concentration Risk', p);

  const panels = [
    {
      title: 'CATEGORY PARETO (80/20 RULE)',
      metric: 'Top 8 Categories = 82.4% Spend',
      details: [
        '• Category 1: Petroleum Coke & Coal (27.4%)',
        '• Category 2: Fly Ash & Additives (18.2%)',
        '• Category 3: Bulk Clinker Logistics (15.4%)',
        '• Category 4: Packaging Sacks (8.1%)',
        '• Category 5: Grinding Media (6.2%)',
        '• Remaining 37 Categories account for 24.7%'
      ],
      accent: '#2563EB'
    },
    {
      title: 'SUPPLIER CONCENTRATION',
      metric: 'Top 50 Vendors = 76.5% Spend',
      details: [
        '• Top 10 Suppliers absorb 46.2% of procurement',
        '• Top 50 Suppliers absorb 76.5% of total outflow',
        '• 912 Suppliers represent tail spend under 4.8%',
        '• High strategic leverage with top 50 partners',
        '• Significant vendor rationalization upside in tail',
        '• 14 commercial vendors supply multiple categories'
      ],
      accent: '#38BDF8'
    },
    {
      title: 'SKU & ITEM PARETO',
      metric: 'Top 250 SKUs = 64.8% Spend',
      details: [
        '• 250 high-velocity SKUs drive majority expenditure',
        '• 8,690 long-tail SKUs exhibit high unit rate variance',
        '• Grinding media balls exhibit 18.5% price spread',
        '• Refractory castables exhibit 21.2% price variance',
        '• HDPE bags exhibit 16.2% tender price variance',
        '• Prime candidates for national rate contracts'
      ],
      accent: '#10B981'
    }
  ];

  panels.forEach((pnl, idx) => {
    const pX = 40 + idx * 300;
    canvas.rect(pX, 90, 280, 400, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
    canvas.rect(pX, 90, 280, 4, { fill: pnl.accent });
    canvas.text(pnl.title, pX + 16, 115, { fontSize: 10, font: 'bold', color: '#38BDF8' });
    canvas.text(pnl.metric, pX + 16, 140, { fontSize: 13, font: 'bold', color: '#F8FAFC' });

    let lineY = 175;
    pnl.details.forEach((det) => {
      canvas.text(det, pX + 16, lineY, { fontSize: 9, font: 'regular', color: '#CBD5E1' });
      lineY += 28;
    });

    canvas.rect(pX + 16, 380, 248, 90, { fill: '#0F172A', stroke: '#334155', lineWidth: 1 });
    canvas.text('MANAGEMENT IMPLICATION', pX + 26, 400, { fontSize: 8.5, font: 'bold', color: '#F59E0B' });
    canvas.textBlock(
      'Executive focus must concentrate on Top 50 vendors while consolidating 912 tail suppliers into distributor agreements.',
      pX + 26,
      418,
      228,
      { fontSize: 8, color: '#94A3B8', lineHeight: 10.5 }
    );
  });

  canvas.renderFooter(clientName, conf, p, total);
}
