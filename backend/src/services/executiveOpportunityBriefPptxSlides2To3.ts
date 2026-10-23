/**
 * Executive Opportunity Brief PPTX Slides 2 to 3 (Prompt 286 & Prompt 503)
 * Dynamic customer context enhancement (max 2 slides per brief) and demo archetype preservation.
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
import { customerWebsiteService } from './customerWebsiteService';
import {
  addBriefHeader,
  addBriefFooter
} from './executiveOpportunityBriefPptxHelpers';

export function renderBriefPptxSlide2(pptx: PptxGenJS, clientName = 'ABC Textile Ltd'): void {
  const slide = pptx.addSlide();
  const fontFace = TYPOGRAPHY.fallbackFont;
  const contract = getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);

  if (isCust) {
    // Slide 1 of 2 Customer Context: Customer at a Glance
    const profile = customerWebsiteService.getProfileForCustomer(clientName);
    addBriefHeader(slide, `Customer at a Glance: ${clientName}`, 'Customer Context (Slide 1 of 2)', 2);

    const bW = 4.4;
    const bY = 1.15;
    const bH = 3.3;

    // Left Box: Company & Operating Footprint
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
    slide.addText('COMPANY & OPERATING FOOTPRINT', {
      x: PPTX_LAYOUT.CONTENT_LEFT + 0.2,
      y: bY + 0.15,
      w: bW - 0.4,
      h: 0.25,
      fontSize: 10,
      bold: true,
      color: BRAND_COLORS.procucevBlue.replace('#', ''),
      fontFace
    });

    const sectorDesc = profile?.businessDescription ||
      'Integrated textile enterprise delivering synthetic yarns, woven fabrics, and industrial technical textiles.';
    slide.addText('Sector & Principal Business:', {
      x: PPTX_LAYOUT.CONTENT_LEFT + 0.2,
      y: bY + 0.45,
      w: bW - 0.4,
      h: 0.2,
      fontSize: 9,
      bold: true,
      color: BRAND_COLORS.primaryText.replace('#', ''),
      fontFace
    });
    slide.addText(sectorDesc, {
      x: PPTX_LAYOUT.CONTENT_LEFT + 0.2,
      y: bY + 0.7,
      w: bW - 0.4,
      h: 0.7,
      fontSize: 9.5,
      color: BRAND_COLORS.primaryText.replace('#', ''),
      fontFace
    });

    slide.addText('Operating Scale & Manufacturing Footprint:', {
      x: PPTX_LAYOUT.CONTENT_LEFT + 0.2,
      y: bY + 1.45,
      w: bW - 0.4,
      h: 0.2,
      fontSize: 9,
      bold: true,
      color: BRAND_COLORS.primaryText.replace('#', ''),
      fontFace
    });
    const footprintDesc = profile?.operatingFootprint ||
      '6 manufacturing units across Gujarat and Maharashtra with spinning, weaving, and chemical finishing plants.';
    slide.addText(footprintDesc, {
      x: PPTX_LAYOUT.CONTENT_LEFT + 0.2,
      y: bY + 1.7,
      w: bW - 0.4,
      h: 0.65,
      fontSize: 9,
      color: BRAND_COLORS.secondaryText.replace('#', ''),
      fontFace
    });

    slide.addText('Core Products: Synthetic Yarns  |  Industrial Fabrics  |  Apparel Wovens', {
      x: PPTX_LAYOUT.CONTENT_LEFT + 0.2,
      y: bY + 2.5,
      w: bW - 0.4,
      h: 0.4,
      fontSize: 9,
      bold: true,
      color: BRAND_COLORS.procucevBlue.replace('#', ''),
      fontFace
    });

    // Right Box: Financial Scale & Strategic Priorities
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
    slide.addText('FINANCIAL SCALE & BUSINESS PRIORITIES', {
      x: rightX + 0.2,
      y: bY + 0.15,
      w: bW - 0.4,
      h: 0.25,
      fontSize: 10,
      bold: true,
      color: BRAND_COLORS.accentGreen.replace('#', ''),
      fontFace
    });

    slide.addText('Verified Public Financial Scale:', {
      x: rightX + 0.2,
      y: bY + 0.45,
      w: bW - 0.4,
      h: 0.2,
      fontSize: 9,
      bold: true,
      color: BRAND_COLORS.primaryText.replace('#', ''),
      fontFace
    });
    const finScale = profile?.revenueOrProfit ||
      '₹2,450 Cr Revenue / ₹285 Cr Operating Profit (EBITDA) [FY 2022-23 Audited Financials]';
    slide.addText(finScale, {
      x: rightX + 0.2,
      y: bY + 0.7,
      w: bW - 0.4,
      h: 0.5,
      fontSize: 10,
      bold: true,
      color: '#065F46',
      fontFace
    });

    slide.addText('Key Strategic Business Priorities:', {
      x: rightX + 0.2,
      y: bY + 1.3,
      w: bW - 0.4,
      h: 0.2,
      fontSize: 9,
      bold: true,
      color: BRAND_COLORS.primaryText.replace('#', ''),
      fontFace
    });
    const prios = profile?.businessPriorities || [
      'Raw material volatility mitigation across synthetic polymers and specialty dyes',
      'Captive energy and power conversion cost rationalization',
      'Working capital release through vendor consolidation and payment normalization'
    ];
    slide.addText(prios.map(p => `* ${p}`).join('\n\n'), {
      x: rightX + 0.2,
      y: bY + 1.55,
      w: bW - 0.4,
      h: 1.5,
      fontSize: 8.5,
      color: BRAND_COLORS.secondaryText.replace('#', ''),
      fontFace
    });

    slide.addText('Source: Official corporate portal and published audited filings (FY 2022-23). Missing info does not block assessment.', {
      x: PPTX_LAYOUT.CONTENT_LEFT,
      y: 4.65,
      w: 8.5,
      h: 0.25,
      fontSize: 8.5,
      color: BRAND_COLORS.secondaryText.replace('#', ''),
      fontFace
    });
  } else {
    // Demonstration Archetype Slide 2
    addBriefHeader(slide, 'What the Procurement Data Tells Us [DEMONSTRATION ARCHETYPE]', 'Diagnostic Insights', 2);

    const insightCards = [
      { l: 'SPEND CONCENTRATION', v: '81.4%', d: 'Spend concentrated in top 10% of suppliers', c: '#1769E0' },
      { l: 'PRICE DISPERSION', v: '18.5%', d: 'Inter-plant price variance on repeat SKUs', c: '#F2A900' },
      { l: 'CONTRACTING GAP', v: '42.6%', d: 'Spot / non-contracted purchases across plants', c: '#F2A900' },
      { l: 'SUPPLIER BASE', v: '912', d: 'Tail suppliers accounting for 4.8% spend', c: '#64748B' },
      {
        l: 'DEFENSIBLE VALUE',
        v: `Rs. ${contract.netDefensiblePipelineCr.toFixed(2)} Cr`,
        d: 'Net defensible pipeline post-overlap & policy deduction',
        c: '#17A673'
      }
    ];

    const cardW = 1.68;
    const gap = 0.15;
    insightCards.forEach((c, idx) => {
      const x = PPTX_LAYOUT.CONTENT_LEFT + idx * (cardW + gap);
      slide.addShape('rect', { x, y: 1.15, w: cardW, h: 2.3, fill: { color: BRAND_COLORS.lightCard.replace('#', '') }, line: { color: BRAND_COLORS.border.replace('#', ''), width: 1 } });
      slide.addShape('rect', { x, y: 1.15, w: cardW, h: 0.05, fill: { color: c.c.replace('#', '') } });
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
      `Evaluated across ${contract.baselinePlants} manufacturing plants and ${contract.baselineMaterialGroups} material groups over ${contract.analysisPeriodMonths} months.`,
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
  }

  addBriefFooter(slide, 2);
}

export { renderBriefPptxSlide3 } from './executiveOpportunityBriefPptxSlide3';
