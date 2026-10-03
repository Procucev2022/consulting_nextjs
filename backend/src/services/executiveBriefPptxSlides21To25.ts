/**
 * Executive Brief PPTX Slides 21 to 25 (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strict 10 x 5.625 inch grid, Aptos/Arial typography, benchmarks, formulas, maturity flow, and roadmap.
 */

import type PptxGenJS from 'pptxgenjs';
import { BRAND_COLORS, TYPOGRAPHY } from '../constants/executiveBriefLayoutConstants';
import { addSlideHeader, addSlideFooter } from './executiveBriefPptxHelpers';

export function renderPptxSlides21To25(
  pptx: PptxGenJS,
  clientName: string,
  totalSlides: number
): void {
  const fontFace = TYPOGRAPHY.fallbackFont;

  // Slide 21: PCBI Benchmark Findings
  const s21 = pptx.addSlide();
  s21.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s21, 'PCBI Benchmark Findings: Customer Purchase Rate vs Market Indices', 'Market Benchmarks', 21);

  const items21 = [
    { n: 'Imported Petcoke (6.5% S)', r: 'Customer: ₹14,200/MT  |  PCBI: ₹13,400/MT', d: '+5.9% Over PCBI Index', o: '₹9.80 Cr Strategic Timing', desc: 'Locked in during a temporary spike. Transitioning to monthly index-linked pricing captures prevailing market declines.', c: BRAND_COLORS.accentAmber },
    { n: 'Domestic Thermal Coal (G11)', r: 'Customer: ₹8,650/MT  |  PCBI: ₹8,200/MT', d: '+5.5% Over PCBI Index', o: '₹3.62 Cr Contract Reset', desc: 'Plant spot coal buying carries distribution intermediary premiums. Bilateral linkage eliminates trader markups.', c: BRAND_COLORS.procucevBlue },
    { n: 'PP Granules (Packaging)', r: 'Customer: ₹98.50/kg  |  PCBI: ₹94.00/kg', d: '+4.8% Over PCBI Index', o: '₹1.46 Cr Formula Linkage', desc: 'Converter pricing lags raw polymer falls by 60-90 days. Transparent formula contracts enforce instant pass-through.', c: BRAND_COLORS.accentGreen }
  ];
  items21.forEach((it, idx) => {
    const x = 0.5 + idx * 3.05;
    s21.addShape('rect', { x, y: 1.15, w: 2.9, h: 3.1, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s21.addShape('rect', { x, y: 1.15, w: 2.9, h: 0.05, fill: { color: it.c.replace('#', '') } });
    s21.addText(it.n, { x: x + 0.15, y: 1.25, w: 2.6, h: 0.28, fontSize: 9.5, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
    s21.addText(it.d, { x: x + 0.15, y: 1.55, w: 2.6, h: 0.22, fontSize: 8.5, bold: true, color: it.c.replace('#', ''), fontFace });
    s21.addShape('rect', { x: x + 0.15, y: 1.82, w: 2.6, h: 0.55, fill: { color: BRAND_COLORS.canvas.replace('#', '') }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s21.addText(it.r, { x: x + 0.2, y: 1.9, w: 2.5, h: 0.38, fontSize: 8, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
    s21.addText(it.desc, { x: x + 0.15, y: 2.45, w: 2.6, h: 1.15, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
    s21.addShape('rect', { x: x + 0.15, y: 3.75, w: 2.6, h: 0.38, fill: { color: 'EFF6FF' }, line: { color: BRAND_COLORS.procucevBlue.replace('#', '') } });
    s21.addText(it.o, { x: x + 0.2, y: 3.82, w: 2.5, h: 0.25, fontSize: 8.5, bold: true, color: BRAND_COLORS.procucevBlue.replace('#', ''), fontFace });
  });

  s21.addShape('rect', { x: 0.5, y: 4.4, w: 9.0, h: 0.65, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s21.addText('STRATEGIC MARKET VALUE GOVERNANCE: Total Strategic Market Value of ₹14.88 Cr is tracked separately from Direct Savings (₹78.72 Cr). It reflects commercial timing and formula indexing upside dependent on market commodity movements rather than pure operational rate reduction.', {
    x: 0.65, y: 4.45, w: 8.7, h: 0.55, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
  });
  addSlideFooter(s21, clientName, 21, totalSlides);

  // Slide 22: Index Contracting Formulas
  const s22 = pptx.addSlide();
  s22.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s22, 'Benchmark-Guided Sourcing Interventions & Index Contract Formulas', 'Index Contracting', 22);

  const formulas22 = [
    { t: 'PETCOKE & COAL FUEL FORMULA', sub: 'Imported Fuel Procurement (₹1,480 Cr)', f: 'P_net = P_base * [0.70 * (Idx / Idx0) + 0.30 * (FX / FX0)]', d: 'Links landed plant fuel cost directly to international Argus/Platts index benchmarks and RBI USD/INR reference rates. Eliminates importer speculative trading spread.', b: 'Captures ₹9.80 Cr Market Realignment', c: BRAND_COLORS.procucevBlue },
    { t: 'PP PACKAGING GRANULE FORMULA', sub: 'HDPE & PP Cement Sacks (₹947 Cr)', f: 'P_bag = Raw_Polymer * (Platts_PP / Base_PP) + Conv_Fee', d: 'Converter manufacturing fee is frozen and audited; raw polymer cost tracks Platts PP index on a 30-day lagged average. Removes converter margin inflation during resin downturns.', b: 'Secures ₹14.50 Cr E-Auction Lock-In', c: BRAND_COLORS.accentGreen },
    { t: 'FREIGHT DIESEL ESCALATION FACTOR', sub: 'Secondary Logistics & Road Freight (₹828 Cr)', f: 'Rate_t = Base_Rate * [1 + 0.35 * (Diesel_t - D0) / D0]', d: 'Standardized 35% fuel pass-through weight based on heavy commercial vehicle consumption metrics. Stops arbitrary carrier rate hike surcharges during diesel volatility.', b: 'Eliminates ₹4.80 Cr Rate Leakage', c: '#0284C7' }
  ];
  formulas22.forEach((fm, idx) => {
    const x = 0.5 + idx * 3.05;
    s22.addShape('rect', { x, y: 1.15, w: 2.9, h: 3.1, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s22.addShape('rect', { x, y: 1.15, w: 2.9, h: 0.05, fill: { color: fm.c.replace('#', '') } });
    s22.addText(fm.t, { x: x + 0.15, y: 1.25, w: 2.6, h: 0.35, fontSize: 8.5, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
    s22.addText(fm.sub, { x: x + 0.15, y: 1.6, w: 2.6, h: 0.22, fontSize: 8, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
    s22.addShape('rect', { x: x + 0.15, y: 1.88, w: 2.6, h: 0.55, fill: { color: BRAND_COLORS.canvas.replace('#', '') }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s22.addText(fm.f, { x: x + 0.2, y: 1.95, w: 2.5, h: 0.42, fontSize: 7.5, bold: true, color: fm.c.replace('#', ''), fontFace });
    s22.addText(fm.d, { x: x + 0.15, y: 2.5, w: 2.6, h: 1.1, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
    s22.addShape('rect', { x: x + 0.15, y: 3.75, w: 2.6, h: 0.38, fill: { color: 'EFF6FF' }, line: { color: BRAND_COLORS.procucevBlue.replace('#', '') } });
    s22.addText(fm.b, { x: x + 0.2, y: 3.82, w: 2.5, h: 0.25, fontSize: 8.5, bold: true, color: BRAND_COLORS.procucevBlue.replace('#', ''), fontFace });
  });

  s22.addShape('rect', { x: 0.5, y: 4.4, w: 9.0, h: 0.65, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s22.addText('INDEX CONTRACTING GOVERNANCE: Formula-linked indexing protects both UltraTech and suppliers against unexpected commodity spikes while automatically capturing down-cycle cost reductions without contentious adversarial re-negotiations.', {
    x: 0.65, y: 4.45, w: 8.7, h: 0.55, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
  });
  addSlideFooter(s22, clientName, 22, totalSlides);

  // Slide 23: Savings Realization Pipeline
  const s23 = pptx.addSlide();
  s23.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s23, 'Savings Realization Pipeline: Governance from Opportunity to P&L', 'Execution Governance', 23);

  const stages23 = [
    { n: 'STAGE 1', t: 'IDENTIFIED', v: '₹173.12 Cr', s: 'Gross Standalone', d: 'Total sum of individual sourcing lever potentials before interaction deduplication.', c: BRAND_COLORS.secondaryText },
    { n: 'STAGE 2', t: 'DEDUPLICATED', v: '₹93.60 Cr', s: 'Net Defensible', d: 'Rigorous deduction of ₹62.80 Cr overlaps and ₹16.72 Cr policy exclusions.', c: BRAND_COLORS.procucevBlue },
    { n: 'STAGE 3', t: 'VALIDATED', v: '₹47.90 Cr', s: 'Wave 1 Pre-Qualified', d: 'Fully verified supplier capacity, approved specs, and 90-day tender readiness.', c: BRAND_COLORS.accentGreen },
    { n: 'STAGE 4', t: 'CONTRACTED', v: 'In Execution', s: 'Commercial Awards', d: 'Legally binding master contracts, e-auction awards, and index formulas locked in.', c: '#0284C7' },
    { n: 'STAGE 5', t: 'REALIZED', v: '₹68.00 Cr', s: 'Classified Realized *', d: 'Audited ERP invoice payments showing direct P&L recurring EBITDA expansion.', c: BRAND_COLORS.accentAmber }
  ];
  stages23.forEach((st, idx) => {
    const x = 0.5 + idx * 1.82;
    s23.addShape('rect', { x, y: 1.15, w: 1.72, h: 2.1, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s23.addShape('rect', { x, y: 1.15, w: 1.72, h: 0.04, fill: { color: st.c.replace('#', '') } });
    s23.addText(`${st.n}\n${st.t}`, { x: x + 0.1, y: 1.25, w: 1.52, h: 0.42, fontSize: 8.5, bold: true, color: st.c.replace('#', ''), fontFace });
    s23.addText(st.v, { x: x + 0.1, y: 1.7, w: 1.52, h: 0.35, fontSize: 14, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
    s23.addText(st.s, { x: x + 0.1, y: 2.05, w: 1.52, h: 0.22, fontSize: 8, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
    s23.addText(st.d, { x: x + 0.1, y: 2.3, w: 1.52, h: 0.85, fontSize: 7.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
  });

  s23.addShape('rect', { x: 0.5, y: 3.38, w: 4.35, h: 1.6, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s23.addShape('rect', { x: 0.5, y: 3.38, w: 4.35, h: 0.04, fill: { color: BRAND_COLORS.accentGreen.replace('#', '') } });
  s23.addText('WAVE 1 VALIDATED SAVINGS: ₹47.90 Cr', { x: 0.65, y: 3.48, w: 4.0, h: 0.22, fontSize: 9.5, bold: true, color: BRAND_COLORS.accentGreen.replace('#', ''), fontFace });
  s23.addText('Wave 1 initiatives represent immediate, low-risk sourcing interventions that have passed engineering specification reviews and vendor capacity checks. These 5 initiatives can be deployed within 90 days to deliver immediate P&L cash savings.', {
    x: 0.65, y: 3.75, w: 4.0, h: 1.1, fontSize: 8.5, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace
  });

  s23.addShape('rect', { x: 5.15, y: 3.38, w: 4.35, h: 1.6, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s23.addShape('rect', { x: 5.15, y: 3.38, w: 4.35, h: 0.04, fill: { color: BRAND_COLORS.accentAmber.replace('#', '') } });
  s23.addText('CLASSIFIED REALIZED SAVINGS: ₹68.00 Cr *', { x: 5.3, y: 3.48, w: 4.0, h: 0.22, fontSize: 9.5, bold: true, color: BRAND_COLORS.accentAmber.replace('#', ''), fontFace });
  s23.addText('* Classified Realized Savings represents separate historical realized savings tracked in Procucev forensic database; not additive to Wave-1 opportunity. Prevents double-counting between past completed initiatives and forward-looking pipeline.', {
    x: 5.3, y: 3.75, w: 4.0, h: 1.1, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
  });
  addSlideFooter(s23, clientName, 23, totalSlides);

  // Slide 24: Wave 1 Initiative Ledger
  const s24 = pptx.addSlide();
  s24.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s24, 'Savings Realization: Wave 1 Initiative Tracking & Milestone Status', 'Initiative Ledger', 24);

  const tableRows24: PptxGenJS.TableRow[] = [
    [
      { text: 'Initiative Name', options: { bold: true, fill: { color: 'F1F5F9' }, color: '0F172A' } },
      { text: 'Category', options: { bold: true, fill: { color: 'F1F5F9' }, color: '0F172A' } },
      { text: 'Target Levers', options: { bold: true, fill: { color: 'F1F5F9' }, color: '0F172A' } },
      { text: 'Addressable', options: { bold: true, fill: { color: 'F1F5F9' }, color: '0F172A' } },
      { text: 'Opportunity', options: { bold: true, fill: { color: 'F1F5F9' }, color: '0F172A' } },
      { text: 'Timeline', options: { bold: true, fill: { color: 'F1F5F9' }, color: '0F172A' } }
    ],
    [{ text: 'Packaging Bags Master E-Auction' }, { text: 'Packaging' }, { text: 'E-Auction & Index Linkage' }, { text: '₹947.26 Cr' }, { text: '₹14.50 Cr' }, { text: 'Days 1-30' }],
    [{ text: 'Grinding Media Rate Harmonization' }, { text: 'Consumables' }, { text: 'Price Variance Arbitrage' }, { text: '₹412.00 Cr' }, { text: '₹11.20 Cr' }, { text: 'Days 15-45' }],
    [{ text: 'Imported Fuel Benchmark Realignment' }, { text: 'Energy' }, { text: 'PCBI Benchmark Index' }, { text: '₹1,480.09 Cr' }, { text: '₹9.80 Cr' }, { text: 'Days 30-60' }],
    [{ text: 'Industrial Lubricants Synthetic Pooling' }, { text: 'Maintenance' }, { text: 'Volume Aggregation & OEM' }, { text: '₹186.00 Cr' }, { text: '₹6.40 Cr' }, { text: 'Days 45-75' }],
    [{ text: 'Refractory Bricks Spec Standardization' }, { text: 'Raw Materials' }, { text: 'Vendor Panelling & Aggregation' }, { text: '₹265.00 Cr' }, { text: '₹6.00 Cr' }, { text: 'Days 60-90' }]
  ];
  s24.addTable(tableRows24, { x: 0.5, y: 1.15, w: 9.0, h: 2.2, colW: [2.5, 1.1, 2.0, 1.2, 1.2, 1.0], fontSize: 8.5, color: '334155', fill: { color: 'FFFFFF' } });

  s24.addShape('rect', { x: 0.5, y: 3.55, w: 9.0, h: 0.44, fill: { color: 'EFF6FF' }, line: { color: BRAND_COLORS.procucevBlue.replace('#', '') } });
  s24.addText('TOTAL WAVE 1 VALIDATED OPPORTUNITY: ₹47.90 Cr  (Ready for Immediate 90-Day Execution across 5 Pre-Qualified Initiatives)', {
    x: 0.65, y: 3.62, w: 8.7, h: 0.3, fontSize: 9.5, bold: true, color: BRAND_COLORS.procucevBlue.replace('#', ''), fontFace
  });

  s24.addShape('rect', { x: 0.5, y: 4.12, w: 4.35, h: 0.95, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s24.addText('PRE-QUALIFIED SUPPLIER READINESS: All 5 Wave 1 initiatives have identified >= 3 pre-qualified manufacturers with verified production capacity. Technical specifications have been matched against plant engineering standards.', {
    x: 0.65, y: 4.18, w: 4.0, h: 0.8, fontSize: 8, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
  });

  s24.addShape('rect', { x: 5.15, y: 4.12, w: 4.35, h: 0.95, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s24.addText('DIRECT P&L CASH SAVINGS TIMELINE: Realized savings flow directly into plant operational budgets starting Month 2 of implementation. The Procucev invoice tracking dashboard matches every invoice rate against baseline contracts.', {
    x: 5.3, y: 4.18, w: 4.0, h: 0.8, fontSize: 8, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
  });
  addSlideFooter(s24, clientName, 24, totalSlides);

  // Slide 25: 90-Day Execution Roadmap
  const s25 = pptx.addSlide();
  s25.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s25, 'Priority Execution Roadmap: Phased 90-Day Implementation Timeline', 'Execution Schedule', 25);

  const phases25 = [
    { p: 'DAYS 1-30', t: 'Mobilize & Quick Wins', m: '₹14.50 Cr Tender Ready', c: BRAND_COLORS.accentGreen, text: '- Form joint commercial working group\n- Verify packaging specs across 26 plants\n- Issue RFP for 320M HDPE Bags reverse auction\n- Lock in ERP price tolerance thresholds' },
    { p: 'DAYS 31-60', t: 'Market Tenders & Panelling', m: '₹25.70 Cr In Process', c: BRAND_COLORS.procucevBlue, text: '- Conduct live reverse auction for packaging bags\n- Harmonize grinding media rates to ₹76/kg\n- Execute corridor bidding for secondary freight\n- Issue technical RFPs for lubricant consolidation' },
    { p: 'DAYS 61-90', t: 'Contract Execution & Handover', m: '₹47.90 Cr Wave 1 Locked', c: '#0284C7', text: '- Execute master frame agreements with winners\n- Implement index-linked fuel contracts\n- Consolidate 912 tail suppliers into panels\n- Deploy Procucev invoice tracking dashboard' },
    { p: 'DAYS 90+', t: 'Sustained Value Run-Rate', m: '₹78.72 Cr Full Run-Rate', c: BRAND_COLORS.accentAmber, text: '- Expand sourcing interventions to Wave 2 spares\n- Automate quarterly market index resets\n- Audit supplier delivery SLAs monthly\n- Maintain zero off-contract purchase drift' }
  ];
  phases25.forEach((ph, idx) => {
    const x = 0.5 + idx * 2.28;
    s25.addShape('rect', { x, y: 1.15, w: 2.15, h: 3.1, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s25.addShape('rect', { x, y: 1.15, w: 2.15, h: 0.05, fill: { color: ph.c.replace('#', '') } });
    s25.addText(ph.p, { x: x + 0.1, y: 1.25, w: 1.95, h: 0.22, fontSize: 9.5, bold: true, color: ph.c.replace('#', ''), fontFace });
    s25.addText(ph.t, { x: x + 0.1, y: 1.5, w: 1.95, h: 0.35, fontSize: 9, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
    s25.addText(ph.text, { x: x + 0.1, y: 1.9, w: 1.95, h: 1.8, fontSize: 8, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
    s25.addShape('rect', { x: x + 0.08, y: 3.75, w: 1.99, h: 0.38, fill: { color: BRAND_COLORS.canvas.replace('#', '') }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s25.addText(ph.m, { x: x + 0.12, y: 3.82, w: 1.9, h: 0.25, fontSize: 8, bold: true, color: ph.c.replace('#', ''), fontFace });
  });

  s25.addShape('rect', { x: 0.5, y: 4.4, w: 9.0, h: 0.65, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s25.addText('EXECUTION VELOCITY PRINCIPLE: Wave 1 is structured for rapid 90-day cash realization without disrupting daily plant operations. Early packaging and grinding media tenders deliver immediate proof-of-value, building organizational momentum for broader cross-plant consolidation.', {
    x: 0.65, y: 4.45, w: 8.7, h: 0.55, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
  });
  addSlideFooter(s25, clientName, 25, totalSlides);
}
