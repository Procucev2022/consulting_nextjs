/**
 * Executive Opportunity Brief PPTX Slide 8 (Prompt 286)
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

export function renderBriefPptxSlide8(pptx: PptxGenJS): void {
  const slide = pptx.addSlide();
  const fontFace = TYPOGRAPHY.fallbackFont;
  addBriefHeader(slide, 'From Opportunity to Execution in 90 Days', 'Execution Roadmap', 8);

  const phases = [
    {
      p: 'DAYS 1-30',
      t: 'Mobilize & Quick Wins',
      s: 'Packaging Bags E-Auction & Rate Harmonization',
      items: [
        'Mobilize joint procurement steering committee',
        'Baseline validation & supplier pre-qualification',
        'Launch Packaging Bags master e-auction (Rs. 14.50 Cr)',
        'Establish corporate rate cards for immediate quick wins'
      ],
      c: BRAND_COLORS.procucevBlue
    },
    {
      p: 'DAYS 31-60',
      t: 'Market Engagement & Tenders',
      s: 'Grinding Media & Fuel Benchmark Alignment',
      items: [
        'Issue dynamic tenders for grinding media (Rs. 11.20 Cr)',
        'Align imported coal & petcoke contracts to PCBI index',
        'Launch secondary freight multi-plant corridor bidding',
        'Commercial negotiations on top 100 consumable SKUs'
      ],
      c: '#2563EB'
    },
    {
      p: 'DAYS 61-90',
      t: 'Award & Savings Realization',
      s: 'Lubricants, Refractory & Contract Signoff',
      items: [
        'Award consolidated lubricants & refractory master contracts',
        'Enforce contract compliance rules in ERP purchase orders',
        'Reconcile realized P&L EBITDA impact with finance teams',
        'Deploy continuous tracking dashboard for ongoing leakage'
      ],
      c: BRAND_COLORS.accentGreen
    }
  ];

  const phW = 2.85;
  const phGap = 0.22;
  const phY = 1.15;

  phases.forEach((ph, idx) => {
    const x = PPTX_LAYOUT.CONTENT_LEFT + idx * (phW + phGap);
    slide.addShape('rect', {
      x,
      y: phY,
      w: phW,
      h: 2.3,
      fill: { color: BRAND_COLORS.lightCard.replace('#', '') },
      line: { color: BRAND_COLORS.border.replace('#', ''), width: 1 }
    });
    slide.addShape('rect', {
      x,
      y: phY,
      w: phW,
      h: 0.05,
      fill: { color: ph.c.replace('#', '') }
    });
    slide.addText(ph.p, {
      x: x + 0.15,
      y: phY + 0.12,
      w: phW - 0.3,
      h: 0.25,
      fontSize: 11,
      bold: true,
      color: ph.c.replace('#', ''),
      fontFace
    });
    slide.addText(ph.t, {
      x: x + 0.15,
      y: phY + 0.38,
      w: phW - 0.3,
      h: 0.3,
      fontSize: 10.5,
      bold: true,
      color: BRAND_COLORS.primaryText.replace('#', ''),
      fontFace
    });
    slide.addText(ph.s, {
      x: x + 0.15,
      y: phY + 0.65,
      w: phW - 0.3,
      h: 0.35,
      fontSize: 8,
      bold: true,
      color: ph.c.replace('#', ''),
      fontFace
    });
    slide.addText(ph.items.map(it => `- ${it}`).join('\n'), {
      x: x + 0.15,
      y: phY + 1.0,
      w: phW - 0.3,
      h: 1.2,
      fontSize: 8,
      color: BRAND_COLORS.primaryText.replace('#', ''),
      fontFace
    });
  });

  const noteY = 3.55;
  slide.addShape('rect', {
    x: PPTX_LAYOUT.CONTENT_LEFT,
    y: noteY,
    w: PPTX_LAYOUT.CONTENT_WIDTH,
    h: 0.85,
    fill: { color: 'F8FAFC' },
    line: { color: BRAND_COLORS.border.replace('#', ''), width: 1 }
  });
  slide.addShape('rect', {
    x: PPTX_LAYOUT.CONTENT_LEFT,
    y: noteY,
    w: 0.06,
    h: 0.85,
    fill: { color: BRAND_COLORS.procucevBlue.replace('#', '') }
  });
  slide.addText(
    `HERO TARGET: Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.validatedSavingsCr.toFixed(2)} Cr Validated Wave 1 ` +
    'Targeted for 90-Day Cash Realization\n' +
    'Direct process savings from 824 POs remain unmonetized until customer time-motion / manpower baseline validation.\n' +
    'Risk / cost avoidance: Rs. 420 Cr spend de-risked across 4 dual-source programs is tracked separately and not monetized.',
    {
      x: PPTX_LAYOUT.CONTENT_LEFT + 0.2,
      y: noteY + 0.1,
      w: PPTX_LAYOUT.CONTENT_WIDTH - 0.4,
      h: 0.65,
      fontSize: 8.5,
      color: BRAND_COLORS.primaryText.replace('#', ''),
      fontFace
    }
  );

  slide.addText('Detailed roadmap: Boardroom & Evidence Edition - Slides 24-25', {
    x: PPTX_LAYOUT.CONTENT_LEFT,
    y: 4.5,
    w: 6.0,
    h: 0.25,
    fontSize: 9,
    italic: true,
    color: BRAND_COLORS.secondaryText.replace('#', ''),
    fontFace
  });

  addBriefFooter(slide, 8);
}
