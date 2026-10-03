/**
 * Executive Opportunity Brief PPTX Slides 2 to 3 (Prompt 286)
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

export function renderBriefPptxSlide2(pptx: PptxGenJS): void {
  const slide = pptx.addSlide();
  const fontFace = TYPOGRAPHY.fallbackFont;
  addBriefHeader(slide, 'What the Procurement Data Tells Us', 'Diagnostic Insights', 2);

  const insightCards = [
    { l: 'SPEND CONCENTRATION', v: '81.4%', d: 'Spend concentrated in top 10% of suppliers', c: '#1769E0' },
    { l: 'PRICE DISPERSION', v: '18.5%', d: 'Inter-plant price variance on repeat SKUs', c: '#F2A900' },
    { l: 'CONTRACTING GAP', v: '42.6%', d: 'Spot / non-contracted purchases across plants', c: '#F2A900' },
    { l: 'SUPPLIER BASE', v: '912', d: 'Tail suppliers accounting for 4.8% spend', c: '#64748B' },
    {
      l: 'DEFENSIBLE VALUE',
      v: `Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.netDefensiblePipelineCr.toFixed(2)} Cr`,
      d: 'Net defensible pipeline post-overlap & policy deduction',
      c: '#17A673'
    }
  ];

  const cardW = 1.68;
  const gap = 0.15;
  insightCards.forEach((c, idx) => {
    const x = PPTX_LAYOUT.CONTENT_LEFT + idx * (cardW + gap);
    slide.addShape('rect', {
      x,
      y: 1.15,
      w: cardW,
      h: 2.3,
      fill: { color: BRAND_COLORS.lightCard.replace('#', '') },
      line: { color: BRAND_COLORS.border.replace('#', ''), width: 1 }
    });
    slide.addShape('rect', {
      x,
      y: 1.15,
      w: cardW,
      h: 0.05,
      fill: { color: c.c.replace('#', '') }
    });
    slide.addText(c.l, {
      x: x + 0.12,
      y: 1.3,
      w: cardW - 0.24,
      h: 0.35,
      fontSize: 8.5,
      bold: true,
      color: BRAND_COLORS.secondaryText.replace('#', ''),
      fontFace
    });
    slide.addText(c.v, {
      x: x + 0.12,
      y: 1.75,
      w: cardW - 0.24,
      h: 0.45,
      fontSize: 20,
      bold: true,
      color: c.c.replace('#', ''),
      fontFace
    });
    slide.addText(c.d, {
      x: x + 0.12,
      y: 2.3,
      w: cardW - 0.24,
      h: 1.0,
      fontSize: 9.5,
      color: BRAND_COLORS.secondaryText.replace('#', ''),
      fontFace
    });
  });

  const bannerY = 3.65;
  slide.addShape('rect', {
    x: PPTX_LAYOUT.CONTENT_LEFT,
    y: bannerY,
    w: PPTX_LAYOUT.CONTENT_WIDTH,
    h: 0.8,
    fill: { color: BRAND_COLORS.lightCard.replace('#', '') },
    line: { color: BRAND_COLORS.border.replace('#', ''), width: 1 }
  });
  slide.addShape('rect', {
    x: PPTX_LAYOUT.CONTENT_LEFT,
    y: bannerY,
    w: 0.06,
    h: 0.8,
    fill: { color: BRAND_COLORS.procucevBlue.replace('#', '') }
  });
  slide.addText(
    'Value is concentrated in price harmonization, supplier consolidation, strategic sourcing and benchmark-led market alignment.\n' +
    'Evaluated across 26 manufacturing plants and 256 material groups over 24 months of invoiced ledger history.',
    {
      x: PPTX_LAYOUT.CONTENT_LEFT + 0.2,
      y: bannerY + 0.12,
      w: PPTX_LAYOUT.CONTENT_WIDTH - 0.4,
      h: 0.55,
      fontSize: 10,
      bold: true,
      color: BRAND_COLORS.primaryText.replace('#', ''),
      fontFace
    }
  );

  slide.addText('Detailed evidence: Boardroom & Evidence Edition - Slides 7-10', {
    x: PPTX_LAYOUT.CONTENT_LEFT,
    y: 4.6,
    w: 6.0,
    h: 0.25,
    fontSize: 9,
    italic: true,
    color: BRAND_COLORS.secondaryText.replace('#', ''),
    fontFace
  });

  addBriefFooter(slide, 2);
}

export function renderBriefPptxSlide3(pptx: PptxGenJS): void {
  const slide = pptx.addSlide();
  const fontFace = TYPOGRAPHY.fallbackFont;
  addBriefHeader(slide, 'WHERE THE OPPORTUNITY IS CONCENTRATED', 'Value Landscape', 3);

  const levers = [
    { name: 'Direct Price Improvement', opp: 'Rs. 42.80 Cr', w: 3.6 },
    { name: 'E-Auction Dynamic Bidding', opp: 'Rs. 31.50 Cr', w: 2.65 },
    { name: 'Vendor Base Consolidation *', opp: 'Rs. 26.40 Cr', w: 2.2 },
    { name: 'Volume Aggregation', opp: 'Rs. 22.10 Cr', w: 1.85 },
    { name: 'Payment Terms Optimization', opp: 'Rs. 14.20 Cr', w: 1.2 },
    { name: 'Category Specialization', opp: 'Rs. 11.80 Cr', w: 1.0 },
    { name: 'Logistics & Packaging Specs', opp: 'Rs. 9.60 Cr', w: 0.8 },
    { name: 'Specification Rationalization', opp: 'Rs. 6.30 Cr', w: 0.53 },
    { name: 'Contract Compliance Audit', opp: 'Rs. 4.80 Cr', w: 0.4 },
    { name: 'PCBI Market Index Contracting', opp: 'Rs. 3.62 Cr', w: 0.3 }
  ];

  const startY = 1.05;
  const barH = 0.23;
  const rowGap = 0.08;

  levers.forEach((lev, idx) => {
    const y = startY + idx * (barH + rowGap);
    slide.addText(lev.name, {
      x: PPTX_LAYOUT.CONTENT_LEFT,
      y,
      w: 2.2,
      h: barH,
      fontSize: 8.5,
      bold: true,
      color: BRAND_COLORS.primaryText.replace('#', ''),
      fontFace
    });
    slide.addShape('rect', {
      x: 2.7,
      y: y + 0.04,
      w: 3.6,
      h: barH - 0.08,
      fill: { color: 'F1F5F9' },
      line: { color: BRAND_COLORS.border.replace('#', ''), width: 0.5 }
    });
    slide.addShape('rect', {
      x: 2.7,
      y: y + 0.04,
      w: lev.w,
      h: barH - 0.08,
      fill: { color: BRAND_COLORS.procucevBlue.replace('#', '') }
    });
    slide.addText(lev.opp, {
      x: 6.4,
      y,
      w: 1.1,
      h: barH,
      fontSize: 8.5,
      bold: true,
      color: BRAND_COLORS.primaryText.replace('#', ''),
      fontFace
    });
  });

  const calloutX = 7.6;
  const calloutY = 1.05;
  const calloutW = 2.15;
  const calloutH = 3.0;
  slide.addShape('rect', {
    x: calloutX,
    y: calloutY,
    w: calloutW,
    h: calloutH,
    fill: { color: BRAND_COLORS.lightCard.replace('#', '') },
    line: { color: BRAND_COLORS.procucevBlue.replace('#', ''), width: 1.5 }
  });
  slide.addText('GROSS IDENTIFIED\nOPPORTUNITY', {
    x: calloutX + 0.12,
    y: calloutY + 0.15,
    w: calloutW - 0.24,
    h: 0.45,
    fontSize: 9,
    bold: true,
    color: BRAND_COLORS.secondaryText.replace('#', ''),
    fontFace
  });
  slide.addText(`Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.grossOpportunityCr.toFixed(2)} Cr`, {
    x: calloutX + 0.12,
    y: calloutY + 0.65,
    w: calloutW - 0.24,
    h: 0.5,
    fontSize: 18,
    bold: true,
    color: BRAND_COLORS.procucevBlue.replace('#', ''),
    fontFace
  });
  slide.addText(
    'Individual opportunities are assessed independently and deduplicated before establishing the net defensible pipeline.',
    {
      x: calloutX + 0.12,
      y: calloutY + 1.25,
      w: calloutW - 0.24,
      h: 1.5,
      fontSize: 8.5,
      color: BRAND_COLORS.secondaryText.replace('#', ''),
      fontFace
    }
  );

  slide.addText(
    'Individual opportunities are deduplicated before the defensible pipeline is established. ' +
    '* Indicative 5% vendor consolidation assumption.\n' +
    'Detailed sourcing evidence: Boardroom & Evidence Edition - Slides 9, 14-19',
    {
      x: PPTX_LAYOUT.CONTENT_LEFT,
      y: 4.3,
      w: PPTX_LAYOUT.CONTENT_WIDTH,
      h: 0.45,
      fontSize: 8.5,
      color: BRAND_COLORS.secondaryText.replace('#', ''),
      fontFace
    }
  );

  addBriefFooter(slide, 3);
}
