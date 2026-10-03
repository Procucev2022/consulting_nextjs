/**
 * Executive Opportunity Brief PPTX Slide 6 (Prompt 286)
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

export function renderBriefPptxSlide6(pptx: PptxGenJS): void {
  const slide = pptx.addSlide();
  const fontFace = TYPOGRAPHY.fallbackFont;
  addBriefHeader(slide, 'How the Value Will Be Captured: Execution Pillars', 'Value Capture Mechanisms', 6);

  const pillars = [
    {
      num: '01',
      title: 'RATE HARMONIZATION',
      sub: 'Cross-plant price alignment & benchmark-led negotiations',
      bullets: [
        'Inter-plant variance elimination on identical standard SKUs',
        'Ex-works benchmark rate cards indexed to regional delivery',
        'ERP real-time price verification stopping contract rate creep'
      ],
      c: BRAND_COLORS.procucevBlue
    },
    {
      num: '02',
      title: 'VOLUME AGGREGATION',
      sub: 'Pool fragmented demand & increase supplier leverage',
      bullets: [
        'Aggregate multi-plant requirements into national master contracts',
        'Demand consolidation across 26 plants for tier-1 volume discounts',
        'Master distributor agreements for regional MRO consumables'
      ],
      c: '#2563EB'
    },
    {
      num: '03',
      title: 'STRATEGIC SOURCING',
      sub: 'Competitive tenders, rationalization & benchmark alignment',
      bullets: [
        'Multi-round competitive bidding and dynamic e-auctions',
        'Strategic vendor base consolidation and panelling',
        'Formula-based commodity indexation (PCBI market linkage)'
      ],
      c: BRAND_COLORS.accentGreen
    }
  ];

  const pW = 2.85;
  const pGap = 0.22;
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
      h: 0.05,
      fill: { color: p.c.replace('#', '') }
    });
    slide.addText(`${p.num}  ${p.title}`, {
      x: x + 0.15,
      y: pY + 0.15,
      w: pW - 0.3,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: BRAND_COLORS.primaryText.replace('#', ''),
      fontFace
    });
    slide.addText(p.sub, {
      x: x + 0.15,
      y: pY + 0.45,
      w: pW - 0.3,
      h: 0.35,
      fontSize: 8.5,
      bold: true,
      color: p.c.replace('#', ''),
      fontFace
    });
    slide.addText(p.bullets.map(b => `- ${b}`).join('\n'), {
      x: x + 0.15,
      y: pY + 0.85,
      w: pW - 0.3,
      h: 1.35,
      fontSize: 8.5,
      color: BRAND_COLORS.primaryText.replace('#', ''),
      fontFace
    });
  });

  const mechY = 3.65;
  slide.addShape('rect', {
    x: PPTX_LAYOUT.CONTENT_LEFT,
    y: mechY,
    w: PPTX_LAYOUT.CONTENT_WIDTH,
    h: 0.75,
    fill: { color: 'F8FAFC' },
    line: { color: BRAND_COLORS.border.replace('#', ''), width: 1 }
  });
  slide.addText('TACTICAL EXECUTION MECHANISMS:', {
    x: PPTX_LAYOUT.CONTENT_LEFT + 0.2,
    y: mechY + 0.08,
    w: 3.0,
    h: 0.2,
    fontSize: 8.5,
    bold: true,
    color: BRAND_COLORS.secondaryText.replace('#', ''),
    fontFace
  });

  const mechanisms = ['E-Auction', 'Specification', 'Payment Terms', 'Contract Compliance', 'Category Strategy'];
  mechanisms.forEach((m, mIdx) => {
    const mx = PPTX_LAYOUT.CONTENT_LEFT + 0.2 + mIdx * 1.75;
    slide.addShape('rect', {
      x: mx,
      y: mechY + 0.3,
      w: 1.6,
      h: 0.32,
      fill: { color: 'FFFFFF' },
      line: { color: BRAND_COLORS.border.replace('#', ''), width: 0.75 }
    });
    slide.addText(m, {
      x: mx,
      y: mechY + 0.34,
      w: 1.6,
      h: 0.24,
      fontSize: 9,
      bold: true,
      align: 'center',
      color: BRAND_COLORS.primaryText.replace('#', ''),
      fontFace
    });
  });

  addBriefFooter(slide, 6);
}
