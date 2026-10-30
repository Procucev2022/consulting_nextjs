/**
 * Renders the Executive Brief PDF from the certified report data. The first layout pass only counts pages, so the
 * footer on the second pass can show "PAGE n OF N". Both passes use the same content functions, so the counts match.
 */
import type { ExecutiveBriefReportData } from '../types/executiveBriefExportTypes';
import type { ExecutiveBriefPdfLayoutPass } from '../types/executiveBriefPdf';
import { PdfCanvas } from '../utils/pdfCanvas';
import { PDF_LAYOUT } from '../constants/executiveBriefLayoutConstants';
import { ExecutiveBriefPdfCursor } from './executiveBriefPdfCursor';
import {
  renderChecklistPage,
  renderCoverPage,
  renderSummaryPage,
  renderTraceabilityPages
} from './executiveBriefPdfContent';
import { renderSectionPages } from './executiveBriefPdfSections';

const layoutDocument = (report: ExecutiveBriefReportData, totalPages: number): ExecutiveBriefPdfLayoutPass => {
  const canvas = new PdfCanvas(PDF_LAYOUT.PAGE_W, PDF_LAYOUT.PAGE_H);
  const cursor = new ExecutiveBriefPdfCursor(canvas, { clientName: report.clientProfile.clientName, totalPages });
  renderCoverPage(cursor, report);
  renderSummaryPage(cursor, report);
  renderSectionPages(cursor, report);
  renderChecklistPage(cursor, report);
  renderTraceabilityPages(cursor, report);
  return { canvas, pageCount: cursor.finish() };
};

export const renderExecutiveBriefPdf = (report: ExecutiveBriefReportData): Uint8Array => {
  const counting = layoutDocument(report, 0);
  return layoutDocument(report, counting.pageCount).canvas.toBytes();
};
