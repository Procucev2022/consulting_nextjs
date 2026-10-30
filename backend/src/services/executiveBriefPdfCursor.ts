/**
 * Page cursor for the Executive Brief PDF. It tracks the vertical position, starts new pages, and draws the header
 * and footer. Content builders describe rows and paragraphs, and the cursor moves to a new page when needed.
 */
import type { PdfCanvas } from '../utils/pdfCanvas';
import { BRAND_COLORS, PDF_LAYOUT } from '../constants/executiveBriefLayoutConstants';
import {
  PDF_BODY_FONT_SIZE,
  PDF_CONTENT_BOTTOM,
  PDF_CONTENT_TOP,
  PDF_DEFAULT_LINE_WIDTH,
  PDF_FOOTER_BASELINE,
  PDF_FOOTER_FONT_SIZE,
  PDF_FOOTER_RULE_Y,
  PDF_HEADER_BASELINE,
  PDF_HEADER_FONT_SIZE,
  PDF_HEADER_RULE_Y,
  PDF_LABEL_COLUMN_WIDTH,
  PDF_LABEL_FONT_SIZE,
  PDF_LINE_HEIGHT_RATIO,
  PDF_RULE_WIDTH,
  PDF_ROW_GAP,
  PDF_STATUS_COLUMN_WIDTH,
  PDF_VALUE_COLUMN_WIDTH
} from '../constants/executiveBriefPdfConstants';
import { EXECUTIVE_BRIEF_LABELS } from '../constants/executiveBriefLabelConstants';
import type {
  ExecutiveBriefPdfDocumentContext,
  ExecutiveBriefPdfRow,
  ExecutiveBriefPdfTextStyle
} from '../types/executiveBriefPdf';

const lineHeightFor = (fontSize: number): number => fontSize * PDF_LINE_HEIGHT_RATIO;

export class ExecutiveBriefPdfCursor {
  private readonly canvas: PdfCanvas;
  private readonly context: ExecutiveBriefPdfDocumentContext;
  private sectionTitle = '';
  private pageNumber = 1;
  private cursorY = PDF_CONTENT_TOP;

  public constructor(canvas: PdfCanvas, context: ExecutiveBriefPdfDocumentContext) {
    this.canvas = canvas;
    this.context = context;
    this.drawHeader();
  }

  public getCanvas(): PdfCanvas {
    return this.canvas;
  }

  public getY(): number {
    return this.cursorY;
  }

  public advance(distance: number): void {
    this.cursorY += distance;
  }

  /**
   * Starts a new page. The footer of the current page is drawn first. When sectionTitle is given, it replaces the
   * running section label in the header.
   */
  public startNewPage(sectionTitle?: string): void {
    this.drawFooter();
    this.canvas.addPage();
    this.pageNumber += 1;
    this.cursorY = PDF_CONTENT_TOP;
    if (sectionTitle !== undefined) {
      this.sectionTitle = sectionTitle;
    }
    this.drawHeader();
  }

  /**
   * Moves to a new page when the next block of the given height would cross the bottom margin.
   */
  public ensureSpace(height: number): void {
    if (this.cursorY + height > PDF_CONTENT_BOTTOM) {
      this.startNewPage();
    }
  }

  /**
   * Draws wrapped text at the current position without advancing the cursor and returns the height used.
   */
  public drawLines(text: string, x: number, width: number, style: ExecutiveBriefPdfTextStyle): number {
    const lines = this.canvas.wrapLines(text, width, style.fontSize);
    const lineHeight = lineHeightFor(style.fontSize);
    lines.forEach((line, index) => {
      this.canvas.text(line, x, this.cursorY + style.fontSize + index * lineHeight, {
        fontSize: style.fontSize,
        font: style.font,
        color: style.color
      });
    });
    return lines.length * lineHeight;
  }

  public measureText(text: string, width: number, fontSize: number): number {
    return this.canvas.wrapLines(text, width, fontSize).length * lineHeightFor(fontSize);
  }

  /**
   * Draws a full-width paragraph and advances the cursor past it.
   */
  public paragraph(text: string, style: ExecutiveBriefPdfTextStyle, gap: number = PDF_ROW_GAP): void {
    const height = this.measureText(text, PDF_LAYOUT.CONTENT_WIDTH, style.fontSize);
    this.ensureSpace(height);
    this.drawLines(text, PDF_LAYOUT.CONTENT_LEFT, PDF_LAYOUT.CONTENT_WIDTH, style);
    this.cursorY += height + gap;
  }

  /**
   * Draws two short texts side by side, each in half the content width, and advances past the taller one.
   */
  public twoColumnLine(left: string, right: string, style: ExecutiveBriefPdfTextStyle): void {
    const columnWidth = PDF_LAYOUT.CONTENT_WIDTH / 2;
    const height = Math.max(
      this.measureText(left, columnWidth, style.fontSize),
      this.measureText(right, columnWidth, style.fontSize)
    );
    this.ensureSpace(height);
    this.drawLines(left, PDF_LAYOUT.CONTENT_LEFT, columnWidth, style);
    this.drawLines(right, PDF_LAYOUT.CONTENT_LEFT + columnWidth, columnWidth, style);
    this.cursorY += height + PDF_ROW_GAP;
  }

