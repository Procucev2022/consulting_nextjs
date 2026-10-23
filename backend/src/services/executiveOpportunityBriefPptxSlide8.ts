/**
 * Executive Opportunity Brief PPTX Slide 8 (Prompt 286 & Prompt 503)
 * Dynamic customer contract binding for 90-day execution roadmap.
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
import {
  addBriefHeader,
  addBriefFooter
} from './executiveOpportunityBriefPptxHelpers';

export function renderBriefPptxSlide8(pptx: PptxGenJS, clientName = 'ABC Textile Ltd'): void {
  const slide = pptx.addSlide();
  const fontFace = TYPOGRAPHY.fallbackFont;
  const contract = getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);

  addBriefHeader(slide, 'From Opportunity to Execution in 90 Days', 'Execution Roadmap', 8);

  const phases = isCust
    ? [
        {
          p: 'DAYS 1-30',
          t: 'Mobilize & Quick Wins',
          s: 'Synthetic Fibers Harmonization & RFP Launch',
          items: [
            'Mobilize joint procurement working committee',
            'Baseline validation & preferred vendor pre-qualification',
            'Launch Synthetic Fiber corporate rate alignment (Rs. 28.50 Cr)',
            'Standardize packaging rate cards for immediate quick wins'
          ],
          c: BRAND_COLORS.procucevBlue
        },
        {
          p: 'DAYS 31-60',
          t: 'Market Engagement & Tenders',
          s: 'Dyes, Chemicals & Packaging Sourcing',
          items: [
            'Issue dynamic tenders for specialty chemical dyes (Rs. 22.10 Cr)',
            'Conduct reverse e-auctions on corrugated packaging (Rs. 14.20 Cr)',
            'Multi-plant transport corridor and logistics contract reviews',
            'Commercial negotiations across top 100 plant consumable SKUs'
          ],
          c: '#2563EB'
        },
        {
          p: 'DAYS 61-90',
          t: 'Award & Savings Realization',
          s: 'MRO Panelling & Contract Signoff',
          items: [
            'Award consolidated preferred MRO & electrical panels (Rs. 10.30 Cr)',
            'Enforce contracted rates in ERP purchase orders',
            'Track realized P&L cash flow savings with corporate finance',
            'Deploy ongoing audit dashboard to stop price creep'
          ],
          c: BRAND_COLORS.accentGreen
        }
      ]
    : [
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
    `HERO TARGET: Rs. ${contract.validatedSavingsCr.toFixed(2)} Cr Proven Opportunity Targeted for 90-Day Realization`,
    {
      x: PPTX_LAYOUT.CONTENT_LEFT + 0.2,
      y: noteY + 0.08,
      w: PPTX_LAYOUT.CONTENT_WIDTH - 0.4,
      h: 0.25,
      fontSize: 9.5,
      bold: true,
      color: BRAND_COLORS.procucevBlue.replace('#', ''),
      fontFace
    }
  );
  slide.addText(
    `Direct process savings from ${contract.lowValuePOsCount} POs remain unmonetized until customer time-motion / manpower baseline validation.`,
    {
      x: PPTX_LAYOUT.CONTENT_LEFT + 0.2,
      y: noteY + 0.32,
      w: PPTX_LAYOUT.CONTENT_WIDTH - 0.4,
      h: 0.22,
      fontSize: 8.5,
      color: BRAND_COLORS.primaryText.replace('#', ''),
      fontFace
    }
  );
  const deriskLine = isCust
    ? 'PCBI benchmark price gap is UNAVAILABLE for this assessment. Zero external surrogate values substituted.'
    : `Risk / cost avoidance: Rs. ${contract.spendDeRiskedCr} Cr spend de-risked across ${contract.dualSourceProgramsCount} dual-source programs is tracked separately and not monetized.`;
  slide.addText(
    deriskLine,
    {
      x: PPTX_LAYOUT.CONTENT_LEFT + 0.2,
      y: noteY + 0.55,
      w: PPTX_LAYOUT.CONTENT_WIDTH - 0.4,
      h: 0.22,
      fontSize: 8.5,
      color: BRAND_COLORS.secondaryText.replace('#', ''),
      fontFace
    }
  );

  addBriefFooter(slide, 8);
}
