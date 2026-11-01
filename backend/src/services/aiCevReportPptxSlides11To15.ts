/**
 * aiCEV Executive Report PPTX Slides 11 to 15 (Prompt 596)
 * Authoritative 16:9 presentation slides for Borosil Ltd (AIC-2026-0002).
 * Rule 8: Constants isolation; Rule 9: Strongly typed; max lines <= 300, complexity <= 10.
 */

import type PptxGenJS from 'pptxgenjs';
import { TYPOGRAPHY } from '../constants/executiveBriefLayoutConstants';
import { addBriefFooter } from './executiveOpportunityBriefPptxHelpers';
import { BOROSIL_COMMERCIAL_SCENARIOS } from '../constants/borosilCommercialScenarios';

export function renderReportPptxSlides11To15(pptx: PptxGenJS): void {
  const fontFace = TYPOGRAPHY.fallbackFont;

  // Slide 11: Lever 2 — Procucev Calculation Mechanism and Scenarios
  const s11 = pptx.addSlide();
  s11.background = { color: '0B1120' };
  s11.addText('LEVER 2 CALCULATION & SCENARIOS', {
    x: 0.6, y: 0.4, w: 3.5, h: 0.3, fontSize: 10, bold: true, color: 'FFFFFF', fill: { color: 'F59E0B' }, fontFace
  });
  s11.addText('How Procucev Calculates Opportunity & Commercial Scenarios: Lever 2', {
    x: 0.6, y: 0.8, w: 8.8, h: 0.45, fontSize: 19, bold: true, color: 'FFFFFF', fontFace
  });
  s11.addText('Status: Held in Governance Reserve — Excluded Pending Commercial Validation (Addressable Spend: ₹12.081 Cr).', {
    x: 0.6, y: 1.25, w: 8.8, h: 0.3, fontSize: 10.5, bold: true, color: 'FBBF24', fontFace
  });

  s11.addShape('rect', { x: 0.6, y: 1.6, w: 8.7, h: 1.15, fill: { color: '1E293B' }, line: { color: '334155', width: 1 } });
  s11.addText('HOW PROCUCEV CALCULATES THE OPPORTUNITY (LEVER 2)', {
    x: 0.8, y: 1.72, w: 8.3, h: 0.25, fontSize: 10, bold: true, color: 'FBBF24', fontFace
  });
  s11.addText('Supplier Fragmentation → Spend Analysis → Volume Consolidation → Qualification → Negotiation → Landed Cost → Validated Opp.', {
    x: 0.8, y: 2.0, w: 8.3, h: 0.22, fontSize: 8.5, bold: true, color: '38BDF8', fontFace
  });
  s11.addText('Formula: Illustrative Consolidation Opportunity = Eligible Consolidated Spend × Commercial Improvement Assumption %\nOutcome: ₹11.978 Cr Net Modelled Pool (4 packages) held in governance reserve; ₹0 customer-facing contribution.', {
    x: 0.8, y: 2.25, w: 8.3, h: 0.45, fontSize: 8, color: 'CBD5E1', fontFace
  });

  const s2A = BOROSIL_COMMERCIAL_SCENARIOS[2];
  const s2B = BOROSIL_COMMERCIAL_SCENARIOS[3];

  // Scenario A Card
  s11.addShape('rect', { x: 0.6, y: 2.9, w: 4.25, h: 2.1, fill: { color: '1E293B' }, line: { color: '334155', width: 1 } });
  s11.addText('SCENARIO A: Vendor Consolidation in Spares', { x: 0.8, y: 3.02, w: 3.85, h: 0.25, fontSize: 10, bold: true, color: '38BDF8', fontFace });
  s11.addText(`Qualified Spend: ₹${s2A.eligibleSpendCr.toFixed(3)} Cr (${s2A.category})\n` +
    'Current: Net category spend ₹5.9678 Cr; qualified package spend ₹0.2170 Cr across 195 lines.\n' +
    `• Conservative (${s2A.conservativeCase.improvementPct.toFixed(1)}%): ₹${s2A.conservativeCase.financialOutcomeCr.toFixed(3)} Cr (${s2A.conservativeCase.financialOutcomeInr.toLocaleString('en-IN')} INR)\n` +
    `• Higher Case (${s2A.higherAchievementCase.improvementPct.toFixed(1)}%): ₹${s2A.higherAchievementCase.financialOutcomeCr.toFixed(3)} Cr (${s2A.higherAchievementCase.financialOutcomeInr.toLocaleString('en-IN')} INR)\n` +
    `Timeline: ${s2A.implementationTimeline}\n` +
    `Status: ${s2A.assumptionStatus}`, {
    x: 0.8, y: 3.3, w: 3.85, h: 1.6, fontSize: 8, color: 'E2E8F0', fontFace
  });

  // Scenario B Card
  s11.addShape('rect', { x: 5.05, y: 2.9, w: 4.25, h: 2.1, fill: { color: '1E293B' }, line: { color: '334155', width: 1 } });
  s11.addText('SCENARIO B: Preferred Supplier Panel (Material Group 11525)', { x: 5.25, y: 3.02, w: 3.85, h: 0.25, fontSize: 10, bold: true, color: '38BDF8', fontFace });
  s11.addText(`Eligible Spend: ₹${s2B.eligibleSpendCr.toFixed(3)} Cr (${s2B.category})\n` +
    'Current: Material Group 11525 contains 0 rows and ₹0 spend in Borosil SAP master.\n' +
    `• Conservative: ${s2B.conservativeCase.description}\n` +
    `• Higher Case: ${s2B.higherAchievementCase.description}\n` +
    `Timeline: ${s2B.implementationTimeline}\n` +
    `Status: ${s2B.assumptionStatus}`, {
    x: 5.25, y: 3.3, w: 3.85, h: 1.6, fontSize: 8, color: 'E2E8F0', fontFace
  });
  addBriefFooter(s11, 11);

  // Slide 12: Lever 2 — Preferred Supplier Strategy
  const s12 = pptx.addSlide();
  s12.background = { color: '0B1120' };
  s12.addText('LEVER 2 PREFERRED PANELS', {
    x: 0.6, y: 0.4, w: 3.0, h: 0.3, fontSize: 10, bold: true, color: 'FFFFFF', fill: { color: 'F59E0B' }, fontFace
  });
  s12.addText('Lever 2 — Preferred Supplier Panel & Tiering Framework', {
    x: 0.6, y: 0.8, w: 8.8, h: 0.45, fontSize: 20, bold: true, color: 'FFFFFF', fontFace
  });
  s12.addText('Rationalizing 1,537 Active SAP Supplier Accounts into structured commercial partnership tiers.', {
    x: 0.6, y: 1.25, w: 8.8, h: 0.3, fontSize: 11, color: '94A3B8', fontFace
  });

  const tierRows = [
    ['Tier Classification', 'Spend Share (%)', 'Selection Criteria', 'Commercial Governance Action'],
    ['Tier 1: Strategic Partners', 'Top 10% (~75% Spend)', 'Primary manufacturers with multi-plant capacity', 'Annual C-suite review, volume indexed pricing, consignment stock'],
    ['Tier 2: Preferred Distributors', 'Next 25% (~20% Spend)', 'Authorized regional distributors with SLA guarantees', 'Master framework rate cards, retrospective volume rebates, 60 days'],
    ['Tier 3: Transactional Vendors', 'Remaining 65% (~5% Spend)', 'Spot & tail-spend suppliers creating processing overhead', 'Digital catalog marketplace, spot purchase reduction, vendor pruning']
  ];
  const tierTableData = tierRows.map((row) => row.map((text) => ({ text })));
  s12.addTable(tierTableData as unknown as PptxGenJS.TableRow[], {
    x: 0.6, y: 1.6, w: 8.7, h: 2.7,
    fill: { color: '1E293B' },
    color: 'F8FAFC',
    fontSize: 8.5,
    fontFace,
    border: { pt: 0.5, color: '334155' }
  });
  s12.addText('Governance Rule: Supplier consolidation will not sacrifice dual-sourcing requirements for critical production lines.', {
    x: 0.6, y: 4.5, w: 8.7, h: 0.3, fontSize: 8.5, color: '94A3B8', fontFace
  });
  addBriefFooter(s12, 12);

  // Slide 13: Lever 3 — Reverse E-Auction Opportunity
  const s13 = pptx.addSlide();
  s13.background = { color: '0B1120' };
  s13.addText('LEVER 3 E-AUCTION', {
    x: 0.6, y: 0.4, w: 2.5, h: 0.3, fontSize: 10, bold: true, color: 'FFFFFF', fill: { color: '10B981' }, fontFace
  });
  s13.addText('Lever 3 — Reverse E-Auction Opportunity (₹1.352 Cr)', {
    x: 0.6, y: 0.8, w: 8.8, h: 0.45, fontSize: 20, bold: true, color: 'FFFFFF', fontFace
  });
  s13.addText('Real-time competitive bidding and dynamic price discovery across 12 qualified packaging packages.', {
    x: 0.6, y: 1.25, w: 8.8, h: 0.3, fontSize: 11, color: '94A3B8', fontFace
  });

  const l3Metrics = [
    { l: 'QUALIFIED PACKAGES', v: '12', s: 'Corrugated boxes & indirects' },
    { l: 'ELIGIBLE SPEND', v: '₹21.817 Cr', s: 'Auction-ready spend baseline' },
    { l: 'GROSS OPPORTUNITY', v: '₹1.440 Cr', s: 'Dynamic bidding benefit' },
    { l: 'NET MODELLED OPP.', v: '₹1.352 Cr', s: 'Post-overlap deduplication' }
  ];
  l3Metrics.forEach((m, idx) => {
    const x = 0.6 + idx * 2.2;
    s13.addShape('rect', { x, y: 1.6, w: 2.1, h: 1.05, fill: { color: '1E293B' }, line: { color: '334155', width: 1 } });
    s13.addText(m.l, { x: x + 0.1, y: 1.7, w: 1.9, h: 0.2, fontSize: 8, bold: true, color: '94A3B8', fontFace });
    s13.addText(m.v, { x: x + 0.1, y: 1.95, w: 1.9, h: 0.35, fontSize: 16, bold: true, color: '10B981', fontFace });
    s13.addText(m.s, { x: x + 0.1, y: 2.3, w: 1.9, h: 0.25, fontSize: 8, color: 'CBD5E1', fontFace });
  });

  s13.addShape('rect', { x: 0.6, y: 2.8, w: 8.7, h: 2.2, fill: { color: '1E293B' }, line: { color: '334155', width: 1 } });
  s13.addText('LEVER 3 TACTICAL REVERSE AUCTIONS & DEDUPLICATION', {
    x: 0.8, y: 2.95, w: 8.3, h: 0.3, fontSize: 11, bold: true, color: '10B981', fontFace
  });
  const l3Points = [
    '• Packaging & Corrugated Boxes: Standardized specifications enable multi-round reverse dynamic e-auctions.',
    '• Transparent Price Discovery: Market competition discovers optimal regional prices without specification risk.',
    '• Overlap Deductions Applied: ₹0.088 Cr overlap removed to ensure perfect ledger reconciliation.',
    '• Net Modelled Opportunity: ₹1.352 Cr post-deduplication (₹1.440 Cr Gross - ₹0.088 Cr Overlap).',
    '• Opportunity Classification: Net Modelled Sourcing Opportunity established at ₹1.352 Cr (Client-Approved: ₹0).',
    '• Reconciliation: Modelled Opportunity Excluding Lever 2: L1 (₹73.769 Cr) + L3 (₹1.352 Cr) = ₹75.121 Cr. L2 (₹11.978 Cr) in reserve.'
  ];
  s13.addText(l3Points.join('\n'), {
    x: 0.8, y: 3.3, w: 8.3, h: 1.6, fontSize: 8.5, color: 'E2E8F0', fontFace
  });
  addBriefFooter(s13, 13);

  // Slide 14: Lever 3 — Procucev Calculation Mechanism and Scenarios
  const s14 = pptx.addSlide();
  s14.background = { color: '0B1120' };
  s14.addText('LEVER 3 CALCULATION & SCENARIOS', {
    x: 0.6, y: 0.4, w: 3.5, h: 0.3, fontSize: 10, bold: true, color: 'FFFFFF', fill: { color: '10B981' }, fontFace
  });
  s14.addText('How Procucev Calculates Opportunity & Commercial Scenarios: Lever 3', {
    x: 0.6, y: 0.8, w: 8.8, h: 0.45, fontSize: 19, bold: true, color: 'FFFFFF', fontFace
  });
  s14.addText('Defensible bottom-up dynamic bidding logic and 2 practical commercial scenarios for Borosil management.', {
    x: 0.6, y: 1.25, w: 8.8, h: 0.3, fontSize: 11, color: '94A3B8', fontFace
  });

  s14.addShape('rect', { x: 0.6, y: 1.6, w: 8.7, h: 1.15, fill: { color: '1E293B' }, line: { color: '334155', width: 1 } });
  s14.addText('HOW PROCUCEV CALCULATES THE OPPORTUNITY (LEVER 3)', {
    x: 0.8, y: 1.72, w: 8.3, h: 0.25, fontSize: 10, bold: true, color: '10B981', fontFace
  });
  s14.addText('Auction Spend → Spec Standardization → Qualified Panel → RFQ Template → Multi-Round Auction → Final Bid → Overlap Deduction', {
    x: 0.8, y: 2.0, w: 8.3, h: 0.22, fontSize: 8.5, bold: true, color: '38BDF8', fontFace
  });
  s14.addText('Formula: Auction Opportunity = MAX(0, Normalized Existing Purchase Price − Final Qualified Bid) × Eligible Auction Quantity\nOutcome: ₹1.440 Cr Gross − ₹0.088 Cr Overlap = ₹1.352 Cr Net Modelled Opportunity across 12 packages.', {
    x: 0.8, y: 2.25, w: 8.3, h: 0.45, fontSize: 8, color: 'CBD5E1', fontFace
  });

  const s3A = BOROSIL_COMMERCIAL_SCENARIOS[4];
  const s3B = BOROSIL_COMMERCIAL_SCENARIOS[5];

  // Scenario A Card
  s14.addShape('rect', { x: 0.6, y: 2.9, w: 4.25, h: 2.1, fill: { color: '1E293B' }, line: { color: '334155', width: 1 } });
  s14.addText('SCENARIO A: Dynamic Reverse Auctions (Packaging)', { x: 0.8, y: 3.02, w: 3.85, h: 0.25, fontSize: 10, bold: true, color: '38BDF8', fontFace });
  s14.addText(`Qualified Spend: ₹${s3A.eligibleSpendCr.toFixed(3)} Cr (${s3A.category})\n` +
    'Current: Net category spend ₹27.1472 Cr; qualified carton spend ₹2.1047 Cr (637 lines).\n' +
    `• Conservative (${s3A.conservativeCase.improvementPct.toFixed(1)}%): ₹${s3A.conservativeCase.financialOutcomeCr.toFixed(3)} Cr (${s3A.conservativeCase.financialOutcomeInr.toLocaleString('en-IN')} INR)\n` +
    `• Higher Case (${s3A.higherAchievementCase.improvementPct.toFixed(1)}%): ₹${s3A.higherAchievementCase.financialOutcomeCr.toFixed(3)} Cr (${s3A.higherAchievementCase.financialOutcomeInr.toLocaleString('en-IN')} INR)\n` +
    `Timeline: ${s3A.implementationTimeline}\n` +
    `Status: ${s3A.assumptionStatus}`, {
    x: 0.8, y: 3.3, w: 3.85, h: 1.6, fontSize: 8, color: 'E2E8F0', fontFace
  });

  // Scenario B Card
  s14.addShape('rect', { x: 5.05, y: 2.9, w: 4.25, h: 2.1, fill: { color: '1E293B' }, line: { color: '334155', width: 1 } });
  s14.addText('SCENARIO B: Plastic Packaging (Material Group 11320)', { x: 5.25, y: 3.02, w: 3.85, h: 0.25, fontSize: 10, bold: true, color: '38BDF8', fontFace });
  s14.addText(`Eligible Spend: ₹${s3B.eligibleSpendCr.toFixed(3)} Cr (${s3B.category})\n` +
    'Current: Material Group 11320 contains 0 rows and ₹0 spend in Borosil SAP master.\n' +
    `• Conservative: ${s3B.conservativeCase.description}\n` +
    `• Higher Case: ${s3B.higherAchievementCase.description}\n` +
    `Timeline: ${s3B.implementationTimeline}\n` +
    `Status: ${s3B.assumptionStatus}`, {
    x: 5.25, y: 3.3, w: 3.85, h: 1.6, fontSize: 8, color: 'E2E8F0', fontFace
  });
  addBriefFooter(s14, 14);

  // Slide 15: Additional Procurement Transformation Levers
  const s15 = pptx.addSlide();
  s15.background = { color: '0B1120' };
  s15.addText('PROCUREMENT TRANSFORMATION', {
    x: 0.6, y: 0.4, w: 3.2, h: 0.3, fontSize: 10, bold: true, color: 'FFFFFF', fill: { color: '64748B' }, fontFace
  });
  s15.addText('Additional Procurement Transformation Levers', {
    x: 0.6, y: 0.8, w: 8.8, h: 0.45, fontSize: 20, bold: true, color: 'FFFFFF', fontFace
  });
  s15.addText('10 strategic and operational interventions beyond direct price negotiation to transform procurement capability.', {
    x: 0.6, y: 1.25, w: 8.8, h: 0.3, fontSize: 11, color: '94A3B8', fontFace
  });

  const tRows = [
    ['Transformation Lever', 'Analytical Focus', 'Proposed Sourcing Intervention', 'Target Business Impact'],
    ['1. Demand Consolidation', 'Multi-plant BOM & volume pooling', 'Centralized enterprise master framework agreements', 'Enhanced buyer scale & top-tier volume pricing'],
    ['2. Spec Standardization', 'Cross-plant engineering tolerances', 'Harmonize packaging grammage & film microns', 'Elimination of setup fees & lower SKU complexity'],
    ['3. Make-vs-Buy Analysis', 'Captive maintenance vs 3rd party', 'Benchmark in-house fabrication against turnkey specialists', 'Fixed overhead conversion to variable unit cost'],
    ['4. Terms Harmonization', 'Supplier terms audit (15-60 days)', 'Enforce 60-day corporate benchmark credit across POs', 'Working capital expansion (₹8-12 Cr cash release)'],
    ['5. Logistics Optimization', 'Ex-works vs FOR delivered rates', 'Consolidate inbound shipping under competitive 3PL contracts', 'Removal of hidden distributor freight margins']
  ];
  const tTableData = tRows.map((row) => row.map((text) => ({ text })));
  s15.addTable(tTableData as unknown as PptxGenJS.TableRow[], {
    x: 0.6, y: 1.6, w: 8.7, h: 2.7,
    fill: { color: '1E293B' },
    color: 'F8FAFC',
    fontSize: 8,
    fontFace,
    border: { pt: 0.5, color: '334155' }
  });
  s15.addText('Non-Monetization Mandate: Transformation benefits are strictly separated from Module 2 direct price savings to preserve CFO audit trust.', {
    x: 0.6, y: 4.5, w: 8.7, h: 0.3, fontSize: 8, color: '94A3B8', fontFace
  });
  addBriefFooter(s15, 15);
}
