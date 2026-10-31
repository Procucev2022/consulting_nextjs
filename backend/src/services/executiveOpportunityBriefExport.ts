import PptxGenJS from 'pptxgenjs';
import { EXECUTIVE_BRIEF_CONTENT_TYPES } from '../constants/executiveBriefExportConstants';
import { EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT } from '../constants/executiveOpportunityBriefConstants';
import type { ExecutiveOpportunityBriefReport } from '../types';
import { PdfCanvas } from '../utils/pdfCanvas';

const formatNumber = (value: number): string => value.toLocaleString('en-IN', {
  minimumFractionDigits: EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT.MONEY_DECIMAL_PLACES,
  maximumFractionDigits: EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT.MONEY_DECIMAL_PLACES
});

const formatCr = (value: number): string => `${formatNumber(value)}${EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT.CURRENCY_SUFFIX}`;

const opportunityLines = (report: ExecutiveOpportunityBriefReport): string[] => report.opportunities.map((item) =>
  `${item.category}: ${item.title} | ${formatCr(item.estimatedSavingsCr)} | ${item.status} | ${item.riskLevel}`
);

const slideRowBuilders: Record<number, (report: ExecutiveOpportunityBriefReport) => string[]> = {
  0: (report) => [
    report.tenant.enterpriseName,
    `Baseline spend: ${formatCr(report.metrics.totalSpendCr)}`,
    `Estimated savings register: ${formatCr(report.metrics.estimatedSavingsCr)}`,
    `Opportunities: ${report.metrics.opportunityCount.toLocaleString('en-IN')}`,
    `Transactions: ${report.metrics.transactionCount.toLocaleString('en-IN')}`
  ],
  1: (report) => [
    `Baseline transactions: ${report.metrics.transactionCount.toLocaleString('en-IN')}`,
    `Baseline spend: ${formatCr(report.metrics.totalSpendCr)}`,
    `Suppliers: ${report.metrics.supplierCount.toLocaleString('en-IN')}`,
    `Materials: ${report.metrics.materialCount.toLocaleString('en-IN')}`,
    `Plants: ${report.metrics.plantCount.toLocaleString('en-IN')}`,
    `Purchase orders: ${report.metrics.purchaseOrderCount.toLocaleString('en-IN')}`
  ],
  2: (report) => [
    `Register records: ${report.metrics.opportunityCount.toLocaleString('en-IN')}`,
    `Estimated savings: ${formatCr(report.metrics.estimatedSavingsCr)}`,
    ...opportunityLines(report).slice(0, EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT.MAX_ROWS - 2)
  ],
  3: (report) => report.levers.length > 0
    ? report.levers.map((group) => `${group.label}: ${formatCr(group.estimatedSavingsCr)} across ${group.count} records`)
    : [EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT.EMPTY_VALUE],
  4: (report) => report.statuses.length > 0
    ? report.statuses.map((group) => `${group.label}: ${group.count} records, ${formatCr(group.estimatedSavingsCr)}`)
    : [EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT.EMPTY_VALUE],
  5: (report) => [
    `Average recorded confidence: ${(report.metrics.averageConfidence * EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT.CONFIDENCE_MULTIPLIER).toFixed(0)}${EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT.CONFIDENCE_SUFFIX}`,
    ...(report.risks.length > 0
      ? report.risks.map((group) => `${group.label}: ${group.count} records, ${formatCr(group.estimatedSavingsCr)}`)
      : [EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT.EMPTY_VALUE])
  ],
  6: (report) => opportunityLines(report).slice(0, EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT.MAX_ROWS),
  7: (report) => [
    `Suppliers: ${report.metrics.supplierCount.toLocaleString('en-IN')}`,
    `Materials: ${report.metrics.materialCount.toLocaleString('en-IN')}`,
    `Plants: ${report.metrics.plantCount.toLocaleString('en-IN')}`,
    `Purchase orders: ${report.metrics.purchaseOrderCount.toLocaleString('en-IN')}`
  ],
  8: (report) => [
    report.scopeDescription,
    `Transaction period: ${report.metrics.firstTransactionDate ?? EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT.EMPTY_VALUE} to `
      + `${report.metrics.lastTransactionDate ?? EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT.EMPTY_VALUE}`,
    `Report generated: ${report.generatedAt}`
  ],
  9: (report) => {
    const actions = report.opportunities
      .map((item) => item.recommendedAction)
      .filter((item) => item.length > 0)
      .slice(0, EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT.MAX_ROWS);
    return actions.length > 0 ? actions : [EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT.UNAVAILABLE_ACTION];
  }
};

export const getExecutiveOpportunityBriefSlideRows = (
  report: ExecutiveOpportunityBriefReport,
  slideIndex: number
): string[] => slideRowBuilders[slideIndex]?.(report) ?? [EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT.EMPTY_VALUE];

