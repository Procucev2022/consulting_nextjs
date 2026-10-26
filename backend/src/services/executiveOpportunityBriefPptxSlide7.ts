/**
 * Executive Opportunity Brief PPTX Slide 7 (Prompt 286 & Prompt 503)
 * Dynamic customer contract binding for Wave 1 priority initiatives.
 */

import type PptxGenJS from 'pptxgenjs';
import {
  PPTX_LAYOUT,
  BRAND_COLORS,
  TYPOGRAPHY
} from '../constants/executiveBriefLayoutConstants';
import {
  getExecutiveBriefPresentationContract,
  isCustomerAssessment
} from '../constants/executiveBriefPresentationConstants';
import {
  addBriefHeader,
  addBriefFooter
} from './executiveOpportunityBriefPptxHelpers';

export function renderBriefPptxSlide7(pptx: PptxGenJS, clientName = 'ABC Textile Ltd'): void {
  const slide = pptx.addSlide();
  const fontFace = TYPOGRAPHY.fallbackFont;
  const contract = getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);

  const headerTitle = isCust
    ? 'Wave 1 — Immediate Value Capture: Proven Priority Initiatives'
    : 'Wave 1 — Immediate Value Capture: Priority Initiatives';
  addBriefHeader(slide, headerTitle, 'Immediate Value Capture', 7);

  const heroY = 1.15;
  slide.addShape('rect', {
    x: PPTX_LAYOUT.CONTENT_LEFT,
    y: heroY,
    w: PPTX_LAYOUT.CONTENT_WIDTH,
    h: 0.75,
    fill: { color: 'ECFDF5' },
    line: { color: BRAND_COLORS.accentGreen.replace('#', ''), width: 1 }
  });
  slide.addShape('rect', {
    x: PPTX_LAYOUT.CONTENT_LEFT,
    y: heroY,
    w: 0.08,
    h: 0.75,
    fill: { color: BRAND_COLORS.accentGreen.replace('#', '') }
  });

  slide.addText('PROVEN WAVE 1 OPPORTUNITY', {
    x: PPTX_LAYOUT.CONTENT_LEFT + 0.2,
    y: heroY + 0.08,
    w: 3.5,
    h: 0.2,
    fontSize: 9,
    bold: true,
    color: '065F46',
    fontFace
  });
  slide.addText(`Rs. ${contract.validatedSavingsCr.toFixed(2)} Cr`, {
    x: PPTX_LAYOUT.CONTENT_LEFT + 0.2,
    y: heroY + 0.28,
    w: 3.5,
    h: 0.38,
    fontSize: 20,
    bold: true,
    color: BRAND_COLORS.accentGreen.replace('#', ''),
    fontFace
  });
  slide.addText(
    isCust
      ? '5 commercially validated initiatives with specification signoff, ready for immediate tender execution.'
      : '5 pre-qualified commercial initiatives with technical specification signoff, ready for immediate 90-day execution.',
    {
      x: PPTX_LAYOUT.CONTENT_LEFT + 3.8,
      y: heroY + 0.2,
      w: 5.0,
      h: 0.45,
      fontSize: 10,
      bold: true,
      color: BRAND_COLORS.primaryText.replace('#', ''),
      fontFace
    }
  );

  const initiatives = isCust
    ? [
        { n: 'Synthetic Fibers', v: 'Rs. 28.50 Cr', c: 'Raw Fibers', l: 'Volume Pooling & OEM Contracts', t: 'Days 1-30' },
        { n: 'Specialty Dyes', v: 'Rs. 22.10 Cr', c: 'Chemicals', l: 'Price Variance Arbitrage', t: 'Days 15-45' },
        { n: 'Packaging & Boxes', v: 'Rs. 14.20 Cr', c: 'Packaging', l: 'Reverse E-Auction Tenders', t: 'Days 30-60' },
        { n: 'Plant MRO Spares', v: 'Rs. 10.30 Cr', c: 'Maintenance', l: 'Consolidated Preferred Panels', t: 'Days 45-75' },
        { n: 'Captive Energy', v: 'Rs. 7.28 Cr', c: 'Energy/Fuel', l: 'Rate Harmonization & Terms', t: 'Days 60-90' }
      ]
    : [
        { n: 'Packaging Bags', v: 'Rs. 14.50 Cr', c: 'Packaging', l: 'E-Auction & Index Linkage', t: 'Days 1-30' },
        { n: 'Grinding Media', v: 'Rs. 11.20 Cr', c: 'Consumables', l: 'Price Variance Arbitrage', t: 'Days 15-45' },
        { n: 'Imported Fuel', v: 'Rs. 9.80 Cr', c: 'Energy', l: 'PCBI Benchmark Index', t: 'Days 30-60' },
        { n: 'Industrial Lubricants', v: 'Rs. 6.40 Cr', c: 'Maintenance', l: 'Volume Pooling & OEM', t: 'Days 45-75' },
        { n: 'Refractory', v: 'Rs. 6.00 Cr', c: 'Raw Materials', l: 'Vendor Panelling', t: 'Days 60-90' }
      ];

  const iW = 1.68;
  const iGap = 0.15;
  const iY = 2.05;

  initiatives.forEach((init, idx) => {
    const x = PPTX_LAYOUT.CONTENT_LEFT + idx * (iW + iGap);
    slide.addShape('rect', {
      x,
      y: iY,
      w: iW,
      h: 1.7,
      fill: { color: BRAND_COLORS.lightCard.replace('#', '') },
      line: { color: BRAND_COLORS.border.replace('#', ''), width: 1 }
    });
    slide.addShape('rect', {
      x,
      y: iY,
      w: iW,
      h: 0.04,
      fill: { color: BRAND_COLORS.accentGreen.replace('#', '') }
    });
    slide.addText(init.n, {
      x: x + 0.1,
      y: iY + 0.1,
      w: iW - 0.2,
      h: 0.3,
      fontSize: 9.5,
      bold: true,
      color: BRAND_COLORS.primaryText.replace('#', ''),
      fontFace
    });
    slide.addText(init.v, {
      x: x + 0.1,
      y: iY + 0.4,
      w: iW - 0.2,
      h: 0.35,
      fontSize: 16,
      bold: true,
      color: BRAND_COLORS.accentGreen.replace('#', ''),
      fontFace
    });
    slide.addText(init.c.toUpperCase(), {
      x: x + 0.1,
      y: iY + 0.75,
      w: iW - 0.2,
      h: 0.2,
      fontSize: 8,
      bold: true,
      color: BRAND_COLORS.procucevBlue.replace('#', ''),
      fontFace
    });
    slide.addText(init.l, {
      x: x + 0.1,
      y: iY + 0.95,
      w: iW - 0.2,
      h: 0.4,
      fontSize: 8,
      color: BRAND_COLORS.secondaryText.replace('#', ''),
      fontFace
    });
    slide.addShape('rect', {
      x: x + 0.1,
      y: iY + 1.35,
      w: iW - 0.2,
      h: 0.25,
      fill: { color: 'F1F5F9' }
    });
    slide.addText(init.t, {
      x: x + 0.15,
      y: iY + 1.37,
      w: iW - 0.3,
      h: 0.22,
      fontSize: 8.5,
      bold: true,
      color: BRAND_COLORS.primaryText.replace('#', ''),
      fontFace
    });
  });

  const bannerY = 3.9;
  slide.addShape('rect', {
    x: PPTX_LAYOUT.CONTENT_LEFT,
    y: bannerY,
    w: PPTX_LAYOUT.CONTENT_WIDTH,
    h: 0.6,
    fill: { color: BRAND_COLORS.lightCard.replace('#', '') },
    line: { color: BRAND_COLORS.border.replace('#', ''), width: 1 }
  });
  slide.addText(
    'Validated Wave 1 initiatives provide the first execution pathway from identified opportunity to realized savings.\n' +
    `Note: Proven Opportunity (Rs. ${contract.validatedSavingsCr.toFixed(2)} Cr) is the immediate execution tranche, distinct from Realized Savings (Rs. ${contract.realizedSavingsCr.toFixed(2)} Cr).`,
    {
      x: PPTX_LAYOUT.CONTENT_LEFT + 0.2,
      y: bannerY + 0.08,
      w: PPTX_LAYOUT.CONTENT_WIDTH - 0.4,
      h: 0.45,
      fontSize: 9,
      color: BRAND_COLORS.secondaryText.replace('#', ''),
      fontFace
    }
  );

  addBriefFooter(slide, 7);
}
