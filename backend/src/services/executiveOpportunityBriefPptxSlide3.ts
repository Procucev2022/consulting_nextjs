/**
 * 10-Slide Executive Opportunity Brief PPTX — Slide 3
 * Adheres strictly to Prompt 286 (CFO/CEO Discussion Edition) and Prompt 503.
 * Customer contract binding and Module 3 isolation controls.
 */

import type PptxGenJS from 'pptxgenjs';
import {
  BRAND_COLORS,
  PPTX_LAYOUT,
  TYPOGRAPHY
} from '../constants/executiveBriefLayoutConstants';
import {
  getExecutiveBriefPresentationContract,
  isCustomerAssessment
} from '../constants/executiveBriefPresentationConstants';
import { addBriefFooter, addBriefHeader } from './executiveOpportunityBriefPptxHelpers';
import { renderBriefPptxSlide3Customer } from './executiveOpportunityBriefPptxSlide3Customer';

export function renderBriefPptxSlide3(pptx: PptxGenJS, clientName = 'ABC Textile Ltd'): void {
  const slide = pptx.addSlide();
  const fontFace = TYPOGRAPHY.fallbackFont;
  const contract = getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);

  if (isCust) {
    renderBriefPptxSlide3Customer(slide, clientName, contract);
  } else {
    // Demonstration Archetype Slide 3
    addBriefHeader(slide, 'WHERE THE OPPORTUNITY IS CONCENTRATED [DEMONSTRATION ARCHETYPE]', 'Value Landscape', 3);

    const levers = [
      { name: 'Direct Price Improvement', opp: 'Rs. 42.80 Cr', w: 3.6 },
      { name: 'E-Auction Dynamic Bidding', opp: 'Rs. 31.50 Cr', w: 2.65 },
      { name: 'Vendor Base Consolidation *', opp: 'Rs. 26.40 Cr', w: 2.22 },
      { name: 'Volume Aggregation', opp: 'Rs. 22.10 Cr', w: 1.86 },
      { name: 'Payment Terms Optimization', opp: 'Rs. 14.20 Cr', w: 1.20 },
      { name: 'Category Specialization', opp: 'Rs. 11.80 Cr', w: 0.99 },
      { name: 'Logistics & Packaging Specs', opp: 'Rs. 9.60 Cr', w: 0.81 },
      { name: 'Specification Rationalization', opp: 'Rs. 6.30 Cr', w: 0.53 },
      { name: 'Contract Compliance Audit', opp: 'Rs. 4.80 Cr', w: 0.40 },
      { name: 'PCBI Market Index Contracting', opp: 'Rs. 3.62 Cr', w: 0.31 }
    ];

    const startY = 1.15;
    const barH = 0.23;
    const gap = 0.09;
    const maxBarW = 3.6;

    levers.forEach((lev, idx) => {
      const y = startY + idx * (barH + gap);
      slide.addText(lev.name, {
        x: PPTX_LAYOUT.CONTENT_LEFT,
        y: y - 0.02,
        w: 2.1,
        h: barH,
        fontSize: 8.5,
        bold: true,
        color: BRAND_COLORS.primaryText.replace('#', ''),
        fontFace
      });

      slide.addShape('rect', {
        x: PPTX_LAYOUT.CONTENT_LEFT + 2.15,
        y,
        w: maxBarW,
        h: barH,
        fill: { color: 'F1F5F9' },
        line: { color: BRAND_COLORS.border.replace('#', ''), width: 0.5 }
      });
      slide.addShape('rect', {
        x: PPTX_LAYOUT.CONTENT_LEFT + 2.15,
        y,
        w: lev.w,
        h: barH,
        fill: { color: BRAND_COLORS.procucevBlue.replace('#', '') }
      });

      slide.addText(lev.opp, {
        x: PPTX_LAYOUT.CONTENT_LEFT + 2.15 + maxBarW + 0.12,
        y: y - 0.02,
        w: 1.2,
        h: barH,
        fontSize: 9,
        bold: true,
        color: BRAND_COLORS.primaryText.replace('#', ''),
        fontFace
      });
    });

    slide.addShape('rect', {
      x: 7.4,
      y: startY,
      w: 2.1,
      h: 2.0,
      fill: { color: BRAND_COLORS.lightCard.replace('#', '') },
      line: { color: BRAND_COLORS.procucevBlue.replace('#', ''), width: 1.5 }
    });
    slide.addText('GROSS IDENTIFIED\nOPPORTUNITY', {
      x: 7.52,
      y: startY + 0.15,
      w: 1.86,
      h: 0.45,
      fontSize: 8.5,
      bold: true,
      color: BRAND_COLORS.secondaryText.replace('#', ''),
      fontFace
    });
    slide.addText(`Rs. ${contract.grossOpportunityCr.toFixed(2)} Cr`, {
      x: 7.52,
      y: startY + 0.65,
      w: 1.86,
      h: 0.45,
      fontSize: 16,
      bold: true,
      color: BRAND_COLORS.procucevBlue.replace('#', ''),
      fontFace
    });
    slide.addText('Assessed independently & deduplicated before establishing net pipeline.', {
      x: 7.52,
      y: startY + 1.15,
      w: 1.86,
      h: 0.75,
      fontSize: 8,
      color: BRAND_COLORS.secondaryText.replace('#', ''),
      fontFace
    });
  }

  addBriefFooter(slide, 3);
}
