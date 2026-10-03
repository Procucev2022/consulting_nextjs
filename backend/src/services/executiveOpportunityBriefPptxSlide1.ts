/**
 * Executive Opportunity Brief PPTX Slide 1 (Prompt 286)
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
  addBriefFooter,
  getBriefLogoBase64
} from './executiveOpportunityBriefPptxHelpers';

export function renderBriefPptxSlide1(pptx: PptxGenJS, clientName: string): void {
  const slide = pptx.addSlide();
  const fontFace = TYPOGRAPHY.fallbackFont;

  const logoData = getBriefLogoBase64();
  if (logoData) {
    slide.addImage({
      data: logoData,
      x: PPTX_LAYOUT.LOGO_X,
      y: PPTX_LAYOUT.LOGO_Y,
      w: PPTX_LAYOUT.LOGO_W,
      h: PPTX_LAYOUT.LOGO_H
    });
  }

  slide.addText('aiCEV by Procucev', {
    x: PPTX_LAYOUT.CONTENT_LEFT,
    y: 0.35,
    w: 4.0,
    h: 0.25,
    fontSize: 10,
    bold: true,
    color: BRAND_COLORS.procucevBlue.replace('#', ''),
    fontFace
  });

  slide.addText('Procurement Value Opportunity Brief', {
    x: PPTX_LAYOUT.CONTENT_LEFT,
    y: 0.6,
    w: 7.5,
    h: 0.45,
    fontSize: 24,
    bold: true,
    color: BRAND_COLORS.primaryText.replace('#', ''),
    fontFace
  });

  slide.addText(`${clientName} | CFO / CEO Discussion Edition`, {
    x: PPTX_LAYOUT.CONTENT_LEFT,
    y: 1.05,
    w: 7.5,
    h: 0.25,
    fontSize: 11,
    color: BRAND_COLORS.secondaryText.replace('#', ''),
    fontFace
  });

  // Hero Card
  const heroY = 1.4;
  slide.addShape('rect', {
    x: PPTX_LAYOUT.CONTENT_LEFT,
    y: heroY,
    w: 4.4,
    h: 3.2,
    fill: { color: BRAND_COLORS.lightCard.replace('#', '') },
    line: { color: BRAND_COLORS.border.replace('#', ''), width: 1 }
  });
  slide.addShape('rect', {
    x: PPTX_LAYOUT.CONTENT_LEFT,
    y: heroY,
    w: 0.08,
    h: 3.2,
    fill: { color: BRAND_COLORS.accentGreen.replace('#', '') }
  });

  slide.addText('PRIMARY VALUE THESIS', {
    x: PPTX_LAYOUT.CONTENT_LEFT + 0.25,
    y: heroY + 0.25,
    w: 3.8,
    h: 0.25,
    fontSize: 10,
    bold: true,
    color: BRAND_COLORS.secondaryText.replace('#', ''),
    fontFace
  });

  slide.addText(`Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.netDirectSavingsCr.toFixed(2)} Cr`, {
    x: PPTX_LAYOUT.CONTENT_LEFT + 0.25,
    y: heroY + 0.6,
    w: 3.8,
    h: 0.7,
    fontSize: 34,
    bold: true,
    color: BRAND_COLORS.accentGreen.replace('#', ''),
    fontFace
  });

  slide.addText('Direct Savings Opportunity', {
    x: PPTX_LAYOUT.CONTENT_LEFT + 0.25,
    y: heroY + 1.35,
    w: 3.8,
    h: 0.3,
    fontSize: 16,
    bold: true,
    color: BRAND_COLORS.primaryText.replace('#', ''),
    fontFace
  });

  slide.addText(
    'Defensible P&L cost reduction across rate harmonization, volume pooling, and strategic tenders. ' +
    'Reconciled with 0 variance against 31,671 invoice transactions.',
    {
      x: PPTX_LAYOUT.CONTENT_LEFT + 0.25,
      y: heroY + 1.7,
      w: 3.8,
      h: 0.8,
      fontSize: 10.5,
      color: BRAND_COLORS.secondaryText.replace('#', ''),
      fontFace
    }
  );

  // Secondary Cards
  const cardsX = 5.1;
  const cardW = 4.4;
  const metrics = [
    {
      l: 'NET DEFENSIBLE PIPELINE',
      v: `Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.netDefensiblePipelineCr.toFixed(2)} Cr`,
      s: 'Direct Savings + Strategic Market Value',
      c: BRAND_COLORS.procucevBlue
    },
    {
      l: 'STRATEGIC MARKET VALUE',
      v: `Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.strategicMarketValueCr.toFixed(2)} Cr`,
      s: 'Commodity Timing & Index Contracting Levers',
      c: '#0284C7'
    },
    {
      l: 'TOTAL SPEND EVALUATED',
      v: `Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.totalCustomerSpendCr.toLocaleString('en-IN', {
        minimumFractionDigits: 2
      })} Cr`,
      s: `${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.baselineTransactions.toLocaleString()} Invoiced Records | 24 Months`,
      c: BRAND_COLORS.primaryText
    }
  ];

  metrics.forEach((m, idx) => {
    const cy = heroY + idx * 1.1;
    slide.addShape('rect', {
      x: cardsX,
      y: cy,
      w: cardW,
      h: 0.98,
      fill: { color: BRAND_COLORS.lightCard.replace('#', '') },
      line: { color: BRAND_COLORS.border.replace('#', ''), width: 1 }
    });
    slide.addShape('rect', {
      x: cardsX,
      y: cy,
      w: 0.06,
      h: 0.98,
      fill: { color: m.c.replace('#', '') }
    });
    slide.addText(m.l, {
      x: cardsX + 0.2,
      y: cy + 0.1,
      w: cardW - 0.3,
      h: 0.2,
      fontSize: 8.5,
      bold: true,
      color: BRAND_COLORS.secondaryText.replace('#', ''),
      fontFace
    });
    slide.addText(m.v, {
      x: cardsX + 0.2,
      y: cy + 0.32,
      w: cardW - 0.3,
      h: 0.38,
      fontSize: 20,
      bold: true,
      color: m.c.replace('#', ''),
      fontFace
    });
    slide.addText(m.s, {
      x: cardsX + 0.2,
      y: cy + 0.72,
      w: cardW - 0.3,
      h: 0.2,
      fontSize: 9,
      color: BRAND_COLORS.secondaryText.replace('#', ''),
      fontFace
    });
  });

  addBriefFooter(slide, 1);
}
