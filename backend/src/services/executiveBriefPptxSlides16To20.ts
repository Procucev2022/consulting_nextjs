/**
 * Executive Brief PPTX Slides 16 to 20 (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strict 10 x 5.625 inch grid, Aptos/Arial typography, process flow, before/after cards, and PCBI metrics.
 */

import type PptxGenJS from 'pptxgenjs';
import { BRAND_COLORS, TYPOGRAPHY } from '../constants/executiveBriefLayoutConstants';
import { addSlideHeader, addSlideFooter, addPptxKpiCard } from './executiveBriefPptxHelpers';

export function renderPptxSlides16To20(
  pptx: PptxGenJS,
  clientName: string,
  totalSlides: number
): void {
  const fontFace = TYPOGRAPHY.fallbackFont;

  // Slide 16: E-Auction Execution
  const s16 = pptx.addSlide();
  s16.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s16, 'E-Auction as an Execution Mechanism: Dynamic Price Discovery', 'Dynamic Sourcing', 16);

  const steps16 = [
    { n: '1', t: 'IDENTIFY', d: 'Screen competitive spend with >= 3 qualified vendors' },
    { n: '2', t: 'QUALIFY', d: 'Verify plant QA specs and supplier capacity limits' },
    { n: '3', t: 'STRUCTURE', d: 'Define plant lotting rules and reserve baseline pricing' },
    { n: '4', t: 'RUN', d: 'Choreograph dynamic live reverse auction bidding' },
    { n: '5', t: 'NEGOTIATE', d: 'Final commercial alignment and volume confirmations' },
    { n: '6', t: 'CONTRACT', d: 'Execute master rate contracts and supply SLAs' },
    { n: '7', t: 'REALIZE', d: 'Audit invoice pricing against auction award rates' }
  ];
  steps16.forEach((st, idx) => {
    const x = 0.5 + idx * 1.3;
    s16.addShape('rect', { x, y: 1.15, w: 1.2, h: 1.35, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s16.addShape('rect', { x, y: 1.15, w: 1.2, h: 0.04, fill: { color: BRAND_COLORS.procucevBlue.replace('#', '') } });
    s16.addText(`STAGE ${st.n}\n${st.t}`, { x: x + 0.08, y: 1.25, w: 1.04, h: 0.45, fontSize: 8.5, bold: true, color: BRAND_COLORS.procucevBlue.replace('#', ''), fontFace });
    s16.addText(st.d, { x: x + 0.08, y: 1.75, w: 1.04, h: 0.7, fontSize: 8, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
  });

  s16.addShape('rect', { x: 0.5, y: 2.65, w: 4.35, h: 1.6, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s16.addShape('rect', { x: 0.5, y: 2.65, w: 4.35, h: 0.04, fill: { color: BRAND_COLORS.accentGreen.replace('#', '') } });
  s16.addText('COMMERCIAL SOURCING RULEBOOK', { x: 0.65, y: 2.75, w: 4.0, h: 0.22, fontSize: 9.5, bold: true, color: BRAND_COLORS.accentGreen.replace('#', ''), fontFace });
  s16.addText('Use controlled volume allocation across qualified suppliers based on competition, capacity, risk and commercial outcome. Multi-supplier volume allocation ensures operational supply continuity across all 26 plant sites.', {
    x: 0.65, y: 3.05, w: 4.0, h: 1.1, fontSize: 9, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace
  });

  s16.addShape('rect', { x: 5.15, y: 2.65, w: 4.35, h: 1.6, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s16.addShape('rect', { x: 5.15, y: 2.65, w: 4.35, h: 0.04, fill: { color: BRAND_COLORS.procucevBlue.replace('#', '') } });
  s16.addText('E-AUCTION OPPORTUNITY POOL: ₹31.50 Cr', { x: 5.3, y: 2.75, w: 4.0, h: 0.22, fontSize: 9.5, bold: true, color: BRAND_COLORS.procucevBlue.replace('#', ''), fontFace });
  s16.addText('E-auction is strictly an execution mechanism to capture verified market pricing. Applicable to highly liquid categories including HDPE packing bags (₹14.50 Cr), secondary freight (₹9.60 Cr), and grinding media (₹7.40 Cr).', {
    x: 5.3, y: 3.05, w: 4.0, h: 1.1, fontSize: 9, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace
  });

  s16.addShape('rect', { x: 0.5, y: 4.4, w: 9.0, h: 0.65, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s16.addText('EXECUTION SAFEGUARDS: Dynamic reverse auctions are never run cold. Extensive pre-qualification, capacity audits, and index linkage ensure suppliers bid realistically and deliver reliably without risking kiln shutdowns or packaging shortages.', {
    x: 0.65, y: 4.45, w: 8.7, h: 0.55, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
  });
  addSlideFooter(s16, clientName, 16, totalSlides);

  // Slide 17: Vendor Consolidation
  const s17 = pptx.addSlide();
  s17.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s17, 'Vendor Base Consolidation: Tail Spend Rationalization & Panelling', 'Vendor Rationalization', 17);

  const states17 = [
    { t: 'CURRENT STATE', s: 'Fragmented Tail Base', m: '974 Suppliers (912 in Tail)', d: 'Severe vendor fragmentation across operating units. High administrative overhead managing hundreds of sub-scale single-plant vendors with zero corporate volume leverage.', c: BRAND_COLORS.secondaryText },
    { t: 'PROCUCEV INTERVENTION', s: 'Panelling & Rationalization', m: 'Master Preferred Tiers', d: 'Deploy regional hub agreements, preferred vendor tiers, and structured panelling for consumable and MRO categories. Establish corporate frame contracts.', c: BRAND_COLORS.procucevBlue },
    { t: 'TARGET STATE', s: 'Streamlined Supplier Network', m: '450 Vendors (₹26.40 Cr *)', d: '50%+ reduction in tail supplier count. Consolidated purchasing volumes unlock higher discount tiers and substantially lower transactional PO processing burden.', c: BRAND_COLORS.accentGreen }
  ];
  states17.forEach((st, idx) => {
    const x = 0.5 + idx * 3.05;
    s17.addShape('rect', { x, y: 1.15, w: 2.9, h: 3.1, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s17.addShape('rect', { x, y: 1.15, w: 2.9, h: 0.05, fill: { color: st.c.replace('#', '') } });
    s17.addText(st.t, { x: x + 0.15, y: 1.25, w: 2.6, h: 0.25, fontSize: 9.5, bold: true, color: st.c.replace('#', ''), fontFace });
    s17.addText(st.s, { x: x + 0.15, y: 1.5, w: 2.6, h: 0.22, fontSize: 8, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
    s17.addText(st.m, { x: x + 0.15, y: 1.8, w: 2.6, h: 0.45, fontSize: 16, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
    s17.addText(st.d, { x: x + 0.15, y: 2.35, w: 2.6, h: 1.7, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
  });

  s17.addShape('rect', { x: 0.5, y: 4.4, w: 9.0, h: 0.65, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s17.addText('* Indicative modelling assumption: The estimated ₹26.40 Cr opportunity from vendor consolidation represents an indicative 5% savings benchmark on tail spend based on industrial precedents. Tail supplier rationalization is phased carefully to protect local plant supply continuity.', {
    x: 0.65, y: 4.45, w: 8.7, h: 0.55, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
  });
  addSlideFooter(s17, clientName, 17, totalSlides);

  // Slide 18: PO Productivity
  const s18 = pptx.addSlide();
  s18.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s18, 'Fewer POs, Less Transactional Effort: PO Consolidation & Specialization', 'Process Productivity', 18);

  const steps18 = [
    { n: 'STEP 1', s: '824 POs', t: 'Low-Value PO Baseline', d: '824 low-value POs (<₹50,000 each) currently issued across plants, driving disproportionate transactional workload.', c: BRAND_COLORS.procucevBlue },
    { n: 'STEP 2', s: '20.0%', t: 'Effort Reduction Potential', d: 'Catalog purchasing, vendor panelling, and automated monthly consolidated billing eliminate 20% of operational buyer load.', c: '#0284C7' },
    { n: 'STEP 3', s: '₹0.00 Monetized', t: 'Zero Direct Savings Booked', d: 'Conservative Governance: Direct cost savings are booked at ₹0.00 until UltraTech internal time-motion baseline is verified.', c: BRAND_COLORS.accentGreen }
  ];
  steps18.forEach((st, idx) => {
    const x = 0.5 + idx * 3.05;
    s18.addShape('rect', { x, y: 1.15, w: 2.9, h: 1.6, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s18.addShape('rect', { x, y: 1.15, w: 2.9, h: 0.04, fill: { color: st.c.replace('#', '') } });
    s18.addText(`${st.n}: ${st.s}`, { x: x + 0.15, y: 1.25, w: 2.6, h: 0.35, fontSize: 16, bold: true, color: st.c.replace('#', ''), fontFace });
    s18.addText(st.t, { x: x + 0.15, y: 1.62, w: 2.6, h: 0.22, fontSize: 8.5, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
    s18.addText(st.d, { x: x + 0.15, y: 1.88, w: 2.6, h: 0.8, fontSize: 8, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
  });

  s18.addShape('rect', { x: 0.5, y: 2.9, w: 4.35, h: 1.35, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s18.addText('OPERATIONAL WORKLOAD ELIMINATION', { x: 0.65, y: 3.0, w: 4.0, h: 0.22, fontSize: 9.5, bold: true, color: BRAND_COLORS.procucevBlue.replace('#', ''), fontFace });
  s18.addText('While 824 low-value POs account for <1% of evaluated procurement spend, they generate over 25% of commercial buyer inquiries and invoice processing exceptions. Streamlining these releases team bandwidth for strategic vendor negotiation.', {
    x: 0.65, y: 3.25, w: 4.0, h: 0.95, fontSize: 8.5, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace
  });

  s18.addShape('rect', { x: 5.15, y: 2.9, w: 4.35, h: 1.35, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s18.addText('STRICT CFO FINANCIAL GOVERNANCE', { x: 5.3, y: 3.0, w: 4.0, h: 0.22, fontSize: 9.5, bold: true, color: BRAND_COLORS.accentGreen.replace('#', ''), fontFace });
  s18.addText('Unlike conventional consulting presentations that claim fictitious administrative labor savings, Procucev maintains ₹0.00 direct savings monetization for process productivity. All ₹78.72 Cr direct savings reflect verifiable unit price reductions.', {
    x: 5.3, y: 3.25, w: 4.0, h: 0.95, fontSize: 8.5, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace
  });

  s18.addShape('rect', { x: 0.5, y: 4.4, w: 9.0, h: 0.65, fill: { color: BRAND_COLORS.canvas.replace('#', '') }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s18.addText('EXECUTIVE PRODUCTIVITY VERDICT: 20.0% processing effort reduction across 824 low-value POs enables existing plant procurement teams to manage Wave 1 strategic initiatives without adding headcount or external contractor expense.', {
    x: 0.65, y: 4.45, w: 8.7, h: 0.55, fontSize: 8.5, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace
  });
  addSlideFooter(s18, clientName, 18, totalSlides);

  // Slide 19: Volume Aggregation
  const s19 = pptx.addSlide();
  s19.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s19, 'Volume Aggregation: National Demand Pooling on Standardized Specs', 'Scale Sourcing', 19);

  const examples19 = [
    { t: 'HDPE PACKAGING BAGS', b: '24 plants buying fragmented lots from 18 regional converters at ₹16.40/pc avg.', i: 'Pool 320 Million Bags into national master tender benchmarked to Platts PP index.', a: 'Harmonized ₹14.80/pc factory contract with Tier-1 polymer converters.', s: '₹14.50 Cr Validated', c: BRAND_COLORS.procucevBlue },
    { t: 'GRINDING MEDIA BALLS', b: '18 plants issuing 200-500 MT orders at disparate rates up to ₹89/kg.', i: 'Consolidate 14,200 MT national demand package direct to primary alloy mills.', a: 'Harmonized ₹76/kg contract rate with staged quarterly plant delivery.', s: '₹11.20 Cr Validated', c: BRAND_COLORS.accentGreen },
    { t: 'INDUSTRIAL LUBRICANTS', b: '14 fragmented plant orders across 6 disparate local distributor brands.', i: 'Standardize to 3 high-performance synthetic grades via direct OEM refinery pact.', a: 'Master supply agreement securing 15% tier discount and bulk ISO delivery.', s: '₹6.40 Cr Validated', c: '#0284C7' }
  ];
  examples19.forEach((ex, idx) => {
    const x = 0.5 + idx * 3.05;
    s19.addShape('rect', { x, y: 1.15, w: 2.9, h: 3.1, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s19.addShape('rect', { x, y: 1.15, w: 2.9, h: 0.05, fill: { color: ex.c.replace('#', '') } });
    s19.addText(ex.t, { x: x + 0.15, y: 1.25, w: 2.6, h: 0.25, fontSize: 9.5, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
    s19.addText(`CURRENT: ${ex.b}\n\nINTERVENTION: ${ex.i}\n\nTARGET: ${ex.a}`, { x: x + 0.15, y: 1.55, w: 2.6, h: 2.0, fontSize: 8, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
    s19.addShape('rect', { x: x + 0.15, y: 3.75, w: 2.6, h: 0.38, fill: { color: 'EFF6FF' }, line: { color: BRAND_COLORS.procucevBlue.replace('#', '') } });
    s19.addText(ex.s, { x: x + 0.2, y: 3.82, w: 2.5, h: 0.25, fontSize: 8.5, bold: true, color: BRAND_COLORS.procucevBlue.replace('#', ''), fontFace });
  });

  s19.addShape('rect', { x: 0.5, y: 4.4, w: 9.0, h: 0.65, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s19.addText('SPECIFICATION STANDARDIZATION AUDIT MANDATE: Volume aggregation is evaluated strictly on identical technical specifications and validated manufacturer capacity. Demand is never arbitrarily grouped across dissimilar grades. Pooling recurring spend unlocks direct Tier-1 OEM factory pricing.', {
    x: 0.65, y: 4.45, w: 8.7, h: 0.55, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
  });
  addSlideFooter(s19, clientName, 19, totalSlides);

  // Slide 20: PCBI Coverage
  const s20 = pptx.addSlide();
  s20.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s20, 'Module 3 - PCBI Benchmark Coverage & Market Alignment', 'Market Intelligence', 20);

  addPptxKpiCard(s20, 0.5, 1.1, 2.15, 0.95, 'PCBI Covered Spend', '₹1,480.00 Cr', 'Key Industrial Commodities', BRAND_COLORS.procucevBlue);
  addPptxKpiCard(s20, 2.78, 1.1, 2.15, 0.95, 'Benchmark Indices', '28 Commodity Indices', 'Coal, Petcoke, Polymer, Steel', BRAND_COLORS.accentGreen);
  addPptxKpiCard(s20, 5.06, 1.1, 2.15, 0.95, 'Index Correlation', '94.2% Market R2', 'Empirical Landing Match', '#0284C7');
  addPptxKpiCard(s20, 7.35, 1.1, 2.15, 0.95, 'Strategic Market Value', '₹14.88 Cr', 'Timing & Formula Reset', BRAND_COLORS.accentAmber);

  s20.addShape('rect', { x: 0.5, y: 2.2, w: 4.35, h: 2.05, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s20.addShape('rect', { x: 0.5, y: 2.2, w: 4.35, h: 0.04, fill: { color: BRAND_COLORS.procucevBlue.replace('#', '') } });
  s20.addText('INDEPENDENT COMMODITY INTELLIGENCE', { x: 0.65, y: 2.3, w: 4.0, h: 0.22, fontSize: 9.5, bold: true, color: BRAND_COLORS.procucevBlue.replace('#', ''), fontFace });
  s20.addText('PCBI benchmarks consume external import customs clearance filings, port handling manifests, domestic mining index updates, and published physical commodity exchange transactions. Data feeds are independent, unmanipulated, and continuously updated.', {
    x: 0.65, y: 2.58, w: 4.0, h: 1.6, fontSize: 8.5, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace
  });

  s20.addShape('rect', { x: 5.15, y: 2.2, w: 4.35, h: 2.05, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s20.addShape('rect', { x: 5.15, y: 2.2, w: 4.35, h: 0.04, fill: { color: BRAND_COLORS.accentGreen.replace('#', '') } });
  s20.addText('STRICT TECHNICAL DATA ISOLATION', { x: 5.3, y: 2.3, w: 4.0, h: 0.22, fontSize: 9.5, bold: true, color: BRAND_COLORS.accentGreen.replace('#', ''), fontFace });
  s20.addText('Customer purchase transactions NEVER enter PCBI benchmark series. There is zero risk of data leakage or cross-customer contamination. Benchmarks serve as an external commercial beacon to measure whether UltraTech is buying ahead or behind prevailing market cycles.', {
    x: 5.3, y: 2.58, w: 4.0, h: 1.6, fontSize: 8.5, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace
  });

  s20.addShape('rect', { x: 0.5, y: 4.4, w: 9.0, h: 0.65, fill: { color: BRAND_COLORS.canvas.replace('#', '') }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s20.addText('MARKET ALIGNMENT STRATEGY: PCBI index correlation enables UltraTech to convert fixed-price commodity contracts into formulaic index-linked agreements, capturing ₹14.88 Cr in non-direct strategic market value during down-cycles while protecting budget certainty.', {
    x: 0.65, y: 4.45, w: 8.7, h: 0.55, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
  });
  addSlideFooter(s20, clientName, 20, totalSlides);
}
