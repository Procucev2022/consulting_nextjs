/**
 * 10-Slide Executive Opportunity Brief — PDF Helpers
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  BRAND_COLORS,
  PDF_LAYOUT,
  TYPOGRAPHY
} from '../constants/executiveBriefLayoutConstants';

export function renderExecutiveOpportunityBriefFooter(canvas: PdfCanvas, pageNum: number): void {
  canvas.line(PDF_LAYOUT.CONTENT_LEFT, 508, PDF_LAYOUT.CONTENT_RIGHT, 508, BRAND_COLORS.border, 0.75);
  canvas.text(
    'Management Confidential | CFO / CEO Discussion Edition',
    PDF_LAYOUT.CONTENT_LEFT,
    PDF_LAYOUT.FOOTER_Y + 12,
    { fontSize: TYPOGRAPHY.footerSize, font: 'regular', color: BRAND_COLORS.secondaryText }
  );
  canvas.text(
    'aiCEV by Procucev',
    480,
    PDF_LAYOUT.FOOTER_Y + 12,
    { fontSize: TYPOGRAPHY.footerSize, font: 'bold', color: BRAND_COLORS.secondaryText, align: 'center' }
  );
  canvas.text(
    `PAGE ${pageNum} OF 10`,
    PDF_LAYOUT.CONTENT_RIGHT,
    PDF_LAYOUT.FOOTER_Y + 12,
    { fontSize: TYPOGRAPHY.footerSize, font: 'bold', color: BRAND_COLORS.secondaryText, align: 'right' }
  );
}
