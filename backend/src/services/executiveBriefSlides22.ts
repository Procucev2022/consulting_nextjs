/**
 * Executive Brief Slide 22 - Index Contracting (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strict 10 x 5.625 inch grid, Aptos typography, 3 formula cards, indexing governance.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  PDF_LAYOUT,
  BRAND_COLORS
} from '../constants/executiveBriefPresentationConstants';

export function renderSlide22IndexContracting(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader(
    'Benchmark-Guided Sourcing Interventions & Index Contract Formulas',
    'Index Contracting',
    p
  );

  // 3 Clean Formula Cards
  const cardW = 276;
  const cardH = 300;
  const startY = 104;

  const formulas = [
    {
      title: 'PETCOKE & COAL FUEL FORMULA',
      target: 'Imported Fuel Procurement (₹1,480 Cr)',
      formula: 'P_net = P_base * [0.70 * (Idx / Idx0) + 0.30 * (FX / FX0)]',
      desc: 'Links landed plant fuel cost directly to international Argus/Platts benchmarks and RBI FX rates. ' +
            'Eliminates importer speculative trading spread.',
      benefit: 'Captures ₹9.80 Cr Market Realignment',
      color: BRAND_COLORS.procucevBlue
    },
    {
      title: 'PP PACKAGING GRANULE FORMULA',
      target: 'HDPE & PP Cement Sacks (₹947 Cr)',
      formula: 'P_bag = Raw_Polymer * (Platts_PP / Base_PP) + Conv_Fee',
      desc: 'Converter manufacturing fee is frozen and audited; raw polymer cost tracks Platts PP index on 30-day ' +
            'lagged average, removing margin inflation.',
      benefit: 'Secures ₹14.50 Cr E-Auction Lock-In',
      color: BRAND_COLORS.accentGreen
    },
    {
      title: 'FREIGHT DIESEL ESCALATION FACTOR',
      target: 'Secondary Logistics & Road Freight (₹828 Cr)',
      formula: 'Rate_t = Base_Rate * [1 + 0.35 * (Diesel_t - D0) / D0]',
      desc: 'Standardized 35% fuel pass-through weight based on commercial vehicle metrics. ' +
            'Stops arbitrary carrier rate hike surcharges during diesel shifts.',
      benefit: 'Eliminates ₹4.80 Cr Rate Leakage',
      color: '#0284C7'
    }
  ];

  formulas.forEach((fm, idx) => {
    const x = PDF_LAYOUT.CONTENT_LEFT + idx * (cardW + 18);
    canvas.rect(x, startY, cardW, cardH, {
      fill: BRAND_COLORS.lightCard,
      stroke: BRAND_COLORS.border,
      lineWidth: 1
    });
    canvas.rect(x, startY, cardW, 4, { fill: fm.color });

    canvas.text(fm.title, x + 16, startY + 28, { fontSize: 9.5, font: 'bold', color: BRAND_COLORS.primaryText });
    canvas.text(fm.target, x + 16, startY + 44, { fontSize: 8, color: BRAND_COLORS.secondaryText });

    // Formula Box
    const fBoxY = startY + 62;
    canvas.rect(x + 16, fBoxY, cardW - 32, 54, {
      fill: BRAND_COLORS.canvas,
      stroke: BRAND_COLORS.border,
      lineWidth: 0.5
    });
    canvas.text('INDEX CONTRACT FORMULA:', x + 24, fBoxY + 18, { fontSize: 7.5, font: 'bold', color: fm.color });
    canvas.textBlock(fm.formula, x + 24, fBoxY + 34, cardW - 48, {
      fontSize: 8.5,
      font: 'bold',
      color: BRAND_COLORS.primaryText,
      lineHeight: 11
    });

    canvas.textBlock(fm.desc, x + 16, startY + 130, cardW - 32, {
      fontSize: 9,
      color: BRAND_COLORS.primaryText,
      lineHeight: 14
    });

    canvas.rect(x + 16, startY + 242, cardW - 32, 38, {
      fill: '#EFF6FF',
      stroke: BRAND_COLORS.procucevBlue,
      lineWidth: 0.5
    });
    canvas.text(fm.benefit, x + 24, startY + 266, { fontSize: 9.5, font: 'bold', color: BRAND_COLORS.procucevBlue });
  });

  // Bottom Takeaway Banner
  const banY = 422;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, banY, PDF_LAYOUT.CONTENT_WIDTH, 68, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.text('INDEX CONTRACTING GOVERNANCE', PDF_LAYOUT.CONTENT_LEFT + 20, banY + 22, {
    fontSize: 9,
    font: 'bold',
    color: BRAND_COLORS.procucevBlue
  });
  canvas.textBlock(
    'Formula-linked indexing protects both UltraTech and suppliers against unexpected commodity spikes while ' +
    'automatically capturing down-cycle cost reductions without contentious adversarial re-negotiations.',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    banY + 40,
    PDF_LAYOUT.CONTENT_WIDTH - 40,
    { fontSize: 10, color: BRAND_COLORS.secondaryText, lineHeight: 15 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}
