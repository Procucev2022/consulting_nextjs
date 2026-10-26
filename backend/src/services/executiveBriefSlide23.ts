/**
 * Executive Brief Slide 23 (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Savings Realization Pipeline: Governance from Opportunity to P&L
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  PDF_LAYOUT,
  BRAND_COLORS,
  getExecutiveBriefPresentationContract,
  isCustomerAssessment,
  formatPresentationValues
} from '../constants/executiveBriefPresentationConstants';

interface MaturityStage {
  num: string;
  title: string;
  stat: string;
  sub: string;
  desc: string;
  color: string;
}

export function renderSlide23ExecutionPipeline(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Savings Realization Pipeline: Governance from Opportunity to P&L', 'Execution Governance', p);

  const contract = getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);
  const fmt = formatPresentationValues(contract, isCust);

  // Horizontal Maturity Flow (5 Stages)
  const stages: MaturityStage[] = isCust
    ? [
        {
          num: 'STAGE 1',
          title: 'IDENTIFIED',
          stat: fmt.grossOpportunityFormatted,
          sub: 'Gross Levers',
          desc: 'Sum of individual lever potentials before interaction deduplication.',
          color: BRAND_COLORS.secondaryText
        },
        {
          num: 'STAGE 2',
          title: 'DEDUPLICATED',
          stat: fmt.netDirectSavingsFormatted,
          sub: 'Net Pipeline',
          desc: `Rigorous deduction of ${fmt.overlapDeductionsFormatted} cross-lever overlaps.`,
          color: BRAND_COLORS.procucevBlue
        },
        {
          num: 'STAGE 3',
          title: 'PROVEN',
          stat: fmt.provenOpportunityFormatted,
          sub: 'Proven Opportunity',
          desc: 'Transaction-level price variance proof verified across ERP invoices with zero speculation.',
          color: BRAND_COLORS.accentGreen
        },
        {
          num: 'STAGE 4',
          title: 'CONTRACTED',
          stat: 'Wave 1 Awards',
          sub: 'Commercial Contracts',
          desc: 'Master framework agreements, competitive e-auctions, and index formulas ready for award.',
          color: '#0284C7'
        },
        {
          num: 'STAGE 5',
          title: 'REALIZED',
          stat: fmt.realizedSavingsFormatted,
          sub: 'Audited Realized *',
          desc: 'Realized savings remain ₹0.00 Cr until post-award ERP invoices are verified against new contracts.',
          color: BRAND_COLORS.accentAmber
        }
      ]
    : [
        {
          num: 'STAGE 1',
          title: 'IDENTIFIED',
          stat: '₹173.12 Cr',
          sub: 'Gross Levers',
          desc: 'Sum of individual lever potentials before interaction deduplication.',
          color: BRAND_COLORS.secondaryText
        },
        {
          num: 'STAGE 2',
          title: 'DEDUPLICATED',
          stat: '₹93.60 Cr',
          sub: 'Net Pipeline',
          desc: 'Rigorous deduction of ₹62.80 Cr overlaps and ₹16.72 Cr exclusions.',
          color: BRAND_COLORS.procucevBlue
        },
        {
          num: 'STAGE 3',
          title: 'VALIDATED',
          stat: '₹47.90 Cr',
          sub: 'Wave 1 Ready',
          desc: 'Verified vendor capacity, approved specs, and 90-day tender readiness.',
          color: BRAND_COLORS.accentGreen
        },
        {
          num: 'STAGE 4',
          title: 'CONTRACTED',
          stat: 'Wave 1 Awards',
          sub: 'Commercial Contracts',
          desc: 'Legally binding master contracts, e-auction awards, and index formulas.',
          color: '#0284C7'
        },
        {
          num: 'STAGE 5',
          title: 'REALIZED',
          stat: '₹68.00 Cr',
          sub: 'Classified Realized *',
          desc: 'Audited ERP invoice payments showing direct P&L recurring EBITDA expansion.',
          color: BRAND_COLORS.accentAmber
        }
      ];

  const colW = 162;
  const colH = 200;
  const startY = 104;

  stages.forEach((st, idx) => {
    const x = PDF_LAYOUT.CONTENT_LEFT + idx * (colW + 13);
    canvas.rect(x, startY, colW, colH, {
      fill: BRAND_COLORS.lightCard,
      stroke: BRAND_COLORS.border,
      lineWidth: 1
    });
    canvas.rect(x, startY, colW, 4, { fill: st.color });

    canvas.text(st.num, x + 14, startY + 24, { fontSize: 8, font: 'bold', color: st.color });
    canvas.text(st.title, x + 14, startY + 44, { fontSize: 11, font: 'bold', color: BRAND_COLORS.primaryText });
    canvas.text(st.stat, x + 14, startY + 74, { fontSize: 16, font: 'bold', color: st.color });
    canvas.text(st.sub, x + 14, startY + 94, { fontSize: 8, font: 'bold', color: BRAND_COLORS.secondaryText });
    canvas.line(x + 14, startY + 106, x + colW - 14, startY + 106, BRAND_COLORS.border, 0.5);
    canvas.textBlock(st.desc, x + 14, startY + 120, colW - 28, {
      fontSize: 8.5,
      color: BRAND_COLORS.secondaryText,
      lineHeight: 12
    });
  });

  // Governance & Verification Grid
  const gridY = 324;
  const gridW = 424;
  const gridH = 166;

  // Left Card: Validation Standard
  const leftTitle = isCust
    ? `PROVEN SOURCING OPPORTUNITY: ${fmt.provenOpportunityFormatted}`
    : 'WAVE 1 VALIDATED SAVINGS: ₹47.90 Cr';
  const leftDesc = isCust
    ? `Directly evidenced across 23,570 ERP transaction records spanning ${contract.baselineSuppliers} suppliers. ` +
      'Supported by empirical price dispersion across operating units, providing immediate execution readiness.'
    : 'Wave 1 initiatives represent immediate, low-risk sourcing interventions that have passed engineering specification ' +
      'reviews and vendor capacity checks. These 5 initiatives can be deployed within 90 days for cash savings.';

  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, gridY, gridW, gridH, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, gridY, gridW, 4, { fill: BRAND_COLORS.accentGreen });
  canvas.text(
    leftTitle,
    PDF_LAYOUT.CONTENT_LEFT + 20,
    gridY + 26,
    { fontSize: 9.5, font: 'bold', color: BRAND_COLORS.accentGreen }
  );
  canvas.textBlock(
    leftDesc,
    PDF_LAYOUT.CONTENT_LEFT + 20,
    gridY + 50,
    gridW - 40,
    { fontSize: 10, color: BRAND_COLORS.primaryText, lineHeight: 15 }
  );

  // Right Card: Realized Savings Governance
  const rightGridX = PDF_LAYOUT.CONTENT_LEFT + gridW + 16;
  const rightTitle = isCust
    ? `REALIZED SAVINGS STATUS: ${fmt.realizedSavingsFormatted} *`
    : 'CLASSIFIED REALIZED SAVINGS: ₹68.00 Cr *';
  const rightDesc = isCust
    ? '* Realized Savings strictly reflect post-implementation ERP invoice payments. Value remains strictly ₹0.00 Cr ' +
      'during assessment phase to maintain forensic audit integrity and eliminate premature savings claims.'
    : '* Classified Realized Savings represents separate historical realized savings tracked in Procucev forensic database; ' +
      'not additive to Wave-1 opportunity. Prevents double-counting between past completed initiatives and forward pipeline.';

  canvas.rect(rightGridX, gridY, gridW, gridH, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.rect(rightGridX, gridY, gridW, 4, { fill: BRAND_COLORS.accentAmber });
  canvas.text(
    rightTitle,
    rightGridX + 20,
    gridY + 26,
    { fontSize: 9.5, font: 'bold', color: BRAND_COLORS.accentAmber }
  );
  canvas.textBlock(
    rightDesc,
    rightGridX + 20,
    gridY + 50,
    gridW - 40,
    { fontSize: 10, color: BRAND_COLORS.primaryText, lineHeight: 15 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}
