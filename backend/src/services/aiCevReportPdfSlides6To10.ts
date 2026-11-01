/**
 * aiCEV Executive Report PDF Slides 6 to 10 (Prompt 596)
 * Authoritative 16:9 presentation slides for Borosil Ltd (AIC-2026-0002).
 * Rule 8: Constants isolation; Rule 9: Strongly typed; max lines <= 300, complexity <= 10.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import { BOROSIL_COMMERCIAL_SCENARIOS } from '../constants/borosilCommercialScenarios';
import { BOROSIL_ALTERNATIVE_SUPPLIERS } from '../constants/borosilAlternativeSuppliers';

export function renderReportPdfSlides6To10(canvas: PdfCanvas): void {
  // Slide 6: Sourcing Strategy and Opportunity Architecture
  canvas.addPage();
  canvas.rect(0, 0, 960, 540, { fill: '#0B1120' });
  canvas.badge(60, 36, 'SOURCING ARCHITECTURE', { bgColor: '#2563EB', textColor: '#FFFFFF' });
  canvas.text('Sourcing Strategy and Opportunity Architecture', 60, 85, { fontSize: 22, font: 'bold', color: '#FFFFFF' });
  canvas.text('Three-tier sourcing lever structure with strict deduplication and governance reserve isolation.', 60, 110, { fontSize: 11, color: '#94A3B8' });

  const archCards = [
    { lever: 'LEVER 1', title: 'Strategic Sourcing', spend: '₹127.118 Cr', net: '₹73.769 Cr', status: 'Commercial Scope', desc: 'Direct price harmonization & primary producer master agreements across 89 packages.' },
    { lever: 'LEVER 2', title: 'Vendor Consolidation', spend: '₹12.081 Cr', net: '₹11.978 Cr', status: 'Governance Reserve', desc: 'Held in governance reserve; excluded from customer targets pending validation (4 packages).' },
    { lever: 'LEVER 3', title: 'Reverse E-Auctions', spend: '₹21.817 Cr', net: '₹1.352 Cr', status: 'Commercial Scope', desc: 'Dynamic competitive multi-round e-bidding for packaging and indirect commodities (12 packages).' }
  ];

  archCards.forEach((c, idx) => {
    const x = 60 + idx * 285;
    canvas.rect(x, 140, 270, 175, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
    canvas.text(c.lever, x + 16, 168, { fontSize: 9.5, font: 'bold', color: '#38BDF8' });
    canvas.text(c.title, x + 16, 192, { fontSize: 13, font: 'bold', color: '#F8FAFC' });
    canvas.text(`Spend: ${c.spend} | Net: ${c.net}`, x + 16, 218, { fontSize: 9.5, font: 'bold', color: idx === 1 ? '#FBBF24' : '#34D399' });
    canvas.text(`Status: ${c.status}`, x + 16, 240, { fontSize: 8.5, color: idx === 1 ? '#FBBF24' : '#38BDF8' });
    canvas.textBlock(c.desc, x + 16, 262, 238, { fontSize: 8.5, color: '#94A3B8', lineHeight: 12 });
  });

  canvas.rect(60, 335, 840, 145, { fill: '#0F172A', stroke: '#1E293B', lineWidth: 1 });
  canvas.text('PRIMARY PRODUCER DIRECT ENGAGEMENT STRATEGY', 80, 362, { fontSize: 10.5, font: 'bold', color: '#38BDF8' });
  canvas.text('• Dense Soda Ash & Core Feedstocks: Present direct manufacturer engagement as a strategy to evaluate with primary producers.', 80, 388, { fontSize: 9, color: '#E2E8F0' });
  canvas.text('• Primary Producer Engagement: Direct commercial negotiations with primary producers GHCL and RSPL for annual volume indexation and formula-based pricing.', 80, 412, { fontSize: 9, color: '#E2E8F0' });
  canvas.text('• Opportunity Reconciliation: L1 (₹73.769 Cr) + L3 (₹1.352 Cr) = ₹75.121 Cr Modelled Opportunity Identified for Commercial Validation.', 80, 436, { fontSize: 9, font: 'bold', color: '#10B981' });
  canvas.text('• Governance Principle: Modelled opportunity is unapproved; realization recognized only post-contract execution and audit verification.', 80, 458, { fontSize: 8.5, color: '#64748B' });

  // Slide 7: Lever 1 — Strategic Sourcing Opportunity
  canvas.addPage();
  canvas.rect(0, 0, 960, 540, { fill: '#0B1120' });
  canvas.badge(60, 36, 'LEVER 1 SOURCING', { bgColor: '#2563EB', textColor: '#FFFFFF' });
  canvas.text('Lever 1 — Strategic Sourcing Opportunity (₹73.769 Cr)', 60, 85, { fontSize: 22, font: 'bold', color: '#FFFFFF' });
  canvas.text('Direct price variance elimination and volume master contracting across 89 qualified packages.', 60, 110, { fontSize: 11, color: '#94A3B8' });

  const l1Metrics = [
    { l: 'QUALIFIED PACKAGES', v: '89', s: 'Direct materials & chemicals' },
    { l: 'ELIGIBLE SPEND', v: '₹127.118 Cr', s: 'Evaluated category baseline' },
    { l: 'GROSS OPPORTUNITY', v: '₹103.729 Cr', s: 'Identified variance benefit' },
    { l: 'NET MODELLED OPP.', v: '₹73.769 Cr', s: 'Post-overlap deduplication' }
  ];
  l1Metrics.forEach((m, idx) => {
    const x = 60 + idx * 212;
    canvas.rect(x, 135, 202, 100, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
    canvas.text(m.l, x + 16, 162, { fontSize: 8.5, font: 'bold', color: '#94A3B8' });
    canvas.text(m.v, x + 16, 192, { fontSize: 18, font: 'bold', color: '#38BDF8' });
    canvas.text(m.s, x + 16, 215, { fontSize: 8.5, color: '#CBD5E1' });
  });

  canvas.rect(60, 255, 840, 220, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('LEVER 1 EXECUTION MECHANISMS & DEDUPLICATION', 80, 282, { fontSize: 11, font: 'bold', color: '#38BDF8' });
  canvas.text('• Cross-Plant Price Harmonization: Align purchase rates across Bharuch (1120) and Jaipur (6101, 8202) units to best ex-works rates.', 80, 312, { fontSize: 9.5, color: '#F8FAFC' });
  canvas.text('• Direct Manufacturer Engagement: Present primary producer agreements (GHCL, Tata Chemicals) as an evaluation strategy.', 80, 338, { fontSize: 9.5, color: '#F8FAFC' });
  canvas.text('• Multi-Lever Overlap Deductions: ₹29.960 Cr overlap deducted against dynamic e-auction to eliminate double-counting.', 80, 364, { fontSize: 9.5, color: '#E2E8F0' });
  canvas.text('• Net Defensible Value: ₹73.769 Cr post-deduplication (₹103.729 Cr Gross - ₹29.960 Cr Overlap).', 80, 390, { fontSize: 9.5, color: '#34D399' });
  canvas.text('• Opportunity Classification: Net Modelled Sourcing Opportunity established at ₹73.769 Cr (Client-Approved: ₹0, Realized: ₹0).', 80, 416, { fontSize: 9.5, color: '#38BDF8' });
  canvas.text('• Validation Rule: Savings recognized strictly upon commercial contract execution, revised PO pricing, and invoice matching.', 80, 442, { fontSize: 9, color: '#94A3B8' });

  // Slide 8: Lever 1 — Procucev Calculation Mechanism and Scenarios
  canvas.addPage();
  canvas.rect(0, 0, 960, 540, { fill: '#0B1120' });
  canvas.badge(60, 36, 'LEVER 1 CALCULATION & SCENARIOS', { bgColor: '#2563EB', textColor: '#FFFFFF' });
  canvas.text('How Procucev Calculates Opportunity & Commercial Scenarios: Lever 1', 60, 85, { fontSize: 20, font: 'bold', color: '#FFFFFF' });
  canvas.text('Defensible bottom-up calculation logic and 2 practical commercial scenarios for Borosil management.', 60, 110, { fontSize: 10.5, color: '#94A3B8' });

  canvas.rect(60, 135, 840, 110, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('HOW PROCUCEV CALCULATES THE OPPORTUNITY (LEVER 1)', 80, 158, { fontSize: 10, font: 'bold', color: '#38BDF8' });
  const l1Flow = 'Transactions → Normalization → Price Comparison → Reference Price → Qty Opportunity → Overlap Deduction → Net Modelled';
  canvas.text(l1Flow, 80, 182, { fontSize: 8.5, font: 'bold', color: '#34D399' });
  canvas.text('Formula: Potential Price Opportunity = MAX(0, Actual Comparable Purchase Price − Reference Price) × Eligible Quantity', 80, 206, { fontSize: 8.5, color: '#F8FAFC' });
  canvas.text('Exact Integer Outcome: ₹103.729 Cr Gross − ₹29.960 Cr Overlap = ₹73.769 Cr Net Modelled Opportunity across 89 packages.', 80, 228, { fontSize: 8.5, color: '#94A3B8' });

  const s1A = BOROSIL_COMMERCIAL_SCENARIOS[0];
  const s1B = BOROSIL_COMMERCIAL_SCENARIOS[1];

  const scY = 255;
  const scW = 410;
  // Scenario A Card
  canvas.rect(60, scY, scW, 215, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('SCENARIO A: Cross-Plant Price Harmonization', 80, scY + 24, { fontSize: 10.5, font: 'bold', color: '#38BDF8' });
  canvas.text(`Eligible Spend: ₹${s1A.eligibleSpendCr.toFixed(3)} Cr (${s1A.category})`, 80, scY + 44, { fontSize: 8.5, color: '#94A3B8' });
  canvas.textBlock(`Current Situation: ${s1A.currentSituation}`, 80, scY + 62, scW - 40, { fontSize: 8, color: '#E2E8F0', lineHeight: 11 });
  canvas.text(`• Conservative Case: ${s1A.conservativeCase.description}`, 80, scY + 115, { fontSize: 8, font: 'bold', color: '#94A3B8' });
  canvas.text(`• Higher Case: ${s1A.higherAchievementCase.description}`, 80, scY + 135, { fontSize: 8, font: 'bold', color: '#94A3B8' });
  canvas.text(`Timeline: ${s1A.implementationTimeline}`, 80, scY + 158, { fontSize: 8, color: '#94A3B8' });
  canvas.text(`Status: ${s1A.assumptionStatus}`, 80, scY + 178, { fontSize: 7.5, color: '#FBBF24' });

  // Scenario B Card
  const scBX = 490;
  canvas.rect(scBX, scY, scW, 215, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('SCENARIO B: Direct Manufacturer Strategic Sourcing', scBX + 20, scY + 24, { fontSize: 10.5, font: 'bold', color: '#38BDF8' });
  canvas.text(`Eligible Spend: ₹${s1B.eligibleSpendCr.toFixed(3)} Cr (${s1B.category})`, scBX + 20, scY + 44, { fontSize: 8.5, color: '#94A3B8' });
  canvas.textBlock(`Current Situation: ${s1B.currentSituation}`, scBX + 20, scY + 62, scW - 40, { fontSize: 8, color: '#E2E8F0', lineHeight: 11 });
  canvas.text(`• Conservative Case (${s1B.conservativeCase.improvementPct.toFixed(1)}%): ₹${s1B.conservativeCase.financialOutcomeCr.toFixed(3)} Cr (${s1B.conservativeCase.financialOutcomeInr.toLocaleString('en-IN')} INR)`, scBX + 20, scY + 115, { fontSize: 8.5, font: 'bold', color: '#34D399' });
  canvas.text(`• Higher Case (${s1B.higherAchievementCase.improvementPct.toFixed(1)}%): ₹${s1B.higherAchievementCase.financialOutcomeCr.toFixed(3)} Cr (${s1B.higherAchievementCase.financialOutcomeInr.toLocaleString('en-IN')} INR)`, scBX + 20, scY + 135, { fontSize: 8.5, font: 'bold', color: '#38BDF8' });
  canvas.text(`Timeline: ${s1B.implementationTimeline}`, scBX + 20, scY + 158, { fontSize: 8, color: '#94A3B8' });
  canvas.text(`Status: ${s1B.assumptionStatus}`, scBX + 20, scY + 178, { fontSize: 7.5, color: '#FBBF24' });

  // Slide 9: Lever 1 — Alternative Supplier and Direct Sourcing Strategy
  canvas.addPage();
  canvas.rect(0, 0, 960, 540, { fill: '#0B1120' });
  canvas.badge(60, 36, 'LEVER 1 ALTERNATIVES', { bgColor: '#2563EB', textColor: '#FFFFFF' });
  canvas.text('Lever 1 — Alternative Supplier and Direct Sourcing Strategy', 60, 85, { fontSize: 22, font: 'bold', color: '#FFFFFF' });
  canvas.text('Rigorous supplier market evaluation across Dense Soda Ash, Silica Sand, and Industrial Gases.', 60, 110, { fontSize: 11, color: '#94A3B8' });

  const l1Suppliers = BOROSIL_ALTERNATIVE_SUPPLIERS.slice(0, 4);
  l1Suppliers.forEach((s, idx) => {
    const y = 140 + idx * 75;
    canvas.rect(60, y, 840, 65, { fill: '#1E293B', stroke: '#334155', lineWidth: 0.75 });
    canvas.text(s.materialCategory, 80, y + 20, { fontSize: 10, font: 'bold', color: '#38BDF8' });
    canvas.text(`Current: ${s.currentSupplier}`, 280, y + 20, { fontSize: 8.5, color: '#94A3B8' });
    canvas.text(`Alternative: ${s.potentialAlternative}`, 480, y + 20, { fontSize: 8.5, font: 'bold', color: '#34D399' });
    canvas.text(s.qualificationStatusLabel, 80, y + 38, { fontSize: 8, font: 'bold', color: s.qualificationStatus === 'EXISTING_APPROVED_HISTORICAL' ? '#10B981' : '#FBBF24' });
    canvas.text(`Proximity: ${s.geographicProximity}`, 480, y + 38, { fontSize: 8, color: '#CBD5E1' });
    canvas.text(`Recommendation: ${s.evaluationRecommendation}`, 80, y + 54, { fontSize: 8, color: '#E2E8F0' });
  });

  canvas.rect(60, 450, 840, 35, { fill: '#0F172A', stroke: '#1E293B', lineWidth: 1 });
  canvas.text('Three Classifications Enforced: 1. Existing Approved | 2. Potential Alternative — Qualification Required | 3. Strategic Manufacturer Candidate — Verification Required.', 80, 472, { fontSize: 7.5, color: '#94A3B8' });

  // Slide 10: Lever 2 — Vendor Consolidation Opportunity
  canvas.addPage();
  canvas.rect(0, 0, 960, 540, { fill: '#0B1120' });
  canvas.badge(60, 36, 'LEVER 2 CONSOLIDATION', { bgColor: '#F59E0B', textColor: '#FFFFFF' });
  canvas.text('Lever 2 — Vendor Consolidation Opportunity (Governance Reserve)', 60, 85, { fontSize: 20, font: 'bold', color: '#FFFFFF' });
  canvas.text('Status: Held in Governance Reserve — Excluded Pending Commercial Validation (Addressable Spend: ₹12.081 Cr).', 60, 110, { fontSize: 10.5, font: 'bold', color: '#FBBF24' });

  const l2Metrics = [
    { l: 'QUALIFIED PACKAGES', v: '4', s: 'Consumables & plant spares' },
    { l: 'RELEVANT SPEND', v: '₹12.081 Cr', s: 'Evaluated fragmented spend' },
    { l: 'MODELLED OPP.', v: '₹11.978 Cr', s: 'Held in governance reserve' },
    { l: 'CUSTOMER CONTRIBUTION', v: '₹0.00 Cr', s: 'Excluded pending validation' }
  ];
  l2Metrics.forEach((m, idx) => {
    const x = 60 + idx * 212;
    canvas.rect(x, 135, 202, 100, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
    canvas.text(m.l, x + 16, 162, { fontSize: 8.5, font: 'bold', color: '#94A3B8' });
    canvas.text(m.v, x + 16, 192, { fontSize: 18, font: 'bold', color: m.v === '₹0.00 Cr' ? '#FBBF24' : '#38BDF8' });
    canvas.text(m.s, x + 16, 215, { fontSize: 8.5, color: '#CBD5E1' });
  });

  canvas.rect(60, 255, 840, 220, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.text('LEVER 2 COMMERCIAL VALIDATION SAFEGUARD & RECONCILIATION', 80, 282, { fontSize: 11, font: 'bold', color: '#FBBF24' });
  canvas.text('• Governance Reserve Status: ₹11.978 Cr held in governance reserve; excluded from customer actionable opportunity.', 80, 312, { fontSize: 9.5, color: '#F8FAFC' });
  canvas.text('• Relevant Addressable Spend: ₹12.081 Cr across 4 fragmented categories (electrical spares, hardware, consumable tools).', 80, 338, { fontSize: 9.5, color: '#F8FAFC' });
  canvas.text('• Quality & Continuity Safeguard: Vendor consolidation requires formal plant maintenance and engineering clearance.', 80, 364, { fontSize: 9.5, color: '#E2E8F0' });
  canvas.text('• Customer-Facing Savings: Exactly ₹0.00 Cr recognized; zero customer savings claimed prior to formal validation.', 80, 390, { fontSize: 9.5, color: '#38BDF8' });
  canvas.text('• Supplier Base Audit: 1,537 Active SAP Supplier Accounts normalized from 1,561 raw ERP vendor records.', 80, 416, { fontSize: 9.5, color: '#E2E8F0' });
  canvas.text('• Commercial Next Step: Launch Wave 3 distributor panel negotiations and execute joint technical qualification trials.', 80, 442, { fontSize: 9, color: '#94A3B8' });
}
