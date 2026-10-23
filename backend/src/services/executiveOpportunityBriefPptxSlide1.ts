/**
 * Executive Opportunity Brief PPTX Slide 1 (Prompt 286 & Prompt 503)
 * Dynamic customer contract binding and metadata alignment.
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
  addBriefFooter,
  getBriefLogoBase64
} from './executiveOpportunityBriefPptxHelpers';

export function renderBriefPptxSlide1(pptx: PptxGenJS, clientName = 'ABC Textile Ltd'): void {
  const slide = pptx.addSlide();
  const fontFace = TYPOGRAPHY.fallbackFont;
  const contract = getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);

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

  const subEdition = isCust
    ? `${clientName} | CFO / CEO Discussion Edition [AIC-2026-0002]`
    : `${clientName} | Demonstration Archetype Edition`;
  slide.addText(subEdition, {
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

  slide.addText(`Rs. ${contract.netDirectSavingsCr.toFixed(2)} Cr`, {
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
    `Reconciled with 0 variance against ${contract.baselineTransactions.toLocaleString()} invoice transactions.`,
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
      v: `Rs. ${contract.netDefensiblePipelineCr.toFixed(2)} Cr`,
      s: 'Direct Savings + Strategic Market Value',
      c: BRAND_COLORS.procucevBlue
    },
    {
      l: 'STRATEGIC MARKET VALUE',
      v: `Rs. ${contract.strategicMarketValueCr.toFixed(2)} Cr`,
      s: isCust ? 'PCBI Price Gap UNAVAILABLE (Isolated)' : 'Commodity Timing & Index Contracting Levers',
      c: '#0284C7'
    },
    {
      l: 'TOTAL SPEND EVALUATED',
      v: `Rs. ${contract.totalCustomerSpendCr.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4
      })} Cr`,
      s: `${contract.baselineTransactions.toLocaleString()} Invoiced Records | ${contract.analysisPeriodMonths} Months`,
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
      w: cardW - 0.4,
      h: 0.25,
      fontSize: 9,
      bold: true,
      color: BRAND_COLORS.secondaryText.replace('#', ''),
      fontFace
    });
    slide.addText(m.v, {
      x: cardsX + 0.2,
      y: cy + 0.35,
      w: cardW - 0.4,
      h: 0.35,
      fontSize: 20,
      bold: true,
      color: m.c.replace('#', ''),
      fontFace
    });
    slide.addText(m.s, {
      x: cardsX + 0.2,
      y: cy + 0.68,
      w: cardW - 0.4,
      h: 0.25,
      fontSize: 9,
      color: BRAND_COLORS.secondaryText.replace('#', ''),
      fontFace
    });
  });

  slide.addShape('rect', {
    x: PPTX_LAYOUT.CONTENT_LEFT,
    y: 4.65,
    w: PPTX_LAYOUT.CONTENT_WIDTH,
    h: 0.4,
    fill: { color: 'EFF6FF' },
    line: { color: 'BFDBFE', width: 1 }
  });
  slide.addText(
    `"${contract.analysisPeriodMonths} months of transaction-level procurement analysis translated into an approved defensible value pipeline."`,
    {
      x: PPTX_LAYOUT.CONTENT_LEFT,
      y: 4.7,
      w: PPTX_LAYOUT.CONTENT_WIDTH,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: BRAND_COLORS.procucevBlue.replace('#', ''),
      align: 'center',
      fontFace
    }
  );

  addBriefFooter(slide, 1);
}
