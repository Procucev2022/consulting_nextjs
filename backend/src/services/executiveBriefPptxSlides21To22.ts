/**
 * Executive Brief PPTX Slides 21 to 22 (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Benchmarks and Formula Contracting
 */

import type PptxGenJS from 'pptxgenjs';
import { BRAND_COLORS, TYPOGRAPHY } from '../constants/executiveBriefLayoutConstants';
import { addSlideHeader, addSlideFooter } from './executiveBriefPptxHelpers';
import {
  getExecutiveBriefPresentationContract,
  isCustomerAssessment,
  formatPresentationValues
} from '../constants/executiveBriefPresentationConstants';

export function renderPptxSlide21(
  pptx: PptxGenJS,
  clientName: string,
  totalSlides: number
): void {
  const fontFace = TYPOGRAPHY.fallbackFont;
  const contract = getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);
  const fmt = formatPresentationValues(contract, isCust);

  const s21 = pptx.addSlide();
  s21.background = { color: BRAND_COLORS.canvas.replace('#', '') };

  if (isCust) {
    addSlideHeader(s21, 'PCBI Benchmark Findings: Benchmark Availability Status', 'Market Benchmarks', 21);

    const items = [
      {
        n: 'BENCHMARK STATUS',
        r: 'PCBI Benchmark Price Gap: UNAVAILABLE',
        d: 'External Indices Not Configured',
        o: 'Zero External Speculation',
        desc: `External PCBI benchmark indices are not configured for ${clientName}. In accordance with data governance policies, all opportunity modeling is derived strictly from verified internal ERP records.`,
        c: BRAND_COLORS.secondaryText
      },
      {
        n: 'INTERNAL PRICE DISPERSION',
        r: `${fmt.provenOpportunityFormatted} Proven Opportunity`,
        d: '100% Transactional Proof',
        o: 'Direct ERP Line-Item Evidence',
        desc: `Opportunity is established directly through internal unit rate dispersion across suppliers and operating entities within ${clientName}'s actual purchase history across 23,570 line items.`,
        c: BRAND_COLORS.procucevBlue
      },
      {
        n: 'FORENSIC AUDIT INTEGRITY',
        r: `Realized Savings: ${fmt.realizedSavingsFormatted}`,
        d: 'Audited P&L Realization Only',
        o: 'Zero Fictitious Savings',
        desc: 'No synthetic market indices or speculative price shifts are applied. Realized savings remain strictly ₹0.00 Cr until post-negotiation contract pricing is verified against invoices.',
        c: BRAND_COLORS.accentGreen
      }
    ];

    items.forEach((it, idx) => {
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
    s21.addText(`SAVINGS MODEL GOVERNANCE: Opportunity calculation is 100% self-contained within audited ERP transactional data. Net Modelled Opportunity: ${fmt.netDirectSavingsFormatted} | Proven Opportunity: ${fmt.provenOpportunityFormatted} | Realized Savings: ${fmt.realizedSavingsFormatted}.`, {
      x: 0.65, y: 4.45, w: 8.7, h: 0.55, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
    });
  } else {
    addSlideHeader(s21, 'PCBI Benchmark Findings: Customer Purchase Rate vs Market Indices', 'Market Benchmarks', 21);

    const items = [
      { n: 'Imported Petcoke (6.5% S)', r: 'Customer: ₹14,200/MT  |  PCBI: ₹13,400/MT', d: '+5.9% Over PCBI Index', o: '₹9.80 Cr Strategic Timing', desc: 'Locked in during a temporary spike. Transitioning to monthly index-linked pricing captures prevailing market declines.', c: BRAND_COLORS.accentAmber },
      { n: 'Domestic Thermal Coal (G11)', r: 'Customer: ₹8,650/MT  |  PCBI: ₹8,200/MT', d: '+5.5% Over PCBI Index', o: '₹3.62 Cr Contract Reset', desc: 'Plant spot coal buying carries distribution intermediary premiums. Bilateral linkage eliminates trader markups.', c: BRAND_COLORS.procucevBlue },
      { n: 'PP Granules (Packaging)', r: 'Customer: ₹98.50/kg  |  PCBI: ₹94.00/kg', d: '+4.8% Over PCBI Index', o: '₹1.46 Cr Formula Linkage', desc: 'Converter pricing lags raw polymer falls by 60-90 days. Transparent formula contracts enforce instant pass-through.', c: BRAND_COLORS.accentGreen }
    ];

    items.forEach((it, idx) => {
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
  }

  addSlideFooter(s21, clientName, 21, totalSlides);
}

export function renderPptxSlide22(
  pptx: PptxGenJS,
  clientName: string,
  totalSlides: number
): void {
  const fontFace = TYPOGRAPHY.fallbackFont;
  const isCust = isCustomerAssessment(clientName);

  const s22 = pptx.addSlide();
  s22.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s22, 'Benchmark-Guided Sourcing Interventions & Index Contract Formulas', 'Index Contracting', 22);

  const formulas = isCust
    ? [
        {
          t: 'RAW FIBER & YARN FORMULA',
          sub: 'Synthetic & Natural Fibers (₹78.20 Cr)',
          f: 'P_net = P_base * [0.65 * (Idx_Fiber / Idx0) + 0.35 * (CPI / CPI0)]',
          d: 'Links raw fiber and synthetic yarn purchases directly to published benchmark indices with transparent formula pass-through.',
          b: 'Disciplined Cost Pass-Through',
          c: BRAND_COLORS.procucevBlue
        },
        {
          t: 'PACKAGING MATERIALS FORMULA',
          sub: 'Polymer Bags & Corrugated (₹42.85 Cr)',
          f: 'P_pack = Raw_Polymer * (Idx_Poly / Base_Poly) + Conv_Fee',
          d: 'Converter processing fees are frozen and audited; raw polymer tracks published resin indices to capture price downturns.',
          b: 'Removes Converter Margin Drift',
          c: BRAND_COLORS.accentGreen
        },
        {
          t: 'FREIGHT DIESEL ESCALATION',
          sub: 'Inbound & Outbound Transport (₹38.60 Cr)',
          f: 'Rate_t = Base_Rate * [1 + 0.30 * (Diesel_t - D0) / D0]',
          d: 'Standardized fuel escalation formula prevents unverified freight surcharge inflation during diesel price swings.',
          b: 'Eliminates Freight Surcharges',
          c: '#0284C7'
        }
      ]
    : [
        {
          t: 'PETCOKE & COAL FUEL FORMULA',
          sub: 'Imported Fuel Procurement (₹1,480 Cr)',
          f: 'P_net = P_base * [0.70 * (Idx / Idx0) + 0.30 * (FX / FX0)]',
          d: 'Links landed plant fuel cost directly to international Argus/Platts index benchmarks and RBI USD/INR reference rates. Eliminates importer speculative trading spread.',
          b: 'Captures ₹9.80 Cr Market Realignment',
          c: BRAND_COLORS.procucevBlue
        },
        {
          t: 'PP PACKAGING GRANULE FORMULA',
          sub: 'HDPE & PP Cement Sacks (₹947 Cr)',
          f: 'P_bag = Raw_Polymer * (Platts_PP / Base_PP) + Conv_Fee',
          d: 'Converter manufacturing fee is frozen and audited; raw polymer cost tracks Platts PP index on a 30-day lagged average. Removes converter margin inflation during resin downturns.',
          b: 'Secures ₹14.50 Cr E-Auction Lock-In',
          c: BRAND_COLORS.accentGreen
        },
        {
          t: 'FREIGHT DIESEL ESCALATION FACTOR',
          sub: 'Secondary Logistics & Road Freight (₹828 Cr)',
          f: 'Rate_t = Base_Rate * [1 + 0.35 * (Diesel_t - D0) / D0]',
          d: 'Standardized 35% fuel pass-through weight based on heavy commercial vehicle consumption metrics. Stops arbitrary carrier rate hike surcharges during diesel volatility.',
          b: 'Eliminates ₹4.80 Cr Rate Leakage',
          c: '#0284C7'
        }
      ];

  formulas.forEach((fm, idx) => {
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
  s22.addText(`INDEX CONTRACTING GOVERNANCE: Formula-linked indexing protects both ${clientName} and suppliers against unexpected commodity spikes while automatically capturing down-cycle cost reductions without contentious adversarial re-negotiations.`, {
    x: 0.65, y: 4.45, w: 8.7, h: 0.55, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
  });
  addSlideFooter(s22, clientName, 22, totalSlides);
}
