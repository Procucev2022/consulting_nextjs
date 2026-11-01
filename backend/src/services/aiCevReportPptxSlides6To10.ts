/**
 * aiCEV Executive Report PPTX Slides 6 to 10 (Prompt 596)
 * Authoritative 16:9 presentation slides for Borosil Ltd (AIC-2026-0002).
 * Rule 8: Constants isolation; Rule 9: Strongly typed; max lines <= 300, complexity <= 10.
 */

import type PptxGenJS from 'pptxgenjs';
import { TYPOGRAPHY } from '../constants/executiveBriefLayoutConstants';
import { addBriefFooter } from './executiveOpportunityBriefPptxHelpers';
import { BOROSIL_COMMERCIAL_SCENARIOS } from '../constants/borosilCommercialScenarios';

export function renderReportPptxSlides6To10(pptx: PptxGenJS): void {
  const fontFace = TYPOGRAPHY.fallbackFont;

  // Slide 6: Sourcing Strategy and Opportunity Architecture
  const s6 = pptx.addSlide();
  s6.background = { color: '0B1120' };
  s6.addText('SOURCING ARCHITECTURE', {
    x: 0.6, y: 0.4, w: 3.0, h: 0.3, fontSize: 10, bold: true, color: 'FFFFFF', fill: { color: '2563EB' }, fontFace
  });
  s6.addText('Sourcing Strategy and Opportunity Architecture', {
    x: 0.6, y: 0.8, w: 8.8, h: 0.45, fontSize: 20, bold: true, color: 'FFFFFF', fontFace
  });
  s6.addText('Three-tier sourcing lever structure with strict deduplication and governance reserve isolation.', {
    x: 0.6, y: 1.25, w: 8.8, h: 0.3, fontSize: 11, color: '94A3B8', fontFace
  });

  const archCards = [
    { l: 'LEVER 1', t: 'Strategic Sourcing', s: '₹127.118 Cr', n: '₹73.769 Cr', st: 'Commercial Scope', d: 'Direct price harmonization & primary producer master agreements across 89 packages.' },
    { l: 'LEVER 2', t: 'Vendor Consolidation', s: '₹12.081 Cr', n: '₹11.978 Cr', st: 'Governance Reserve', d: 'Held in governance reserve; excluded from customer targets pending validation (4 packages).' },
    { l: 'LEVER 3', t: 'Reverse E-Auctions', s: '₹21.817 Cr', n: '₹1.352 Cr', st: 'Commercial Scope', d: 'Dynamic competitive multi-round e-bidding for packaging and indirect commodities (12 packages).' }
  ];
  archCards.forEach((c, idx) => {
    const x = 0.6 + idx * 2.95;
    s6.addShape('rect', { x, y: 1.6, w: 2.8, h: 1.7, fill: { color: '1E293B' }, line: { color: '334155', width: 1 } });
    s6.addText(c.l, { x: x + 0.15, y: 1.75, w: 2.5, h: 0.25, fontSize: 9.5, bold: true, color: '38BDF8', fontFace });
    s6.addText(c.t, { x: x + 0.15, y: 2.05, w: 2.5, h: 0.35, fontSize: 13, bold: true, color: 'F8FAFC', fontFace });
    s6.addText(`Spend: ${c.s} | Net: ${c.n}`, { x: x + 0.15, y: 2.45, w: 2.5, h: 0.25, fontSize: 9.5, bold: true, color: idx === 1 ? 'FBBF24' : '34D399', fontFace });
    s6.addText(`Status: ${c.st}`, { x: x + 0.15, y: 2.7, w: 2.5, h: 0.2, fontSize: 8.5, color: idx === 1 ? 'FBBF24' : '38BDF8', fontFace });
    s6.addText(c.d, { x: x + 0.15, y: 2.95, w: 2.5, h: 0.35, fontSize: 8.5, color: '94A3B8', fontFace });
  });

  s6.addShape('rect', { x: 0.6, y: 3.45, w: 8.7, h: 1.55, fill: { color: '0F172A' }, line: { color: '1E293B', width: 1 } });
  s6.addText('PRIMARY PRODUCER DIRECT ENGAGEMENT STRATEGY', {
    x: 0.8, y: 3.6, w: 8.3, h: 0.25, fontSize: 10.5, bold: true, color: '38BDF8', fontFace
  });
  const archPoints = [
    '• Dense Soda Ash & Core Feedstocks: Present direct manufacturer engagement as a strategy to evaluate with primary producers.',
    '• Primary Producer Engagement: Direct commercial negotiations with primary producers GHCL and RSPL for annual volume indexation and formula-based pricing.',
    '• Opportunity Reconciliation: L1 (₹73.769 Cr) + L3 (₹1.352 Cr) = ₹75.121 Cr Modelled Opportunity Identified for Commercial Validation.',
    '• Governance Principle: Modelled opportunity is unapproved; realization recognized only post-contract execution and audit verification.'
  ];
  s6.addText(archPoints.join('\n'), {
    x: 0.8, y: 3.9, w: 8.3, h: 1.05, fontSize: 8.5, color: 'E2E8F0', fontFace
  });
  addBriefFooter(s6, 6);

  // Slide 7: Lever 1 — Strategic Sourcing Opportunity
  const s7 = pptx.addSlide();
  s7.background = { color: '0B1120' };
  s7.addText('LEVER 1 SOURCING', {
    x: 0.6, y: 0.4, w: 2.5, h: 0.3, fontSize: 10, bold: true, color: 'FFFFFF', fill: { color: '2563EB' }, fontFace
  });
  s7.addText('Lever 1 — Strategic Sourcing Opportunity (₹73.769 Cr)', {
    x: 0.6, y: 0.8, w: 8.8, h: 0.45, fontSize: 20, bold: true, color: 'FFFFFF', fontFace
  });
  s7.addText('Direct price variance elimination and volume master contracting across 89 qualified packages.', {
    x: 0.6, y: 1.25, w: 8.8, h: 0.3, fontSize: 11, color: '94A3B8', fontFace
  });

  const l1Metrics = [
    { l: 'QUALIFIED PACKAGES', v: '89', s: 'Direct materials & chemicals' },
    { l: 'ELIGIBLE SPEND', v: '₹127.118 Cr', s: 'Evaluated category baseline' },
    { l: 'GROSS OPPORTUNITY', v: '₹103.729 Cr', s: 'Identified variance benefit' },
    { l: 'NET MODELLED OPP.', v: '₹73.769 Cr', s: 'Post-overlap deduplication' }
  ];
  l1Metrics.forEach((m, idx) => {
    const x = 0.6 + idx * 2.2;
    s7.addShape('rect', { x, y: 1.6, w: 2.1, h: 1.05, fill: { color: '1E293B' }, line: { color: '334155', width: 1 } });
    s7.addText(m.l, { x: x + 0.1, y: 1.7, w: 1.9, h: 0.2, fontSize: 8, bold: true, color: '94A3B8', fontFace });
    s7.addText(m.v, { x: x + 0.1, y: 1.95, w: 1.9, h: 0.35, fontSize: 16, bold: true, color: '38BDF8', fontFace });
    s7.addText(m.s, { x: x + 0.1, y: 2.3, w: 1.9, h: 0.25, fontSize: 8, color: 'CBD5E1', fontFace });
  });

  s7.addShape('rect', { x: 0.6, y: 2.8, w: 8.7, h: 2.2, fill: { color: '1E293B' }, line: { color: '334155', width: 1 } });
  s7.addText('LEVER 1 EXECUTION MECHANISMS & DEDUPLICATION', {
    x: 0.8, y: 2.95, w: 8.3, h: 0.3, fontSize: 11, bold: true, color: '38BDF8', fontFace
  });
  const l1Points = [
    '• Cross-Plant Price Harmonization: Align purchase rates across Bharuch (1120) and Jaipur (6101, 8202) units to best ex-works rates.',
    '• Direct Manufacturer Engagement: Present primary producer agreements (GHCL, Tata Chemicals) as an evaluation strategy.',
    '• Multi-Lever Overlap Deductions: ₹29.960 Cr overlap deducted against dynamic e-auction to eliminate double-counting.',
    '• Net Defensible Value: ₹73.769 Cr post-deduplication (₹103.729 Cr Gross - ₹29.960 Cr Overlap).',
    '• Opportunity Classification: Net Modelled Sourcing Opportunity established at ₹73.769 Cr (Client-Approved: ₹0, Realized: ₹0).',
    '• Validation Rule: Savings recognized strictly upon commercial contract execution, revised PO pricing, and invoice matching.'
  ];
  s7.addText(l1Points.join('\n'), {
    x: 0.8, y: 3.3, w: 8.3, h: 1.6, fontSize: 8.5, color: 'E2E8F0', fontFace
  });
  addBriefFooter(s7, 7);

  // Slide 8: Lever 1 — Procucev Calculation Mechanism and Scenarios
  const s8 = pptx.addSlide();
  s8.background = { color: '0B1120' };
  s8.addText('LEVER 1 CALCULATION & SCENARIOS', {
    x: 0.6, y: 0.4, w: 3.5, h: 0.3, fontSize: 10, bold: true, color: 'FFFFFF', fill: { color: '2563EB' }, fontFace
  });
  s8.addText('How Procucev Calculates Opportunity & Commercial Scenarios: Lever 1', {
    x: 0.6, y: 0.8, w: 8.8, h: 0.45, fontSize: 19, bold: true, color: 'FFFFFF', fontFace
  });
  s8.addText('Defensible bottom-up calculation logic and 2 practical commercial scenarios for Borosil management.', {
    x: 0.6, y: 1.25, w: 8.8, h: 0.3, fontSize: 11, color: '94A3B8', fontFace
  });

  s8.addShape('rect', { x: 0.6, y: 1.6, w: 8.7, h: 1.15, fill: { color: '1E293B' }, line: { color: '334155', width: 1 } });
  s8.addText('HOW PROCUCEV CALCULATES THE OPPORTUNITY (LEVER 1)', {
    x: 0.8, y: 1.72, w: 8.3, h: 0.25, fontSize: 10, bold: true, color: '38BDF8', fontFace
  });
  s8.addText('Transactions → Normalization → Price Comparison → Reference Price → Qty Opportunity → Overlap Deduction → Net Modelled', {
    x: 0.8, y: 2.0, w: 8.3, h: 0.22, fontSize: 8.5, bold: true, color: '34D399', fontFace
  });
  s8.addText('Formula: Potential Price Opportunity = MAX(0, Actual Comparable Purchase Price − Reference Price) × Eligible Quantity\nOutcome: ₹103.729 Cr Gross − ₹29.960 Cr Overlap = ₹73.769 Cr Net Modelled Opportunity across 89 packages.', {
    x: 0.8, y: 2.25, w: 8.3, h: 0.45, fontSize: 8, color: 'CBD5E1', fontFace
  });

  const s1A = BOROSIL_COMMERCIAL_SCENARIOS[0];
  const s1B = BOROSIL_COMMERCIAL_SCENARIOS[1];

  // Scenario A Card
  s8.addShape('rect', { x: 0.6, y: 2.9, w: 4.25, h: 2.1, fill: { color: '1E293B' }, line: { color: '334155', width: 1 } });
  s8.addText('SCENARIO A: Cross-Plant Price Harmonization', { x: 0.8, y: 3.02, w: 3.85, h: 0.25, fontSize: 10, bold: true, color: '38BDF8', fontFace });
  s8.addText(`Eligible Spend: ₹${s1A.eligibleSpendCr.toFixed(3)} Cr (${s1A.category})\n` +
    'Current: Material Group 11100 100% procured at Bharuch Plant 1120. 0 chemical POs at Jaipur.\n' +
    `• Conservative: ${s1A.conservativeCase.description}\n` +
    `• Higher Case: ${s1A.higherAchievementCase.description}\n` +
    `Timeline: ${s1A.implementationTimeline}\n` +
    `Status: ${s1A.assumptionStatus}`, {
    x: 0.8, y: 3.3, w: 3.85, h: 1.6, fontSize: 8, color: 'E2E8F0', fontFace
  });

  // Scenario B Card
  s8.addShape('rect', { x: 5.05, y: 2.9, w: 4.25, h: 2.1, fill: { color: '1E293B' }, line: { color: '334155', width: 1 } });
  s8.addText('SCENARIO B: Direct Manufacturer Strategic Sourcing', { x: 5.25, y: 3.02, w: 3.85, h: 0.25, fontSize: 10, bold: true, color: '38BDF8', fontFace });
  s8.addText(`Eligible Spend: ₹${s1B.eligibleSpendCr.toFixed(3)} Cr (${s1B.category})\n` +
    'Current: Borosil buys 100% direct from primary producers GHCL (₹58.117 Cr) and RSPL (₹15.900 Cr) at Plant 1120.\n' +
    `• Conservative (${s1B.conservativeCase.improvementPct.toFixed(1)}%): ₹${s1B.conservativeCase.financialOutcomeCr.toFixed(3)} Cr (${s1B.conservativeCase.financialOutcomeInr.toLocaleString('en-IN')} INR)\n` +
    `• Higher Case (${s1B.higherAchievementCase.improvementPct.toFixed(1)}%): ₹${s1B.higherAchievementCase.financialOutcomeCr.toFixed(3)} Cr (${s1B.higherAchievementCase.financialOutcomeInr.toLocaleString('en-IN')} INR)\n` +
    `Timeline: ${s1B.implementationTimeline}\n` +
    `Status: ${s1B.assumptionStatus}`, {
    x: 5.25, y: 3.3, w: 3.85, h: 1.6, fontSize: 8, color: 'E2E8F0', fontFace
  });
  addBriefFooter(s8, 8);

  // Slide 9: Lever 1 — Alternative Supplier and Direct Sourcing Strategy
  const s9 = pptx.addSlide();
  s9.background = { color: '0B1120' };
  s9.addText('LEVER 1 ALTERNATIVES', {
    x: 0.6, y: 0.4, w: 2.8, h: 0.3, fontSize: 10, bold: true, color: 'FFFFFF', fill: { color: '2563EB' }, fontFace
  });
  s9.addText('Lever 1 — Alternative Supplier and Direct Sourcing Strategy', {
    x: 0.6, y: 0.8, w: 8.8, h: 0.45, fontSize: 20, bold: true, color: 'FFFFFF', fontFace
  });
  s9.addText('Rigorous supplier market evaluation across Dense Soda Ash, Silica Sand, and Industrial Gases.', {
    x: 0.6, y: 1.25, w: 8.8, h: 0.3, fontSize: 11, color: '94A3B8', fontFace
  });

  const l1SuppRows = [
    ['Category', 'Current Source', 'Potential Alternative', 'Status Classification', 'Proximity'],
    ['Dense Soda Ash (Active)', 'GHCL Limited (Vendor 703717)', 'GHCL Limited (Sutrapada)', 'Existing Approved Primary Manufacturer', '<120 km (Bharuch)'],
    ['Inner Cartons (Active)', 'Parksons Packaging (1901090)', 'Parksons Packaging Ltd', 'Existing Approved Packaging Converter', 'Plant 6101 Regional'],
    ['Dense Soda Ash (Candidate)', 'GHCL / RSPL (Direct)', 'Tata Chemicals (Mithapur)', 'Potential Alternative — Qual. Required', '~450 km (Mithapur)'],
    ['Dense Soda Ash (Candidate)', 'GHCL / RSPL (Direct)', 'Nirma Limited (Porbandar)', 'Potential Alternative — Qual. Required', '~380 km (Porbandar)']
  ];
  const l1TableData = l1SuppRows.map((row) => row.map((text) => ({ text })));
  s9.addTable(l1TableData as unknown as PptxGenJS.TableRow[], {
    x: 0.6, y: 1.6, w: 8.7, h: 2.7,
    fill: { color: '1E293B' },
    color: 'F8FAFC',
    fontSize: 8.5,
    fontFace,
    border: { pt: 0.5, color: '334155' }
  });
  s9.addText('Three Classifications Enforced: 1. Existing Approved | 2. Potential Alternative — Qualification Required | 3. Strategic Manufacturer Candidate — Verification Required.', {
    x: 0.6, y: 4.5, w: 8.7, h: 0.3, fontSize: 8, color: '94A3B8', fontFace
  });
  addBriefFooter(s9, 9);

  // Slide 10: Lever 2 — Vendor Consolidation Opportunity
  const s10 = pptx.addSlide();
  s10.background = { color: '0B1120' };
  s10.addText('LEVER 2 CONSOLIDATION', {
    x: 0.6, y: 0.4, w: 3.0, h: 0.3, fontSize: 10, bold: true, color: 'FFFFFF', fill: { color: 'F59E0B' }, fontFace
  });
  s10.addText('Lever 2 — Vendor Consolidation Opportunity (Governance Reserve)', {
    x: 0.6, y: 0.8, w: 8.8, h: 0.45, fontSize: 19, bold: true, color: 'FFFFFF', fontFace
  });
  s10.addText('Status: Held in Governance Reserve — Excluded Pending Commercial Validation (Addressable Spend: ₹12.081 Cr).', {
    x: 0.6, y: 1.25, w: 8.8, h: 0.3, fontSize: 10.5, bold: true, color: 'FBBF24', fontFace
  });

  const l2Metrics = [
    { l: 'QUALIFIED PACKAGES', v: '4', s: 'Consumables & plant spares' },
    { l: 'RELEVANT SPEND', v: '₹12.081 Cr', s: 'Evaluated fragmented spend' },
    { l: 'MODELLED OPP.', v: '₹11.978 Cr', s: 'Held in governance reserve' },
    { l: 'CUSTOMER CONTRIBUTION', v: '₹0.00 Cr', s: 'Excluded pending validation' }
  ];
  l2Metrics.forEach((m, idx) => {
    const x = 0.6 + idx * 2.2;
    s10.addShape('rect', { x, y: 1.6, w: 2.1, h: 1.05, fill: { color: '1E293B' }, line: { color: '334155', width: 1 } });
    s10.addText(m.l, { x: x + 0.1, y: 1.7, w: 1.9, h: 0.2, fontSize: 8, bold: true, color: '94A3B8', fontFace });
    s10.addText(m.v, { x: x + 0.1, y: 1.95, w: 1.9, h: 0.35, fontSize: 16, bold: true, color: m.v === '₹0.00 Cr' ? 'FBBF24' : '38BDF8', fontFace });
    s10.addText(m.s, { x: x + 0.1, y: 2.3, w: 1.9, h: 0.25, fontSize: 8, color: 'CBD5E1', fontFace });
  });

  s10.addShape('rect', { x: 0.6, y: 2.8, w: 8.7, h: 2.2, fill: { color: '1E293B' }, line: { color: '334155', width: 1 } });
  s10.addText('LEVER 2 COMMERCIAL VALIDATION SAFEGUARD & RECONCILIATION', {
    x: 0.8, y: 2.95, w: 8.3, h: 0.3, fontSize: 11, bold: true, color: 'FBBF24', fontFace
  });
  const l2Points = [
    '• Governance Reserve Status: ₹11.978 Cr held in governance reserve; excluded from customer actionable opportunity.',
    '• Relevant Addressable Spend: ₹12.081 Cr across 4 fragmented categories (electrical spares, hardware, consumable tools).',
    '• Quality & Continuity Safeguard: Vendor consolidation requires formal plant maintenance and engineering clearance.',
    '• Customer-Facing Savings: Exactly ₹0.00 Cr recognized; zero customer savings claimed prior to formal validation.',
    '• Supplier Base Audit: 1,537 Active SAP Supplier Accounts normalized from 1,561 raw ERP vendor records.',
    '• Commercial Next Step: Launch Wave 3 distributor panel negotiations and execute joint technical qualification trials.'
  ];
  s10.addText(l2Points.join('\n'), {
    x: 0.8, y: 3.3, w: 8.3, h: 1.6, fontSize: 8.5, color: 'E2E8F0', fontFace
  });
  addBriefFooter(s10, 10);
}
