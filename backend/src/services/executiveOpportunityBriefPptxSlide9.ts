/**
 * Executive Opportunity Brief PPTX Slide 9 (Prompt 286)
 * Strictly adheres to 10-slide executive structure and shared certified contract.
 */

import type PptxGenJS from 'pptxgenjs';
import {
  PPTX_LAYOUT,
  BRAND_COLORS,
  TYPOGRAPHY
} from '../constants/executiveBriefLayoutConstants';
import {
  addBriefHeader,
  addBriefFooter
} from './executiveOpportunityBriefPptxHelpers';

export function renderBriefPptxSlide9(pptx: PptxGenJS): void {
  const slide = pptx.addSlide();
  const fontFace = TYPOGRAPHY.fallbackFont;
  addBriefHeader(slide, 'Why Procucev + aiCEV: Enterprise Partner Value', 'Platform & Advisory Capabilities', 9);

  const pillars = [
    {
      t: 'PROCUREMENT EXPERTISE',
      s: 'Domain Authority & Category Depth',
      b: [
        'Decades of direct category leadership in heavy manufacturing',
        'Specialized playbooks across fuel, power, logistics & MRO',
        'Senior practitioner negotiation support across pan-India suppliers'
      ],
      c: BRAND_COLORS.procucevBlue
    },
    {
      t: 'FORENSIC SPEND INTELLIGENCE',
      s: 'Transaction-Level Precision',
      b: [
        'Granular transaction harmonization across 31,671 invoice lines',
        'Multi-plant ex-works price dispersion detection on identical SKUs',
        'Systematic exclusion and overlap deduplication governance'
      ],
      c: '#2563EB'
    },
    {
      t: 'MARKET BENCHMARK INTELLIGENCE',
      s: 'Independent Market Anchoring',
      b: [
        'Proprietary PCBI indices for cement-specific commodities',
        'Independent index-linked pricing formulas (coal, petcoke, polymer)',
        'Market timing intelligence for contract renegotiation windows'
      ],
      c: '#0284C7'
    },
    {
      t: 'EXECUTION & SAVINGS REALIZATION',
      s: 'Measurable P&L Impact',
      b: [
        'Dynamic e-auction platform and RFP commercial orchestration',
        'Joint steering model driving plant-level operational adoption',
        'Continuous savings ledger tracking realized cash flow impact'
      ],
      c: BRAND_COLORS.accentGreen
    }
  ];

  const pW = 2.12;
  const pGap = 0.17;
  const pY = 1.15;

  pillars.forEach((p, idx) => {
    const x = PPTX_LAYOUT.CONTENT_LEFT + idx * (pW + pGap);
    slide.addShape('rect', {
      x,
      y: pY,
      w: pW,
      h: 2.35,
      fill: { color: BRAND_COLORS.lightCard.replace('#', '') },
      line: { color: BRAND_COLORS.border.replace('#', ''), width: 1 }
    });
    slide.addShape('rect', {
      x,
      y: pY,
      w: pW,
      h: 0.04,
      fill: { color: p.c.replace('#', '') }
    });
    slide.addText(p.t, {
      x: x + 0.1,
      y: pY + 0.12,
      w: pW - 0.2,
      h: 0.35,
      fontSize: 8.5,
      bold: true,
      color: BRAND_COLORS.primaryText.replace('#', ''),
      fontFace
    });
    slide.addText(p.s, {
      x: x + 0.1,
      y: pY + 0.45,
      w: pW - 0.2,
      h: 0.3,
      fontSize: 8,
      bold: true,
      color: p.c.replace('#', ''),
      fontFace
    });
    slide.addText(p.b.map(bullet => `- ${bullet}`).join('\n'), {
      x: x + 0.1,
      y: pY + 0.8,
      w: pW - 0.2,
      h: 1.45,
      fontSize: 7.5,
      color: BRAND_COLORS.primaryText.replace('#', ''),
      fontFace
    });
  });

  const bannerY = 3.65;
  slide.addShape('rect', {
    x: PPTX_LAYOUT.CONTENT_LEFT,
    y: bannerY,
    w: PPTX_LAYOUT.CONTENT_WIDTH,
    h: 0.75,
    fill: { color: 'F8FAFC' },
    line: { color: BRAND_COLORS.border.replace('#', ''), width: 1 }
  });
  slide.addShape('rect', {
    x: PPTX_LAYOUT.CONTENT_LEFT,
    y: bannerY,
    w: 0.06,
    h: 0.75,
    fill: { color: BRAND_COLORS.procucevBlue.replace('#', '') }
  });
  slide.addText(
    'From transaction data to procurement decision to measurable execution.\n' +
    'Customer procurement data is handled under configured tenant isolation, access controls, ' +
    'confidentiality and data-governance controls.',
    {
      x: PPTX_LAYOUT.CONTENT_LEFT + 0.2,
      y: bannerY + 0.12,
      w: PPTX_LAYOUT.CONTENT_WIDTH - 0.4,
      h: 0.5,
      fontSize: 9.5,
      color: BRAND_COLORS.primaryText.replace('#', ''),
      fontFace
    }
  );

  addBriefFooter(slide, 9);
}
