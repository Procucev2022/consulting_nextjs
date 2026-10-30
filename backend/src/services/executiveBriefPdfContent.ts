/**
 * Cover, summary, checklist, and traceability pages of the Executive Brief PDF. Every value comes from the report.
 */
import type {
  ExecutiveBriefReportData,
  ExecutiveBriefSummaryCardItem,
  ExecutiveBriefTraceabilityItem
} from '../types/executiveBriefExportTypes';
import type { ExecutiveBriefPdfRow } from '../types/executiveBriefPdf';
import { BRAND_COLORS, PDF_LAYOUT } from '../constants/executiveBriefLayoutConstants';
import {
  PDF_BLOCK_GAP,
  PDF_CONTENTS_COLUMNS,
  PDF_COVER_TOP_OFFSET,
  PDF_KPI_ACCENT_WIDTH,
  PDF_KPI_COLUMNS,
  PDF_KPI_DETAIL_BASELINE_OFFSET,
  PDF_KPI_DETAIL_FONT_SIZE,
  PDF_KPI_DETAIL_LINE_LIMIT,
  PDF_KPI_GAP,
  PDF_KPI_HEIGHT,
  PDF_KPI_LABEL_BASELINE_OFFSET,
  PDF_KPI_LABEL_FONT_SIZE,
  PDF_KPI_PADDING,
  PDF_KPI_ROW_GAP,
  PDF_KPI_VALUE_BASELINE_OFFSET,
  PDF_KPI_VALUE_FONT_SIZE,
  PDF_LINE_HEIGHT_RATIO,
  PDF_RULE_WIDTH,
  PDF_STATUS_COLORS,
  PDF_TEXT_STYLES
} from '../constants/executiveBriefPdfConstants';
import {
  EXECUTIVE_BRIEF_CHECKLIST_KEYS,
  EXECUTIVE_BRIEF_CHECKLIST_LABELS,
  EXECUTIVE_BRIEF_LABELS
} from '../constants/executiveBriefLabelConstants';
import type { ExecutiveBriefPdfCursor } from './executiveBriefPdfCursor';

const KPI_CARD_WIDTH = (PDF_LAYOUT.CONTENT_WIDTH - (PDF_KPI_COLUMNS - 1) * PDF_KPI_GAP) / PDF_KPI_COLUMNS;

const drawKpiCard = (
  cursor: ExecutiveBriefPdfCursor,
  card: ExecutiveBriefSummaryCardItem,
  left: number,
  top: number
): void => {
  const canvas = cursor.getCanvas();
  canvas.rect(left, top, KPI_CARD_WIDTH, PDF_KPI_HEIGHT, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: PDF_RULE_WIDTH
  });
  canvas.rect(left, top, PDF_KPI_ACCENT_WIDTH, PDF_KPI_HEIGHT, { fill: BRAND_COLORS.procucevBlue });
  const textLeft = left + PDF_KPI_PADDING;
  const textWidth = KPI_CARD_WIDTH - PDF_KPI_PADDING * 2;
  canvas.text(card.label.toUpperCase(), textLeft, top + PDF_KPI_LABEL_BASELINE_OFFSET, {
    fontSize: PDF_KPI_LABEL_FONT_SIZE,
    font: 'bold',
    color: BRAND_COLORS.secondaryText
  });
  canvas.text(card.formattedValue, textLeft, top + PDF_KPI_VALUE_BASELINE_OFFSET, {
    fontSize: PDF_KPI_VALUE_FONT_SIZE,
    font: 'bold',
    color: BRAND_COLORS.primaryText
  });
  const detailText = `${card.module}${EXECUTIVE_BRIEF_LABELS.pairSeparator}${card.evidenceRef}`;
  canvas.wrapLines(detailText, textWidth, PDF_KPI_DETAIL_FONT_SIZE)
    .slice(0, PDF_KPI_DETAIL_LINE_LIMIT)
    .forEach((line, index) => {
      const lineOffset = index * PDF_KPI_DETAIL_FONT_SIZE * PDF_LINE_HEIGHT_RATIO;
      canvas.text(line, textLeft, top + PDF_KPI_DETAIL_BASELINE_OFFSET + lineOffset, {
        fontSize: PDF_KPI_DETAIL_FONT_SIZE,
        font: 'regular',
        color: BRAND_COLORS.secondaryText
      });
    });
};

