/**
 * 10-Slide Executive Opportunity Brief — Slide 8
 * Adheres strictly to Prompt 286 (CFO/CEO Discussion Edition) and Prompt 503.
 * Customer contract binding and Module 3 isolation controls.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  BRAND_COLORS,
  PDF_LAYOUT
} from '../constants/executiveBriefLayoutConstants';
import {
  getExecutiveBriefPresentationContract,
  isCustomerAssessment
} from '../constants/executiveBriefPresentationConstants';
import type { ExecutiveBriefPresentationContract } from '../types/executiveBriefPresentation';
import { renderExecutiveOpportunityBriefFooter } from './executiveOpportunityBriefPdfHelpers';

export function renderBriefSlide8(
  canvas: PdfCanvas,
  clientName = 'ABC Textile Ltd',
  contract?: ExecutiveBriefPresentationContract
): void {
  const activeContract = contract || getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);

  canvas.addPage();
  canvas.renderHeader('From Opportunity to Execution in 90 Days', 'Execution Roadmap', 8);

  const phases = isCust
    ? [
        {
          period: 'DAYS 1-30',
          title: 'Mobilize & Quick Wins',
          sub: 'Synthetic Fibers Harmonization & RFP Launch',
          items: [
            'Mobilize joint procurement working committee',
            'Baseline validation & preferred vendor pre-qualification',
            'Launch Synthetic Fiber corporate rate alignment (Rs. 28.50 Cr)',
            'Standardize packaging rate cards for immediate quick wins'
          ],
          c: BRAND_COLORS.procucevBlue
        },
        {
          period: 'DAYS 31-60',
          title: 'Market Engagement & Tenders',
          sub: 'Dyes, Chemicals & Packaging Sourcing',
          items: [
            'Issue dynamic tenders for specialty chemical dyes (Rs. 22.10 Cr)',
            'Conduct reverse e-auctions on corrugated packaging (Rs. 14.20 Cr)',
            'Multi-plant transport corridor and logistics contract reviews',
            'Commercial negotiations across top 100 plant consumable SKUs'
          ],
          c: '#2563EB'
        },
        {
          period: 'DAYS 61-90',
          title: 'Award & Savings Realization',
          sub: 'MRO Panelling & Contract Signoff',
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
          period: 'DAYS 1-30',
          title: 'Mobilize & Quick Wins',
          sub: 'Packaging Bags E-Auction & Rate Harmonization',
          items: [
            'Mobilize joint procurement steering committee',
            'Baseline validation & supplier pre-qualification',
            'Launch Packaging Bags master e-auction (Rs. 14.50 Cr)',
            'Establish corporate rate cards for immediate quick wins'
          ],
          c: BRAND_COLORS.procucevBlue
        },
        {
          period: 'DAYS 31-60',
          title: 'Market Engagement & Tenders',
          sub: 'Grinding Media & Fuel Benchmark Alignment',
          items: [
            'Issue dynamic tenders for grinding media (Rs. 11.20 Cr)',
            'Align imported coal & petcoke contracts to PCBI index',
            'Launch secondary freight multi-plant corridor bidding',
            'Commercial negotiations on top 100 consumable SKUs'
          ],
          c: '#2563EB'
        },
        {
          period: 'DAYS 61-90',
          title: 'Award & Savings Realization',
          sub: 'Lubricants, Refractory & Contract Signoff',
          items: [
            'Award consolidated lubricants & refractory master contracts',
            'Enforce contract compliance rules in ERP purchase orders',
            'Reconcile realized P&L EBITDA impact with finance teams',
            'Deploy continuous tracking dashboard for ongoing leakage'
          ],
          c: BRAND_COLORS.accentGreen
        }
      ];

  const phW = 280;
  const phGap = 20;
  const phY = 104;

  phases.forEach((ph, idx) => {
    const x = PDF_LAYOUT.CONTENT_LEFT + idx * (phW + phGap);
    canvas.rect(x, phY, phW, 230, {
      fill: BRAND_COLORS.lightCard, stroke: BRAND_COLORS.border, lineWidth: 1
    });
    canvas.rect(x, phY, phW, 4, { fill: ph.c });
    canvas.text(ph.period, x + 16, phY + 26, { fontSize: 12, font: 'bold', color: ph.c });
    canvas.text(ph.title, x + 16, phY + 48, { fontSize: 11, font: 'bold', color: BRAND_COLORS.primaryText });
    canvas.text(ph.sub, x + 16, phY + 68, { fontSize: 8.5, font: 'bold', color: ph.c });

    ph.items.forEach((item, iIdx) => {
      canvas.textBlock(`- ${item}`, x + 16, phY + 98 + iIdx * 30, phW - 32, {
        fontSize: 8.5, color: BRAND_COLORS.primaryText, lineHeight: 12
      });
    });
  });

  const noteY = 350;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, noteY, PDF_LAYOUT.CONTENT_WIDTH, 80, {
    fill: '#F8FAFC', stroke: BRAND_COLORS.border, lineWidth: 1
  });
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, noteY, 4, 80, { fill: BRAND_COLORS.procucevBlue });
  canvas.text(
    `HERO TARGET: Rs. ${activeContract.validatedSavingsCr.toFixed(2)} Cr Proven Opportunity ` +
    'Targeted for 90-Day Commercial Realization',
    PDF_LAYOUT.CONTENT_LEFT + 20, noteY + 24, {
      fontSize: 10, font: 'bold', color: BRAND_COLORS.procucevBlue
    }
  );
  canvas.text(
    `Direct process savings from ${activeContract.lowValuePOsCount} POs remain unmonetized until customer time-motion / manpower baseline validation.`,
    PDF_LAYOUT.CONTENT_LEFT + 20, noteY + 46, {
      fontSize: 9, font: 'regular', color: BRAND_COLORS.primaryText
    }
  );
  const deriskText = isCust
    ? 'PCBI benchmark price gap is UNAVAILABLE for this assessment. Zero external surrogate values substituted.'
    : `Risk / cost avoidance: Rs. ${activeContract.spendDeRiskedCr} Cr spend de-risked across ${activeContract.dualSourceProgramsCount} dual-source programs is tracked separately and not monetized.`;
  canvas.text(
    deriskText,
    PDF_LAYOUT.CONTENT_LEFT + 20, noteY + 66, {
      fontSize: 8.5, color: BRAND_COLORS.secondaryText
    }
  );

  canvas.text(
    'Detailed roadmap: Boardroom & Evidence Edition - Slides 24-25',
    PDF_LAYOUT.CONTENT_LEFT, 455, {
      fontSize: 9, font: 'italic', color: BRAND_COLORS.secondaryText
    }
  );
  renderExecutiveOpportunityBriefFooter(canvas, 8);
}
