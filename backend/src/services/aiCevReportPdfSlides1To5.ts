/**
 * aiCEV Executive Report PDF Slides 1 to 5 (Prompt 587)
 * Authoritative 16:9 presentation slides for Borosil Ltd (AIC-2026-0002).
 * Rule 8: Constants isolation; Rule 9: Strongly typed; max lines <= 300, complexity <= 10.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';

export function renderReportPdfSlides1To5(canvas: PdfCanvas): void {
  // Slide 1: Procucev Introduction and Methodology
  canvas.rect(0, 0, 960, 540, { fill: '#0B1120' });
  canvas.badge(60, 36, 'aiCEV PROCUREMENT DIAGNOSTIC', { bgColor: '#2563EB', textColor: '#FFFFFF' });
  canvas.text('aiCEV by Procucev: Procurement Diagnostic & Opportunity Brief', 60, 85, {
    fontSize: 22,
    font: 'bold',
    color: '#FFFFFF'
  });
  canvas.text('Customer: Borosil Ltd | Customer ID: CUST-2026-0002 | Assessment ID: AIC-2026-0002', 60, 110, {
    fontSize: 11,
    color: '#94A3B8'
  });

  const mBoxY = 140;
  const modules = [
    { n: 'M1', title: 'Spend Hygiene & Ingestion', desc: '100% line-item PO normalization; duplicate elimination and multi-plant ledger reconciliation.' },
    { n: 'M2', title: 'Strategic Sourcing Levers', desc: '105 qualified opportunity packages across price harmonization, volume pooling, and tenders.' },
    { n: 'M3', title: 'PCBI Market Benchmarks', desc: 'Benchmark research completed and formally closed; no operational benchmark observations available.' },
    { n: 'M4', title: 'Realization Governance', desc: 'Audit-controlled downstream tracking; independent governance of realized P&L cash flow.' }
  ];

  modules.forEach((m, idx) => {
    const x = 60 + idx * 212;
    canvas.rect(x, mBoxY, 202, 220, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
    canvas.rect(x, mBoxY, 202, 4, { fill: '#38BDF8' });
    canvas.text(m.n, x + 16, mBoxY + 30, { fontSize: 16, font: 'bold', color: '#38BDF8' });
    canvas.text(m.title, x + 16, mBoxY + 58, { fontSize: 10, font: 'bold', color: '#F8FAFC' });
    canvas.textBlock(m.desc, x + 16, mBoxY + 84, 170, { fontSize: 8.5, color: '#94A3B8', lineHeight: 13 });
  });

  canvas.rect(60, 385, 840, 90, { fill: '#0F172A', stroke: '#1E293B', lineWidth: 1 });
  canvas.text('GOVERNANCE STANDARD', 80, 410, { fontSize: 9.5, font: 'bold', color: '#10B981' });
  canvas.text('• Mathematical Defensibility: Multi-lever overlap deductions eliminate cross-lever double-counting.', 80, 432, { fontSize: 9, color: '#E2E8F0' });
  canvas.text('• Strict Realization Boundary: Modelled opportunities are strictly separated from client-approved and realized savings.', 80, 454, { fontSize: 9, color: '#E2E8F0' });

  // Slide 2: Borosil Company & Procurement Context
  canvas.addPage();
  canvas.rect(0, 0, 960, 540, { fill: '#0B1120' });
  canvas.badge(60, 36, 'CUSTOMER CONTEXT', { bgColor: '#0284C7', textColor: '#FFFFFF' });
  canvas.text('Customer Context: Borosil Ltd (AIC-2026-0002)', 60, 85, { fontSize: 22, font: 'bold', color: '#FFFFFF' });
  canvas.text('Verified assessment scope and manufacturing footprint. Zero unverified claims or synthetic assumptions.', 60, 110, { fontSize: 11, color: '#94A3B8' });

  const cBoxW = 410;
  canvas.rect(60, 140, cBoxW, 330, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.rect(60, 140, cBoxW, 4, { fill: '#0284C7' });
  canvas.text('VERIFIED ENTERPRISE SCOPE', 80, 168, { fontSize: 11, font: 'bold', color: '#38BDF8' });
  canvas.text('Enterprise Name: Borosil Ltd', 80, 198, { fontSize: 10, font: 'bold', color: '#F8FAFC' });
  canvas.text('Customer ID: CUST-2026-0002 | Assessment ID: AIC-2026-0002', 80, 222, { fontSize: 9.5, color: '#94A3B8' });
  canvas.text('Principal Sector: Specialty Glassware & Laboratory Solutions', 80, 246, { fontSize: 9.5, color: '#94A3B8' });
  canvas.text('Evaluated Plants: 3 Facilities (Plant 1120, Plant 6101, Plant 8202)', 80, 270, { fontSize: 9.5, color: '#94A3B8' });
  canvas.text('Operating Locations: Bharuch (Gujarat) and Jaipur (Rajasthan) facilities', 80, 294, { fontSize: 9.5, color: '#94A3B8' });
  canvas.text('Assessment Scope: 1 April 2026 to 22 October 2026 (FY2026-27 YTD, 205 days)', 80, 318, { fontSize: 9.5, color: '#94A3B8' });
  canvas.text('Audited Ledger Lines: 27,777 canonical purchase order transactions', 80, 342, { fontSize: 9.5, color: '#94A3B8' });
  canvas.text('Active Suppliers: 1,537 Active SAP Supplier Accounts profiled', 80, 366, { fontSize: 9.5, color: '#94A3B8' });
  canvas.text('Isolation Standard: Dedicated tenant boundary under AES-256-GCM encryption', 80, 390, { fontSize: 9.5, color: '#10B981' });

  const rBoxX = 490;
  canvas.rect(rBoxX, 140, cBoxW, 330, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.rect(rBoxX, 140, cBoxW, 4, { fill: '#10B981' });
  canvas.text('KEY PROCUREMENT PRIORITIES', rBoxX + 20, 168, { fontSize: 11, font: 'bold', color: '#34D399' });
  const priorities = [
    'Direct chemical price harmonization across manufacturing plants (Dense Soda Ash, Silica Sand)',
    'Packaging supplier rationalization and volume consolidation across corrugated categories',
    'Logistics freight route optimization and dynamic e-auction dynamic bidding',
    'Standardizing supplier commercial payment terms to 60-day corporate benchmark',
    'MRO maintenance spares preferred supplier paneling across plant operations'
  ];
  priorities.forEach((pr, pIdx) => {
    canvas.textBlock(`• ${pr}`, rBoxX + 20, 202 + pIdx * 52, cBoxW - 40, { fontSize: 9, color: '#E2E8F0', lineHeight: 13 });
  });

  // Slide 3: Executive Summary
  canvas.addPage();
  canvas.rect(0, 0, 960, 540, { fill: '#0B1120' });
  canvas.badge(60, 36, 'EXECUTIVE SUMMARY', { bgColor: '#10B981', textColor: '#FFFFFF' });
  canvas.text('Executive Summary: Borosil Procurement Value Diagnostic', 60, 85, { fontSize: 22, font: 'bold', color: '#FFFFFF' });
  canvas.text('Evaluated Baseline: ₹556.535 Cr | Net Modelled: ₹87.100 Cr | Modelled Opp. Excl. Lever 2: ₹75.121 Cr', 60, 110, { fontSize: 11, color: '#94A3B8' });

  const kpis = [
    { label: 'EVALUATED BASELINE', val: '₹556.535 Cr', sub: '27,777 canonical rows' },
    { label: 'ADDRESSABLE SPEND', val: '₹168.658 Cr', sub: 'Diagnostic (₹161.016 Cr Qual.)' },
    { label: 'GROSS OPPORTUNITY', val: '₹117.512 Cr', sub: 'Across 3 sourcing levers' },
    { label: 'EXCLUDING LEVER 2', val: '₹75.121 Cr', sub: 'Modelled Opp. (L2: ₹11.978 Cr in reserve)' }
  ];
  kpis.forEach((k, idx) => {
    const x = 60 + idx * 212;
    canvas.rect(x, 135, 202, 100, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
    canvas.text(k.label, x + 16, 162, { fontSize: 8.5, font: 'bold', color: '#94A3B8' });
    canvas.text(k.val, x + 16, 192, { fontSize: 18, font: 'bold', color: '#38BDF8' });
    canvas.text(k.sub, x + 16, 215, { fontSize: 8.5, color: '#CBD5E1' });
  });

  canvas.rect(60, 255, 840, 220, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('VALUE GOVERNANCE STATUS & RECONCILIATION SUMMARY', 80, 282, { fontSize: 11, font: 'bold', color: '#38BDF8' });
  canvas.text('• Modelled Opportunity Excluding Lever 2: ₹75.121 Cr (Strategic Sourcing ₹73.769 Cr + E-Auctions ₹1.352 Cr).', 80, 310, { fontSize: 9.5, color: '#F8FAFC' });
  canvas.text('• Lever 2 Modelled Opportunity: ₹11.978 Cr held in governance reserve, excluded from customer-facing actionable opportunity pending commercial validation.', 80, 335, { fontSize: 9.5, font: 'bold', color: '#FBBF24' });
  canvas.text('• Savings Contribution: ₹0.00 Cr recognized; excluded from customer totals until validation is concluded.', 80, 360, { fontSize: 9.5, color: '#E2E8F0' });
  canvas.text('• Proposed Year 1 Sourcing Target: ₹12.90 Cr (Proposed target across Waves 1–3, indicative consulting proposal only).', 80, 385, { fontSize: 9.5, font: 'bold', color: '#34D399' });
  canvas.text('• Client-Approved Savings: ₹0.00 Cr | Realized Savings: ₹0.00 Cr | Module 3 Benchmark Contribution: ₹0.00 Cr', 80, 410, { fontSize: 9.5, color: '#94A3B8' });
  canvas.text('• Module 3 PCBI Benchmark: Benchmark research completed and formally closed; no operational benchmark observations available.', 80, 435, { fontSize: 9.5, color: '#F59E0B' });
  canvas.text('• Overlap Deductions: ₹30.412 Cr multi-lever overlaps removed across internal analytical models.', 80, 460, { fontSize: 9, color: '#64748B' });

  // Slide 4: Customer Spend Baseline Analysis
  canvas.addPage();
  canvas.rect(0, 0, 960, 540, { fill: '#0B1120' });
  canvas.badge(60, 36, 'BASELINE AUDIT', { bgColor: '#6366F1', textColor: '#FFFFFF' });
  canvas.text('Customer Spend Baseline Analysis (Module 1 Certified)', 60, 85, { fontSize: 22, font: 'bold', color: '#FFFFFF' });
  canvas.text('Complete forensic normalization across all invoiced procurement lines (1 Apr 2026 – 22 Oct 2026).', 60, 110, { fontSize: 11, color: '#94A3B8' });

  const baseMetrics = [
    { n: '27,777', l: 'Canonical Lines', s: 'ERP invoiced rows' },
    { n: '1,537', l: 'Active SAP Suppliers', s: 'Normalized active accounts' },
    { n: '8,976', l: 'Catalog Materials', s: 'Categorized SKUs' },
    { n: '3', l: 'Manufacturing Plants', s: 'Plant 1120, 6101, 8202' },
    { n: '205 Days', l: 'Audit Period', s: 'FY2026-27 YTD' }
  ];
  baseMetrics.forEach((b, idx) => {
    const x = 60 + idx * 170;
    canvas.rect(x, 140, 160, 115, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
    canvas.text(b.n, x + 14, 172, { fontSize: 18, font: 'bold', color: '#38BDF8' });
    canvas.text(b.l, x + 14, 202, { fontSize: 9.5, font: 'bold', color: '#F8FAFC' });
    canvas.text(b.s, x + 14, 226, { fontSize: 8.5, color: '#94A3B8' });
  });

  canvas.rect(60, 280, 840, 195, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('DATA PROVENANCE & INTEGRITY ASSURANCE', 80, 308, { fontSize: 11, font: 'bold', color: '#38BDF8' });
  canvas.text('• 100% Certified Data Lineage: Evaluated ₹556.535 Cr spend reconciled with zero unexplained line variance.', 80, 336, { fontSize: 9.5, color: '#E2E8F0' });
  canvas.text('• Tenant Isolation: Processed exclusively under Borosil tenant credentials; no external customer data accessible.', 80, 362, { fontSize: 9.5, color: '#E2E8F0' });
  canvas.text('• Duplicate Elimination: Multi-level matching identified and purged redundant PO lines.', 80, 388, { fontSize: 9.5, color: '#E2E8F0' });
  canvas.text('• Plant Reconciliation: Comprehensive coverage across Bharuch facility (1120) and Jaipur units (6101, 8202).', 80, 414, { fontSize: 9.5, color: '#E2E8F0' });
  canvas.text('• Verification Verdict: Certified production baseline ready for strategic sourcing lever evaluation.', 80, 440, { fontSize: 9.5, color: '#10B981' });

  // Slide 5: Spend and Category Analysis
  canvas.addPage();
  canvas.rect(0, 0, 960, 540, { fill: '#0B1120' });
  canvas.badge(60, 36, 'CATEGORY ANALYSIS', { bgColor: '#8B5CF6', textColor: '#FFFFFF' });
  canvas.text('Spend Categorization & Scope Reconciliation (133 vs 105)', 60, 85, { fontSize: 22, font: 'bold', color: '#FFFFFF' });
  canvas.text('Granular category mapping across direct materials, packaging, capital equipment, and indirect goods.', 60, 110, { fontSize: 11, color: '#94A3B8' });

  const catRows = [
    { name: 'Chemicals & Raw Materials (Soda Ash, Silica Sand)', spend: '₹228.401 Cr', pct: '41.04%', s: 'Direct Raw Materials' },
    { name: 'Capital Equipment & Engineering Projects', spend: '₹36.884 Cr', pct: '6.63%', s: 'Plant Capex' },
    { name: 'Corrugated Packaging & Cartons', spend: '₹18.250 Cr', pct: '3.28%', s: 'Indirect Packaging' },
    { name: 'Electrical & Instrumentation Spares', spend: '₹5.863 Cr', pct: '1.05%', s: 'Plant Maintenance' },
    { name: 'Mechanical Spares & Engineering Consumables', spend: '₹4.920 Cr', pct: '0.88%', s: 'Plant Maintenance' },
    { name: 'Laboratory Consumables & Reagents', spend: '₹3.450 Cr', pct: '0.62%', s: 'Lab Operations' }
  ];

  catRows.forEach((c, idx) => {
    const y = 145 + idx * 46;
    canvas.rect(60, y, 840, 38, { fill: idx % 2 === 0 ? '#1E293B' : '#0F172A', stroke: '#334155', lineWidth: 0.5 });
    canvas.text(c.name, 80, y + 23, { fontSize: 9.5, font: 'bold', color: '#F8FAFC' });
    canvas.text(c.s, 480, y + 23, { fontSize: 9, color: '#94A3B8' });
    canvas.text(c.spend, 700, y + 23, { fontSize: 9.5, font: 'bold', color: '#38BDF8' });
    canvas.text(c.pct, 820, y + 23, { fontSize: 9.5, font: 'bold', color: '#34D399' });
  });

  canvas.rect(60, 440, 840, 45, { fill: '#1E293B', stroke: '#334155', lineWidth: 0.75 });
  canvas.text('Evaluated Diagnostic Addressable Spend: ₹168.658 Cr across 133 categories | Qualified Execution: ₹161.016 Cr across 105 packages (28 categories / ₹7.642 Cr unquantified).', 80, 467, {
    fontSize: 8.5,
    font: 'bold',
    color: '#38BDF8'
  });
}
