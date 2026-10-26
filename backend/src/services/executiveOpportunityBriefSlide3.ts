/**
 * 10-Slide Executive Opportunity Brief — Slide 3
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

export function renderBriefSlide3(
  canvas: PdfCanvas,
  clientName = 'ABC Textile Ltd',
  contract?: ExecutiveBriefPresentationContract
): void {
  const activeContract = contract || getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);

  canvas.addPage();

  if (isCust) {
    // Slide 2 of 2: Procurement Impact on Business (Prompt 503 Section 3)
    canvas.renderHeader(`Procurement Impact on Business: ${clientName}`, 'Procurement Impact (Slide 2 of 2)', 3);

    const bW = 425;
    const bY = 106;

    // Left Box: Actual Assessed Spend & Priorities
    canvas.rect(PDF_LAYOUT.CONTENT_LEFT, bY, bW, 330, {
      fill: BRAND_COLORS.lightCard, stroke: BRAND_COLORS.border, lineWidth: 1
    });
    canvas.rect(PDF_LAYOUT.CONTENT_LEFT, bY, bW, 4, { fill: BRAND_COLORS.procucevBlue });
    canvas.text('ASSESSED SPEND & PROCUREMENT PRIORITIES', PDF_LAYOUT.CONTENT_LEFT + 20, bY + 28, {
      fontSize: 10, font: 'bold', color: BRAND_COLORS.procucevBlue
    });

    canvas.text('Evaluated Spend Footprint:', PDF_LAYOUT.CONTENT_LEFT + 20, bY + 54, {
      fontSize: 9, font: 'bold', color: BRAND_COLORS.primaryText
    });
    canvas.textBlock(
      `Rs. ${activeContract.totalCustomerSpendCr.toFixed(4)} Cr evaluated spend across ` +
      `${activeContract.baselineTransactions.toLocaleString()} invoices and ${activeContract.baselineSuppliers} active suppliers.`,
      PDF_LAYOUT.CONTENT_LEFT + 20, bY + 70, bW - 40, {
        fontSize: 9.5, color: BRAND_COLORS.primaryText, lineHeight: 14
      }
    );

    canvas.text('Key Assessed Procurement Categories:', PDF_LAYOUT.CONTENT_LEFT + 20, bY + 115, {
      fontSize: 9, font: 'bold', color: BRAND_COLORS.primaryText
    });
    const cats = [
      'Synthetic Polymers & Viscose Raw Fibers (Direct Material)',
      'Specialty Chemical Dyes & Finishing Auxiliaries',
      'Corrugated & Industrial Packaging Materials',
      'Captive Power Fuel & Energy Inputs',
      'Plant Electrical & Mechanical Maintenance Spares (MRO)'
    ];
    cats.forEach((ct, cIdx) => {
      canvas.textBlock(`* ${ct}`, PDF_LAYOUT.CONTENT_LEFT + 20, bY + 135 + cIdx * 25, bW - 40, {
        fontSize: 8.5, color: BRAND_COLORS.secondaryText, lineHeight: 12
      });
    });

    canvas.text('Top Customer-Specific Procurement Priorities:', PDF_LAYOUT.CONTENT_LEFT + 20, bY + 265, {
      fontSize: 9, font: 'bold', color: BRAND_COLORS.primaryText
    });
    canvas.textBlock(
      '1. Cross-plant unit price harmonization across 6 manufacturing units.\n' +
      '2. Preferred supplier consolidation across fragmented vendor base.',
      PDF_LAYOUT.CONTENT_LEFT + 20, bY + 282, bW - 40, {
        fontSize: 8.5, color: BRAND_COLORS.primaryText, lineHeight: 13
      }
    );

    // Right Box: Value Discovery & Action
    const rightX = PDF_LAYOUT.CONTENT_LEFT + bW + 20;
    const rightW = 425;
    canvas.rect(rightX, bY, rightW, 330, {
      fill: BRAND_COLORS.lightCard, stroke: BRAND_COLORS.border, lineWidth: 1
    });
    canvas.rect(rightX, bY, rightW, 4, { fill: BRAND_COLORS.accentGreen });
    canvas.text('APPROVED VALUE DISCOVERY & P&L IMPACT', rightX + 20, bY + 28, {
      fontSize: 10, font: 'bold', color: BRAND_COLORS.accentGreen
    });

    const valCards = [
      {
        l: 'NET MODELLED OPPORTUNITY',
        v: `Rs. ${activeContract.netDefensiblePipelineCr.toFixed(3)} Cr`,
        d: `Gross Rs. ${activeContract.grossOpportunityCr.toFixed(3)} Cr less Overlaps Rs. ${activeContract.overlapDeductionsCr.toFixed(3)} Cr (~30.0% EBITDA)`
      },
      {
        l: 'PROVEN OPPORTUNITY',
        v: `Rs. ${activeContract.validatedSavingsCr.toFixed(3)} Cr`,
        d: 'Evidence-based commercial validation under existing criteria'
      },
      {
        l: 'REALIZED SAVINGS',
        v: `Rs. ${activeContract.realizedSavingsCr.toFixed(2)} Cr`,
        d: 'Realized savings zero until contract deployment and billing execution'
      }
    ];

    valCards.forEach((vc, idx) => {
      const vy = bY + 54 + idx * 64;
      canvas.rect(rightX + 16, vy, rightW - 32, 56, { fill: '#F8FAFC', stroke: BRAND_COLORS.border, lineWidth: 0.5 });
      canvas.text(vc.l, rightX + 26, vy + 16, { fontSize: 8, font: 'bold', color: BRAND_COLORS.secondaryText });
      canvas.text(vc.v, rightX + 26, vy + 34, { fontSize: 13, font: 'bold', color: BRAND_COLORS.accentGreen });
      canvas.text(vc.d, rightX + 26, vy + 48, { fontSize: 7.5, color: BRAND_COLORS.secondaryText });
    });

    const recY = bY + 252;
    canvas.rect(rightX + 16, recY, rightW - 32, 62, { fill: '#ECFDF5', stroke: BRAND_COLORS.accentGreen, lineWidth: 1 });
    canvas.text('CONCISE RECOMMENDED ACTION', rightX + 24, recY + 16, {
      fontSize: 8.5, font: 'bold', color: '#065F46'
    });
    canvas.textBlock(
      'Deploy Wave 1 commercial sourcing tenders on top 5 chemical and packaging categories to capture immediate Rs. 82.380 Cr proven value.',
      rightX + 24, recY + 30, rightW - 48, {
        fontSize: 8.5, color: BRAND_COLORS.primaryText, lineHeight: 12
      }
    );

    // Isolation Callout Banner
    const calloutY = 444;
    canvas.rect(PDF_LAYOUT.CONTENT_LEFT, calloutY, PDF_LAYOUT.CONTENT_WIDTH, 46, {
      fill: '#FFFBEB', stroke: '#FDE68A', lineWidth: 1
    });
    canvas.text('PCBI BENCHMARK GOVERNANCE', PDF_LAYOUT.CONTENT_LEFT + 16, calloutY + 16, {
      fontSize: 8.5, font: 'bold', color: '#B45309'
    });
    canvas.text(
      'PCBI Benchmark Price Gap: UNAVAILABLE for this assessment (Empirical PCBI benchmark index not commissioned). No surrogate benchmark substituted.',
      PDF_LAYOUT.CONTENT_LEFT + 16, calloutY + 32, {
        fontSize: 8.5, font: 'bold', color: '#92400E'
      }
    );
  } else {
    // Demonstration Archetype Slide 3
    canvas.renderHeader('WHERE THE OPPORTUNITY IS CONCENTRATED [DEMONSTRATION ARCHETYPE]', 'Value Landscape', 3);

    const levers = [
      { name: 'Direct Price Improvement', opp: 42.80, pct: 100 },
      { name: 'E-Auction Dynamic Bidding', opp: 31.50, pct: 73.6 },
      { name: 'Vendor Base Consolidation *', opp: 26.40, pct: 61.7 },
      { name: 'Volume Aggregation', opp: 22.10, pct: 51.6 },
      { name: 'Payment Terms Optimization', opp: 14.20, pct: 33.2 },
      { name: 'Category Specialization', opp: 11.80, pct: 27.6 },
      { name: 'Logistics & Packaging Specs', opp: 9.60, pct: 22.4 },
      { name: 'Specification Rationalization', opp: 6.30, pct: 14.7 },
      { name: 'Contract Compliance Audit', opp: 4.80, pct: 11.2 },
      { name: 'PCBI Market Index Contracting', opp: 3.62, pct: 8.5 }
    ];

    const startY = 100;
    const barH = 21;
    const gap = 8;
    const maxBarW = 430;

    levers.forEach((lev, idx) => {
      const y = startY + idx * (barH + gap);
      canvas.text(lev.name, PDF_LAYOUT.CONTENT_LEFT, y + 15, {
        fontSize: 9, font: 'bold', color: BRAND_COLORS.primaryText
      });
      const barX = PDF_LAYOUT.CONTENT_LEFT + 220;
      canvas.rect(barX, y, maxBarW, barH, { fill: '#F1F5F9', stroke: BRAND_COLORS.border, lineWidth: 0.5 });
      const fillW = (maxBarW * lev.pct) / 100;
      canvas.rect(barX, y, fillW, barH, { fill: BRAND_COLORS.procucevBlue });
      canvas.text(`Rs. ${lev.opp.toFixed(2)} Cr`, barX + maxBarW + 15, y + 15, {
        fontSize: 9.5, font: 'bold', color: BRAND_COLORS.primaryText
      });
    });

    const calloutX = 770;
    const calloutY = 100;
    canvas.rect(calloutX, calloutY, 150, 160, {
      fill: BRAND_COLORS.lightCard, stroke: BRAND_COLORS.procucevBlue, lineWidth: 1.5
    });
    canvas.text('GROSS IDENTIFIED', calloutX + 14, calloutY + 28, {
      fontSize: 8.5, font: 'bold', color: BRAND_COLORS.secondaryText
    });
    canvas.text('OPPORTUNITY', calloutX + 14, calloutY + 44, {
      fontSize: 8.5, font: 'bold', color: BRAND_COLORS.secondaryText
    });
    canvas.text(`Rs. ${activeContract.grossOpportunityCr.toFixed(2)} Cr`,
      calloutX + 14, calloutY + 84, {
        fontSize: 16, font: 'bold', color: BRAND_COLORS.procucevBlue
      });
    canvas.textBlock(
      'Individual opportunities are assessed independently and deduplicated before establishing the net defensible pipeline.',
      calloutX + 14, calloutY + 110, 122, {
        fontSize: 8, color: BRAND_COLORS.secondaryText, lineHeight: 12
      }
    );

    canvas.rect(PDF_LAYOUT.CONTENT_LEFT, 400, PDF_LAYOUT.CONTENT_WIDTH, 42, {
      fill: BRAND_COLORS.lightCard, stroke: BRAND_COLORS.border, lineWidth: 0.75
    });
    canvas.text(
      'Individual opportunities are assessed independently and deduplicated before establishing the net defensible pipeline.',
      PDF_LAYOUT.CONTENT_LEFT + 16, 425, {
        fontSize: 9, font: 'regular', color: BRAND_COLORS.secondaryText
      }
    );

    canvas.text(
      'Detailed sourcing evidence: Boardroom & Evidence Edition - Slides 9, 14-19',
      PDF_LAYOUT.CONTENT_LEFT, 465, {
        fontSize: 9, font: 'italic', color: BRAND_COLORS.secondaryText
      }
    );
  }

  renderExecutiveOpportunityBriefFooter(canvas, 3);
}
