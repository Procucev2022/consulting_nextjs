/**
 * Executive Brief Slides 1 to 6 (Prompt 257)
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import { formatINRCrore } from '../utils/moneyModel';
import {
  PROCUCEV_PROFILE,
  DEFAULT_CLIENT_PROFILE
} from '../constants/executiveBriefConstants';
import {
  RAW_TOTAL_SPEND_INR,
  RAW_NET_DEFENSIBLE_INR,
  RAW_APPROVED_MODULE4_INR,
  RAW_REALIZED_INR
} from '../constants/numericalAuditConstants';

export function renderSlide1Cover(canvas: PdfCanvas, clientName: string): void {
  canvas.rect(0, 0, 960, 540, { fill: '#0A0F1D' });
  canvas.rect(40, 40, 6, 460, { fill: '#2563EB' });

  canvas.badge(60, 70, 'BOARD-LEVEL STRATEGIC PROCUREMENT ADVISORY', { bgColor: '#1E293B', textColor: '#38BDF8' });
  canvas.text('Procurement Value & Savings Diagnostic', 60, 140, { fontSize: 32, font: 'bold', color: '#F8FAFC' });
  canvas.text(`Executive Brief for ${clientName}`, 60, 180, { fontSize: 20, font: 'bold', color: '#94A3B8' });

  canvas.rect(60, 220, 840, 1, { fill: '#334155' });

  canvas.text('PREPARED BY', 60, 260, { fontSize: 10, font: 'bold', color: '#64748B' });
  canvas.text('Procucev / aiCEV Procurement Advisory Services', 60, 280, { fontSize: 13, font: 'bold', color: '#F8FAFC' });

  canvas.text('ANALYSIS PERIOD', 60, 320, { fontSize: 10, font: 'bold', color: '#64748B' });
  canvas.text(
    'FY 2021-22 to FY 2024-25 (31,671 Invoiced Purchase Records Evaluated)',
    60,
    340,
    { fontSize: 12, font: 'regular', color: '#CBD5E1' }
  );

  canvas.text('TOTAL SPEND EVALUATED', 60, 380, { fontSize: 10, font: 'bold', color: '#64748B' });
  canvas.text(
    `${formatINRCrore(RAW_TOTAL_SPEND_INR)} (Addressable: ${formatINRCrore(49310000000)})`,
    60,
    400,
    { fontSize: 14, font: 'bold', color: '#38BDF8' }
  );

  canvas.text('CLASSIFICATION', 60, 440, { fontSize: 10, font: 'bold', color: '#64748B' });
  canvas.text(
    `STRICTLY CONFIDENTIAL — Prepared exclusively for the Board & Executive Leadership of ${clientName}`,
    60,
    460,
    { fontSize: 10, font: 'italic', color: '#94A3B8' }
  );
}

export function renderSlide2ExecutiveSummary(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Executive Summary: Core Findings & Leadership Decision Matrix', 'Strategic Synthesis', p);

  // 4 Top KPI Cards
  canvas.kpiCard(40, 85, 205, 90, 'Total Spend Evaluated', formatINRCrore(RAW_TOTAL_SPEND_INR), '31,671 Transactions', '#2563EB');
  canvas.kpiCard(265, 85, 205, 90, 'Addressable Spend', formatINRCrore(49310000000), '83.3% of Procurement', '#38BDF8');
  canvas.kpiCard(490, 85, 205, 90, 'Defensible Net Opportunity', formatINRCrore(RAW_NET_DEFENSIBLE_INR), '4.94% Yield', '#10B981');
  canvas.kpiCard(715, 85, 205, 90, 'Wave 1 Approved Execution', formatINRCrore(RAW_APPROVED_MODULE4_INR), `${formatINRCrore(RAW_REALIZED_INR)} Realized`, '#F59E0B');

  // 9 Core Leadership Questions Grid
  canvas.rect(40, 190, 880, 305, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('EXECUTIVE PROCUREMENT AUDIT & GOVERNANCE RESPONSES', 55, 212, { fontSize: 11, font: 'bold', color: '#38BDF8' });

  const questions = [
    ['1. Scope Analysed', 'Direct raw materials, energy/fuels, packaging, logistics, and plant MRO contracts.'],
    ['2. Spend Evaluated', `${formatINRCrore(RAW_TOTAL_SPEND_INR)} across 18 manufacturing facilities.`],
    ['3. Transaction Count', '31,671 purchase orders normalized and forensic validated (0 duplicates).'],
    ['4. Supplier Count', '1,482 active commercial vendors evaluated across all plant clusters.'],
    ['5. Category Count', '42 procurement categories classified into standardized UNSPSC taxonomy.'],
    ['6. Major Levers', 'Price harmonization, competitive dynamic e-auctions, and tail vendor consolidation.'],
    ['7. Opportunity Range', `${formatINRCrore(RAW_NET_DEFENSIBLE_INR)} net of mathematical overlaps and exclusions.`],
    ['8. Active Execution Status', `${formatINRCrore(RAW_APPROVED_MODULE4_INR)} in approved Wave-1 initiatives.`],
    ['9. Recommended Action', 'Institute Cross-Plant Sourcing Council and execute Wave-1 dynamic electronic tenders.']
  ];

  let qY = 230;
  questions.forEach(([q, a]) => {
    canvas.text(q, 55, qY, { fontSize: 9, font: 'bold', color: '#F8FAFC' });
    canvas.text(a, 270, qY, { fontSize: 9, font: 'regular', color: '#CBD5E1' });
    qY += 28;
  });

  canvas.renderFooter(clientName, conf, p, total);
}

export function renderSlide3AboutProcucev(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('About Procucev: Industrial Procurement Intelligence & Sourcing Execution', 'Corporate Profile', p);

  // Left Box: Positioning
  canvas.rect(40, 90, 420, 400, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.rect(40, 90, 4, 400, { fill: '#2563EB' });
  canvas.text('POSITIONING & OPERATING MODEL', 60, 115, { fontSize: 11, font: 'bold', color: '#38BDF8' });

  canvas.textBlock(
    'Procucev is an enterprise procurement advisory and execution platform purpose-built for heavy manufacturing. We bridge the gap between static management consulting presentations and realized EBITDA expansion.',
    60,
    140,
    380,
    { fontSize: 10, color: '#CBD5E1', lineHeight: 16 }
  );

  canvas.text('OUR FOUR PILLARS', 60, 230, { fontSize: 10, font: 'bold', color: '#F8FAFC' });

  const pillars = [
    ['Procurement Domain Expertise', 'Decades of deep category benchmarks across heavy manufacturing.'],
    ['Forensic Data Engineering', '100% transaction-level lineage with zero interpolation or synthetic data.'],
    ['AI & Decision Intelligence', 'Automated UNSPSC classification and real-time market dispersion analytics.'],
    ['Turnkey Execution Management', 'Hands-on e-auction facilitation, vendor negotiations, and contract lock-in.']
  ];

  let pillY = 255;
  pillars.forEach(([title, desc]) => {
    canvas.text(`* ${title}`, 60, pillY, { fontSize: 9.5, font: 'bold', color: '#38BDF8' });
    canvas.textBlock(desc, 72, pillY + 14, 365, { fontSize: 8.5, color: '#94A3B8', lineHeight: 12 });
    pillY += 38;
  });

  // Right Box: What Sets Us Apart
  canvas.rect(490, 90, 430, 400, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.rect(490, 90, 4, 400, { fill: '#10B981' });
  canvas.text('THE PROCUCEV STANDARD OF INTEGRITY', 510, 115, { fontSize: 11, font: 'bold', color: '#10B981' });

  const standards = [
    ['Zero Synthetic Savings', 'We never apply arbitrary percentage discounts or fictitious savings targets.'],
    ['Audited Invariant Balancing', 'Every rupee of opportunity balances back to specific ERP PO records.'],
    ['Rigorous Overlap Deduplication', 'Multi-lever interactions are mathematically de-duplicated.'],
    ['Sovereign Data Protection', 'Customer procurement data is isolated via AES-256-GCM and never shared.']
  ];

  let stdY = 150;
  standards.forEach(([title, desc]) => {
    canvas.text(title, 510, stdY, { fontSize: 10, font: 'bold', color: '#F8FAFC' });
    canvas.textBlock(desc, 510, stdY + 16, 390, { fontSize: 9, color: '#CBD5E1', lineHeight: 14 });
    stdY += 55;
  });

  canvas.renderFooter(clientName, conf, p, total);
}

export function renderSlide4Capabilities(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Procucev Procurement Capability Architecture', 'Enterprise Capabilities', p);

  canvas.rect(40, 90, 880, 85, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('END-TO-END PROCUREMENT VALUE CONVERSION ARCHITECTURE', 55, 110, { fontSize: 10, font: 'bold', color: '#38BDF8' });

  const stages = PROCUCEV_PROFILE.methodologyStages;
  stages.forEach((st, idx) => {
    const sX = 55 + idx * 144;
    canvas.badge(sX, 125, `${idx + 1}. ${st.stage}`, { bgColor: '#2563EB', textColor: '#FFFFFF', fontSize: 8.5 });
    canvas.textBlock(st.desc, sX, 150, 135, { fontSize: 7.5, color: '#94A3B8', lineHeight: 10 });
  });

  canvas.rect(40, 190, 880, 300, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('TEN SPECIALIZED STRATEGIC PROCUREMENT COMPETENCIES', 55, 212, { fontSize: 10, font: 'bold', color: '#10B981' });

  const headers = ['#', 'Competency Name', 'Methodological Focus', 'Client Outcome'];
  const rows = [
    ['01', 'Forensic Spend Diagnostic', 'Cleanse, normalize and classify 100% of line-item purchase history', 'Complete spend transparency'],
    ['02', 'Strategic Sourcing & Category Mgmt', 'Develop bespoke category strategy per spend velocity and liquidity', 'Structurally reduced cost profiles'],
    ['03', 'Cross-Plant Price Analytics', 'Percentile dispersion analysis and unit-rate variance tracking', 'Harmonized corporate purchasing rates'],
    ['04', 'Electronic Reverse Auctions', 'Multi-round dynamic bidding rulebooks with verified reserve price logic', 'Accelerated price discovery'],
    ['05', 'Vendor Base Consolidation', 'Pareto tail rationalization and core vendor volume tiering', 'Lowered administrative overhead'],
    ['06', 'PCBI Market Benchmarking', 'Independent index correlation for landed energy and chemical commodities', 'Objective rate parity'],
    ['07', 'Volume Aggregation', 'Pool standardized technical specifications across multi-plant networks', 'Direct OEM manufacturer access'],
    ['08', 'Contract Compliance Audit', 'Real-time invoice price verification against rate contract baseline', 'Zero off-contract price drift'],
    ['09', 'Managed Procurement Services', 'Turnkey execution support bridging client category bandwidth gaps', 'Rapid deployment in 30 days'],
    ['10', 'Sustained Value Realization', 'Post-award invoice tracking verifying direct P&L EBITDA margin expansion', 'Audited, boardroom-defensible value']
  ];

  canvas.table(55, 225, 850, headers, rows, [35, 180, 385, 250], { headerBg: '#0F172A', rowAltBg: '#182234' });

  canvas.renderFooter(clientName, conf, p, total);
}

export function renderSlide5UnderstandingClient(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader(`Understanding ${clientName}: Public Corporate Profile & Operating Scale`, 'Client Context', p);

  canvas.rect(40, 90, 880, 400, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('PUBLICLY VERIFIED CORPORATE PROFILE & INDUSTRIAL CHARACTERISTICS', 55, 112, { fontSize: 10, font: 'bold', color: '#38BDF8' });

  const headers = ['Dimension', 'Verified Public Fact', 'Official Source', 'Date'];
  const rows = DEFAULT_CLIENT_PROFILE.publicFacts.map((pf) => [
    pf.characteristic,
    pf.fact,
    pf.source,
    pf.sourceDate
  ]);

  canvas.table(55, 125, 850, headers, rows, [140, 440, 190, 80], { headerBg: '#0F172A', rowAltBg: '#182234' });

  canvas.rect(55, 340, 850, 130, { fill: '#0F172A', stroke: '#334155', lineWidth: 1 });
  canvas.text('DATA VERIFICATION & GOVERNANCE NOTE', 70, 360, { fontSize: 9.5, font: 'bold', color: '#10B981' });
  canvas.textBlock(
    'All company metrics above represent audited, publicly disclosed data from statutory stock exchange filings, annual reports, and investor disclosures. Procucev maintains a strict demarcation between public external corporate data and confidential client transaction ledgers.',
    70,
    380,
    820,
    { fontSize: 8.5, color: '#94A3B8', lineHeight: 13 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}

export function renderSlide6WhyProcurementMatters(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader(`Why Procurement Matters for ${clientName}`, 'Strategic Alignment', p);

  canvas.rect(40, 90, 880, 400, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('CONNECTING VERIFIED INDUSTRIAL SCALE TO PROCUREMENT VALUE CREATION', 55, 112, { fontSize: 10, font: 'bold', color: '#38BDF8' });

  const headers = ['Industrial Characteristic', 'Procurement Value Implication', 'Diagnostic Research Question'];
  const rows = DEFAULT_CLIENT_PROFILE.publicFacts.map((pf) => [
    pf.characteristic,
    pf.implication,
    pf.analyticalQuestion
  ]);

  canvas.table(55, 125, 850, headers, rows, [160, 360, 330], { headerBg: '#0F172A', rowAltBg: '#182234' });

  canvas.rect(55, 360, 850, 110, { fill: '#0F172A', stroke: '#2563EB', lineWidth: 1 });
  canvas.text('EXECUTIVE PROCUREMENT HYPOTHESIS', 70, 380, { fontSize: 10, font: 'bold', color: '#38BDF8' });
  canvas.textBlock(
    'In a heavy process manufacturing enterprise with nationwide multi-plant operations, decentralized procurement inevitably generates intra-firm price dispersion. By converting historical transaction evidence into corporate rate parity, e-auctions, and vendor consolidation, the business captures between 3.5% and 6.5% direct bottom-line cash savings without disrupting plant operations.',
    70,
    400,
    820,
    { fontSize: 9, color: '#CBD5E1', lineHeight: 14 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}
