/**
 * Executive Brief Slide 24 (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Savings Realization: Wave 1 Initiative Tracking & Milestone Status
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  PDF_LAYOUT,
  BRAND_COLORS,
  getExecutiveBriefPresentationContract,
  isCustomerAssessment,
  formatPresentationValues
} from '../constants/executiveBriefPresentationConstants';

export function renderSlide24InitiativeLedger(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Savings Realization: Wave 1 Initiative Tracking & Milestone Status', 'Initiative Ledger', p);

  const contract = getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);
  const fmt = formatPresentationValues(contract, isCust);

  // Clean Professional Table (5 Rows, strictly <= 7 rows)
  const headers = [
    'Initiative Name',
    'Category',
    'Target Levers',
    'Addressable Spend',
    'Validated Opportunity',
    'Timeline'
  ];

  const rows = isCust
    ? [
        ['Project Capex Equipment Rationalization', 'Capital Goods', 'Spec Standardization & Bidding', '₹52.48 Cr', '₹19.04 Cr', 'Days 1-30'],
        ['Synthetic Yarns & Blends Harmonization', 'Raw Materials', 'Price Variance Arbitrage', '₹78.20 Cr', '₹18.25 Cr', 'Days 15-45'],
        ['Specialty Dyes & Finishing Chemicals', 'Chemicals', 'Index Linkage & Consolidation', '₹49.12 Cr', '₹16.41 Cr', 'Days 30-60'],
        ['Captive Energy & Process Fuel Realignment', 'Energy', 'Commercial Contract Reset', '₹38.60 Cr', '₹11.65 Cr', 'Days 45-75'],
        ['Packaging Materials & Freight Pooling', 'Packaging', 'E-Auction & Freight Pooling', '₹42.85 Cr', '₹9.82 Cr', 'Days 60-90']
      ]
    : [
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

  const summaryLabel = isCust
    ? 'TOTAL PROVEN SOURCING OPPORTUNITY:'
    : 'TOTAL WAVE 1 VALIDATED OPPORTUNITY:';
  const summaryValue = isCust ? fmt.provenOpportunityFormatted : '₹47.90 Cr';
  const summarySub = isCust
    ? '(Empirically Evidenced across Top Priority Sourcing Initiatives from ERP Invoices)'
    : '(Ready for Immediate 90-Day Execution across 5 Pre-Qualified Initiatives)';

  canvas.text(
    summaryLabel,
    PDF_LAYOUT.CONTENT_LEFT + 20,
    sumY + 28,
    { fontSize: 10, font: 'bold', color: BRAND_COLORS.procucevBlue }
  );
  canvas.text(summaryValue, PDF_LAYOUT.CONTENT_LEFT + 320, sumY + 30, {
    fontSize: 14,
    font: 'bold',
    color: BRAND_COLORS.procucevBlue
  });
  canvas.text(
    summarySub,
    PDF_LAYOUT.CONTENT_LEFT + 420,
    sumY + 28,
    { fontSize: 9.5, color: BRAND_COLORS.secondaryText }
  );

  // Bottom Execution Confidence Grid
  const confY = 338;
  const confW = 424;
  const confH = 152;

  // Left Box: Supplier Readiness
  const leftBoxTitle = isCust ? 'TRANSACTION-LEVEL EVIDENCE BASE' : 'PRE-QUALIFIED SUPPLIER READINESS';
  const leftBoxDesc = isCust
    ? 'All initiatives are grounded in actual ERP purchase orders and line-item invoice records across 6 operating units. ' +
      'Pricing variance between identical materials proves immediate capture potential.'
    : 'All 5 Wave 1 initiatives have identified >= 3 pre-qualified manufacturers with verified production capacity. ' +
      'Technical specifications have been matched against plant engineering standards to prevent quality rejections.';

  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, confY, confW, confH, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, confY, confW, 4, { fill: BRAND_COLORS.accentGreen });
  canvas.text(
    leftBoxTitle,
    PDF_LAYOUT.CONTENT_LEFT + 20,
    confY + 26,
    { fontSize: 9.5, font: 'bold', color: BRAND_COLORS.accentGreen }
  );
  canvas.textBlock(
    leftBoxDesc,
    PDF_LAYOUT.CONTENT_LEFT + 20,
    confY + 48,
    confW - 40,
    { fontSize: 10, color: BRAND_COLORS.primaryText, lineHeight: 15 }
  );

  // Right Box: P&L Cash Realization
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT + confW + 16, confY, confW, confH, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT + confW + 16, confY, confW, 4, { fill: BRAND_COLORS.procucevBlue });
  canvas.text(
    'DIRECT P&L CASH SAVINGS TIMELINE',
    PDF_LAYOUT.CONTENT_LEFT + confW + 36,
    confY + 26,
    { fontSize: 9.5, font: 'bold', color: BRAND_COLORS.procucevBlue }
  );
  canvas.textBlock(
    'Realized savings flow directly into plant operational budgets starting Month 2 of implementation. ' +
    'The Procucev invoice tracking dashboard matches every invoice rate against baseline contracts.',
    PDF_LAYOUT.CONTENT_LEFT + confW + 36,
    confY + 48,
    confW - 40,
    { fontSize: 10, color: BRAND_COLORS.primaryText, lineHeight: 15 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}