  /**
   * Draws a label in the left column and its value in the right column. Both start at the same baseline.
   */
  public row(row: ExecutiveBriefPdfRow, valueColor: string = BRAND_COLORS.primaryText): void {
    const labelStyle: ExecutiveBriefPdfTextStyle = {
      fontSize: PDF_LABEL_FONT_SIZE,
      font: 'bold',
      color: BRAND_COLORS.secondaryText
    };
    const valueStyle: ExecutiveBriefPdfTextStyle = { fontSize: PDF_BODY_FONT_SIZE, font: 'regular', color: valueColor };
    const valueHeight = this.measureText(row.value, PDF_VALUE_COLUMN_WIDTH, valueStyle.fontSize);
    const labelHeight = this.measureText(row.label, PDF_LABEL_COLUMN_WIDTH, labelStyle.fontSize);
    const height = Math.max(valueHeight, labelHeight);
    this.ensureSpace(height);
    this.drawLines(row.label, PDF_LAYOUT.CONTENT_LEFT, PDF_LABEL_COLUMN_WIDTH, labelStyle);
    this.drawLines(row.value, PDF_LAYOUT.CONTENT_LEFT + PDF_LABEL_COLUMN_WIDTH, PDF_VALUE_COLUMN_WIDTH, valueStyle);
    this.cursorY += height + PDF_ROW_GAP;
  }

  /**
   * Draws a full-width label with its status right-aligned in the status column, used by the checklist.
   */
  public statusRow(label: string, status: string, statusColor: string): void {
    const style: ExecutiveBriefPdfTextStyle = { fontSize: PDF_BODY_FONT_SIZE, font: 'regular', color: BRAND_COLORS.primaryText };
    const labelWidth = PDF_LAYOUT.CONTENT_WIDTH - PDF_STATUS_COLUMN_WIDTH;
    const height = this.measureText(label, labelWidth, style.fontSize);
    this.ensureSpace(height);
    this.drawLines(label, PDF_LAYOUT.CONTENT_LEFT, labelWidth, style);
    this.canvas.text(status, PDF_LAYOUT.CONTENT_RIGHT, this.cursorY + style.fontSize, {
      fontSize: style.fontSize,
      font: 'bold',
      color: statusColor,
      align: 'right'
    });
    this.cursorY += height + PDF_ROW_GAP;
  }

  /**
   * Ends the document: draws the last footer, flushes the last page, and returns the number of pages.
   */
  public finish(): number {
    this.drawFooter();
    this.canvas.addPage();
    return this.pageNumber;
  }

  private drawHeader(): void {
    this.canvas.text(EXECUTIVE_BRIEF_LABELS.headerTitle, PDF_LAYOUT.CONTENT_LEFT, PDF_HEADER_BASELINE, {
      fontSize: PDF_HEADER_FONT_SIZE,
      font: 'bold',
      color: BRAND_COLORS.procucevBlue
    });
    if (this.sectionTitle.length > 0) {
      this.canvas.text(this.sectionTitle, PDF_LAYOUT.CONTENT_RIGHT, PDF_HEADER_BASELINE, {
        fontSize: PDF_HEADER_FONT_SIZE,
        font: 'regular',
        color: BRAND_COLORS.secondaryText,
        align: 'right'
      });
    }
    this.canvas.line(
      PDF_LAYOUT.CONTENT_LEFT,
      PDF_HEADER_RULE_Y,
      PDF_LAYOUT.CONTENT_RIGHT,
      PDF_HEADER_RULE_Y,
      BRAND_COLORS.border,
      PDF_RULE_WIDTH
    );
  }

  private drawFooter(): void {
    const footerColor = BRAND_COLORS.secondaryText;
    this.canvas.line(
      PDF_LAYOUT.CONTENT_LEFT,
      PDF_FOOTER_RULE_Y,
      PDF_LAYOUT.CONTENT_RIGHT,
      PDF_FOOTER_RULE_Y,
      BRAND_COLORS.border,
      PDF_DEFAULT_LINE_WIDTH
    );
    this.canvas.text(
      `${EXECUTIVE_BRIEF_LABELS.confidentialityPrefix} ${this.context.clientName}`,
      PDF_LAYOUT.CONTENT_LEFT,
      PDF_FOOTER_BASELINE,
      { fontSize: PDF_FOOTER_FONT_SIZE, font: 'regular', color: footerColor }
    );
    this.canvas.text(EXECUTIVE_BRIEF_LABELS.brandFooter, PDF_LAYOUT.PAGE_W / 2, PDF_FOOTER_BASELINE, {
      fontSize: PDF_FOOTER_FONT_SIZE,
      font: 'bold',
      color: footerColor,
      align: 'center'
    });
    this.canvas.text(
      `${EXECUTIVE_BRIEF_LABELS.pageLabel} ${this.pageNumber} ${EXECUTIVE_BRIEF_LABELS.pageOfLabel} ${this.context.totalPages}`,
      PDF_LAYOUT.CONTENT_RIGHT,
      PDF_FOOTER_BASELINE,
      { fontSize: PDF_FOOTER_FONT_SIZE, font: 'bold', color: footerColor, align: 'right' }
    );
  }
}
