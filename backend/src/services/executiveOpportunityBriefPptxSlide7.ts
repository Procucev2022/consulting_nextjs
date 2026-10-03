/**
 * Executive Opportunity Brief PPTX Slide 7 (Prompt 286)
 * Strictly adheres to 10-slide executive structure and shared certified contract.
 */

import type PptxGenJS from 'pptxgenjs';
import {
  PPTX_LAYOUT,
  BRAND_COLORS,
  TYPOGRAPHY
} from '../constants/executiveBriefLayoutConstants';
import {
  EXECUTIVE_BRIEF_PRESENTATION_CONTRACT
} from '../constants/executiveBriefPresentationConstants';
import {
  addBriefHeader,
  addBriefFooter
} from './executiveOpportunityBriefPptxHelpers';

export function renderBriefPptxSlide7(pptx: PptxGenJS): void {
  const slide = pptx.addSlide();
  const fontFace = TYPOGRAPHY.fallbackFont;
  addBriefHeader(slide, 'Wave 1 — Immediate Value Capture: Priority Initiatives', 'Immediate Value Capture', 7);

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

  slide.addText('VALIDATED WAVE 1 OPPORTUNITY', {
    x: PPTX_LAYOUT.CONTENT_LEFT + 0.2,
    y: heroY + 0.08,
    w: 3.5,
    h: 0.2,
    fontSize: 9,
    bold: true,
    color: '065F46',
    fontFace
  });
  slide.addText(`Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.validatedSavingsCr.toFixed(2)} Cr`, {
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
    '5 pre-qualified commercial initiatives with technical specification signoff, ready for immediate 90-day execution.',
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

  const initiatives = [
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
      h: 0.22,
      fill: { color: 'F1F5F9' }
    });
    slide.addText(init.t, {
      x: x + 0.1,
      y: iY + 1.36,
      w: iW - 0.2,
      h: 0.2,
      fontSize: 8,
      bold: true,
      align: 'center',
      color: BRAND_COLORS.primaryText.replace('#', ''),
      fontFace
    });
  });

  slide.addText(
    'Validated Wave 1 initiatives provide the first execution pathway from identified opportunity to realized savings.\n' +
    'Detailed initiative ledger: Boardroom & Evidence Edition - Slide 24',
    {
      x: PPTX_LAYOUT.CONTENT_LEFT,
      y: 3.9,
      w: PPTX_LAYOUT.CONTENT_WIDTH,
      h: 0.5,
      fontSize: 8.5,
      color: BRAND_COLORS.secondaryText.replace('#', ''),
      fontFace
    }
  );

  addBriefFooter(slide, 7);
}
