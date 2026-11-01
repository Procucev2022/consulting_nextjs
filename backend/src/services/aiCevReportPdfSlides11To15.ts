/**
 * aiCEV Executive Report PDF Slides 11 to 15 (Prompt 596)
 * Authoritative 16:9 presentation slides for Borosil Ltd (AIC-2026-0002).
 * Rule 8: Constants isolation; Rule 9: Strongly typed; max lines <= 300, complexity <= 10.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import { BOROSIL_COMMERCIAL_SCENARIOS } from '../constants/borosilCommercialScenarios';
import { BOROSIL_TRANSFORMATION_LEVERS } from '../constants/borosilAlternativeSuppliers';

export function renderReportPdfSlides11To15(canvas: PdfCanvas): void {
  // Slide 11: Lever 2 — Procucev Calculation Mechanism and Scenarios
  canvas.addPage();
  canvas.rect(0, 0, 960, 540, { fill: '#0B1120' });
  canvas.badge(60, 36, 'LEVER 2 CALCULATION & SCENARIOS', { bgColor: '#F59E0B', textColor: '#FFFFFF' });
  canvas.text('How Procucev Calculates Opportunity & Commercial Scenarios: Lever 2', 60, 85, { fontSize: 20, font: 'bold', color: '#FFFFFF' });
  canvas.text('Status: Held in Governance Reserve — Excluded Pending Commercial Validation (Addressable Spend: ₹12.081 Cr).', 60, 110, { fontSize: 10.5, font: 'bold', color: '#FBBF24' });

  canvas.rect(60, 135, 840, 110, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('HOW PROCUCEV CALCULATES THE OPPORTUNITY (LEVER 2)', 80, 158, { fontSize: 10, font: 'bold', color: '#FBBF24' });
  const l2Flow = 'Supplier Fragmentation → Spend Analysis → Volume Consolidation → Qualification → Negotiation → Landed Cost → Validated Opp.';
  canvas.text(l2Flow, 80, 182, { fontSize: 8.5, font: 'bold', color: '#38BDF8' });
  canvas.text('Formula: Illustrative Consolidation Opportunity = Eligible Consolidated Spend × Commercial Improvement Assumption %', 80, 206, { fontSize: 8.5, color: '#F8FAFC' });
  canvas.text('Exact Ledger Outcome: ₹11.978 Cr Net Modelled Pool (4 packages) held in governance reserve; ₹0 customer-facing contribution.', 80, 228, { fontSize: 8.5, color: '#CBD5E1' });

  const s2A = BOROSIL_COMMERCIAL_SCENARIOS[2];
  const s2B = BOROSIL_COMMERCIAL_SCENARIOS[3];

  const scY = 255;
  const scW = 410;
  // Scenario A Card
  canvas.rect(60, scY, scW, 215, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('SCENARIO A: Vendor Consolidation in Spares', 80, scY + 24, { fontSize: 10.5, font: 'bold', color: '#38BDF8' });
  canvas.text(`Qualified Spend: ₹${s2A.eligibleSpendCr.toFixed(3)} Cr (${s2A.category})`, 80, scY + 44, { fontSize: 8.5, color: '#94A3B8' });
  canvas.textBlock(`Current Situation: ${s2A.currentSituation}`, 80, scY + 62, scW - 40, { fontSize: 8, color: '#E2E8F0', lineHeight: 11 });
  canvas.text(`• Conservative Case (${s2A.conservativeCase.improvementPct.toFixed(1)}%): ₹${s2A.conservativeCase.financialOutcomeCr.toFixed(3)} Cr (${s2A.conservativeCase.financialOutcomeInr.toLocaleString('en-IN')} INR)`, 80, scY + 115, { fontSize: 8.5, font: 'bold', color: '#34D399' });
  canvas.text(`• Higher Case (${s2A.higherAchievementCase.improvementPct.toFixed(1)}%): ₹${s2A.higherAchievementCase.financialOutcomeCr.toFixed(3)} Cr (${s2A.higherAchievementCase.financialOutcomeInr.toLocaleString('en-IN')} INR)`, 80, scY + 135, { fontSize: 8.5, font: 'bold', color: '#38BDF8' });
  canvas.text(`Timeline: ${s2A.implementationTimeline}`, 80, scY + 158, { fontSize: 8, color: '#94A3B8' });
  canvas.text(`Status: ${s2A.assumptionStatus}`, 80, scY + 178, { fontSize: 7.5, color: '#FBBF24' });

  // Scenario B Card
  const scBX = 490;
  canvas.rect(scBX, scY, scW, 215, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('SCENARIO B: Preferred Supplier Panel (Material Group 11525)', scBX + 20, scY + 24, { fontSize: 10.5, font: 'bold', color: '#38BDF8' });
  canvas.text(`Eligible Spend: ₹${s2B.eligibleSpendCr.toFixed(3)} Cr (${s2B.category})`, scBX + 20, scY + 44, { fontSize: 8.5, color: '#94A3B8' });
  canvas.textBlock(`Current Situation: ${s2B.currentSituation}`, scBX + 20, scY + 62, scW - 40, { fontSize: 8, color: '#E2E8F0', lineHeight: 11 });
  canvas.text(`• Conservative Case: ${s2B.conservativeCase.description}`, scBX + 20, scY + 115, { fontSize: 8, font: 'bold', color: '#94A3B8' });
  canvas.text(`• Higher Case: ${s2B.higherAchievementCase.description}`, scBX + 20, scY + 135, { fontSize: 8, font: 'bold', color: '#94A3B8' });
  canvas.text(`Timeline: ${s2B.implementationTimeline}`, scBX + 20, scY + 158, { fontSize: 8, color: '#94A3B8' });
  canvas.text(`Status: ${s2B.assumptionStatus}`, scBX + 20, scY + 178, { fontSize: 7.5, color: '#FBBF24' });

  // Slide 12: Lever 2 — Preferred Supplier Strategy
  canvas.addPage();
  canvas.rect(0, 0, 960, 540, { fill: '#0B1120' });
  canvas.badge(60, 36, 'LEVER 2 PREFERRED PANELS', { bgColor: '#F59E0B', textColor: '#FFFFFF' });
  canvas.text('Lever 2 — Preferred Supplier Panel & Tiering Framework', 60, 85, { fontSize: 22, font: 'bold', color: '#FFFFFF' });
  canvas.text('Rationalizing 1,537 Active SAP Supplier Accounts into structured commercial partnership tiers.', 60, 110, { fontSize: 11, color: '#94A3B8' });

  const tiers = [
    { name: 'TIER 1: STRATEGIC PARTNERS', share: 'Top 10% Suppliers (~75% Spend)', criteria: 'Direct primary manufacturers with multi-plant contracts and indexed pricing.', act: 'Annual executive review, joint innovation roadmap, dedicated plant consignment.' },
    { name: 'TIER 2: PREFERRED DISTRIBUTORS', share: 'Next 25% Suppliers (~20% Spend)', criteria: 'Authorized regional distributors for spares, hardware, packaging, and chemicals.', act: 'Master framework rate cards, retrospective volume rebates, 60-day terms.' },
    { name: 'TIER 3: TRANSACTIONAL TAIL', share: 'Remaining 65% Suppliers (~5% Spend)', criteria: 'Low-value spot and ad-hoc suppliers currently creating processing overhead.', act: 'Digital catalog marketplace, spot purchase reduction, vendor base rationalization.' }
  ];

  tiers.forEach((t, idx) => {
    const y = 140 + idx * 105;
    canvas.rect(60, y, 840, 95, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
    canvas.text(t.name, 80, y + 25, { fontSize: 11, font: 'bold', color: '#38BDF8' });
    canvas.text(t.share, 450, y + 25, { fontSize: 9.5, font: 'bold', color: '#34D399' });
    canvas.text(`Criteria: ${t.criteria}`, 80, y + 50, { fontSize: 8.5, color: '#F8FAFC' });
    canvas.text(`Action: ${t.act}`, 80, y + 74, { fontSize: 8.5, color: '#94A3B8' });
  });

  canvas.rect(60, 460, 840, 35, { fill: '#0F172A', stroke: '#1E293B', lineWidth: 1 });
  canvas.text('Governance Rule: Supplier consolidation will not sacrifice dual-sourcing requirements for critical production lines.', 80, 482, { fontSize: 8, color: '#CBD5E1' });

  // Slide 13: Lever 3 — Reverse E-Auction Opportunity
  canvas.addPage();
  canvas.rect(0, 0, 960, 540, { fill: '#0B1120' });
  canvas.badge(60, 36, 'LEVER 3 E-AUCTION', { bgColor: '#10B981', textColor: '#FFFFFF' });
  canvas.text('Lever 3 — Reverse E-Auction Opportunity (₹1.352 Cr)', 60, 85, { fontSize: 22, font: 'bold', color: '#FFFFFF' });
  canvas.text('Real-time competitive bidding and dynamic price discovery across 12 qualified packaging packages.', 60, 110, { fontSize: 11, color: '#94A3B8' });

  const l3Metrics = [
    { l: 'QUALIFIED PACKAGES', v: '12', s: 'Corrugated boxes & indirects' },
    { l: 'ELIGIBLE SPEND', v: '₹21.817 Cr', s: 'Auction-ready spend baseline' },
    { l: 'GROSS OPPORTUNITY', v: '₹1.440 Cr', s: 'Dynamic bidding benefit' },
    { l: 'NET MODELLED OPP.', v: '₹1.352 Cr', s: 'Post-overlap deduplication' }
  ];
  l3Metrics.forEach((m, idx) => {
    const x = 60 + idx * 212;
    canvas.rect(x, 135, 202, 100, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
    canvas.text(m.l, x + 16, 162, { fontSize: 8.5, font: 'bold', color: '#94A3B8' });
    canvas.text(m.v, x + 16, 192, { fontSize: 18, font: 'bold', color: '#10B981' });
    canvas.text(m.s, x + 16, 215, { fontSize: 8.5, color: '#CBD5E1' });
  });

  canvas.rect(60, 255, 840, 220, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('LEVER 3 TACTICAL REVERSE AUCTIONS & DEDUPLICATION', 80, 282, { fontSize: 11, font: 'bold', color: '#10B981' });
  canvas.text('• Packaging & Corrugated Boxes: Standardized specifications enable multi-round reverse dynamic e-auctions.', 80, 312, { fontSize: 9.5, color: '#F8FAFC' });
  canvas.text('• Transparent Price Discovery: Market competition discovers optimal regional prices without specification risk.', 80, 338, { fontSize: 9.5, color: '#F8FAFC' });
  canvas.text('• Overlap Deductions Applied: ₹0.088 Cr overlap removed to ensure perfect ledger reconciliation.', 80, 364, { fontSize: 9.5, color: '#E2E8F0' });
  canvas.text('• Net Modelled Opportunity: ₹1.352 Cr post-deduplication (₹1.440 Cr Gross - ₹0.088 Cr Overlap).', 80, 390, { fontSize: 9.5, color: '#34D399' });
  canvas.text('• Opportunity Classification: Net Modelled Sourcing Opportunity established at ₹1.352 Cr (Client-Approved: ₹0).', 80, 416, { fontSize: 9.5, color: '#38BDF8' });
  canvas.text('• Reconciliation: Modelled Opportunity Excluding Lever 2: L1 (₹73.769 Cr) + L3 (₹1.352 Cr) = ₹75.121 Cr. L2 (₹11.978 Cr) in reserve.', 80, 442, { fontSize: 9, font: 'bold', color: '#10B981' });

  // Slide 14: Lever 3 — Procucev Calculation Mechanism and Scenarios
  canvas.addPage();
  canvas.rect(0, 0, 960, 540, { fill: '#0B1120' });
  canvas.badge(60, 36, 'LEVER 3 CALCULATION & SCENARIOS', { bgColor: '#10B981', textColor: '#FFFFFF' });
  canvas.text('How Procucev Calculates Opportunity & Commercial Scenarios: Lever 3', 60, 85, { fontSize: 20, font: 'bold', color: '#FFFFFF' });
  canvas.text('Defensible bottom-up dynamic bidding logic and 2 practical commercial scenarios for Borosil management.', 60, 110, { fontSize: 10.5, color: '#94A3B8' });

  canvas.rect(60, 135, 840, 110, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('HOW PROCUCEV CALCULATES THE OPPORTUNITY (LEVER 3)', 80, 158, { fontSize: 10, font: 'bold', color: '#10B981' });
  const l3Flow = 'Auction Spend → Spec Standardization → Qualified Panel → RFQ Template → Multi-Round Auction → Final Bid → Overlap Deduction';
  canvas.text(l3Flow, 80, 182, { fontSize: 8.5, font: 'bold', color: '#38BDF8' });
  canvas.text('Formula: Auction Opportunity = MAX(0, Normalized Existing Purchase Price − Final Qualified Bid) × Eligible Auction Quantity', 80, 206, { fontSize: 8.5, color: '#F8FAFC' });
  canvas.text('Exact Ledger Outcome: ₹1.440 Cr Gross − ₹0.088 Cr Overlap = ₹1.352 Cr Net Modelled Opportunity across 12 packages.', 80, 228, { fontSize: 8.5, color: '#CBD5E1' });

  const s3A = BOROSIL_COMMERCIAL_SCENARIOS[4];
  const s3B = BOROSIL_COMMERCIAL_SCENARIOS[5];

  // Scenario A Card
  canvas.rect(60, scY, scW, 215, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('SCENARIO A: Dynamic Reverse Auctions (Packaging)', 80, scY + 24, { fontSize: 10.5, font: 'bold', color: '#38BDF8' });
  canvas.text(`Qualified Spend: ₹${s3A.eligibleSpendCr.toFixed(3)} Cr (${s3A.category})`, 80, scY + 44, { fontSize: 8.5, color: '#94A3B8' });
  canvas.textBlock(`Current Situation: ${s3A.currentSituation}`, 80, scY + 62, scW - 40, { fontSize: 8, color: '#E2E8F0', lineHeight: 11 });
  canvas.text(`• Conservative Case (${s3A.conservativeCase.improvementPct.toFixed(1)}%): ₹${s3A.conservativeCase.financialOutcomeCr.toFixed(3)} Cr (${s3A.conservativeCase.financialOutcomeInr.toLocaleString('en-IN')} INR)`, 80, scY + 115, { fontSize: 8.5, font: 'bold', color: '#34D399' });
  canvas.text(`• Higher Case (${s3A.higherAchievementCase.improvementPct.toFixed(1)}%): ₹${s3A.higherAchievementCase.financialOutcomeCr.toFixed(3)} Cr (${s3A.higherAchievementCase.financialOutcomeInr.toLocaleString('en-IN')} INR)`, 80, scY + 135, { fontSize: 8.5, font: 'bold', color: '#38BDF8' });
  canvas.text(`Timeline: ${s3A.implementationTimeline}`, 80, scY + 158, { fontSize: 8, color: '#94A3B8' });
  canvas.text(`Status: ${s3A.assumptionStatus}`, 80, scY + 178, { fontSize: 7.5, color: '#FBBF24' });

  // Scenario B Card
  canvas.rect(scBX, scY, scW, 215, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('SCENARIO B: Plastic Packaging (Material Group 11320)', scBX + 20, scY + 24, { fontSize: 10.5, font: 'bold', color: '#38BDF8' });
  canvas.text(`Eligible Spend: ₹${s3B.eligibleSpendCr.toFixed(3)} Cr (${s3B.category})`, scBX + 20, scY + 44, { fontSize: 8.5, color: '#94A3B8' });
  canvas.textBlock(`Current Situation: ${s3B.currentSituation}`, scBX + 20, scY + 62, scW - 40, { fontSize: 8, color: '#E2E8F0', lineHeight: 11 });
  canvas.text(`• Conservative Case: ${s3B.conservativeCase.description}`, scBX + 20, scY + 115, { fontSize: 8, font: 'bold', color: '#94A3B8' });
  canvas.text(`• Higher Case: ${s3B.higherAchievementCase.description}`, scBX + 20, scY + 135, { fontSize: 8, font: 'bold', color: '#94A3B8' });
  canvas.text(`Timeline: ${s3B.implementationTimeline}`, scBX + 20, scY + 158, { fontSize: 8, color: '#94A3B8' });
  canvas.text(`Status: ${s3B.assumptionStatus}`, scBX + 20, scY + 178, { fontSize: 7.5, color: '#FBBF24' });

  // Slide 15: Additional Procurement Transformation Levers
  canvas.addPage();
  canvas.rect(0, 0, 960, 540, { fill: '#0B1120' });
  canvas.badge(60, 36, 'PROCUREMENT TRANSFORMATION', { bgColor: '#64748B', textColor: '#FFFFFF' });
  canvas.text('Additional Procurement Transformation Levers', 60, 85, { fontSize: 22, font: 'bold', color: '#FFFFFF' });
  canvas.text('10 strategic and operational interventions beyond direct price negotiation to transform procurement capability.', 60, 110, { fontSize: 11, color: '#94A3B8' });

  const tLevers = BOROSIL_TRANSFORMATION_LEVERS.slice(0, 5);
  tLevers.forEach((tl, idx) => {
    const y = 140 + idx * 62;
    canvas.rect(60, y, 840, 54, { fill: '#1E293B', stroke: '#334155', lineWidth: 0.75 });
    canvas.text(`${tl.leverIndex}. ${tl.leverName}`, 80, y + 20, { fontSize: 10, font: 'bold', color: '#38BDF8' });
    canvas.text(`Scope: ${tl.whatProcucevAnalyzes}`, 320, y + 20, { fontSize: 8, color: '#CBD5E1' });
    canvas.text(`Intervention: ${tl.proposedIntervention}`, 80, y + 40, { fontSize: 8, color: '#F8FAFC' });
    canvas.text(`Benefit: ${tl.expectedBusinessBenefit}`, 480, y + 40, { fontSize: 8, font: 'bold', color: tl.financialClassification === 'FINANCIAL' ? '#34D399' : '#38BDF8' });
  });

  canvas.rect(60, 460, 840, 35, { fill: '#0F172A', stroke: '#1E293B', lineWidth: 1 });
  canvas.text('Non-Monetization Mandate: Transformation benefits are strictly separated from Module 2 direct price savings to preserve CFO audit trust.', 80, 482, { fontSize: 8, color: '#94A3B8' });
}
