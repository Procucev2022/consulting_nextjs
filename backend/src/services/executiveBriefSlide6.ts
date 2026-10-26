/**
 * Executive Brief Slide 6 (Prompt 283 & Prompt 503)
 * Implements Procurement Impact on Business (Slide 2 of Customer Context).
 * Strictly limits customer context to 2 slides and preserves demonstration archetype outputs.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  PDF_LAYOUT,
  BRAND_COLORS
} from '../constants/executiveBriefLayoutConstants';
import {
  getExecutiveBriefPresentationContract,
  isCustomerAssessment
} from '../constants/executiveBriefPresentationConstants';

export function renderSlide6WhyProcurementMatters(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  const isCust = isCustomerAssessment(clientName);
  const contract = getExecutiveBriefPresentationContract(clientName);

  if (isCust) {
    canvas.renderHeader(`Procurement Impact on Business: ${clientName}`, 'Procurement Impact (Slide 2 of 2)', p);

    const bW = 416;
    const bY = 106;

    // Left Box: Spend & Category Relevance
    canvas.rect(PDF_LAYOUT.CONTENT_LEFT, bY, bW, 320, {
      fill: BRAND_COLORS.lightCard, stroke: BRAND_COLORS.border, lineWidth: 1
    });
    canvas.rect(PDF_LAYOUT.CONTENT_LEFT, bY, bW, 4, { fill: BRAND_COLORS.procucevBlue });
    canvas.text('ASSESSED SPEND & PROCUREMENT PRIORITIES', PDF_LAYOUT.CONTENT_LEFT + 20, bY + 28, {
      fontSize: 10, font: 'bold', color: BRAND_COLORS.procucevBlue
    });

    canvas.text('Evaluated Spend Footprint:', PDF_LAYOUT.CONTENT_LEFT + 20, bY + 54, {
      fontSize: 9.5, font: 'bold', color: BRAND_COLORS.primaryText
    });
    canvas.textBlock(
      `Rs. ${contract.totalCustomerSpendCr.toFixed(4)} Cr evaluated spend across ` +
      `${contract.baselineTransactions.toLocaleString()} invoices and ${contract.baselineSuppliers} active suppliers.`,
      PDF_LAYOUT.CONTENT_LEFT + 20, bY + 72, bW - 40, {
        fontSize: 9.5, color: BRAND_COLORS.primaryText, lineHeight: 14
      }
    );

    canvas.text('Key Assessed Procurement Categories:', PDF_LAYOUT.CONTENT_LEFT + 20, bY + 120, {
      fontSize: 9.5, font: 'bold', color: BRAND_COLORS.primaryText
    });
    const cats = [
      'Synthetic Polymers & Viscose Raw Fibers (Direct Material)',
      'Specialty Chemical Dyes & Finishing Auxiliaries',
      'Corrugated & Industrial Packaging Materials',
      'Captive Power Fuel & Energy Inputs',
      'Plant Electrical & Mechanical Maintenance Spares (MRO)'
    ];
    cats.forEach((ct, cIdx) => {
      canvas.textBlock(`* ${ct}`, PDF_LAYOUT.CONTENT_LEFT + 20, bY + 140 + cIdx * 24, bW - 40, {
        fontSize: 8.5, color: BRAND_COLORS.secondaryText, lineHeight: 12
      });
    });

    canvas.text('Top Customer-Specific Procurement Priorities:', PDF_LAYOUT.CONTENT_LEFT + 20, bY + 265, {
      fontSize: 9.5, font: 'bold', color: BRAND_COLORS.primaryText
    });
    canvas.textBlock(
      '1. Cross-plant unit price harmonization across 6 manufacturing units.\n' +
      '2. Preferred supplier consolidation across fragmented vendor base.',
      PDF_LAYOUT.CONTENT_LEFT + 20, bY + 282, bW - 40, {
        fontSize: 8.5, color: BRAND_COLORS.primaryText, lineHeight: 13
      }
    );

    // Right Box: Value Bridge & Action
    const rightX = PDF_LAYOUT.CONTENT_LEFT + bW + 24;
    const rightW = 424;
    canvas.rect(rightX, bY, rightW, 320, {
      fill: BRAND_COLORS.lightCard, stroke: BRAND_COLORS.border, lineWidth: 1
    });
    canvas.rect(rightX, bY, rightW, 4, { fill: BRAND_COLORS.accentGreen });
    canvas.text('APPROVED VALUE DISCOVERY & P&L IMPACT', rightX + 20, bY + 28, {
      fontSize: 10, font: 'bold', color: BRAND_COLORS.accentGreen
    });

    const valCards = [
      {
        l: 'NET MODELLED OPPORTUNITY',
        v: `Rs. ${contract.netDefensiblePipelineCr.toFixed(3)} Cr`,
        d: `Gross Rs. ${contract.grossOpportunityCr.toFixed(3)} Cr less Overlaps Rs. ${contract.overlapDeductionsCr.toFixed(3)} Cr (~30.0% EBITDA)`
      },
      {
        l: 'PROVEN OPPORTUNITY',
        v: `Rs. ${contract.validatedSavingsCr.toFixed(3)} Cr`,
        d: 'Evidence-based commercial validation under existing criteria'
      },
      {
        l: 'REALIZED SAVINGS',
        v: `Rs. ${contract.realizedSavingsCr.toFixed(2)} Cr`,
        d: 'Realized savings zero until contract deployment and billing execution'
      }
    ];

    valCards.forEach((vc, idx) => {
      const vy = bY + 54 + idx * 62;
      canvas.rect(rightX + 16, vy, rightW - 32, 54, { fill: '#F8FAFC', stroke: BRAND_COLORS.border, lineWidth: 0.5 });
      canvas.text(vc.l, rightX + 26, vy + 16, { fontSize: 8, font: 'bold', color: BRAND_COLORS.secondaryText });
      canvas.text(vc.v, rightX + 26, vy + 33, { fontSize: 13, font: 'bold', color: BRAND_COLORS.accentGreen });
      canvas.text(vc.d, rightX + 26, vy + 46, { fontSize: 7.5, color: BRAND_COLORS.secondaryText });
    });

    const recY = bY + 248;
    canvas.rect(rightX + 16, recY, rightW - 32, 58, { fill: '#ECFDF5', stroke: BRAND_COLORS.accentGreen, lineWidth: 1 });
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
    const calloutY = 436;
    canvas.rect(PDF_LAYOUT.CONTENT_LEFT, calloutY, PDF_LAYOUT.CONTENT_WIDTH, 54, {
      fill: '#FFFBEB', stroke: '#FDE68A', lineWidth: 1
    });
    canvas.text('PCBI BENCHMARK GOVERNANCE', PDF_LAYOUT.CONTENT_LEFT + 20, calloutY + 18, {
      fontSize: 8.5, font: 'bold', color: '#B45309'
    });
    canvas.text(
      'PCBI Benchmark Price Gap: UNAVAILABLE for this assessment (Empirical PCBI benchmark index not commissioned). No surrogate benchmark substituted.',
      PDF_LAYOUT.CONTENT_LEFT + 20, calloutY + 36, {
        fontSize: 9, font: 'bold', color: '#92400E'
      }
    );
  } else {
    // Demonstration Archetype Slide 6
    canvas.renderHeader('Strategic Alignment: Procurement Value Creation Map [DEMONSTRATION ARCHETYPE]', 'Strategic Alignment', p);

    const mapY = 104;
    const rowH = 54;
    const rows = [
      {
        char: 'Decentralized Multi-Plant Network',
        imp: 'Autonomous plant buying leads to regional rate divergence',
        hyp: 'Rate harmonization across 26 units captures ₹42.80 Cr'
      },
      {
        char: 'Capital-Intensive Logistics & Freight',
        imp: 'High freight sensitivity with multiple carrier contracts',
        hyp: 'Dynamic e-auctions capture ₹31.50 Cr across freight & packing'
      },
      {
        char: 'Fragmented Tail Vendor Base',
        imp: '912 tail suppliers drive heavy operational processing load',
        hyp: 'Vendor rationalization yields ₹26.40 Cr indicative value'
      },
      {
        char: 'High Input Commodity Volatility',
        imp: 'Coal, petcoke, and additives expose EBITDA to market swings',
        hyp: 'PCBI index formulas deliver ₹14.88 Cr strategic market upside'
      },
      {
        char: 'Specification Diversity Across Units',
        imp: 'Duplicate SKU specs prevent national volume aggregation',
        hyp: 'National spec pooling captures ₹22.10 Cr OEM volume pricing'
      }
    ];

    rows.forEach((rw, idx) => {
      const y = mapY + idx * (rowH + 10);
      canvas.rect(PDF_LAYOUT.CONTENT_LEFT, y, PDF_LAYOUT.CONTENT_WIDTH, rowH, {
        fill: BRAND_COLORS.lightCard,
        stroke: BRAND_COLORS.border,
        lineWidth: 1
      });

      canvas.text(rw.char, PDF_LAYOUT.CONTENT_LEFT + 16, y + 22, {
        fontSize: 9.5,
        font: 'bold',
        color: BRAND_COLORS.primaryText
      });
      canvas.text('Industrial Characteristic', PDF_LAYOUT.CONTENT_LEFT + 16, y + 40, {
        fontSize: 8,
        color: BRAND_COLORS.secondaryText
      });

      canvas.text('->', PDF_LAYOUT.CONTENT_LEFT + 250, y + 30, {
        fontSize: 14,
        font: 'bold',
        color: BRAND_COLORS.procucevBlue
      });

      canvas.textBlock(rw.imp, PDF_LAYOUT.CONTENT_LEFT + 280, y + 16, 260, {
        fontSize: 9,
        color: BRAND_COLORS.secondaryText,
        lineHeight: 13
      });

      canvas.text('->', PDF_LAYOUT.CONTENT_LEFT + 555, y + 30, {
        fontSize: 14,
        font: 'bold',
        color: BRAND_COLORS.accentGreen
      });

      canvas.textBlock(rw.hyp, PDF_LAYOUT.CONTENT_LEFT + 580, y + 16, 260, {
        fontSize: 9.5,
        font: 'bold',
        color: BRAND_COLORS.procucevBlue,
        lineHeight: 14
      });
    });

    const calloutY = 432;
    canvas.rect(PDF_LAYOUT.CONTENT_LEFT, calloutY, PDF_LAYOUT.CONTENT_WIDTH, 62, {
      fill: '#EFF6FF',
      stroke: BRAND_COLORS.procucevBlue,
      lineWidth: 1.5
    });
    canvas.text('EXECUTIVE HYPOTHESIS', PDF_LAYOUT.CONTENT_LEFT + 20, calloutY + 20, {
      fontSize: 9,
      font: 'bold',
      color: BRAND_COLORS.procucevBlue
    });
    canvas.textBlock(
      'UltraTech can capture ₹78.72 Cr in net direct recurring cost reductions within 24 months ' +
      'without operational disruption through systematic cross-plant rate alignment and supplier consolidation.',
      PDF_LAYOUT.CONTENT_LEFT + 20,
      calloutY + 36,
      PDF_LAYOUT.CONTENT_WIDTH - 40,
      { fontSize: 10, font: 'bold', color: BRAND_COLORS.primaryText, lineHeight: 14 }
    );
  }

  canvas.renderFooter(clientName, conf, p, total);
}
