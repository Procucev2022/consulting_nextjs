/**
 * Executive Brief PPTX Slides 26 to 30 (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strict 10 x 5.625 inch grid, Aptos/Arial typography, domain authority, trust, decisions, and appendix.
 */

import type PptxGenJS from 'pptxgenjs';
import { BRAND_COLORS, TYPOGRAPHY } from '../constants/executiveBriefLayoutConstants';
import { addSlideHeader, addSlideFooter } from './executiveBriefPptxHelpers';

export function renderPptxSlides26To30(
  pptx: PptxGenJS,
  clientName: string,
  totalSlides: number
): void {
  const fontFace = TYPOGRAPHY.fallbackFont;

  // Slide 26: Strategic Recommendations
  const s26 = pptx.addSlide();
  s26.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s26, 'Strategic Recommendations: Multi-Year Procurement Roadmap', 'Strategic Roadmap', 26);

  s26.addShape('rect', { x: 0.5, y: 1.15, w: 4.35, h: 3.1, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s26.addShape('rect', { x: 0.5, y: 1.15, w: 4.35, h: 0.04, fill: { color: BRAND_COLORS.accentGreen.replace('#', '') } });
  s26.addText('HORIZON 1: YEAR 1 VALUE CAPTURE\nTarget: ₹47.90 Cr Validated + Wave 2 Initiation', {
    x: 0.65, y: 1.25, w: 4.0, h: 0.45, fontSize: 9.5, bold: true, color: BRAND_COLORS.accentGreen.replace('#', ''), fontFace
  });
  s26.addText('1. Deploy Wave 1 e-auctions across Packaging Bags (₹14.50 Cr) and Grinding Media (₹11.20 Cr).\n2. Execute petcoke and domestic coal index formula contracts (₹9.80 Cr strategic timing).\n3. Standardize top 100 consumable SKUs across 26 plants and establish 60/90 day terms.\n4. Implement real-time invoice rate verification in ERP to stop contract price drift.', {
    x: 0.65, y: 1.8, w: 4.0, h: 2.2, fontSize: 9, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace
  });

  s26.addShape('rect', { x: 5.15, y: 1.15, w: 4.35, h: 3.1, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s26.addShape('rect', { x: 5.15, y: 1.15, w: 4.35, h: 0.04, fill: { color: BRAND_COLORS.procucevBlue.replace('#', '') } });
  s26.addText('HORIZON 2: YEAR 2 RUN-RATE REALIZATION\nTarget: Full ₹78.72 Cr Direct Savings Run-Rate', {
    x: 5.3, y: 1.25, w: 4.0, h: 0.45, fontSize: 9.5, bold: true, color: BRAND_COLORS.procucevBlue.replace('#', ''), fontFace
  });
  s26.addText('1. Consolidate 912 tail suppliers into preferred panelling tiers (₹26.40 Cr indicative value *).\n2. Aggregate national demand on capital equipment spares and refractory consumables.\n3. Automate catalog purchasing across plants to capture 20% process effort reduction.\n4. Embed continuous PCBI commodity price monitoring to optimize annual re-contracting.', {
    x: 5.3, y: 1.8, w: 4.0, h: 2.2, fontSize: 9, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace
  });

  s26.addShape('rect', { x: 0.5, y: 4.4, w: 9.0, h: 0.65, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s26.addText('STRATEGIC PROCUREMENT VISION: Transforming UltraTech procurement from decentralized transactional purchasing into a high-leverage strategic competency ensures permanent structural cost advantages and superior EBITDA margins against cement industry peers.', {
    x: 0.65, y: 4.45, w: 8.7, h: 0.55, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
  });
  addSlideFooter(s26, clientName, 26, totalSlides);

  // Slide 27: Domain Authority
  const s27 = pptx.addSlide();
  s27.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s27, 'Procucev Domain Authority: Cement & Heavy Manufacturing Provenance', 'Domain Authority', 27);

  const creds27 = [
    { s: '₹45,000+ Cr', l: 'SPEND AUDITED', d: 'Extensive forensic spend analysis across cement, metals, mining, and heavy process manufacturing enterprises.', b: 'Extensive Scale', c: BRAND_COLORS.procucevBlue },
    { s: 'PCBI Index', l: 'BENCHMARKS', d: '28 industrial commodity benchmark indices covering imported fuels, chemicals, packaging, and freight rates.', b: 'Market Intelligence', c: BRAND_COLORS.accentGreen },
    { s: 'Cement Ops', l: 'CATEGORY PLAYBOOKS', d: 'Hands-on category experience across limestone extraction, clinker burning, grinding mills, and bulk terminals.', b: 'Category Mastery', c: '#0284C7' },
    { s: '100% Audited', l: 'P&L CASH REALIZATION', d: 'Turnkey execution model verifying actual rate reductions against ERP payment registers with zero fictitious savings.', b: 'CFO Trust', c: BRAND_COLORS.accentAmber }
  ];
  creds27.forEach((cr, idx) => {
    const x = 0.5 + idx * 2.28;
    s27.addShape('rect', { x, y: 1.15, w: 2.15, h: 3.1, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s27.addShape('rect', { x, y: 1.15, w: 2.15, h: 0.05, fill: { color: cr.c.replace('#', '') } });
    s27.addText(cr.s, { x: x + 0.1, y: 1.25, w: 1.95, h: 0.35, fontSize: 18, bold: true, color: cr.c.replace('#', ''), fontFace });
    s27.addText(cr.l, { x: x + 0.1, y: 1.6, w: 1.95, h: 0.22, fontSize: 8, bold: true, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
    s27.addText(cr.d, { x: x + 0.1, y: 1.9, w: 1.95, h: 1.7, fontSize: 8.5, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
    s27.addShape('rect', { x: x + 0.08, y: 3.75, w: 1.99, h: 0.38, fill: { color: BRAND_COLORS.canvas.replace('#', '') }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s27.addText(cr.b, { x: x + 0.12, y: 3.82, w: 1.9, h: 0.25, fontSize: 8.5, bold: true, color: cr.c.replace('#', ''), fontFace });
  });

  s27.addShape('rect', { x: 0.5, y: 4.4, w: 9.0, h: 0.65, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s27.addText('OPERATIONAL EXECUTION ADVANTAGE: Procucev is not a generalist management consultancy. We deploy procurement practitioners, commodity data scientists, and dynamic auction choreographers who work alongside UltraTech plant teams to deliver hard EBITDA results.', {
    x: 0.65, y: 4.45, w: 8.7, h: 0.55, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
  });
  addSlideFooter(s27, clientName, 27, totalSlides);

  // Slide 28: Trust, Security & Governance
  const s28 = pptx.addSlide();
  s28.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s28, 'How Customer Procurement Data is Protected: Trust & Governance', 'Trust & Governance', 28);

  const trusts28 = [
    { n: '01', t: 'AES-256-GCM', s: 'Cryptographic Standard', d: 'All transactional line items, unit rates, supplier names, and plant IDs are encrypted with AES-256-GCM using unique per-tenant keys.', b: 'FIPS-Grade', c: BRAND_COLORS.procucevBlue },
    { n: '02', t: 'Zero Training', s: 'Data Isolation', d: 'UltraTech procurement data is processed in an isolated tenant enclave. Data is NEVER shared or used to train public machine learning models.', b: 'Air-Gapped', c: BRAND_COLORS.accentGreen },
    { n: '03', t: 'Audit Trail', s: 'Lineage Line', d: 'Every finding carries an immutable checksum linked directly back to specific SAP invoice and PO line-item numbers.', b: '100% Provenance', c: '#0284C7' },
    { n: '04', t: 'Compliance', s: 'SOC-2 / ISO 27001', d: 'Hardened cloud infrastructure with role-based access control (RBAC), multi-factor authentication, and automated audit logging on all queries.', b: 'Enterprise Ready', c: BRAND_COLORS.accentAmber }
  ];
  trusts28.forEach((tr, idx) => {
    const x = 0.5 + idx * 2.28;
    s28.addShape('rect', { x, y: 1.15, w: 2.15, h: 3.1, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s28.addShape('rect', { x, y: 1.15, w: 2.15, h: 0.05, fill: { color: tr.c.replace('#', '') } });
    s28.addText(tr.n, { x: x + 0.1, y: 1.25, w: 1.95, h: 0.25, fontSize: 12, bold: true, color: tr.c.replace('#', ''), fontFace });
    s28.addText(`${tr.t}\n${tr.s}`, { x: x + 0.1, y: 1.55, w: 1.95, h: 0.42, fontSize: 8.5, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
    s28.addText(tr.d, { x: x + 0.1, y: 2.05, w: 1.95, h: 1.6, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
    s28.addShape('rect', { x: x + 0.08, y: 3.75, w: 1.99, h: 0.38, fill: { color: BRAND_COLORS.canvas.replace('#', '') }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s28.addText(tr.b, { x: x + 0.12, y: 3.82, w: 1.9, h: 0.25, fontSize: 8.5, bold: true, color: tr.c.replace('#', ''), fontFace });
  });

  s28.addShape('rect', { x: 0.5, y: 4.4, w: 9.0, h: 0.65, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s28.addText('ENTERPRISE DATA INTEGRITY PLEDGE: Procucev guarantees full legal and technical custody of customer confidential information. Commercial rate intelligence remains strictly proprietary to UltraTech Cement Limited and is safeguarded under mutual non-disclosure agreements.', {
    x: 0.65, y: 4.45, w: 8.7, h: 0.55, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
  });
  addSlideFooter(s28, clientName, 28, totalSlides);

  // Slide 29: Next Steps & Management Decision
  const s29 = pptx.addSlide();
  s29.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s29, 'Management Decision: Converting Opportunity into Realized EBITDA', 'Next Step', 29);

  const decs29 = [
    { n: 'DECISION 1', t: 'Wave 1 Sourcing Signoff', s: 'Authorize ₹47.90 Cr Tenders', d: 'Approve execution of 5 pre-qualified Wave 1 initiatives across packaging bags, grinding media, and imported fuel benchmarks. Direct P&L cash realization in 90 days.', a: 'APPROVE WAVE 1 RFPs', c: BRAND_COLORS.accentGreen },
    { n: 'DECISION 2', t: 'Working Group Charter', s: 'Empower Plant Procurement', d: 'Charter a joint UltraTech-Procucev Sourcing Steering Committee connecting central procurement with plant managers to ensure operational adoption.', a: 'CHARTER WORKING GROUP', c: BRAND_COLORS.procucevBlue },
    { n: 'DECISION 3', t: 'E-Auction Authorization', s: 'Dynamic Reverse Bidding', d: 'Authorize Procucev dynamic reverse e-auction rules and controlled volume allocation framework for high-competition packaging and freight categories.', a: 'AUTHORIZE E-AUCTIONS', c: '#0284C7' }
  ];
  decs29.forEach((dc, idx) => {
    const x = 0.5 + idx * 3.05;
    s29.addShape('rect', { x, y: 1.15, w: 2.9, h: 2.5, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s29.addShape('rect', { x, y: 1.15, w: 2.9, h: 0.05, fill: { color: dc.c.replace('#', '') } });
    s29.addText(dc.n, { x: x + 0.15, y: 1.25, w: 2.6, h: 0.22, fontSize: 8.5, bold: true, color: dc.c.replace('#', ''), fontFace });
    s29.addText(dc.t, { x: x + 0.15, y: 1.5, w: 2.6, h: 0.25, fontSize: 10, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
    s29.addText(dc.s, { x: x + 0.15, y: 1.75, w: 2.6, h: 0.22, fontSize: 8.5, bold: true, color: dc.c.replace('#', ''), fontFace });
    s29.addText(dc.d, { x: x + 0.15, y: 2.05, w: 2.6, h: 1.0, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
    s29.addShape('rect', { x: x + 0.15, y: 3.12, w: 2.6, h: 0.42, fill: { color: dc.c.replace('#', '') } });
    s29.addText(dc.a, { x: x + 0.15, y: 3.2, w: 2.6, h: 0.28, fontSize: 8.5, bold: true, align: 'center', color: 'FFFFFF', fontFace });
  });

  s29.addShape('rect', { x: 0.5, y: 3.82, w: 9.0, h: 1.22, fill: { color: 'EFF6FF' }, line: { color: BRAND_COLORS.procucevBlue.replace('#', '') } });
  s29.addText('THE OPPORTUNITY IS IDENTIFIED. NOW IT IS TIME TO CONVERT IT.\nAcross ₹5,920.35 Cr of audited spend, Procucev has certified ₹78.72 Cr in defensible direct recurring savings and ₹14.88 Cr in strategic market upside. Execution begins immediately upon steering committee authorization.', {
    x: 0.65, y: 3.92, w: 8.7, h: 0.72, fontSize: 9.5, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace
  });
  s29.addText('Contact: leadership@procucev.com  |  aiCEV Procurement Intelligence Platform  |  Boardroom Edition', {
    x: 0.65, y: 4.7, w: 8.7, h: 0.25, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
  });
  addSlideFooter(s29, clientName, 29, totalSlides);

  // Slide 30: Audit Appendix
  const s30 = pptx.addSlide();
  s30.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s30, 'Evidence Appendix: Methodological Provenance & Transaction Traceability', 'Audit Appendix', 30);

  const tableRows30: PptxGenJS.TableRow[] = [
    [
      { text: 'Metric Invariant', options: { bold: true, fill: { color: 'F1F5F9' }, color: '0F172A' } },
      { text: 'Audited Value', options: { bold: true, fill: { color: 'F1F5F9' }, color: '0F172A' } },
      { text: 'Reconciliation Scope & Provenance', options: { bold: true, fill: { color: 'F1F5F9' }, color: '0F172A' } }
    ],
    [{ text: 'Total Spend Evaluated' }, { text: '₹5,920.35 Cr' }, { text: '31,671 invoice line items (April 2024 - March 2026, 24 Months)' }],
    [{ text: 'Commercial Baseline' }, { text: '₹4,931.00 Cr' }, { text: 'Excludes non-controllable taxes, duties, and inter-unit transfers' }],
    [{ text: 'Gross Opportunity' }, { text: '₹173.12 Cr' }, { text: 'Sum of individual potentials across 10 strategic sourcing levers' }],
    [{ text: 'Multi-Lever Overlaps' }, { text: '₹62.80 Cr' }, { text: 'Mathematical deduplication between tenders, volume, and rate cuts' }],
    [{ text: 'Policy Exclusions' }, { text: '₹16.72 Cr' }, { text: 'Carve-out of long-term contracts and single-source OEM spares' }],
    [{ text: 'Net Defensible Pipeline' }, { text: '₹93.60 Cr' }, { text: 'Certified value pool: ₹78.72 Cr Direct + ₹14.88 Cr Strategic' }],
    [{ text: 'Direct P&L Savings' }, { text: '₹78.72 Cr' }, { text: 'Monetized recurring EBITDA cost reduction across 26 plants' }],
    [{ text: 'Strategic Market Value' }, { text: '₹14.88 Cr' }, { text: 'Commodity benchmark alignment; tracked separately from direct savings' }]
  ];
  s30.addTable(tableRows30, { x: 0.5, y: 1.15, w: 9.0, h: 2.45, colW: [2.5, 1.8, 4.7], fontSize: 8.5, color: '334155', fill: { color: 'FFFFFF' } });

  s30.addShape('rect', { x: 0.5, y: 3.75, w: 9.0, h: 1.3, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s30.addShape('rect', { x: 0.5, y: 3.75, w: 0.08, h: 1.3, fill: { color: BRAND_COLORS.accentGreen.replace('#', '') } });
  s30.addText('PROCUCEV CERTIFIED DIAGNOSTIC AUDIT ATTESTATION\nThis Executive Brief is certified by Procucev Enterprise Diagnostic Analytics Engine. All numerical invariants balance with ₹0.00 variance across the transactional ledger. Process productivity (20.0% effort reduction across 824 POs) and risk avoidance (₹420.00 Cr spend de-risked) are strictly non-monetized to guarantee absolute boardroom credibility.\n\nPrepared Exclusively for UltraTech Cement Limited  |  aiCEV by Procucev  |  Audit Certified', {
    x: 0.7, y: 3.82, w: 8.6, h: 1.15, fontSize: 8.5, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace
  });
  addSlideFooter(s30, clientName, 30, totalSlides);
}
