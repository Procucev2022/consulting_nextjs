/**
 * Executive Opportunity Brief PPTX Slide 5 (Prompt 286)
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

export function renderBriefPptxSlide5(pptx: PptxGenJS): void {
  const slide = pptx.addSlide();
  const fontFace = TYPOGRAPHY.fallbackFont;
  addBriefHeader(slide, 'Why Management Can Trust the Number', 'Evidence & Audit Trail', 5);

  const proofPoints = [
    {
      n: EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.baselineTransactions.toLocaleString(),
      l: 'Transaction Records',
      s: 'Audited PO & invoice lines'
    },
    {
      n: EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.baselineSuppliers.toLocaleString(),
      l: 'Suppliers',
      s: 'Vendor master profiled'
    },
    {
      n: EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.baselineMaterialGroups.toLocaleString(),
      l: 'Material Groups',
      s: 'Clean taxonomy categories'
    },
    {
      n: EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.baselinePlants.toLocaleString(),
      l: 'Plants',
      s: 'Pan-India sites'
    },
    {
      n: `${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.analysisPeriodMonths} Months`,
      l: 'Analysis Period',
      s: EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.analysisPeriod
    }
  ];

  const pW = 1.68;
  const pGap = 0.15;
  proofPoints.forEach((p, idx) => {
    const x = PPTX_LAYOUT.CONTENT_LEFT + idx * (pW + pGap);
    slide.addShape('rect', {
      x,
      y: 1.15,
      w: pW,
      h: 1.35,
      fill: { color: BRAND_COLORS.lightCard.replace('#', '') },
      line: { color: BRAND_COLORS.border.replace('#', ''), width: 1 }
    });
    slide.addShape('rect', {
      x,
      y: 1.15,
      w: pW,
      h: 0.04,
      fill: { color: BRAND_COLORS.procucevBlue.replace('#', '') }
    });
    slide.addText(p.n, {
      x: x + 0.1,
      y: 1.25,
      w: pW - 0.2,
      h: 0.35,
      fontSize: 18,
      bold: true,
      color: BRAND_COLORS.primaryText.replace('#', ''),
      fontFace
    });
    slide.addText(p.l, {
      x: x + 0.1,
      y: 1.65,
      w: pW - 0.2,
      h: 0.35,
      fontSize: 9.5,
      bold: true,
      color: BRAND_COLORS.procucevBlue.replace('#', ''),
      fontFace
    });
    slide.addText(p.s, {
      x: x + 0.1,
      y: 2.05,
      w: pW - 0.2,
      h: 0.35,
      fontSize: 8.5,
      color: BRAND_COLORS.secondaryText.replace('#', ''),
      fontFace
    });
  });

  const flowY = 2.7;
  slide.addShape('rect', {
    x: PPTX_LAYOUT.CONTENT_LEFT,
    y: flowY,
    w: PPTX_LAYOUT.CONTENT_WIDTH,
    h: 0.75,
    fill: { color: BRAND_COLORS.lightCard.replace('#', '') },
    line: { color: BRAND_COLORS.border.replace('#', ''), width: 1 }
  });
  slide.addText('ROBUST VALUE PROVENANCE ARCHITECTURE', {
    x: PPTX_LAYOUT.CONTENT_LEFT + 0.2,
    y: flowY + 0.1,
    w: PPTX_LAYOUT.CONTENT_WIDTH - 0.4,
    h: 0.2,
    fontSize: 8.5,
    bold: true,
    color: BRAND_COLORS.procucevBlue.replace('#', ''),
    fontFace
  });
  slide.addText(
    'Transaction-level analysis  ->  Category intelligence  ->  ' +
    'Sourcing opportunities  ->  Overlap controls  ->  Defensible pipeline',
    {
      x: PPTX_LAYOUT.CONTENT_LEFT + 0.2,
      y: flowY + 0.35,
      w: PPTX_LAYOUT.CONTENT_WIDTH - 0.4,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: BRAND_COLORS.primaryText.replace('#', ''),
      fontFace
    }
  );

  const secY = 3.6;
  slide.addShape('rect', {
    x: PPTX_LAYOUT.CONTENT_LEFT,
    y: secY,
    w: PPTX_LAYOUT.CONTENT_WIDTH,
    h: 0.65,
    fill: { color: 'F8FAFC' },
    line: { color: BRAND_COLORS.border.replace('#', ''), width: 1 }
  });
  slide.addText(
    'DATA GOVERNANCE & INTEGRITY ASSURANCE:\n' +
    'Customer procurement data is handled under configured tenant isolation, access controls, ' +
    'confidentiality and data-governance controls.',
    {
      x: PPTX_LAYOUT.CONTENT_LEFT + 0.2,
      y: secY + 0.1,
      w: PPTX_LAYOUT.CONTENT_WIDTH - 0.4,
      h: 0.45,
      fontSize: 9,
      color: BRAND_COLORS.primaryText.replace('#', ''),
      fontFace
    }
  );

  slide.addText('Full methodology and audit trail: Boardroom & Evidence Edition - Slides 7 & 30', {
    x: PPTX_LAYOUT.CONTENT_LEFT,
    y: 4.45,
    w: 6.0,
    h: 0.25,
    fontSize: 9,
    italic: true,
    color: BRAND_COLORS.secondaryText.replace('#', ''),
    fontFace
  });

  addBriefFooter(slide, 5);
}
