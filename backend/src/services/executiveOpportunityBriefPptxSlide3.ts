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

export function renderBriefPptxSlide3(pptx: PptxGenJS, clientName = 'ABC Textile Ltd'): void {
  const slide = pptx.addSlide();
  const fontFace = TYPOGRAPHY.fallbackFont;
  const contract = getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);

  if (isCust) {
    // Slide 2 of 2 Customer Context: Procurement Impact on Business
    addBriefHeader(slide, `Procurement Impact on Business: ${clientName}`, 'Procurement Impact (Slide 2 of 2)', 3);

    const bW = 4.4;
    const bY = 1.15;
    const bH = 3.3;

    // Left Box: Assessed Spend & Priorities
    slide.addShape('rect', {
      x: PPTX_LAYOUT.CONTENT_LEFT,
      y: bY,
      w: bW,
      h: bH,
      fill: { color: BRAND_COLORS.lightCard.replace('#', '') },
      line: { color: BRAND_COLORS.border.replace('#', ''), width: 1 }
    });
    slide.addShape('rect', {
      x: PPTX_LAYOUT.CONTENT_LEFT,
      y: bY,
      w: bW,
      h: 0.05,
      fill: { color: BRAND_COLORS.procucevBlue.replace('#', '') }
    });
    slide.addText('ASSESSED SPEND & PROCUREMENT PRIORITIES', {
      x: PPTX_LAYOUT.CONTENT_LEFT + 0.2,
      y: bY + 0.15,
      w: bW - 0.4,
      h: 0.25,
      fontSize: 10,
      bold: true,
      color: BRAND_COLORS.procucevBlue.replace('#', ''),
      fontFace
    });

    slide.addText('Evaluated Spend Footprint:', {
      x: PPTX_LAYOUT.CONTENT_LEFT + 0.2,
      y: bY + 0.45,
      w: bW - 0.4,
      h: 0.2,
      fontSize: 9,
      bold: true,
      color: BRAND_COLORS.primaryText.replace('#', ''),
      fontFace
    });
    slide.addText(
      `Rs. ${contract.totalCustomerSpendCr.toFixed(4)} Cr evaluated spend across ` +
      `${contract.baselineTransactions.toLocaleString()} invoices and ${contract.baselineSuppliers} active suppliers.`,
      {
        x: PPTX_LAYOUT.CONTENT_LEFT + 0.2,
        y: bY + 0.68,
        w: bW - 0.4,
        h: 0.45,
        fontSize: 9.5,
        color: BRAND_COLORS.primaryText.replace('#', ''),
        fontFace
      }
    );

    slide.addText('Key Assessed Procurement Categories:', {
      x: PPTX_LAYOUT.CONTENT_LEFT + 0.2,
      y: bY + 1.2,
      w: bW - 0.4,
      h: 0.2,
      fontSize: 9,
      bold: true,
      color: BRAND_COLORS.primaryText.replace('#', ''),
      fontFace
    });
    const catsText =
      '* Synthetic Polymers & Viscose Raw Fibers (Direct Material)\n' +
      '* Specialty Chemical Dyes & Finishing Auxiliaries\n' +
      '* Corrugated & Industrial Packaging Materials\n' +
      '* Captive Power Fuel & Energy Inputs\n' +
      '* Plant Electrical & Mechanical Maintenance Spares (MRO)';
    slide.addText(catsText, {
      x: PPTX_LAYOUT.CONTENT_LEFT + 0.2,
      y: bY + 1.42,
      w: bW - 0.4,
      h: 1.05,
      fontSize: 8.5,
      color: BRAND_COLORS.secondaryText.replace('#', ''),
      fontFace
    });

    slide.addText(
      'Top Priorities: 1. Cross-plant price harmonization across 6 units. 2. Vendor consolidation across 420 suppliers.',
      {
        x: PPTX_LAYOUT.CONTENT_LEFT + 0.2,
        y: bY + 2.6,
        w: bW - 0.4,
        h: 0.55,
        fontSize: 8.5,
        bold: true,
        color: BRAND_COLORS.primaryText.replace('#', ''),
        fontFace
      }
    );

    // Right Box: Value Classification & Action
    const rightX = 5.1;
    slide.addShape('rect', {
      x: rightX,
      y: bY,
      w: bW,
      h: bH,
      fill: { color: BRAND_COLORS.lightCard.replace('#', '') },
      line: { color: BRAND_COLORS.border.replace('#', ''), width: 1 }
    });
    slide.addShape('rect', {
      x: rightX,
      y: bY,
      w: bW,
      h: 0.05,
      fill: { color: BRAND_COLORS.accentGreen.replace('#', '') }
    });
    slide.addText('APPROVED VALUE DISCOVERY & P&L IMPACT', {
      x: rightX + 0.2,
      y: bY + 0.15,
      w: bW - 0.4,
      h: 0.25,
      fontSize: 10,
      bold: true,
      color: BRAND_COLORS.accentGreen.replace('#', ''),
      fontFace
    });

    const vBoxes = [
      { l: 'NET MODELLED OPPORTUNITY', v: `Rs. ${contract.netDefensiblePipelineCr.toFixed(3)} Cr`, s: `Gross Rs. ${contract.grossOpportunityCr.toFixed(3)} Cr less Overlaps Rs. ${contract.overlapDeductionsCr.toFixed(3)} Cr (~30.0% EBITDA)` },
      { l: 'PROVEN OPPORTUNITY', v: `Rs. ${contract.validatedSavingsCr.toFixed(3)} Cr`, s: 'Evidence-based commercial validation' },
      { l: 'REALIZED SAVINGS', v: `Rs. ${contract.realizedSavingsCr.toFixed(2)} Cr`, s: 'Audited post-execution billing; zero premature credit' }
    ];
    vBoxes.forEach((vb, idx) => {
      const vy = bY + 0.45 + idx * 0.65;
      slide.addShape('rect', {
        x: rightX + 0.15,
        y: vy,
        w: bW - 0.3,
        h: 0.58,
        fill: { color: 'F8FAFC' },
        line: { color: BRAND_COLORS.border.replace('#', ''), width: 0.5 }
      });
      slide.addText(`${vb.l}: ${vb.v}\n${vb.s}`, {
        x: rightX + 0.25,
        y: vy + 0.05,
        w: bW - 0.5,
        h: 0.48,
        fontSize: 8.5,
        bold: true,
        color: BRAND_COLORS.accentGreen.replace('#', ''),
        fontFace
      });
    });

    // Concise Recommended Action
    slide.addShape('rect', {
      x: rightX + 0.15,
      y: bY + 2.5,
      w: bW - 0.3,
      h: 0.65,
      fill: { color: 'ECFDF5' },
      line: { color: BRAND_COLORS.accentGreen.replace('#', ''), width: 1 }
    });
    slide.addText('RECOMMENDED ACTION: Deploy Wave 1 commercial tenders on top 5 chemical and packaging categories to capture immediate Rs. 82.380 Cr proven value.', {
      x: rightX + 0.25,
      y: bY + 2.55,
      w: bW - 0.5,
      h: 0.55,
      fontSize: 8.5,
      bold: true,
      color: '#065F46',
      fontFace
    });

    slide.addText('PCBI Benchmark Price Gap: UNAVAILABLE for this assessment (Empirical PCBI benchmark index not commissioned). No surrogate benchmark substituted.', {
      x: PPTX_LAYOUT.CONTENT_LEFT,
      y: 4.65,
      w: 8.5,
      h: 0.25,
      fontSize: 8.5,
      bold: true,
      color: '#B45309',
      fontFace
    });
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
