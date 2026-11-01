/**
 * aiCEV Executive Report PDF Slides 16 to 20 (Prompt 596)
 * Authoritative 16:9 presentation slides for Borosil Ltd (AIC-2026-0002).
 * Rule 8: Constants isolation; Rule 9: Strongly typed; max lines <= 300, complexity <= 10.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import { BOROSIL_ALTERNATIVE_SUPPLIERS } from '../constants/borosilAlternativeSuppliers';

export function renderReportPdfSlides16To20(canvas: PdfCanvas): void {
  // Slide 16: Alternative Vendor Evaluation Framework
  canvas.addPage();
  canvas.rect(0, 0, 960, 540, { fill: '#0B1120' });
  canvas.badge(60, 36, 'VENDOR EVALUATION', { bgColor: '#8B5CF6', textColor: '#FFFFFF' });
  canvas.text('Alternative Vendor Evaluation Framework', 60, 85, { fontSize: 22, font: 'bold', color: '#FFFFFF' });
  canvas.text('Structured evaluation across packaging, plastics, industrial gases, and MRO distributor panels.', 60, 110, { fontSize: 11, color: '#94A3B8' });

  const remainingSuppliers = BOROSIL_ALTERNATIVE_SUPPLIERS.slice(4, 8);
  remainingSuppliers.forEach((s, idx) => {
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

  // Slide 17: Module 3 PCBI Status and Future Benchmarking Roadmap
  canvas.addPage();
  canvas.rect(0, 0, 960, 540, { fill: '#0B1120' });
  canvas.badge(60, 36, 'MODULE 3 BENCHMARKS', { bgColor: '#EF4444', textColor: '#FFFFFF' });
  canvas.text('Module 3 PCBI Status and Future Benchmarking Roadmap', 60, 85, { fontSize: 22, font: 'bold', color: '#FFFFFF' });
  canvas.text('Benchmark research completed and formally closed; no operational benchmark observations available.', 60, 110, { fontSize: 11, font: 'bold', color: '#FBBF24' });

  canvas.rect(60, 140, 840, 335, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
  canvas.rect(60, 140, 840, 4, { fill: '#EF4444' });
  canvas.text('MODULE 3 FORMAL RESEARCH CLOSURE VERDICT', 80, 172, { fontSize: 12, font: 'bold', color: '#F87171' });
  canvas.text('Status: Benchmark research completed and formally closed; no operational benchmark observations available.', 80, 204, { fontSize: 10, font: 'bold', color: '#FBBF24' });
  canvas.text('• Operational Benchmark Coverage: Exactly 0.00% (₹0.00 Cr mapped approved spend).', 80, 236, { fontSize: 9.5, color: '#F8FAFC' });
  canvas.text('• Benchmark-Derived Savings Contribution: Exactly ₹0.00 Cr (Zero synthetic extrapolation).', 80, 264, { fontSize: 9.5, color: '#F8FAFC' });
  canvas.text('• NR Classified Spend: ₹133.0317 Cr classified as Not Currently Benchmarkable during assessment window.', 80, 292, { fontSize: 9.5, color: '#E2E8F0' });
  canvas.text('• Unmapped Baseline Spend: ₹423.4876 Cr preserved with full audit lineage back to SAP purchase orders.', 80, 320, { fontSize: 9.5, color: '#E2E8F0' });
  canvas.text('• Future Benchmarking Roadmap: Post-contract execution, establish index-linked price mechanisms for Soda Ash and Natural Gas.', 80, 348, { fontSize: 9.5, color: '#38BDF8' });
  canvas.text('• Integrity Guarantee: Sourcing opportunity is derived 100% from internal transaction baseline rate dispersion and e-auctions.', 80, 376, { fontSize: 9.5, font: 'bold', color: '#10B981' });
  canvas.text('• Governance Principle: Protects Borosil executive trust by strictly refusing to inject unsubstantiated external indices.', 80, 404, { fontSize: 9, color: '#94A3B8' });

  // Slide 18: Consolidated Financial Waterfall and Governance
  canvas.addPage();
  canvas.rect(0, 0, 960, 540, { fill: '#0B1120' });
  canvas.badge(60, 36, 'FINANCIAL WATERFALL', { bgColor: '#10B981', textColor: '#FFFFFF' });
  canvas.text('Consolidated Financial Waterfall and Governance Architecture', 60, 85, { fontSize: 20, font: 'bold', color: '#FFFFFF' });
  canvas.text('Deduplicated 9-step financial bridge from ₹556.535 Cr evaluated baseline to realized savings.', 60, 110, { fontSize: 11, color: '#94A3B8' });

  const wfSteps = [
    { s: 'Evaluated Baseline', v: '₹556.535 Cr', d: '27,777 canonical rows across 3 plants' },
    { s: 'Diagnostic Addressable', v: '₹168.658 Cr', d: 'Evaluated across 133 categories' },
    { s: 'Execution Addressable', v: '₹161.016 Cr', d: '105 qualified packages (₹7.642 Cr unquantified excl.)' },
    { s: 'Gross Opportunity', v: '₹117.512 Cr', d: 'Combined benefit across Levers 1, 2, 3' },
    { s: 'Overlap Deductions', v: '₹30.412 Cr', d: 'Multi-lever overlap deducted' },
    { s: 'Net Modelled Opp.', v: '₹87.100 Cr', d: 'Deduplicated net sourcing opportunity' },
    { s: 'Excluding Lever 2', v: '₹75.121 Cr', d: 'Opportunity Identified for Commercial Validation (L2 ₹11.978 Cr in reserve)' },
    { s: 'Client-Approved', v: '₹0.00 Cr', d: 'Pending commercial tender execution' },
    { s: 'Audited Realized', v: '₹0.00 Cr', d: 'Recognized post-delivery & invoice match' }
  ];

  wfSteps.forEach((w, idx) => {
    const y = 140 + idx * 32;
    canvas.rect(60, y, 840, 26, { fill: idx % 2 === 0 ? '#1E293B' : '#0F172A', stroke: '#334155', lineWidth: 0.5 });
    canvas.text(`${idx + 1}. ${w.s}`, 75, y + 17, { fontSize: 9, font: 'bold', color: '#F8FAFC' });
    canvas.text(w.v, 480, y + 17, { fontSize: 9, font: 'bold', color: idx === 6 ? '#FBBF24' : (idx >= 7 ? '#94A3B8' : '#38BDF8') });
    canvas.text(w.d, 620, y + 17, { fontSize: 7.5, color: '#CBD5E1' });
  });

  canvas.rect(60, 435, 840, 50, { fill: '#0F172A', stroke: '#1E293B', lineWidth: 1 });
  canvas.text('MANDATORY GOVERNANCE DISCLOSURE', 80, 454, { fontSize: 8.5, font: 'bold', color: '#FBBF24' });
  canvas.text('The ₹87.100 Cr represents modelled sourcing opportunity after overlap deductions. Savings will only be recognized after commercial approval, implementation and audit verification.', 80, 474, { fontSize: 8, color: '#E2E8F0' });

  // Slide 19: Proposed Year 1 Execution Roadmap
  canvas.addPage();
  canvas.rect(0, 0, 960, 540, { fill: '#0B1120' });
  canvas.badge(60, 36, 'EXECUTION ROADMAP', { bgColor: '#0284C7', textColor: '#FFFFFF' });
  canvas.text('Proposed Year 1 Sourcing Execution Roadmap (₹12.90 Cr Target)', 60, 85, { fontSize: 20, font: 'bold', color: '#FFFFFF' });
  canvas.text('Structured 3-wave execution plan targeting ₹12.90 Cr proposed Year 1 sourcing target (indicative proposal only).', 60, 110, { fontSize: 10.5, color: '#94A3B8' });

  const waves = [
    { w: 'WAVE 1: DIRECT STRATEGIC SOURCING', m: 'Months 1–3', t: 'Target: ₹8.50 Cr', d: 'Strategic direct negotiations: Soda Ash direct manufacturer formula indexation & core raw materials.' },
    { w: 'WAVE 2: DYNAMIC REVERSE E-AUCTIONS', m: 'Months 3–6', t: 'Target: ₹3.20 Cr', d: 'Dynamic e-auction bidding: Standardized packaging cartons, shrink film, plant consumables.' },
    { w: 'WAVE 3: VENDOR CONSOLIDATION & PANELS', m: 'Months 6–12', t: 'Target: ₹1.20 Cr', d: 'Vendor consolidation & long-term agreements: MRO distributor panel rationalization & commercial payment terms.' }
  ];

  waves.forEach((wv, idx) => {
    const y = 140 + idx * 85;
    canvas.rect(60, y, 840, 75, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
    canvas.text(wv.w, 80, y + 22, { fontSize: 10.5, font: 'bold', color: '#38BDF8' });
    canvas.text(wv.m, 450, y + 22, { fontSize: 9.5, font: 'bold', color: '#CBD5E1' });
    canvas.text(wv.t, 700, y + 22, { fontSize: 10, font: 'bold', color: '#34D399' });
    canvas.textBlock(wv.d, 80, y + 42, 780, { fontSize: 8.5, color: '#E2E8F0', lineHeight: 12 });
  });

  canvas.rect(60, 405, 840, 80, { fill: '#0F172A', stroke: '#1E293B', lineWidth: 1 });
  canvas.text('DELIVERY CONFIDENCE RANGE: ₹9.004 Cr (10% floor) to ₹22.509 Cr (25% high delivery band)', 80, 428, { fontSize: 9.5, font: 'bold', color: '#38BDF8' });
  canvas.text('• Methodology: Documented 10% floor to 25% realization band applied against net modelled opportunity based on historical consulting delivery benchmarks.', 80, 450, { fontSize: 8.5, color: '#CBD5E1' });
  canvas.text('• Proposed Target: ₹12.90 Cr is an indicative consulting proposal representing achievable Year 1 realization across Waves 1–3.', 80, 470, { fontSize: 8.5, color: '#10B981' });

  // Slide 20: Management Recommendations and Decisions Required
  canvas.addPage();
  canvas.rect(0, 0, 960, 540, { fill: '#0B1120' });
  canvas.badge(60, 36, 'DECISIONS REQUIRED', { bgColor: '#10B981', textColor: '#FFFFFF' });
  canvas.text('Management Recommendations & Decisions Required', 60, 85, { fontSize: 22, font: 'bold', color: '#FFFFFF' });
  canvas.text('Key decisions, steering governance, and formal certification required from Borosil executive leadership.', 60, 110, { fontSize: 11, color: '#94A3B8' });

  const decisions = [
    { n: '1. Sourcing Steering Committee', d: 'Convene joint Borosil-Procucev Sourcing Steering Committee and approve Wave 1 charter.' },
    { n: '2. Primary Producer Direct Trial', d: 'Approve plant technical trial protocol for direct primary manufacturer engagement on Dense Soda Ash.' },
    { n: '3. E-Auction Bidding Authorization', d: 'Authorize reverse dynamic e-auction bidding rules and supplier qualification criteria for corrugated packaging.' },
    { n: '4. Commercial Payment Terms Mandate', d: 'Mandate corporate benchmark 60-day commercial payment terms across all renewed vendor contracts.' }
  ];

  decisions.forEach((dc, idx) => {
    const y = 140 + idx * 72;
    canvas.rect(60, y, 840, 62, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
    canvas.text(dc.n, 80, y + 24, { fontSize: 10.5, font: 'bold', color: '#38BDF8' });
    canvas.text(dc.d, 80, y + 46, { fontSize: 9, color: '#E2E8F0' });
  });

  canvas.rect(60, 435, 840, 55, { fill: '#0F172A', stroke: '#10B981', lineWidth: 1.5 });
  canvas.text('EXECUTIVE DIAGNOSTIC STATEMENT', 80, 455, { fontSize: 9.5, font: 'bold', color: '#10B981' });
  canvas.text('Procurement Diagnostic Completed — Opportunity Identified for Commercial Validation.', 80, 476, { fontSize: 10, font: 'bold', color: '#F8FAFC' });
}
