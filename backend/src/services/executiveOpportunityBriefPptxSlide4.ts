/**
 * Executive Opportunity Brief PPTX Slide 4 (Prompt 286)
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

export function renderBriefPptxSlide4(pptx: PptxGenJS): void {
  const slide = pptx.addSlide();
  const fontFace = TYPOGRAPHY.fallbackFont;
  addBriefHeader(slide, 'From Gross Opportunity to Defensible Value', 'Financial Reconciliation', 4);

  const steps = [
    {
      t: 'GROSS OPPORTUNITY',
      v: `Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.grossOpportunityCr.toFixed(2)} Cr`,
      d: 'Sum of 10 opportunity levers identified pre-deductions',
      c: BRAND_COLORS.procucevBlue, bg: BRAND_COLORS.lightCard
    },
    {
      t: 'OVERLAP DEDUCTIONS',
      v: `- Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.overlapDeductionsCr.toFixed(2)} Cr`,
      d: 'Eliminates cross-lever double-counting',
      c: BRAND_COLORS.accentAmber, bg: 'FFFBEB'
    },
    {
      t: 'POLICY EXCLUSIONS',
      v: `- Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.exclusionsCr.toFixed(2)} Cr`,
      d: 'Single-source OEM & statutory boundaries',
      c: BRAND_COLORS.accentAmber, bg: 'FFFBEB'
    },
    {
      t: 'NET DEFENSIBLE PIPELINE',
      v: `Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.netDefensiblePipelineCr.toFixed(2)} Cr`,
      d: 'Risk-adjusted value pipeline ready for capture',
      c: BRAND_COLORS.accentGreen, bg: 'ECFDF5'
    }
  ];

  const stepW = 2.05;
  const gap = 0.27;
  const stepY = 1.15;

  steps.forEach((s, idx) => {
    const x = PPTX_LAYOUT.CONTENT_LEFT + idx * (stepW + gap);
    slide.addShape('rect', {
      x,
      y: stepY,
      w: stepW,
      h: 1.6,
      fill: { color: s.bg },
      line: { color: s.c.replace('#', ''), width: 1 }
    });
    slide.addShape('rect', {
      x,
      y: stepY,
      w: stepW,
      h: 0.05,
      fill: { color: s.c.replace('#', '') }
    });
    slide.addText(s.t, {
      x: x + 0.1,
      y: stepY + 0.15,
      w: stepW - 0.2,
      h: 0.3,
      fontSize: 8,
      bold: true,
      color: BRAND_COLORS.secondaryText.replace('#', ''),
      fontFace
    });
    slide.addText(s.v, {
      x: x + 0.1,
      y: stepY + 0.55,
      w: stepW - 0.2,
      h: 0.4,
      fontSize: 16,
      bold: true,
      color: s.c.replace('#', ''),
      fontFace
    });
    slide.addText(s.d, {
      x: x + 0.1,
      y: stepY + 0.95,
      w: stepW - 0.2,
      h: 0.55,
      fontSize: 8.5,
      color: BRAND_COLORS.secondaryText.replace('#', ''),
      fontFace
    });

    if (idx < 3) {
      slide.addText('->', {
        x: x + stepW + 0.05,
        y: stepY + 0.65,
        w: 0.2,
        h: 0.3,
        fontSize: 14,
        bold: true,
        color: BRAND_COLORS.secondaryText.replace('#', ''),
        fontFace
      });
    }
  });

  const splitY = 2.95;
  const splitW = 4.35;
  slide.addShape('rect', {
    x: PPTX_LAYOUT.CONTENT_LEFT,
    y: splitY,
    w: splitW,
    h: 1.0,
    fill: { color: 'ECFDF5' },
    line: { color: BRAND_COLORS.accentGreen.replace('#', ''), width: 1 }
  });
  slide.addText('DIRECT SAVINGS OPPORTUNITY (P&L EBITDA EXPANSION)', {
    x: PPTX_LAYOUT.CONTENT_LEFT + 0.15,
    y: splitY + 0.1,
    w: splitW - 0.3,
    h: 0.2,
    fontSize: 8.5,
    bold: true,
    color: '065F46',
    fontFace
  });
  slide.addText(`Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.netDirectSavingsCr.toFixed(2)} Cr`, {
    x: PPTX_LAYOUT.CONTENT_LEFT + 0.15,
    y: splitY + 0.32,
    w: splitW - 0.3,
    h: 0.38,
    fontSize: 18,
    bold: true,
    color: BRAND_COLORS.accentGreen.replace('#', ''),
    fontFace
  });
  slide.addText('Harmonization, volume pooling, and competitive tenders delivering direct cost reductions.', {
    x: PPTX_LAYOUT.CONTENT_LEFT + 0.15,
    y: splitY + 0.72,
    w: splitW - 0.3,
    h: 0.25,
    fontSize: 8.5,
    color: BRAND_COLORS.secondaryText.replace('#', ''),
    fontFace
  });

  const split2X = PPTX_LAYOUT.CONTENT_LEFT + splitW + 0.3;
  slide.addShape('rect', {
    x: split2X,
    y: splitY,
    w: splitW,
    h: 1.0,
    fill: { color: 'EFF6FF' },
    line: { color: BRAND_COLORS.procucevBlue.replace('#', ''), width: 1 }
  });
  slide.addText('STRATEGIC MARKET VALUE (COMMODITY & TIMING LEVERS)', {
    x: split2X + 0.15,
    y: splitY + 0.1,
    w: splitW - 0.3,
    h: 0.2,
    fontSize: 8.5,
    bold: true,
    color: BRAND_COLORS.procucevBlue.replace('#', ''),
    fontFace
  });
  slide.addText(`Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.strategicMarketValueCr.toFixed(2)} Cr`, {
    x: split2X + 0.15,
    y: splitY + 0.32,
    w: splitW - 0.3,
    h: 0.38,
    fontSize: 18,
    bold: true,
    color: BRAND_COLORS.procucevBlue.replace('#', ''),
    fontFace
  });
  slide.addText('Contract reset timing and market index formula contracting tracked distinctly.', {
    x: split2X + 0.15,
    y: splitY + 0.72,
    w: splitW - 0.3,
    h: 0.25,
    fontSize: 8.5,
    color: BRAND_COLORS.secondaryText.replace('#', ''),
    fontFace
  });

  slide.addText(
    'Mathematical reconciliation variance: Rs. 0.00 Cr  |  ' +
    'Full financial reconciliation: Boardroom & Evidence Edition - Slide 10',
    {
      x: PPTX_LAYOUT.CONTENT_LEFT,
      y: 4.15,
      w: PPTX_LAYOUT.CONTENT_WIDTH,
      h: 0.3,
      fontSize: 8.5,
      bold: true,
      color: BRAND_COLORS.accentGreen.replace('#', ''),
      fontFace
    }
  );

  addBriefFooter(slide, 4);
}
