/**
 * Executive Brief Slide 7 - Diagnostic Baseline (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strict 10 x 5.625 inch grid, Aptos typography, 4 hero metrics, process flow, and integrity guarantee.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  PDF_LAYOUT,
  BRAND_COLORS,
  TYPOGRAPHY,
  getExecutiveBriefPresentationContract,
  isCustomerAssessment
} from '../constants/executiveBriefPresentationConstants';

export function renderSlide7DiagnosticBaseline(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  const contract = getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);

  canvas.addPage();
  canvas.renderHeader(
    'Diagnostic Baseline: Transaction Ingestion & Invariant Provenance',
    'Diagnostic Baseline',
    p
  );

  // 4 Hero Metrics (32 pt numbers)
  const cardW = 207;
  const cardH = 92;
  const startY = 104;

  canvas.kpiCard(
    PDF_LAYOUT.CONTENT_LEFT,
    startY,
    cardW,
    cardH,
    'Total Spend Evaluated',
    `₹${contract.totalCustomerSpendCr.toFixed(isCust ? 4 : 2)} Cr`,
    contract.analysisPeriod,
    BRAND_COLORS.procucevBlue
  );
  canvas.kpiCard(
    PDF_LAYOUT.CONTENT_LEFT + 219,
    startY,
    cardW,
    cardH,
    'Invoiced Transactions',
    `${contract.baselineTransactions.toLocaleString('en-IN')} Records`,
    '100% Cleansed & Normalized',
    BRAND_COLORS.accentGreen
  );
  canvas.kpiCard(
    PDF_LAYOUT.CONTENT_LEFT + 438,
    startY,
    cardW,
    cardH,
    'Active Supplier Base',
    `${contract.baselineSuppliers} Suppliers`,
    'Transacting Commercial Vendors',
    '#0284C7'
  );
  canvas.kpiCard(
    PDF_LAYOUT.CONTENT_LEFT + 657,
    startY,
    cardW,
    cardH,
    'Procurement Taxonomy',
    `${contract.baselineMaterialGroups} Material Groups`,
    'UNSPSC Level 4 Mapped',
    BRAND_COLORS.secondaryText
  );

  // Section Subheading
  canvas.text(
    'DATA-TO-VALUE CONVERSION PIPELINE',
    PDF_LAYOUT.CONTENT_LEFT,
    224,
    { fontSize: TYPOGRAPHY.sectionLabelSize, font: 'bold', color: BRAND_COLORS.primaryText }
  );

  // Visual Process Flow: CUSTOMER DATA -> MODULE 1 -> MODULE 2 -> MODULE 3 -> MODULE 4 -> EXECUTIVE VALUE BRIEF
  const flowStages = [
    { name: 'CUSTOMER DATA', desc: 'Raw SAP/ERP invoices & POs', metric: `${contract.baselineTransactions.toLocaleString('en-IN')} Records` },
    { name: 'MODULE 1', desc: 'Spend Diagnostic & Taxonomy', metric: `₹${contract.totalCustomerSpendCr.toFixed(isCust ? 4 : 2)} Cr` },
    { name: 'MODULE 2', desc: 'Strategic Sourcing Levers', metric: isCust ? '4 Sourcing Levers' : '10 Sourcing Levers' },
    { name: 'MODULE 3', desc: 'PCBI Market Benchmarks', metric: isCust ? 'UNAVAILABLE (Isolated)' : '28 Commodity Indices' },
    { name: 'MODULE 4', desc: 'Execution & Realization', metric: `₹${contract.validatedSavingsCr.toFixed(isCust ? 3 : 2)} Cr Proven` },
    { name: 'EXECUTIVE BRIEF', desc: 'Boardroom Decision Report', metric: `₹${contract.netDefensiblePipelineCr.toFixed(isCust ? 3 : 2)} Cr Net Pipeline` }
  ];

  const stageW = 138;
  const stageH = 120;
  const flowY = 242;

  flowStages.forEach((st, idx) => {
    const x = PDF_LAYOUT.CONTENT_LEFT + idx * (stageW + 7);
    canvas.rect(x, flowY, stageW, stageH, {
      fill: BRAND_COLORS.lightCard,
      stroke: BRAND_COLORS.border,
      lineWidth: 1
    });
    canvas.rect(x, flowY, stageW, 3, {
      fill: idx === 5 ? BRAND_COLORS.accentGreen : BRAND_COLORS.procucevBlue
    });
    canvas.text(st.name, x + 10, flowY + 22, {
      fontSize: 9.5,
      font: 'bold',
      color: idx === 5 ? BRAND_COLORS.accentGreen : BRAND_COLORS.procucevBlue
    });
    canvas.textBlock(st.desc, x + 10, flowY + 40, stageW - 20, {
      fontSize: 8.5,
      color: BRAND_COLORS.secondaryText,
      lineHeight: 12
    });
    canvas.rect(x + 8, flowY + 84, stageW - 16, 26, {
      fill: BRAND_COLORS.canvas,
      stroke: BRAND_COLORS.border,
      lineWidth: 0.5
    });
    canvas.text(st.metric, x + 14, flowY + 101, {
      fontSize: 8.5,
      font: 'bold',
      color: BRAND_COLORS.primaryText
    });
  });

  // Integrity Assurance Strip
  const stripY = 388;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, stripY, PDF_LAYOUT.CONTENT_WIDTH, 94, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.text(
    'MATHEMATICAL INTEGRITY GUARANTEE',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    stripY + 24,
    { fontSize: TYPOGRAPHY.cardLabelSize, font: 'bold', color: BRAND_COLORS.procucevBlue }
  );
  canvas.textBlock(
    'Every rupee in this assessment is anchored to reconciled invoiced transactions. Zero synthetic extrapolation. ' +
    'Addressable baseline of ₹4,931.00 Cr reflects commercial procurement spend after removing non-controllable ' +
    'taxes, statutory charges, and inter-company transfers.',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    stripY + 44,
    PDF_LAYOUT.CONTENT_WIDTH - 40,
    { fontSize: 10, color: BRAND_COLORS.secondaryText, lineHeight: 15 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}
