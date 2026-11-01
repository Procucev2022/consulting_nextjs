/**
 * aiCEV Executive Report PPTX Slides 16 to 20 (Prompt 596)
 * Authoritative 16:9 presentation slides for Borosil Ltd (AIC-2026-0002).
 * Rule 8: Constants isolation; Rule 9: Strongly typed; max lines <= 300, complexity <= 10.
 */

import type PptxGenJS from 'pptxgenjs';
import { TYPOGRAPHY } from '../constants/executiveBriefLayoutConstants';
import { addBriefFooter } from './executiveOpportunityBriefPptxHelpers';

export function renderReportPptxSlides16To20(pptx: PptxGenJS): void {
  const fontFace = TYPOGRAPHY.fallbackFont;

  // Slide 16: Alternative Vendor Evaluation Framework
  const s16 = pptx.addSlide();
  s16.background = { color: '0B1120' };
  s16.addText('VENDOR EVALUATION', {
    x: 0.6, y: 0.4, w: 2.8, h: 0.3, fontSize: 10, bold: true, color: 'FFFFFF', fill: { color: '8B5CF6' }, fontFace
  });
  s16.addText('Alternative Vendor Evaluation Framework', {
    x: 0.6, y: 0.8, w: 8.8, h: 0.45, fontSize: 20, bold: true, color: 'FFFFFF', fontFace
  });
  s16.addText('Structured evaluation across packaging, plastics, industrial gases, and MRO distributor panels.', {
    x: 0.6, y: 1.25, w: 8.8, h: 0.3, fontSize: 11, color: '94A3B8', fontFace
  });

  const vRows = [
    ['Category', 'Current Source', 'Potential Alternative', 'Status Classification', 'Proximity'],
    ['Industrial MRO & Spares', '42 Fragmented Stockists', 'Moglix (Mogli Labs Pvt Ltd)', 'Potential Alternative — Qual. Required', 'Western regional depots'],
    ['Hardware & Tools', 'Regional Hardware Vendors', 'Industrybuying (Emart Solutions)', 'Potential Alternative — Qual. Required', 'Western/Northern hubs'],
    ['Flexible Packaging & Films', 'Local Converting Vendors', 'Uflex Limited (Packaging Div.)', 'Potential Alternative — Qual. Required', 'NCR & Western corridors'],
    ['Plant Freight & Logistics', 'Fragmented Transporters', 'V-Trans (India) Limited', 'Potential Alternative — Qual. Required', 'Gujarat & Maharashtra fleet']
  ];
  const vTableData = vRows.map((row) => row.map((text) => ({ text })));
  s16.addTable(vTableData as unknown as PptxGenJS.TableRow[], {
    x: 0.6, y: 1.6, w: 8.7, h: 2.6,
    fill: { color: '1E293B' },
    color: 'F8FAFC',
    fontSize: 8.5,
    fontFace,
    border: { pt: 0.5, color: '334155' }
  });
  s16.addText('Three Classifications Enforced: 1. Existing Approved | 2. Potential Alternative — Qualification Required | 3. Strategic Manufacturer Candidate — Verification Required.', {
    x: 0.6, y: 4.5, w: 8.7, h: 0.3, fontSize: 8, color: '94A3B8', fontFace
  });
  addBriefFooter(s16, 16);

  // Slide 17: Module 3 PCBI Status and Future Benchmarking Roadmap
  const s17 = pptx.addSlide();
  s17.background = { color: '0B1120' };
  s17.addText('MODULE 3 BENCHMARKS', {
    x: 0.6, y: 0.4, w: 3.0, h: 0.3, fontSize: 10, bold: true, color: 'FFFFFF', fill: { color: 'EF4444' }, fontFace
  });
  s17.addText('Module 3 PCBI Status and Future Benchmarking Roadmap', {
    x: 0.6, y: 0.8, w: 8.8, h: 0.45, fontSize: 20, bold: true, color: 'FFFFFF', fontFace
  });
  s17.addText('Benchmark research completed and formally closed; no operational benchmark observations available.', {
    x: 0.6, y: 1.25, w: 8.8, h: 0.3, fontSize: 10.5, bold: true, color: 'FBBF24', fontFace
  });

  s17.addShape('rect', { x: 0.6, y: 1.6, w: 8.7, h: 3.1, fill: { color: '1E293B' }, line: { color: '334155', width: 1 } });
  s17.addText('MODULE 3 FORMAL RESEARCH CLOSURE VERDICT', {
    x: 0.8, y: 1.8, w: 8.3, h: 0.3, fontSize: 11, bold: true, color: 'F87171', fontFace
  });
  const m3Points = [
    '• Status: Benchmark research completed and formally closed; no operational benchmark observations available.',
    '• Operational Benchmark Coverage: Exactly 0.00% (₹0.00 Cr mapped approved spend).',
    '• Benchmark-Derived Savings Contribution: Exactly ₹0.00 Cr (Zero synthetic extrapolation).',
    '• NR Classified Spend: ₹133.0317 Cr classified as Not Currently Benchmarkable during assessment window.',
    '• Unmapped Baseline Spend: ₹423.4876 Cr preserved with full audit lineage back to SAP purchase orders.',
    '• Future Benchmarking Roadmap: Post-contract execution, establish index-linked price mechanisms for Soda Ash and Natural Gas.',
    '• Integrity Guarantee: Sourcing opportunity is derived 100% from internal transaction baseline rate dispersion and e-auctions.',
    '• Governance Principle: Protects Borosil executive trust by strictly refusing to inject unsubstantiated external indices.'
  ];
  s17.addText(m3Points.join('\n\n'), {
    x: 0.8, y: 2.15, w: 8.3, h: 2.4, fontSize: 8.5, color: 'E2E8F0', fontFace
  });
  addBriefFooter(s17, 17);

  // Slide 18: Consolidated Financial Waterfall and Governance
  const s18 = pptx.addSlide();
  s18.background = { color: '0B1120' };
  s18.addText('FINANCIAL WATERFALL', {
    x: 0.6, y: 0.4, w: 2.8, h: 0.3, fontSize: 10, bold: true, color: 'FFFFFF', fill: { color: '10B981' }, fontFace
  });
  s18.addText('Consolidated Financial Waterfall and Governance Architecture', {
    x: 0.6, y: 0.8, w: 8.8, h: 0.45, fontSize: 19, bold: true, color: 'FFFFFF', fontFace
  });
  s18.addText('Deduplicated 9-step financial bridge from ₹556.535 Cr evaluated baseline to realized savings.', {
    x: 0.6, y: 1.25, w: 8.8, h: 0.3, fontSize: 11, color: '94A3B8', fontFace
  });

  const wfTableRows = [
    ['Bridge Stage', 'Amount (₹ Cr)', 'Scope & Governance Treatment'],
    ['1. Evaluated Baseline Spend', '₹556.535 Cr', '27,777 canonical rows across 3 manufacturing plants'],
    ['2. Evaluated Diagnostic Addressable', '₹168.658 Cr', 'Evaluated diagnostic spend across 133 categories'],
    ['3. Qualified Execution Addressable', '₹161.016 Cr', '105 qualified execution packages (₹7.642 Cr unquantified excl.)'],
    ['4. Gross Modelled Opportunity', '₹117.512 Cr', 'Combined modelled benefit across Levers 1, 2, 3'],
    ['5. Overlap Deductions', '₹30.412 Cr', 'Multi-lever overlap deducted across packages'],
    ['6. Net Modelled Sourcing Opp.', '₹87.100 Cr', 'Deduplicated net strategic sourcing opportunity'],
    ['7. Modelled Opp. Excluding Lever 2', '₹75.121 Cr', 'Opportunity Identified for Commercial Validation (L2 in reserve)'],
    ['8. Client-Approved Savings', '₹0.00 Cr', 'Pending commercial tender execution and client sign-off'],
    ['9. Audited Realized Savings', '₹0.00 Cr', 'Recognized strictly post-delivery and invoice audit match']
  ];
  const wfTableData = wfTableRows.map((row) => row.map((text) => ({ text })));
  s18.addTable(wfTableData as unknown as PptxGenJS.TableRow[], {
    x: 0.6, y: 1.6, w: 8.7, h: 2.7,
    fill: { color: '1E293B' },
    color: 'F8FAFC',
    fontSize: 8,
    fontFace,
    border: { pt: 0.5, color: '334155' }
  });
  s18.addText('Mandatory Governance Disclosure: The ₹87.100 Cr represents modelled sourcing opportunity after overlap deductions. Savings will only be recognized after commercial approval, implementation and audit verification.', {
    x: 0.6, y: 4.5, w: 8.7, h: 0.35, fontSize: 7.5, color: 'FBBF24', fontFace
  });
  addBriefFooter(s18, 18);

  // Slide 19: Proposed Year 1 Execution Roadmap
  const s19 = pptx.addSlide();
  s19.background = { color: '0B1120' };
  s19.addText('EXECUTION ROADMAP', {
    x: 0.6, y: 0.4, w: 2.8, h: 0.3, fontSize: 10, bold: true, color: 'FFFFFF', fill: { color: '0284C7' }, fontFace
  });
  s19.addText('Proposed Year 1 Sourcing Execution Roadmap (₹12.90 Cr Target)', {
    x: 0.6, y: 0.8, w: 8.8, h: 0.45, fontSize: 19, bold: true, color: 'FFFFFF', fontFace
  });
  s19.addText('Structured 3-wave execution plan targeting ₹12.90 Cr proposed Year 1 sourcing target (indicative proposal only).', {
    x: 0.6, y: 1.25, w: 8.8, h: 0.3, fontSize: 10.5, color: '94A3B8', fontFace
  });

  const waveBoxes = [
    { w: 'WAVE 1: DIRECT STRATEGIC SOURCING', m: 'Months 1–3', t: 'Target: ₹8.50 Cr', d: 'Strategic direct negotiations: Soda Ash direct manufacturer formula indexation & core raw materials.' },
    { w: 'WAVE 2: DYNAMIC REVERSE E-AUCTIONS', m: 'Months 3–6', t: 'Target: ₹3.20 Cr', d: 'Dynamic e-auction bidding: Standardized packaging cartons, shrink film, plant consumables.' },
    { w: 'WAVE 3: VENDOR CONSOLIDATION & PANELS', m: 'Months 6–12', t: 'Target: ₹1.20 Cr', d: 'Vendor consolidation & long-term agreements: MRO distributor panel rationalization & commercial payment terms.' }
  ];
  waveBoxes.forEach((wv, idx) => {
    const y = 1.6 + idx * 0.95;
    s19.addShape('rect', { x: 0.6, y, w: 8.7, h: 0.85, fill: { color: '1E293B' }, line: { color: '334155', width: 1 } });
    s19.addText(wv.w, { x: 0.8, y: y + 0.08, w: 4.2, h: 0.25, fontSize: 10, bold: true, color: '38BDF8', fontFace });
    s19.addText(wv.m, { x: 5.0, y: y + 0.08, w: 2.0, h: 0.25, fontSize: 9.5, color: 'CBD5E1', fontFace });
    s19.addText(wv.t, { x: 7.2, y: y + 0.08, w: 1.9, h: 0.25, fontSize: 9.5, bold: true, color: '34D399', fontFace });
    s19.addText(wv.d, { x: 0.8, y: y + 0.38, w: 8.3, h: 0.4, fontSize: 8, color: 'E2E8F0', fontFace });
  });

  s19.addShape('rect', { x: 0.6, y: 4.5, w: 8.7, h: 0.55, fill: { color: '0F172A' }, line: { color: '1E293B', width: 1 } });
  s19.addText('Delivery Confidence Range: ₹9.004 Cr (10% floor) to ₹22.509 Cr (25% high delivery band) based on documented consulting delivery benchmarks. Proposed Year 1 target of ₹12.90 Cr is an indicative consulting proposal only.', {
    x: 0.8, y: 4.58, w: 8.3, h: 0.38, fontSize: 7.5, color: 'E2E8F0', fontFace
  });
  addBriefFooter(s19, 19);

  // Slide 20: Management Recommendations and Decisions Required
  const s20 = pptx.addSlide();
  s20.background = { color: '0B1120' };
  s20.addText('DECISIONS REQUIRED', {
    x: 0.6, y: 0.4, w: 2.8, h: 0.3, fontSize: 10, bold: true, color: 'FFFFFF', fill: { color: '10B981' }, fontFace
  });
  s20.addText('Management Recommendations & Decisions Required', {
    x: 0.6, y: 0.8, w: 8.8, h: 0.45, fontSize: 20, bold: true, color: 'FFFFFF', fontFace
  });
  s20.addText('Key decisions, steering governance, and formal certification required from Borosil executive leadership.', {
    x: 0.6, y: 1.25, w: 8.8, h: 0.3, fontSize: 11, color: '94A3B8', fontFace
  });

  const decisions = [
    { n: '1. Sourcing Steering Committee', d: 'Convene joint Borosil-Procucev Sourcing Steering Committee and approve Wave 1 charter.' },
    { n: '2. Primary Producer Direct Trial', d: 'Approve plant technical trial protocol for direct primary manufacturer engagement on Dense Soda Ash.' },
    { n: '3. E-Auction Bidding Authorization', d: 'Authorize reverse dynamic e-auction bidding rules and supplier qualification criteria for corrugated packaging.' },
    { n: '4. Commercial Payment Terms Mandate', d: 'Mandate corporate benchmark 60-day commercial payment terms across all renewed vendor contracts.' }
  ];
  decisions.forEach((dc, idx) => {
    const y = 1.6 + idx * 0.72;
    s20.addShape('rect', { x: 0.6, y, w: 8.7, h: 0.65, fill: { color: '1E293B' }, line: { color: '334155', width: 1 } });
    s20.addText(dc.n, { x: 0.8, y: y + 0.08, w: 8.3, h: 0.25, fontSize: 10, bold: true, color: '38BDF8', fontFace });
    s20.addText(dc.d, { x: 0.8, y: y + 0.35, w: 8.3, h: 0.25, fontSize: 8.5, color: 'E2E8F0', fontFace });
  });

  s20.addShape('rect', { x: 0.6, y: 4.55, w: 8.7, h: 0.5, fill: { color: '0F172A' }, line: { color: '10B981', width: 1.5 } });
  s20.addText('EXECUTIVE CERTIFICATION STATEMENT: Procurement Diagnostic Completed — Opportunity Identified for Commercial Validation.', {
    x: 0.8, y: 4.65, w: 8.3, h: 0.3, fontSize: 9.5, bold: true, color: 'FFFFFF', fontFace
  });
  addBriefFooter(s20, 20);
}
