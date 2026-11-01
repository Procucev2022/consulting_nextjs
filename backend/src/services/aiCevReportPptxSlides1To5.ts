/**
 * aiCEV Executive Report PPTX Slides 1 to 5 (Prompt 587)
 * Authoritative 16:9 presentation slides for Borosil Ltd (AIC-2026-0002).
 * Rule 8: Constants isolation; Rule 9: Strongly typed; max lines <= 300, complexity <= 10.
 */

import type PptxGenJS from 'pptxgenjs';
import { TYPOGRAPHY } from '../constants/executiveBriefLayoutConstants';
import { addBriefFooter } from './executiveOpportunityBriefPptxHelpers';

export function renderReportPptxSlides1To5(pptx: PptxGenJS): void {
  const fontFace = TYPOGRAPHY.fallbackFont;

  // Slide 1: Procucev Introduction and Methodology
  const s1 = pptx.addSlide();
  s1.background = { color: '0B1120' };
  s1.addText('aiCEV PROCUREMENT DIAGNOSTIC', {
    x: 0.6, y: 0.4, w: 3.5, h: 0.3,
    fontSize: 10, bold: true, color: 'FFFFFF', fill: { color: '2563EB' }, fontFace
  });
  s1.addText('aiCEV by Procucev: Procurement Diagnostic & Opportunity Brief', {
    x: 0.6, y: 0.8, w: 8.8, h: 0.45,
    fontSize: 20, bold: true, color: 'FFFFFF', fontFace
  });
  s1.addText('Customer: Borosil Ltd | Customer ID: CUST-2026-0002 | Assessment ID: AIC-2026-0002', {
    x: 0.6, y: 1.25, w: 8.8, h: 0.3,
    fontSize: 11, color: '94A3B8', fontFace
  });

  const modules = [
    { n: 'M1', t: 'Spend Hygiene & Ingestion', d: '100% line-item PO normalization; duplicate elimination and multi-plant ledger reconciliation.' },
    { n: 'M2', t: 'Strategic Sourcing Levers', d: '105 qualified opportunity packages across price harmonization, volume pooling, and tenders.' },
    { n: 'M3', t: 'PCBI Market Benchmarks', d: 'Benchmark research completed and formally closed; no operational benchmark observations available.' },
    { n: 'M4', t: 'Realization Governance', d: 'Audit-controlled downstream tracking; independent governance of realized P&L cash flow.' }
  ];
  modules.forEach((m, idx) => {
    const x = 0.6 + idx * 2.2;
    s1.addShape('rect', { x, y: 1.7, w: 2.1, h: 2.3, fill: { color: '1E293B' }, line: { color: '334155', width: 1 } });
    s1.addText(m.n, { x: x + 0.15, y: 1.85, w: 1.8, h: 0.35, fontSize: 16, bold: true, color: '38BDF8', fontFace });
    s1.addText(m.t, { x: x + 0.15, y: 2.2, w: 1.8, h: 0.4, fontSize: 10, bold: true, color: 'F8FAFC', fontFace });
    s1.addText(m.d, { x: x + 0.15, y: 2.65, w: 1.8, h: 1.2, fontSize: 9, color: '94A3B8', fontFace });
  });

  s1.addShape('rect', { x: 0.6, y: 4.2, w: 8.7, h: 0.9, fill: { color: '0F172A' }, line: { color: '1E293B', width: 1 } });
  s1.addText('GOVERNANCE STANDARD: 100% PO Lineage & Zero Double-Counting', {
    x: 0.8, y: 4.3, w: 8.3, h: 0.25, fontSize: 9.5, bold: true, color: '10B981', fontFace
  });
  s1.addText('• Multi-lever overlap deductions eliminate cross-lever double-counting between price harmonization and e-auctions.\n• Strict Realization Boundary: Modelled opportunities are strictly separated from client-approved and realized savings.', {
    x: 0.8, y: 4.55, w: 8.3, h: 0.5, fontSize: 8.5, color: 'E2E8F0', fontFace
  });
  addBriefFooter(s1, 1);

  // Slide 2: Borosil Company and Procurement Context
  const s2 = pptx.addSlide();
  s2.background = { color: '0B1120' };
  s2.addText('CUSTOMER CONTEXT', {
    x: 0.6, y: 0.4, w: 2.5, h: 0.3, fontSize: 10, bold: true, color: 'FFFFFF', fill: { color: '0284C7' }, fontFace
  });
  s2.addText('Customer Context: Borosil Ltd (AIC-2026-0002)', {
    x: 0.6, y: 0.8, w: 8.8, h: 0.45, fontSize: 20, bold: true, color: 'FFFFFF', fontFace
  });
  s2.addText('Verified assessment scope and manufacturing footprint. Zero unverified claims or synthetic assumptions.', {
    x: 0.6, y: 1.25, w: 8.8, h: 0.3, fontSize: 11, color: '94A3B8', fontFace
  });

  s2.addShape('rect', { x: 0.6, y: 1.6, w: 4.25, h: 3.4, fill: { color: '1E293B' }, line: { color: '334155', width: 1 } });
  s2.addText('VERIFIED ENTERPRISE SCOPE', {
    x: 0.8, y: 1.8, w: 3.8, h: 0.3, fontSize: 11, bold: true, color: '38BDF8', fontFace
  });
  const cInfo = [
    'Enterprise Name: Borosil Ltd',
    'Customer ID: CUST-2026-0002 | Assessment ID: AIC-2026-0002',
    'Principal Sector: Specialty Glassware & Laboratory Solutions',
    'Evaluated Plants: 3 Facilities (Plant 1120, Plant 6101, Plant 8202)',
    'Operating Locations: Bharuch (Gujarat) and Jaipur (Rajasthan) facilities',
    'Assessment Scope: 1 April 2026 to 22 October 2026 (FY2026-27 YTD, 205 days)',
    'Audited Ledger Lines: 27,777 canonical purchase order transactions',
    'Active Suppliers: 1,537 Active SAP Supplier Accounts profiled',
    'Isolation Standard: Dedicated tenant boundary under AES-256-GCM encryption'
  ];
  s2.addText(cInfo.join('\n\n'), {
    x: 0.8, y: 2.15, w: 3.8, h: 2.7, fontSize: 8.5, color: 'CBD5E1', fontFace
  });

  s2.addShape('rect', { x: 5.05, y: 1.6, w: 4.25, h: 3.4, fill: { color: '1E293B' }, line: { color: '334155', width: 1 } });
  s2.addText('KEY PROCUREMENT PRIORITIES', {
    x: 5.25, y: 1.8, w: 3.8, h: 0.3, fontSize: 11, bold: true, color: '34D399', fontFace
  });
  const prioText = [
    '• Direct chemical price harmonization across manufacturing plants (Dense Soda Ash, Silica Sand)',
    '• Packaging supplier rationalization and volume consolidation across corrugated categories',
    '• Logistics freight route optimization and dynamic e-auction dynamic bidding',
    '• Standardizing supplier commercial payment terms to 60-day corporate benchmark',
    '• MRO maintenance spares preferred supplier paneling across plant operations'
  ];
  s2.addText(prioText.join('\n\n'), {
    x: 5.25, y: 2.2, w: 3.8, h: 2.6, fontSize: 9, color: 'E2E8F0', fontFace
  });
  addBriefFooter(s2, 2);

  // Slide 3: Executive Summary
  const s3 = pptx.addSlide();
  s3.background = { color: '0B1120' };
  s3.addText('EXECUTIVE SUMMARY', {
    x: 0.6, y: 0.4, w: 2.5, h: 0.3, fontSize: 10, bold: true, color: 'FFFFFF', fill: { color: '10B981' }, fontFace
  });
  s3.addText('Executive Summary: Borosil Procurement Value Diagnostic', {
    x: 0.6, y: 0.8, w: 8.8, h: 0.45, fontSize: 20, bold: true, color: 'FFFFFF', fontFace
  });
  s3.addText('Evaluated Baseline: ₹556.535 Cr | Net Modelled: ₹87.100 Cr | Modelled Opp. Excl. Lever 2: ₹75.121 Cr', {
    x: 0.6, y: 1.25, w: 8.8, h: 0.3, fontSize: 11, color: '94A3B8', fontFace
  });

  const kpis = [
    { l: 'EVALUATED BASELINE', v: '₹556.535 Cr', s: '27,777 canonical rows' },
    { l: 'ADDRESSABLE SPEND', v: '₹168.658 Cr', s: 'Diagnostic (₹161.016 Cr Qual.)' },
    { l: 'GROSS OPPORTUNITY', v: '₹117.512 Cr', s: 'Across 3 sourcing levers' },
    { l: 'EXCLUDING LEVER 2', v: '₹75.121 Cr', s: 'Modelled Opp. (L2: ₹11.978 Cr in reserve)' }
  ];
  kpis.forEach((k, idx) => {
    const x = 0.6 + idx * 2.2;
    s3.addShape('rect', { x, y: 1.6, w: 2.1, h: 1.0, fill: { color: '1E293B' }, line: { color: '334155', width: 1 } });
    s3.addText(k.l, { x: x + 0.1, y: 1.7, w: 1.9, h: 0.2, fontSize: 8.5, bold: true, color: '94A3B8', fontFace });
    s3.addText(k.v, { x: x + 0.1, y: 1.95, w: 1.9, h: 0.35, fontSize: 16, bold: true, color: '38BDF8', fontFace });
    s3.addText(k.s, { x: x + 0.1, y: 2.3, w: 1.9, h: 0.2, fontSize: 8, color: 'CBD5E1', fontFace });
  });

  s3.addShape('rect', { x: 0.6, y: 2.8, w: 8.7, h: 2.2, fill: { color: '1E293B' }, line: { color: '334155', width: 1 } });
  s3.addText('VALUE GOVERNANCE STATUS & RECONCILIATION SUMMARY', {
    x: 0.8, y: 2.95, w: 8.3, h: 0.3, fontSize: 11, bold: true, color: '38BDF8', fontFace
  });
  const execLines = [
    '• Modelled Opportunity Excluding Lever 2: ₹75.121 Cr (L1 ₹73.769 Cr + L3 ₹1.352 Cr).',
    '• Lever 2 Status: Held in governance reserve; ₹11.978 Cr excluded pending commercial validation (Spend: ₹12.081 Cr).',
    '• Savings Contribution: ₹0.00 Cr recognized; excluded from customer totals until validation is concluded.',
    '• Distinctions Enforced: Modelled opportunity strictly separated from approved and realized savings.',
    '• Proposed Year 1 Sourcing Target: ₹12.90 Cr (Indicative consulting proposal across Waves 1–3, not approved).',
    '• Client-Approved Savings: ₹0.00 Cr | Realized Savings: ₹0.00 Cr | Module 3 Benchmark Contribution: ₹0.00 Cr.',
    '• Overlap Deductions: ₹30.412 Cr multi-lever overlaps removed across internal analytical models.'
  ];
  s3.addText(execLines.join('\n'), {
    x: 0.8, y: 3.3, w: 8.3, h: 1.6, fontSize: 9, color: 'E2E8F0', fontFace
  });
  addBriefFooter(s3, 3);

  // Slide 4: Customer Spend Baseline Analysis
  const s4 = pptx.addSlide();
  s4.background = { color: '0B1120' };
  s4.addText('BASELINE AUDIT', {
    x: 0.6, y: 0.4, w: 2.0, h: 0.3, fontSize: 10, bold: true, color: 'FFFFFF', fill: { color: '6366F1' }, fontFace
  });
  s4.addText('Customer Spend Baseline Analysis (Module 1 Certified)', {
    x: 0.6, y: 0.8, w: 8.8, h: 0.45, fontSize: 20, bold: true, color: 'FFFFFF', fontFace
  });
  s4.addText('Complete forensic normalization across all invoiced procurement lines (1 Apr 2026 – 22 Oct 2026).', {
    x: 0.6, y: 1.25, w: 8.8, h: 0.3, fontSize: 11, color: '94A3B8', fontFace
  });

  const baseMetrics = [
    { n: '27,777', l: 'Canonical Lines', s: 'ERP invoiced rows' },
    { n: '1,537', l: 'Active SAP Suppliers', s: 'Normalized active accounts' },
    { n: '8,976', l: 'Catalog Materials', s: 'Categorized SKUs' },
    { n: '3', l: 'Manufacturing Plants', s: 'Plant 1120, 6101, 8202' },
    { n: '205 Days', l: 'Audit Period', s: 'FY2026-27 YTD' }
  ];
  baseMetrics.forEach((b, idx) => {
    const x = 0.6 + idx * 1.76;
    s4.addShape('rect', { x, y: 1.6, w: 1.66, h: 1.1, fill: { color: '1E293B' }, line: { color: '334155', width: 1 } });
    s4.addText(b.n, { x: x + 0.1, y: 1.75, w: 1.46, h: 0.35, fontSize: 17, bold: true, color: '38BDF8', fontFace });
    s4.addText(b.l, { x: x + 0.1, y: 2.1, w: 1.46, h: 0.25, fontSize: 9, bold: true, color: 'F8FAFC', fontFace });
    s4.addText(b.s, { x: x + 0.1, y: 2.35, w: 1.46, h: 0.25, fontSize: 8, color: '94A3B8', fontFace });
  });

  s4.addShape('rect', { x: 0.6, y: 2.9, w: 8.7, h: 2.1, fill: { color: '1E293B' }, line: { color: '334155', width: 1 } });
  s4.addText('DATA PROVENANCE & INTEGRITY ASSURANCE', {
    x: 0.8, y: 3.05, w: 8.3, h: 0.3, fontSize: 11, bold: true, color: '38BDF8', fontFace
  });
  const dataProv = [
    '• 100% Certified Data Lineage: Evaluated ₹556.535 Cr spend reconciled with zero unexplained line variance.',
    '• Tenant Isolation: Processed exclusively under Borosil tenant credentials; no external customer data accessible.',
    '• Duplicate Elimination: Multi-level matching identified and purged redundant PO lines.',
    '• Plant Reconciliation: Comprehensive coverage across Bharuch facility (1120) and Jaipur units (6101, 8202).',
    '• Verification Verdict: Certified production baseline ready for strategic sourcing lever evaluation.'
  ];
  s4.addText(dataProv.join('\n\n'), {
    x: 0.8, y: 3.4, w: 8.3, h: 1.5, fontSize: 9, color: 'E2E8F0', fontFace
  });
  addBriefFooter(s4, 4);

  // Slide 5: Spend and Category Analysis
  const s5 = pptx.addSlide();
  s5.background = { color: '0B1120' };
  s5.addText('CATEGORY ANALYSIS', {
    x: 0.6, y: 0.4, w: 2.5, h: 0.3, fontSize: 10, bold: true, color: 'FFFFFF', fill: { color: '8B5CF6' }, fontFace
  });
  s5.addText('Spend Categorization & Scope Reconciliation (133 vs 105)', {
    x: 0.6, y: 0.8, w: 8.8, h: 0.45, fontSize: 20, bold: true, color: 'FFFFFF', fontFace
  });
  s5.addText('Granular category mapping across direct materials, packaging, capital equipment, and indirect goods.', {
    x: 0.6, y: 1.25, w: 8.8, h: 0.3, fontSize: 11, color: '94A3B8', fontFace
  });

  const catRows = [
    ['Category Name & Material Group', 'Spend (₹ Cr)', 'Share (%)', 'Classification'],
    ['Chemicals & Raw Materials (Dense Soda Ash, Silica Sand)', '₹228.401 Cr', '41.04%', 'Direct Materials'],
    ['Capital Equipment & Engineering Projects', '₹36.884 Cr', '6.63%', 'Plant Capex'],
    ['Corrugated Packaging & Cartons', '₹18.250 Cr', '3.28%', 'Packaging'],
    ['Electrical & Instrumentation Spares', '₹5.863 Cr', '1.05%', 'Plant MRO'],
    ['Mechanical Spares & Engineering Consumables', '₹4.920 Cr', '0.88%', 'Plant MRO'],
    ['Laboratory Consumables & Reagents', '₹3.450 Cr', '0.62%', 'Lab Operations']
  ];
  const catTableData = catRows.map((row) => row.map((text) => ({ text })));
  s5.addTable(catTableData as unknown as PptxGenJS.TableRow[], {
    x: 0.6, y: 1.6, w: 8.7, h: 2.8,
    fill: { color: '1E293B' },
    color: 'F8FAFC',
    fontSize: 9,
    fontFace,
    border: { pt: 0.5, color: '334155' }
  });
  s5.addText('Evaluated Diagnostic Addressable Spend: ₹168.658 Cr across 133 categories | Qualified Execution: ₹161.016 Cr across 105 packages (28 categories / ₹7.642 Cr unquantified).', {
    x: 0.6, y: 4.6, w: 8.7, h: 0.3, fontSize: 8.5, bold: true, color: '38BDF8', fontFace
  });
  addBriefFooter(s5, 5);
}