export const renderCoverPage = (cursor: ExecutiveBriefPdfCursor, report: ExecutiveBriefReportData): void => {
  const profile = report.clientProfile;
  cursor.advance(PDF_COVER_TOP_OFFSET);
  cursor.paragraph(EXECUTIVE_BRIEF_LABELS.documentTitle, PDF_TEXT_STYLES.coverTitle, PDF_BLOCK_GAP);
  cursor.paragraph(EXECUTIVE_BRIEF_LABELS.documentSubtitle, PDF_TEXT_STYLES.coverSubtitle, PDF_BLOCK_GAP);
  cursor.paragraph(profile.clientName, PDF_TEXT_STYLES.coverClient, PDF_BLOCK_GAP * 2);
  const coverRows: ExecutiveBriefPdfRow[] = [
    { label: EXECUTIVE_BRIEF_LABELS.analysisPeriodLabel, value: profile.analysisPeriod },
    { label: EXECUTIVE_BRIEF_LABELS.reportDateLabel, value: report.metadata.reportDate },
    { label: EXECUTIVE_BRIEF_LABELS.reportVersionLabel, value: profile.reportVersion },
    { label: EXECUTIVE_BRIEF_LABELS.groupLabel, value: profile.group },
    { label: EXECUTIVE_BRIEF_LABELS.statusLabel, value: profile.status }
  ];
  coverRows.forEach((row) => cursor.row(row));
  cursor.advance(PDF_BLOCK_GAP * 2);
  cursor.paragraph(EXECUTIVE_BRIEF_LABELS.contentsTitle, PDF_TEXT_STYLES.subheading, PDF_BLOCK_GAP);
  const contentsItems = [
    EXECUTIVE_BRIEF_LABELS.contentsSummary,
    ...report.sections.map((group) => `${group.groupNumber}  ${group.title}`),
    EXECUTIVE_BRIEF_LABELS.contentsEvidence
  ];
  for (let index = 0; index < contentsItems.length; index += PDF_CONTENTS_COLUMNS) {
    const left = contentsItems[index];
    const right = contentsItems[index + 1];
    cursor.twoColumnLine(left, right === undefined ? '' : right, PDF_TEXT_STYLES.body);
  }
};

export const renderSummaryPage = (cursor: ExecutiveBriefPdfCursor, report: ExecutiveBriefReportData): void => {
  cursor.startNewPage();
  cursor.paragraph(EXECUTIVE_BRIEF_LABELS.summaryTitle, PDF_TEXT_STYLES.heading, PDF_BLOCK_GAP);
  const rowCount = Math.ceil(report.summaryCards.length / PDF_KPI_COLUMNS);
  cursor.ensureSpace(rowCount * (PDF_KPI_HEIGHT + PDF_KPI_ROW_GAP));
  const top = cursor.getY();
  report.summaryCards.forEach((card, index) => {
    const column = index % PDF_KPI_COLUMNS;
    const rowIndex = Math.floor(index / PDF_KPI_COLUMNS);
    const left = PDF_LAYOUT.CONTENT_LEFT + column * (KPI_CARD_WIDTH + PDF_KPI_GAP);
    drawKpiCard(cursor, card, left, top + rowIndex * (PDF_KPI_HEIGHT + PDF_KPI_ROW_GAP));
  });
  cursor.advance(rowCount * (PDF_KPI_HEIGHT + PDF_KPI_ROW_GAP));
};

export const renderChecklistPage = (cursor: ExecutiveBriefPdfCursor, report: ExecutiveBriefReportData): void => {
  cursor.startNewPage(EXECUTIVE_BRIEF_LABELS.checklistTitle);
  cursor.paragraph(EXECUTIVE_BRIEF_LABELS.checklistTitle, PDF_TEXT_STYLES.heading, PDF_BLOCK_GAP);
  EXECUTIVE_BRIEF_CHECKLIST_KEYS.forEach((key) => {
    const passed = report.validationChecklist[key];
    cursor.statusRow(
      EXECUTIVE_BRIEF_CHECKLIST_LABELS[key],
      passed ? EXECUTIVE_BRIEF_LABELS.checklistPass : EXECUTIVE_BRIEF_LABELS.checklistFail,
      passed ? PDF_STATUS_COLORS.pass : PDF_STATUS_COLORS.fail
    );
  });
};

const traceabilityRows = (item: ExecutiveBriefTraceabilityItem): ExecutiveBriefPdfRow[] => {
  const fields = EXECUTIVE_BRIEF_LABELS.traceabilityFields;
  return [
    { label: fields.category, value: item.category },
    { label: fields.item, value: item.item },
    { label: fields.supplier, value: item.supplier },
    { label: fields.erpRecord, value: item.erpRecord },
    { label: fields.calculation, value: item.calculation },
    { label: fields.opportunity, value: item.opportunity },
    { label: fields.savings, value: item.savings }
  ];
};

export const renderTraceabilityPages = (cursor: ExecutiveBriefPdfCursor, report: ExecutiveBriefReportData): void => {
  cursor.startNewPage(EXECUTIVE_BRIEF_LABELS.traceabilityTitle);
  cursor.paragraph(EXECUTIVE_BRIEF_LABELS.traceabilityTitle, PDF_TEXT_STYLES.heading, PDF_BLOCK_GAP);
  report.traceabilityLineage.forEach((item) => {
    cursor.paragraph(`${item.findingId}${EXECUTIVE_BRIEF_LABELS.pairSeparator}${item.module}`, PDF_TEXT_STYLES.subheading);
    traceabilityRows(item).forEach((row) => cursor.row(row));
    cursor.advance(PDF_BLOCK_GAP);
  });
};