const addPdfPage = (canvas: PdfCanvas, report: ExecutiveOpportunityBriefReport, slideIndex: number): void => {
  const {
    PAGE_WIDTH, PAGE_HEIGHT, MARGIN, ROW_GAP, SLIDE_TITLES, MAX_ROWS, FOOTER
  } = EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT;
  canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, { fill: '#F7F9FC' });
  canvas.rect(0, 0, PAGE_WIDTH, 8, { fill: '#1769E0' });
  canvas.text(SLIDE_TITLES[slideIndex], MARGIN, 58, { font: 'bold', fontSize: 25, color: '#172033' });
  canvas.text(report.tenant.enterpriseName, MARGIN, 88, { fontSize: 12, color: '#5B6472' });
  const rows = getExecutiveOpportunityBriefSlideRows(report, slideIndex).slice(0, MAX_ROWS);
  rows.forEach((row, index) => {
    const y = 142 + (index * ROW_GAP);
    canvas.rect(MARGIN, y - 20, PAGE_WIDTH - (MARGIN * 2), 26, { fill: '#FFFFFF', stroke: '#DCE3EC' });
    canvas.text(row, MARGIN + 12, y - 2, { fontSize: 12, color: '#172033' });
  });
  canvas.line(MARGIN, PAGE_HEIGHT - 48, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 48, '#DCE3EC');
  canvas.text(FOOTER, MARGIN, PAGE_HEIGHT - 28, { fontSize: 8, color: '#5B6472' });
  canvas.text(`${slideIndex + 1} / ${SLIDE_TITLES.length}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 28, {
    fontSize: 8,
    color: '#5B6472',
    align: 'right'
  });
};

export const generateExecutiveOpportunityBriefPdf = (report: ExecutiveOpportunityBriefReport): Uint8Array => {
  const canvas = new PdfCanvas(
    EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT.PAGE_WIDTH,
    EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT.PAGE_HEIGHT
  );
  EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT.SLIDE_TITLES.forEach((_title, index) => {
    if (index > 0) {
      canvas.addPage();
    }
    addPdfPage(canvas, report, index);
  });
  return canvas.toBytes();
};

export const generateExecutiveOpportunityBriefPptx = async (
  report: ExecutiveOpportunityBriefReport
): Promise<Uint8Array> => {
  const presentation = new PptxGenJS();
  presentation.layout = EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT.PPTX_LAYOUT;
  presentation.author = EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT.PPTX_AUTHOR;
  presentation.company = EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT.PPTX_COMPANY;
  presentation.title = `${EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT.PPTX_TITLE} - ${report.tenant.enterpriseName}`;
  EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT.SLIDE_TITLES.forEach((title, index) => {
    const slide = presentation.addSlide();
    slide.background = { color: 'F7F9FC' };
    slide.addText(title, { x: 0.6, y: 0.35, w: 8.8, h: 0.55, fontFace: 'Arial', fontSize: 24, bold: true, color: '172033' });
    slide.addText(report.tenant.enterpriseName, { x: 0.6, y: 0.95, w: 8.8, h: 0.3, fontFace: 'Arial', fontSize: 11, color: '5B6472' });
    const rows = getExecutiveOpportunityBriefSlideRows(report, index)
      .slice(0, EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT.MAX_ROWS);
    slide.addText(rows.map((text) => ({ text, options: { bullet: { indent: 14 }, breakLine: true } })), {
      x: 0.8,
      y: 1.55,
      w: 8.4,
      h: 3.1,
      fontFace: 'Arial',
      fontSize: 15,
      color: '172033',
      paraSpaceAfter: 12,
      valign: 'top'
    });
    slide.addText(`${EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT.FOOTER} | ${index + 1} / ${EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT.SLIDE_TITLES.length}`, {
      x: 0.6,
      y: 5.2,
      w: 8.8,
      h: 0.2,
      fontFace: 'Arial',
      fontSize: 8,
      color: '5B6472'
    });
  });
  const output = await presentation.write({ outputType: 'uint8array' });
  if (output instanceof Uint8Array) {
    return output;
  }
  throw new Error(EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT.POWERPOINT_OUTPUT_ERROR);
};

export const executiveOpportunityBriefContentType = (format: 'pdf' | 'pptx'): string =>
  format === 'pdf' ? EXECUTIVE_BRIEF_CONTENT_TYPES.PDF : EXECUTIVE_BRIEF_CONTENT_TYPES.PPTX;

export const executiveOpportunityBriefFilename = (
  tenantName: string,
  format: 'pdf' | 'pptx',
  reportDate: string
): string => {
  const safeTenant = tenantName
    .replace(EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT.TENANT_UNSAFE_CHARACTERS, '_')
    .replace(EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT.TENANT_EDGE_SEPARATORS, '') ||
    EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT.TENANT_FALLBACK;
  const safeDate = EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT.DATE_PATTERN.test(reportDate) ? reportDate : 'undated';
  return `${EXECUTIVE_OPPORTUNITY_BRIEF_ARTIFACT.PDF_NAME_PREFIX}${safeTenant}_${safeDate}.${format}`;
};
