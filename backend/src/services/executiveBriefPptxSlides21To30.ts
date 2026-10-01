/**
 * Executive Brief PPTX Slides 21 to 30 (Prompt 258)
 */

import type PptxGenJS from 'pptxgenjs';
import { formatINR, formatINRCrore } from '../utils/moneyModel';
import {
  BRIEF_PCBI_BENCHMARKS,
  BRIEF_SAVINGS_INITIATIVES
} from '../constants/executiveBriefConstants';
import {
  RAW_GROSS_OPP_INR,
  RAW_NET_DEFENSIBLE_INR,
  RAW_APPROVED_MODULE4_INR,
  RAW_REALIZED_INR
} from '../constants/numericalAuditConstants';
import { addSlideHeader, addSlideFooter, addPptxKpiCard } from './executiveBriefPptxHelpers';

export function renderPptxSlides21To30(
  pptx: PptxGenJS,
  clientName: string,
  totalSlides: number
): void {
  // Slide 21: PCBI Findings
  const s21 = pptx.addSlide();
  s21.background = { color: '0F172A' };
  addSlideHeader(s21, 'PCBI Benchmark Findings: Purchase Rate vs Market Indices', 'Market Benchmarks', 21);
  const bmRows: PptxGenJS.TableRow[] = [
    [{ text: 'Commodity', options: { bold: true } }, { text: 'UOM', options: { bold: true } }, { text: 'Customer Rate', options: { bold: true } }, { text: 'PCBI Ref', options: { bold: true } }, { text: 'Variance', options: { bold: true } }, { text: 'Rating', options: { bold: true } }],
    ...BRIEF_PCBI_BENCHMARKS.map((bm) => [
      { text: bm.commodity },
      { text: bm.uom },
      { text: formatINR(bm.customerPrice, false) },
      { text: formatINR(bm.pcbiReference, false) },
      { text: `${bm.variancePercent.toFixed(1)}%` },
      { text: bm.qualityRating }
    ])
  ];
  s21.addTable(bmRows, { x: 0.5, y: 1.1, w: 9.0, h: 3.8, colW: [3.0, 0.8, 1.3, 1.3, 1.0, 1.6], fontSize: 8.5, color: 'CBD5E1', fill: { color: '182234' } });
  addSlideFooter(s21, clientName, 21, totalSlides);

  // Slide 22: Benchmark-Guided Opportunities
  const s22 = pptx.addSlide();
  s22.background = { color: '0F172A' };
  addSlideHeader(s22, 'Benchmark-Guided Sourcing: Index Contract Formulas', 'Index Contracting', 22);
  const models = [
    ['Petcoke Index-Linked Formula', 'Price = Platts CFR West Coast Port Index + Freight Adder + Fixed Margin', 'Protects against supplier margin padding during downward commodity cycles.'],
    ['Polypropylene Resin Spread Contract', 'Price = Domestic PP Polymer Spot Index + Verified Conversion Adder', 'Isolates plastic resin raw market movements from bag converting fabrication.'],
    ['Thermal Coal Heat-Value Indexation', 'Price = Port Landed Index * (Actual GCV / Guaranteed 5000 kcal/kg GCV)', 'Eliminates moisture and ash penalty leakage by tying settlement to calorimeter tests.']
  ];
  models.forEach(([title, formula, rationale], idx) => {
    const mY = 1.1 + idx * 1.25;
    s22.addShape('rect', { x: 0.5, y: mY, w: 9.0, h: 1.15, fill: { color: '1E293B' }, line: { color: '2563EB' } });
    s22.addText(title.toUpperCase(), { x: 0.7, y: mY + 0.1, w: 8.6, h: 0.25, fontSize: 9.5, bold: true, color: '38BDF8' });
    s22.addText(`Formula: ${formula}`, { x: 0.7, y: mY + 0.4, w: 8.6, h: 0.25, fontSize: 8.5, bold: true, color: '10B981' });
    s22.addText(`Strategic Rationale: ${rationale}`, { x: 0.7, y: mY + 0.7, w: 8.6, h: 0.35, fontSize: 8, color: 'CBD5E1' });
  });
  addSlideFooter(s22, clientName, 22, totalSlides);

  // Slide 23: Module 4 Savings Execution Pipeline
  const s23 = pptx.addSlide();
  s23.background = { color: '0F172A' };
  addSlideHeader(s23, 'Module 4 — Savings Execution Pipeline & Downstream Handoff', 'Execution Governance', 23);
  const stagesList = [
    { name: '1. Identified', val: formatINRCrore(RAW_GROSS_OPP_INR) },
    { name: '2. Validated', val: '₹278.40 Cr' },
    { name: '3. Approved', val: formatINRCrore(RAW_NET_DEFENSIBLE_INR) },
    { name: '4. In Execution', val: formatINRCrore(RAW_APPROVED_MODULE4_INR) },
    { name: '5. Negotiated', val: '₹31.20 Cr' },
    { name: '6. Realized', val: formatINRCrore(RAW_REALIZED_INR) },
    { name: '7. Sustained', val: '₹18.60 Cr' }
  ];
  stagesList.forEach((st, idx) => {
    addPptxKpiCard(s23, 0.5 + idx * 1.3, 1.0, 1.2, 0.85, st.name, st.val, 'Governance', '2563EB');
  });
  s23.addShape('rect', { x: 0.5, y: 2.1, w: 9.0, h: 2.8, fill: { color: '1E293B' }, line: { color: '334155' } });
  s23.addText('SAVINGS REALIZATION GOVERNANCE & P&L HARDENING\n\n• Baseline Locking: Pre-award contracted volume & unit price frozen to prevent baseline shifting.\n• Cryptographic Token Handoff: Module 4 packages consume signed cryptographic tokens from Module 2.\n• Three-Way Invoice Match: Realized savings verified strictly against actual PO, GRN & finance voucher.\n• EBITDA Reconciliation: Bi-weekly finance steering committee reconciling savings with plant cost sheets.', {
    x: 0.8,
    y: 2.3,
    w: 8.4,
    h: 2.4,
    fontSize: 9.5,
    color: 'CBD5E1'
  });
  addSlideFooter(s23, clientName, 23, totalSlides);

  // Slide 24: Savings Realization Tracking
  const s24 = pptx.addSlide();
  s24.background = { color: '0F172A' };
  addSlideHeader(s24, 'Savings Realization: Wave 1 Initiative Tracking', 'Initiative Ledger', 24);
  const siRows: PptxGenJS.TableRow[] = [
    [{ text: 'Initiative ID', options: { bold: true } }, { text: 'Strategic Initiative', options: { bold: true } }, { text: 'Target', options: { bold: true } }, { text: 'Realized', options: { bold: true } }, { text: 'Realized %', options: { bold: true } }, { text: 'Status', options: { bold: true } }],
    ...BRIEF_SAVINGS_INITIATIVES.map((si) => [
      { text: si.initiativeId },
      { text: si.initiative },
      { text: formatINRCrore(si.approvedBenefitInr) },
      { text: formatINRCrore(si.realizedBenefitInr) },
      { text: `${si.realizationPercent.toFixed(1)}%` },
      { text: si.status }
    ])
  ];
  s24.addTable(siRows, { x: 0.5, y: 1.1, w: 9.0, h: 3.8, colW: [1.3, 3.7, 1.0, 1.0, 1.0, 1.0], fontSize: 8.5, color: 'CBD5E1', fill: { color: '182234' } });
  addSlideFooter(s24, clientName, 24, totalSlides);

  // Slide 25: Execution Roadmap
  const s25 = pptx.addSlide();
  s25.background = { color: '0F172A' };
  addSlideHeader(s25, 'Priority Execution Roadmap: Phased Implementation Schedule', 'Execution Schedule', 25);
  const phases = [
    { ph: 'PHASE 1: 0–30 DAYS', t: 'Quick Wins & Parity', desc: '• Enforce lowest unit prices on grinding media (₹14.20 Cr)\n• Dynamic early payment discounting (₹35.60 Cr)\n• Eliminate off-contract invoice price drift', tgt: 'Target: ₹49.80 Cr Locked' },
    { ph: 'PHASE 2: 31–60 DAYS', t: 'Strategic E-Auctions', desc: '• Dynamic reverse auction for 320M HDPE bags (₹19.20 Cr)\n• Corridor bidding for coal logistics (₹16.80 Cr)\n• Direct OEM contracts for refractory castables (₹8.60 Cr)', tgt: 'Target: ₹44.60 Cr Secured' },
    { ph: 'PHASE 3: 61–90 DAYS', t: 'Tail Consolidation', desc: '• Consolidate 912 tail suppliers into 180 master partners\n• Shift petcoke procurement to CFR port index formulas\n• Realize national lubricant volume rebates', tgt: 'Target: ₹58.80 Cr Contracted' },
    { ph: 'PHASE 4: 90+ DAYS', t: 'Structural Transformation', desc: '• Standardize specifications across grinding media & castables\n• Long-term indexed contracts for alternate fuel biomass (AFR)\n• Direct manufacturer purchasing agreements', tgt: 'Target: ₹90.55 Cr Defensible' }
  ];
  phases.forEach((p, idx) => {
    const pX = 0.5 + idx * 2.3;
    s25.addShape('rect', { x: pX, y: 1.1, w: 2.15, h: 3.8, fill: { color: '1E293B' }, line: { color: '2563EB' } });
    s25.addText(p.ph, { x: pX + 0.1, y: 1.2, w: 1.95, h: 0.25, fontSize: 8, bold: true, color: '38BDF8' });
    s25.addText(p.t, { x: pX + 0.1, y: 1.45, w: 1.95, h: 0.35, fontSize: 9, bold: true, color: 'F8FAFC' });
    s25.addText(p.desc, { x: pX + 0.1, y: 1.85, w: 1.95, h: 2.3, fontSize: 7.5, color: 'CBD5E1' });
    s25.addText(p.tgt, { x: pX + 0.1, y: 4.4, w: 1.95, h: 0.3, fontSize: 8, bold: true, color: '10B981' });
  });
  addSlideFooter(s25, clientName, 25, totalSlides);

  // Slide 26: Recommendations
  const s26 = pptx.addSlide();
  s26.background = { color: '0F172A' };
  addSlideHeader(s26, 'Procucev Recommendations: From Opportunity to Savings', 'Strategic Roadmap', 26);
  const recRows: PptxGenJS.TableRow[] = [
    [{ text: 'Diagnostic Finding', options: { bold: true } }, { text: 'Recommended Intervention', options: { bold: true } }, { text: 'Execution Model', options: { bold: true } }, { text: 'Expected Outcome', options: { bold: true } }],
    [{ text: '18.5% Price Spread' }, { text: 'Centralize rate negotiation on high-volume items' }, { text: 'Managed Rate Harmonization' }, { text: '₹24.60 Cr capture' }],
    [{ text: 'Liquid Markets' }, { text: 'Dynamic reverse auctions for packaging & freight' }, { text: 'Turnkey E-Auction Services' }, { text: '₹36.00 Cr discovery' }],
    [{ text: '912 Tail Vendors' }, { text: 'Rationalize vendor base to 180 master partners' }, { text: 'Vendor Panelling Agreements' }, { text: '₹47.20 Cr tier rebates' }],
    [{ text: 'Fuel Volatility' }, { text: 'Transition imported fuels to CFR port indexation' }, { text: 'PCBI Index Contracting' }, { text: '₹12.60 Cr savings' }]
  ];
  s26.addTable(recRows, { x: 0.5, y: 1.1, w: 9.0, h: 3.8, colW: [2.0, 2.8, 2.4, 1.8], fontSize: 8.5, color: 'CBD5E1', fill: { color: '182234' } });
  addSlideFooter(s26, clientName, 26, totalSlides);

  // Slide 27: Sector Expertise
  const s27 = pptx.addSlide();
  s27.background = { color: '0F172A' };
  addSlideHeader(s27, 'Procucev Sector & Category Expertise', 'Domain Authority', 27);
  const sectors = [
    ['Cement & Building Materials', 'Integrated clinker lines, grinding media, refractory castables, HDPE sacks, logistics.'],
    ['Steel & Heavy Metals', 'Coking coal, iron ore, ferro alloys, graphite electrodes, mill rolling consumables.'],
    ['Specialty Chemicals & Polymers', 'Petrochemical feedstocks, bulk solvents, process catalysts, intermediate reagents.'],
    ['Pharmaceuticals & API', 'Fine chemical precursors, primary packaging foils, glass vials, cleanroom MRO.'],
    ['Textiles & Technical Fibers', 'Purified terephthalic acid (PTA), monoethylene glycol (MEG), spinning oils, looms.'],
    ['Automotive Components', 'High-tensile fasteners, forged assemblies, aluminum die-castings, automated robotics.']
  ];
  sectors.forEach(([sec, desc], idx) => {
    const colX = idx % 2 === 0 ? 0.5 : 5.1;
    const rowY = 1.1 + Math.floor(idx / 2) * 1.25;
    s27.addShape('rect', { x: colX, y: rowY, w: 4.4, h: 1.15, fill: { color: '1E293B' }, line: { color: '334155' } });
    s27.addText(sec.toUpperCase(), { x: colX + 0.2, y: rowY + 0.1, w: 4.0, h: 0.25, fontSize: 9, bold: true, color: '38BDF8' });
    s27.addText(desc, { x: colX + 0.2, y: rowY + 0.4, w: 4.0, h: 0.65, fontSize: 8, color: 'CBD5E1' });
  });
  addSlideFooter(s27, clientName, 27, totalSlides);

  // Slide 28: Data Security
  const s28 = pptx.addSlide();
  s28.background = { color: '0F172A' };
  addSlideHeader(s28, 'Customer Data Protection & Cryptographic Security', 'Trust & Governance', 28);
  s28.addShape('rect', { x: 0.5, y: 1.1, w: 9.0, h: 3.8, fill: { color: '1E293B' }, line: { color: '10B981' } });
  s28.addText('VERIFIED ENTERPRISE DATA PRIVACY & CONFIDENTIALITY CONTROLS\n\n• AES-256-GCM AEAD Encryption: All customer invoices and opportunity ledgers encrypted at rest.\n• Zero AI Model Retraining: Customer procurement transactions are NEVER used to train external LLMs.\n• Strict Tenant Isolation: Rigid database boundary; Customer A data can never be accessed by Customer B.\n• PCBI Boundary: Customer purchase transactions never contaminate public market indices.\n• Log Sanitization: Centralized logger masks sensitive banking, PAN, GST and financial amounts.\n• Cryptographic Shredding: Deletion requests trigger certified database record purging and key destruction.', {
    x: 0.8,
    y: 1.3,
    w: 8.4,
    h: 3.4,
    fontSize: 9.5,
    color: 'CBD5E1'
  });
  addSlideFooter(s28, clientName, 28, totalSlides);

  // Slide 29: From Analysis to Action
  const s29 = pptx.addSlide();
  s29.background = { color: '0F172A' };
  addSlideHeader(s29, 'From Analysis to Action: Conversion Framework & Next Steps', 'Engagement Roadmap', 29);
  s29.addShape('rect', { x: 0.5, y: 1.1, w: 9.0, h: 1.0, fill: { color: '1E293B' }, line: { color: '2563EB' } });
  s29.addText('"The diagnostic identifies the opportunity. The next step is disciplined execution to convert opportunity into realized and sustained bottom-line savings."', {
    x: 0.8,
    y: 1.3,
    w: 8.4,
    h: 0.6,
    fontSize: 12,
    bold: true,
    color: 'F8FAFC'
  });
  s29.addShape('rect', { x: 0.5, y: 2.3, w: 9.0, h: 2.6, fill: { color: '1E293B' }, line: { color: '334155' } });
  s29.addText('ENGAGEMENT GOVERNANCE & RECOMMENDED NEXT STEPS\n\n• Week 1: Schedule Joint Sourcing Steering Committee with Corporate Procurement Head & CFO.\n• Week 2: Approve Wave 1 Dynamic Reverse E-Auction Lots & issue vendor qualification notices.\n• Week 3: Enforce historical lowest rate contracts across standardized mechanical consumables.\n• Contacts: executive-brief@procucev.com | Website: https://procucev.com\n\nCONFIDENTIAL — All analytical IP, algorithms and diagnostics are proprietary to Procucev.', {
    x: 0.8,
    y: 2.5,
    w: 8.4,
    h: 2.2,
    fontSize: 9.5,
    color: 'CBD5E1'
  });
  addSlideFooter(s29, clientName, 29, totalSlides);

  // Slide 30: Evidence Appendix
  const s30 = pptx.addSlide();
  s30.background = { color: '0F172A' };
  addSlideHeader(s30, 'Evidence Appendix: Transaction Traceability & Reconciliation', 'Audit Appendix', 30);
  const appRows: PptxGenJS.TableRow[] = [
    [{ text: 'Ref', options: { bold: true } }, { text: 'Lever Name', options: { bold: true } }, { text: 'Eligible Spend', options: { bold: true } }, { text: 'Potential Opp', options: { bold: true } }, { text: 'Confidence', options: { bold: true } }, { text: 'Formula & Lineage', options: { bold: true } }],
    [{ text: 'A-01' }, { text: 'Direct Price Improvement' }, { text: '₹1,420.00 Cr' }, { text: '₹71.00 Cr' }, { text: 'HIGH (88%)' }, { text: 'SUM(qty * (unitPrice - P10)) | TX-00100..15200' }],
    [{ text: 'A-02' }, { text: 'Packaging Sacks Reverse Auction' }, { text: '₹320.00 Cr' }, { text: '₹19.20 Cr' }, { text: 'HIGH (85%)' }, { text: 'P10 Reserve Delta on 320M Bags | TX-02000..04650' }],
    [{ text: 'A-03' }, { text: 'Tail Vendor Base Consolidation' }, { text: '₹1,180.00 Cr' }, { text: '₹47.20 Cr' }, { text: 'HIGH (82%)' }, { text: '10% Tier Rebate on 912 Vendors | TX-04000..10420' }],
    [{ text: 'A-04' }, { text: 'Inbound Freight Lane Auction' }, { text: '₹280.00 Cr' }, { text: '₹16.80 Cr' }, { text: 'HIGH (82%)' }, { text: 'Corridor Rate Dispersion | TX-00200..02650' }],
    [{ text: 'A-05' }, { text: 'Dynamic Early Payment Program' }, { text: '₹890.00 Cr' }, { text: '₹35.60 Cr' }, { text: 'HIGH (92%)' }, { text: '2% 10-Net-30 Cash Discount | TX-01000..05400' }],
    [{ text: 'A-06' }, { text: 'PCBI Fuel Index Alignment' }, { text: '₹420.00 Cr' }, { text: '₹12.60 Cr' }, { text: 'HIGH (84%)' }, { text: 'Variance to Port Landed Index | TX-00150..03270' }]
  ];
  s30.addTable(appRows, { x: 0.5, y: 1.1, w: 9.0, h: 3.8, colW: [0.6, 2.5, 1.3, 1.2, 1.0, 2.4], fontSize: 8, color: 'CBD5E1', fill: { color: '182234' } });
  addSlideFooter(s30, clientName, 30, totalSlides);
}
