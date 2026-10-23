/**
 * Executive Brief PPTX Slides 16 to 18 (Prompt 283 - Premium Boardroom Consulting Redesign)
 * E-Auction methodology, vendor consolidation, and PO productivity.
 */

import type PptxGenJS from 'pptxgenjs';
import { BRAND_COLORS, TYPOGRAPHY } from '../constants/executiveBriefLayoutConstants';
import { addSlideHeader, addSlideFooter } from './executiveBriefPptxHelpers';
import {
  getExecutiveBriefPresentationContract,
  isCustomerAssessment
} from '../constants/executiveBriefPresentationConstants';

export function renderPptxSlide16(
  pptx: PptxGenJS,
  clientName: string,
  totalSlides: number
): void {
  const fontFace = TYPOGRAPHY.fallbackFont;
  const contract = getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);

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

  const rulebookText = isCust
    ? `Use controlled volume allocation across qualified suppliers based on competition, capacity, risk and commercial outcome. Multi-supplier volume allocation ensures operational supply continuity across all ${contract.baselinePlants} operating facilities.`
    : 'Use controlled volume allocation across qualified suppliers based on competition, capacity, risk and commercial outcome. Multi-supplier volume allocation ensures operational supply continuity across all 26 plant sites.';

  s16.addShape('rect', { x: 0.5, y: 2.65, w: 4.35, h: 1.6, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s16.addShape('rect', { x: 0.5, y: 2.65, w: 4.35, h: 0.04, fill: { color: BRAND_COLORS.accentGreen.replace('#', '') } });
  s16.addText('COMMERCIAL SOURCING RULEBOOK', { x: 0.65, y: 2.75, w: 4.0, h: 0.22, fontSize: 9.5, bold: true, color: BRAND_COLORS.accentGreen.replace('#', ''), fontFace });
  s16.addText(rulebookText, {
    x: 0.65, y: 3.05, w: 4.0, h: 1.1, fontSize: 9, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace
  });

  const poolTitle = isCust ? 'E-AUCTION OPPORTUNITY POOL: ₹28.07 Cr' : 'E-AUCTION OPPORTUNITY POOL: ₹31.50 Cr';
  const poolDesc = isCust
    ? 'E-auction is strictly an execution mechanism to capture verified market pricing. Applicable to highly liquid categories including synthetic yarns & fibers (₹18.25 Cr), secondary logistics routes (₹5.20 Cr), and standardized packaging materials (₹4.62 Cr).'
    : 'E-auction is strictly an execution mechanism to capture verified market pricing. Applicable to highly liquid categories including HDPE packing bags (₹14.50 Cr), secondary freight (₹9.60 Cr), and grinding media (₹7.40 Cr).';

  s16.addShape('rect', { x: 5.15, y: 2.65, w: 4.35, h: 1.6, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s16.addShape('rect', { x: 5.15, y: 2.65, w: 4.35, h: 0.04, fill: { color: BRAND_COLORS.procucevBlue.replace('#', '') } });
  s16.addText(poolTitle, { x: 5.3, y: 2.75, w: 4.0, h: 0.22, fontSize: 9.5, bold: true, color: BRAND_COLORS.procucevBlue.replace('#', ''), fontFace });
  s16.addText(poolDesc, {
    x: 5.3, y: 3.05, w: 4.0, h: 1.1, fontSize: 9, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace
  });

  const safeguardsText = isCust
    ? 'EXECUTION SAFEGUARDS: Dynamic reverse auctions are never run cold. Extensive pre-qualification, capacity audits, and index linkage ensure suppliers bid realistically and deliver reliably without risking plant line shutdowns or production supply shortages.'
    : 'EXECUTION SAFEGUARDS: Dynamic reverse auctions are never run cold. Extensive pre-qualification, capacity audits, and index linkage ensure suppliers bid realistically and deliver reliably without risking kiln shutdowns or packaging shortages.';

  s16.addShape('rect', { x: 0.5, y: 4.4, w: 9.0, h: 0.65, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s16.addText(safeguardsText, {
    x: 0.65, y: 4.45, w: 8.7, h: 0.55, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
  });
  addSlideFooter(s16, clientName, 16, totalSlides);
}

export function renderPptxSlide17(
  pptx: PptxGenJS,
  clientName: string,
  totalSlides: number
): void {
  const fontFace = TYPOGRAPHY.fallbackFont;
  const contract = getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);

  const s17 = pptx.addSlide();
  s17.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s17, 'Vendor Base Consolidation: Tail Spend Rationalization & Panelling', 'Vendor Rationalization', 17);

  const states17 = isCust
    ? [
        { t: 'CURRENT STATE', s: 'Fragmented Supplier Base', st: `${contract.baselineSuppliers} Suppliers`, m: '360 Suppliers in Tail (<₹25L)', d: 'Significant vendor fragmentation across operating units. High administrative overhead managing hundreds of single-unit vendors with fragmented corporate volume leverage.', c: BRAND_COLORS.secondaryText },
        { t: 'PROCUCEV INTERVENTION', s: 'Panelling & Rationalization', st: 'Strategic Panelling', m: 'Master Preferred Tiers', d: 'Deploy regional hub agreements, preferred vendor tiers, and structured panelling for consumable and MRO categories. Establish corporate frame contracts.', c: BRAND_COLORS.procucevBlue },
        { t: 'TARGET STATE', s: 'Streamlined Supplier Network', st: '180 Preferred Vendors', m: '₹10.47 Cr Modelled Value *', d: '50%+ reduction in tail supplier count. Consolidated purchasing volumes unlock higher discount tiers and lower transactional PO processing burden.', c: BRAND_COLORS.accentGreen }
      ]
    : [
        { t: 'CURRENT STATE', s: 'Fragmented Tail Base', st: '974 Suppliers', m: '912 Suppliers in Tail (<₹50L)', d: 'Severe vendor fragmentation across operating units. High administrative overhead managing hundreds of single-plant vendors with zero corporate volume leverage.', c: BRAND_COLORS.secondaryText },
        { t: 'PROCUCEV INTERVENTION', s: 'Panelling & Rationalization', st: 'Strategic Panelling', m: 'Master Preferred Tiers', d: 'Deploy regional hub agreements, preferred vendor tiers, and structured panelling for consumable and MRO categories. Establish corporate frame contracts.', c: BRAND_COLORS.procucevBlue },
        { t: 'TARGET STATE', s: 'Streamlined Supplier Network', st: '450 Preferred Vendors', m: '₹26.40 Cr Indicative Value *', d: '50%+ reduction in tail supplier count. Consolidated purchasing volumes unlock higher discount tiers and lower transactional PO processing burden.', c: BRAND_COLORS.accentGreen }
      ];

  states17.forEach((st, idx) => {
    const x = 0.5 + idx * 3.05;
    s17.addShape('rect', { x, y: 1.15, w: 2.9, h: 3.1, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s17.addShape('rect', { x, y: 1.15, w: 2.9, h: 0.05, fill: { color: st.c.replace('#', '') } });
    s17.addText(st.t, { x: x + 0.15, y: 1.25, w: 2.6, h: 0.25, fontSize: 9.5, bold: true, color: st.c.replace('#', ''), fontFace });
    s17.addText(st.s, { x: x + 0.15, y: 1.5, w: 2.6, h: 0.22, fontSize: 8, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
    s17.addText(st.st, { x: x + 0.15, y: 1.8, w: 2.6, h: 0.45, fontSize: 18, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
    s17.addText(st.m, { x: x + 0.15, y: 2.3, w: 2.6, h: 0.25, fontSize: 8.5, bold: true, color: st.c.replace('#', ''), fontFace });
    s17.addText(st.d, { x: x + 0.15, y: 2.6, w: 2.6, h: 1.5, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
  });

  const bannerText17 = isCust
    ? '* Defensible sourcing model: Tail spend panelling focuses on standardizing recurring materials while protecting local plant operations and operational flexibility.'
    : '* Indicative modelling assumption: The estimated ₹26.40 Cr opportunity from vendor consolidation represents an indicative 5% savings benchmark on tail spend based on industrial precedents. Tail supplier rationalization is phased carefully to protect local plant supply continuity.';

  s17.addShape('rect', { x: 0.5, y: 4.4, w: 9.0, h: 0.65, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s17.addText(bannerText17, {
    x: 0.65, y: 4.45, w: 8.7, h: 0.55, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
  });
  addSlideFooter(s17, clientName, 17, totalSlides);
}

export function renderPptxSlide18(
  pptx: PptxGenJS,
  clientName: string,
  totalSlides: number
): void {
  const fontFace = TYPOGRAPHY.fallbackFont;
  const contract = getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);

  const s18 = pptx.addSlide();
  s18.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s18, 'Fewer POs, Less Transactional Effort: PO Consolidation & Specialization', 'Process Productivity', 18);

  const steps18 = [
    { n: 'STEP 1', s: '824 POs', t: 'Low-Value PO Baseline', d: '824 low-value POs (<₹50,000 each) currently issued across plants, driving disproportionate transactional workload.', c: BRAND_COLORS.procucevBlue },
    { n: 'STEP 2', s: '20.0%', t: 'Effort Reduction Potential', d: 'Catalog purchasing, vendor panelling, and automated monthly billing eliminate 20% of operational buyer load.', c: '#0284C7' },
    { n: 'STEP 3', s: '₹0.00 Monetized', t: 'Zero Direct Savings Booked', d: 'Conservative Governance: Direct cost savings are booked at ₹0.00 until time-motion baseline is verified.', c: BRAND_COLORS.accentGreen }
  ];
  steps18.forEach((st, idx) => {
    const x = 0.5 + idx * 3.05;
    s18.addShape('rect', { x, y: 1.15, w: 2.9, h: 2.1, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s18.addShape('rect', { x, y: 1.15, w: 2.9, h: 0.05, fill: { color: st.c.replace('#', '') } });
    s18.addText(`${st.n}  |  ${st.t}`, { x: x + 0.15, y: 1.25, w: 2.6, h: 0.25, fontSize: 8.5, bold: true, color: st.c.replace('#', ''), fontFace });
    s18.addText(st.s, { x: x + 0.15, y: 1.55, w: 2.6, h: 0.45, fontSize: 18, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
    s18.addText(st.d, { x: x + 0.15, y: 2.05, w: 2.6, h: 1.1, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
  });

  s18.addShape('rect', { x: 0.5, y: 3.38, w: 4.35, h: 1.6, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s18.addShape('rect', { x: 0.5, y: 3.38, w: 4.35, h: 0.04, fill: { color: BRAND_COLORS.procucevBlue.replace('#', '') } });
  s18.addText('OPERATIONAL WORKLOAD ELIMINATION', { x: 0.65, y: 3.48, w: 4.0, h: 0.22, fontSize: 9.5, bold: true, color: BRAND_COLORS.procucevBlue.replace('#', ''), fontFace });
  s18.addText('While 824 low-value POs account for <1% of spend, they generate over 25% of commercial buyer inquiries and invoice processing exceptions. Streamlining these releases team bandwidth for strategic negotiation.', {
    x: 0.65, y: 3.75, w: 4.0, h: 1.1, fontSize: 8.5, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace
  });

  const netDirectSavingsStr = isCust ? `₹${contract.netDirectSavingsCr.toFixed(3)} Cr` : '₹78.72 Cr';
  s18.addShape('rect', { x: 5.15, y: 3.38, w: 4.35, h: 1.6, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s18.addShape('rect', { x: 5.15, y: 3.38, w: 4.35, h: 0.04, fill: { color: BRAND_COLORS.accentGreen.replace('#', '') } });
  s18.addText('STRICT CFO FINANCIAL GOVERNANCE', { x: 5.3, y: 3.48, w: 4.0, h: 0.22, fontSize: 9.5, bold: true, color: BRAND_COLORS.accentGreen.replace('#', ''), fontFace });
  s18.addText(`Unlike conventional consulting decks that claim fictitious administrative labor savings, Procucev maintains ₹0.00 direct savings monetization for process productivity. All ${netDirectSavingsStr} direct savings reflect unit price cuts.`, {
    x: 5.3, y: 3.75, w: 4.0, h: 1.1, fontSize: 8.5, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace
  });

  addSlideFooter(s18, clientName, 18, totalSlides);
}
