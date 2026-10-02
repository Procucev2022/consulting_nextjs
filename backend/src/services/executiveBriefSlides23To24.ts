/**
 * Executive Brief Slides 23 to 24 (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strict 10 x 5.625 inch grid, Aptos typography, maturity flow, and Wave 1 ledger.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  PDF_LAYOUT,
  BRAND_COLORS
} from '../constants/executiveBriefPresentationConstants';

export function renderSlide23ExecutionPipeline(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Savings Realization Pipeline: Governance from Opportunity to P&L', 'Execution Governance', p);

  // Horizontal Maturity Flow (5 Stages)
  const stages = [
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

  // Left Card: Wave 1 Validation Standard
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, gridY, gridW, gridH, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, gridY, gridW, 4, { fill: BRAND_COLORS.accentGreen });
  canvas.text(
    'WAVE 1 VALIDATED SAVINGS: ₹47.90 Cr',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    gridY + 26,
    { fontSize: 9.5, font: 'bold', color: BRAND_COLORS.accentGreen }
  );
  canvas.textBlock(
    'Wave 1 initiatives represent immediate, low-risk sourcing interventions that have passed engineering specification ' +
    'reviews and vendor capacity checks. These 5 initiatives can be deployed within 90 days for cash savings.',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    gridY + 50,
    gridW - 40,
    { fontSize: 10, color: BRAND_COLORS.primaryText, lineHeight: 15 }
  );

  // Right Card: Classified Realized Savings
  const rightGridX = PDF_LAYOUT.CONTENT_LEFT + gridW + 16;
  canvas.rect(rightGridX, gridY, gridW, gridH, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.rect(rightGridX, gridY, gridW, 4, { fill: BRAND_COLORS.accentAmber });
  canvas.text(
    'CLASSIFIED REALIZED SAVINGS: ₹68.00 Cr *',
    rightGridX + 20,
    gridY + 26,
    { fontSize: 9.5, font: 'bold', color: BRAND_COLORS.accentAmber }
  );
  canvas.textBlock(
    '* Classified Realized Savings represents separate historical realized savings tracked in Procucev forensic database; ' +
    'not additive to Wave-1 opportunity. Prevents double-counting between past completed initiatives and forward pipeline.',
    rightGridX + 20,
    gridY + 50,
    gridW - 40,
    { fontSize: 10, color: BRAND_COLORS.primaryText, lineHeight: 15 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}

export function renderSlide24InitiativeLedger(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Savings Realization: Wave 1 Initiative Tracking & Milestone Status', 'Initiative Ledger', p);

  // Clean Professional Table (5 Rows, strictly <= 7 rows)
  const headers = [
    'Initiative Name',
    'Category',
    'Target Levers',
    'Addressable Spend',
    'Validated Opportunity',
    'Timeline'
  ];
  const rows = [
    ['Packaging Bags Master E-Auction', 'Packaging', 'E-Auction & Index Linkage', '₹947.26 Cr', '₹14.50 Cr', 'Days 1-30'],
    ['Grinding Media Rate Harmonization', 'Consumables', 'Price Variance Arbitrage', '₹412.00 Cr', '₹11.20 Cr', 'Days 15-45'],
    ['Imported Fuel Benchmark Realignment', 'Energy', 'PCBI Benchmark Index', '₹1,480.09 Cr', '₹9.80 Cr', 'Days 30-60'],
    ['Industrial Lubricants Synthetic Pooling', 'Maintenance', 'Volume Aggregation & OEM', '₹186.00 Cr', '₹6.40 Cr', 'Days 45-75'],
    ['Refractory Bricks Spec Standardization', 'Raw Materials', 'Vendor Panelling & Aggregation', '₹265.00 Cr', '₹6.00 Cr', 'Days 60-90']
  ];

  const colWidths = [220, 100, 190, 120, 140, 94];
  canvas.table(PDF_LAYOUT.CONTENT_LEFT, 106, PDF_LAYOUT.CONTENT_WIDTH, headers, rows, colWidths);

  // Total Summary Strip
  const sumY = 270;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, sumY, PDF_LAYOUT.CONTENT_WIDTH, 48, {
    fill: '#EFF6FF',
    stroke: BRAND_COLORS.procucevBlue,
    lineWidth: 1.5
  });
  canvas.text(
    'TOTAL WAVE 1 VALIDATED OPPORTUNITY:',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    sumY + 28,
    { fontSize: 10, font: 'bold', color: BRAND_COLORS.procucevBlue }
  );
  canvas.text('₹47.90 Cr', PDF_LAYOUT.CONTENT_LEFT + 320, sumY + 30, {
    fontSize: 14,
    font: 'bold',
    color: BRAND_COLORS.procucevBlue
  });
  canvas.text(
    '(Ready for Immediate 90-Day Execution across 5 Pre-Qualified Initiatives)',
    PDF_LAYOUT.CONTENT_LEFT + 410,
    sumY + 28,
    { fontSize: 9.5, color: BRAND_COLORS.secondaryText }
  );

  // Bottom Execution Confidence Grid
  const confY = 338;
  const confW = 424;
  const confH = 152;

  // Left Box: Supplier Qualification
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, confY, confW, confH, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, confY, confW, 4, { fill: BRAND_COLORS.accentGreen });
  canvas.text(
    'PRE-QUALIFIED SUPPLIER READINESS',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    confY + 26,
    { fontSize: 9.5, font: 'bold', color: BRAND_COLORS.accentGreen }
  );
  canvas.textBlock(
    'All 5 Wave 1 initiatives have identified >= 3 pre-qualified manufacturers with verified production capacity. ' +
    'Technical specifications have been matched against plant engineering standards to prevent quality rejections.',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    confY + 48,
    confW - 40,
    { fontSize: 10, color: BRAND_COLORS.primaryText, lineHeight: 15 }
  );

  // Right Box: P&L Cash Realization
  const rightConfX = PDF_LAYOUT.CONTENT_LEFT + confW + 16;
  canvas.rect(rightConfX, confY, confW, confH, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.rect(rightConfX, confY, confW, 4, { fill: BRAND_COLORS.procucevBlue });
  canvas.text(
    'DIRECT P&L CASH SAVINGS TIMELINE',
    rightConfX + 20,
    confY + 26,
    { fontSize: 9.5, font: 'bold', color: BRAND_COLORS.procucevBlue }
  );
  canvas.textBlock(
    'Realized savings flow directly into plant operational budgets starting Month 2 of implementation. ' +
    'The Procucev invoice tracking dashboard matches every invoice rate against baseline contracts.',
    rightConfX + 20,
    confY + 48,
    confW - 40,
    { fontSize: 10, color: BRAND_COLORS.primaryText, lineHeight: 15 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}
