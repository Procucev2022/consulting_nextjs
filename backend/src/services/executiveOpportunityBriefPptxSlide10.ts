/**
 * Executive Opportunity Brief PPTX Slide 10 (Prompt 286)
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

export function renderBriefPptxSlide10(pptx: PptxGenJS): void {
  const slide = pptx.addSlide();
  const fontFace = TYPOGRAPHY.fallbackFont;
  addBriefHeader(slide, 'PROPOSED NEXT STEPS', 'Next Steps', 10);

  const decisions = [
    {
      n: '01',
      t: 'ALIGN',
      a: 'Confirm priority Wave 1 categories',
      d: 'Confirm priority categories and align key stakeholders on immediate commercial launch across packaging bags, grinding media, and fuel.',
      badge: 'Wave 1 Priority',
      c: BRAND_COLORS.accentGreen
    },
    {
      n: '02',
      t: 'MOBILIZE',
      a: 'Establish joint procurement working group',
      d: 'Charter joint central procurement and plant execution steering team to harmonize cross-plant specifications and vendor panels.',
      badge: 'Joint Governance',
      c: BRAND_COLORS.procucevBlue
    },
    {
      n: '03',
      t: 'EXECUTE',
      a: 'Launch approved competitive sourcing initiatives',
      d: 'Launch approved dynamic price discovery events and corporate rate card standardizations across vetted supplier panels.',
      badge: 'Commercial Sourcing',
      c: '#2563EB'
    }
  ];

  const dW = 2.85;
  const dGap = 0.22;
  const dY = 1.15;

  decisions.forEach((d, idx) => {
    const x = PPTX_LAYOUT.CONTENT_LEFT + idx * (dW + dGap);
    slide.addShape('rect', {
      x,
      y: dY,
      w: dW,
      h: 2.3,
      fill: { color: BRAND_COLORS.lightCard.replace('#', '') },
      line: { color: BRAND_COLORS.border.replace('#', ''), width: 1 }
    });
    slide.addShape('rect', {
      x,
      y: dY,
      w: dW,
      h: 0.05,
      fill: { color: d.c.replace('#', '') }
    });
    slide.addText(`${d.n}  ${d.t}`, {
      x: x + 0.15,
      y: dY + 0.12,
      w: dW - 0.3,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: BRAND_COLORS.primaryText.replace('#', ''),
      fontFace
    });
    slide.addShape('rect', {
      x: x + 0.15,
      y: dY + 0.42,
      w: dW - 0.3,
      h: 0.22,
      fill: { color: 'F1F5F9' }
    });
    slide.addText(d.badge, {
      x: x + 0.2,
      y: dY + 0.44,
      w: dW - 0.4,
      h: 0.2,
      fontSize: 8,
      bold: true,
      color: d.c.replace('#', ''),
      fontFace
    });
    slide.addText(d.a, {
      x: x + 0.15,
      y: dY + 0.72,
      w: dW - 0.3,
      h: 0.5,
      fontSize: 9,
      bold: true,
      color: BRAND_COLORS.primaryText.replace('#', ''),
      fontFace
    });
    slide.addText(d.d, {
      x: x + 0.15,
      y: dY + 1.25,
      w: dW - 0.3,
      h: 0.9,
      fontSize: 8.5,
      color: BRAND_COLORS.secondaryText.replace('#', ''),
      fontFace
    });
  });

  const ctaY = 3.6;
  slide.addShape('rect', {
    x: PPTX_LAYOUT.CONTENT_LEFT,
    y: ctaY,
    w: PPTX_LAYOUT.CONTENT_WIDTH,
    h: 0.85,
    fill: { color: 'ECFDF5' },
    line: { color: BRAND_COLORS.accentGreen.replace('#', ''), width: 1.5 }
  });
  slide.addShape('rect', {
    x: PPTX_LAYOUT.CONTENT_LEFT,
    y: ctaY,
    w: 0.08,
    h: 0.85,
    fill: { color: BRAND_COLORS.accentGreen.replace('#', '') }
  });
  slide.addText(
    `Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.netDirectSavingsCr.toFixed(2)} Cr Direct Savings Opportunity  |  ` +
    `Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.netDefensiblePipelineCr.toFixed(2)} Cr Net Defensible Pipeline`,
    {
      x: PPTX_LAYOUT.CONTENT_LEFT + 0.2,
      y: ctaY + 0.08,
      w: PPTX_LAYOUT.CONTENT_WIDTH - 0.4,
      h: 0.25,
      fontSize: 11,
      bold: true,
      color: '065F46',
      fontFace
    }
  );
  slide.addText('Move from diagnostic to execution.', {
    x: PPTX_LAYOUT.CONTENT_LEFT + 0.2,
    y: ctaY + 0.34,
    w: 5.0,
    h: 0.3,
    fontSize: 14,
    bold: true,
    color: BRAND_COLORS.primaryText.replace('#', ''),
    fontFace
  });
  slide.addText('Contact: leadership@procucev.com', {
    x: PPTX_LAYOUT.CONTENT_LEFT + 0.2,
    y: ctaY + 0.62,
    w: 4.0,
    h: 0.2,
    fontSize: 9.5,
    bold: true,
    color: BRAND_COLORS.procucevBlue.replace('#', ''),
    fontFace
  });

  addBriefFooter(slide, 10);
}
