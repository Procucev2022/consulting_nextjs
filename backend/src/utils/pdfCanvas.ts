/**
 * 16:9 PDF Canvas Utility for Executive Brief (Prompt 283 Redesign)
 * Strict 10 x 5.625 inch grid (960 x 540 pt) with official PNG logo embedding.
 */

import fs from 'fs';
import path from 'path';
import type { PdfTextOptions, PdfShapeOptions } from './pdfCanvasTypes';
import { buildPdfObjects, assemblePdfBuffer } from './pdfWriter';
import {
  PDF_LAYOUT,
  BRAND_COLORS,
  TYPOGRAPHY,
  toAsciiSafePresentationString
} from '../constants/executiveBriefLayoutConstants';

export * from './pdfCanvasTypes';

export class PdfCanvas {
  private width: number;
  private height: number;
  private pages: string[] = [];
  private currentPageContent: string[] = [];

  constructor(width = PDF_LAYOUT.PAGE_W, height = PDF_LAYOUT.PAGE_H) {
    this.width = width;
    this.height = height;
  }

  public getPageCount(): number {
    return this.pages.length + (this.currentPageContent.length > 0 ? 1 : 0);
  }

  public getWidth(): number {
    return this.width;
  }

  public getHeight(): number {
    return this.height;
  }

  public addPage(): void {
    if (this.currentPageContent.length > 0) {
      this.pages.push(this.currentPageContent.join('\n'));
      this.currentPageContent = [];
    }
  }

  private emit(command: string): void {
    this.currentPageContent.push(command);
  }

  private parseHexColor(hex: string): { r: number; g: number; b: number } {
    const clean = hex.replace('#', '');
    const num = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16);
    return {
      r: ((num >> 16) & 255) / 255,
      g: ((num >> 8) & 255) / 255,
      b: (num & 255) / 255
    };
  }

  private sanitizeText(str: string): string {
    const safeStr = toAsciiSafePresentationString(str);
    return safeStr.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  public rect(x: number, y: number, w: number, h: number, options?: PdfShapeOptions): void {
    const pdfY = this.height - y - h;
    if (options?.fill) {
      const { r, g, b } = this.parseHexColor(options.fill);
      this.emit(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
    }
    if (options?.stroke) {
      const { r, g, b } = this.parseHexColor(options.stroke);
      this.emit(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`);
      this.emit(`${(options.lineWidth || 1).toFixed(2)} w`);
    }
    const op = options?.fill && options?.stroke ? 'B' : options?.fill ? 'f' : 's';
    this.emit(`${x.toFixed(2)} ${pdfY.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re ${op}`);
  }

  public line(x1: number, y1: number, x2: number, y2: number, color = BRAND_COLORS.border, width = 1): void {
    const pdfY1 = this.height - y1;
    const pdfY2 = this.height - y2;
    const { r, g, b } = this.parseHexColor(color);
    this.emit(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`);
    this.emit(`${width.toFixed(2)} w`);
    this.emit(`${x1.toFixed(2)} ${pdfY1.toFixed(2)} m ${x2.toFixed(2)} ${pdfY2.toFixed(2)} l s`);
  }

  public text(str: string, x: number, y: number, options?: PdfTextOptions): void {
    const fontSize = options?.fontSize || TYPOGRAPHY.bodySize;
    const fontTag = options?.font === 'bold' ? '/F2' : options?.font === 'italic' ? '/F3' : '/F1';
    const color = options?.color || BRAND_COLORS.primaryText;
    const align = options?.align || 'left';

    const { r, g, b } = this.parseHexColor(color);
    const sanitized = this.sanitizeText(str);

    const approxWidth = sanitized.length * fontSize * 0.52;
    let adjustedX = x;
    if (align === 'center') {
      adjustedX = x - approxWidth / 2;
    } else if (align === 'right') {
      adjustedX = x - approxWidth;
    }

    const pdfY = this.height - y;
    this.emit('BT');
    this.emit(`${fontTag} ${fontSize.toFixed(2)} Tf`);
    this.emit(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
    this.emit(`${adjustedX.toFixed(2)} ${pdfY.toFixed(2)} Td`);
    this.emit(`(${sanitized}) Tj`);
    this.emit('ET');
  }

  public textBlock(
    str: string,
    x: number,
    y: number,
    maxWidth: number,
    options?: { fontSize?: number; font?: 'regular' | 'bold'; color?: string; lineHeight?: number }
  ): number {
    const fontSize = options?.fontSize || TYPOGRAPHY.bodySize;
    const lineHeight = options?.lineHeight || fontSize * 1.35;
    const safeStr = toAsciiSafePresentationString(str);
    const words = safeStr.split(' ');
    let currentLine = '';
    let currentY = y;

    for (const word of words) {
      const testLine = currentLine.length === 0 ? word : `${currentLine} ${word}`;
      const approxWidth = testLine.length * fontSize * 0.52;
      if (approxWidth > maxWidth && currentLine.length > 0) {
        this.text(currentLine, x, currentY, { fontSize, font: options?.font, color: options?.color });
        currentLine = word;
        currentY += lineHeight;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine.length > 0) {
      this.text(currentLine, x, currentY, { fontSize, font: options?.font, color: options?.color });
      currentY += lineHeight;
    }
    return currentY - y;
  }

  public table(
    x: number,
    y: number,
    w: number,
    headers: string[],
    rows: string[][],
    colWidths: number[],
    options?: { headerBg?: string; rowAltBg?: string }
  ): number {
    const rowHeight = 24;
    const headerHeight = 26;
    let curY = y;

    this.rect(x, curY, w, headerHeight, { fill: options?.headerBg || '#EFF6FF', stroke: BRAND_COLORS.border, lineWidth: 1 });
    let curX = x;
    headers.forEach((h, i) => {
      this.text(h, curX + 10, curY + 18, { fontSize: TYPOGRAPHY.tableSize, font: 'bold', color: BRAND_COLORS.primaryText });
      curX += colWidths[i];
    });
    curY += headerHeight;

    rows.forEach((row, rowIdx) => {
      const bg = rowIdx % 2 === 0 ? BRAND_COLORS.lightCard : (options?.rowAltBg || BRAND_COLORS.canvas);
      this.rect(x, curY, w, rowHeight, { fill: bg, stroke: BRAND_COLORS.border, lineWidth: 0.5 });
      let cellX = x;
      row.forEach((cell, colIdx) => {
        this.text(cell, cellX + 10, curY + 16, { fontSize: TYPOGRAPHY.tableSize, font: 'regular', color: BRAND_COLORS.primaryText });
        cellX += colWidths[colIdx];
      });
      curY += rowHeight;
    });
    return curY - y;
  }

  public drawImage(x: number, y: number, w: number, h: number, imgRef = '/Im1'): void {
    const pdfY = this.height - y - h;
    this.emit(`q ${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${x.toFixed(2)} ${pdfY.toFixed(2)} cm ${imgRef} Do Q`);
  }

  public kpiCard(
    x: number,
    y: number,
    w: number,
    h: number,
    title: string,
    value: string,
    subtitle: string,
    accentColor: string = BRAND_COLORS.procucevBlue
  ): void {
    this.rect(x, y, w, h, { fill: BRAND_COLORS.lightCard, stroke: BRAND_COLORS.border, lineWidth: 1 });
    this.rect(x, y, 4, h, { fill: accentColor });
    this.text(title.toUpperCase(), x + 16, y + 20, {
      fontSize: TYPOGRAPHY.cardLabelSize,
      font: 'bold',
      color: BRAND_COLORS.secondaryText
    });
    this.text(value, x + 16, y + 54, {
      fontSize: TYPOGRAPHY.keyNumberSize,
      font: 'bold',
      color: BRAND_COLORS.primaryText
    });
    this.text(subtitle, x + 16, y + 78, {
      fontSize: TYPOGRAPHY.cardLabelSize,
      font: 'regular',
      color: accentColor
    });
  }

  public renderHeader(slideTitle: string, categoryTag: string, _pageNum: number): void {
    this.rect(0, 0, this.width, this.height, { fill: BRAND_COLORS.canvas });
    this.text(categoryTag.toUpperCase(), PDF_LAYOUT.CONTENT_LEFT, PDF_LAYOUT.HEADER_Y, {
      fontSize: TYPOGRAPHY.sectionLabelSize,
      font: 'bold',
      color: BRAND_COLORS.procucevBlue
    });
    this.text(slideTitle, PDF_LAYOUT.CONTENT_LEFT, PDF_LAYOUT.TITLE_Y, {
      fontSize: TYPOGRAPHY.executiveTitleSize,
      font: 'bold',
      color: BRAND_COLORS.primaryText
    });
    this.drawImage(PDF_LAYOUT.LOGO_X, PDF_LAYOUT.LOGO_Y, PDF_LAYOUT.LOGO_W, PDF_LAYOUT.LOGO_H, '/Im1');
    this.line(PDF_LAYOUT.CONTENT_LEFT, 86, PDF_LAYOUT.CONTENT_RIGHT, 86, BRAND_COLORS.border, 0.75);
  }

  public renderFooter(clientName: string, _confidentiality: string, pageNum: number, totalPages: number): void {
    this.line(PDF_LAYOUT.CONTENT_LEFT, 508, PDF_LAYOUT.CONTENT_RIGHT, 508, BRAND_COLORS.border, 0.75);
    const leftText = `Management Confidential - Prepared exclusively for ${clientName}`;
    this.text(leftText, PDF_LAYOUT.CONTENT_LEFT, PDF_LAYOUT.FOOTER_Y + 12, {
      fontSize: TYPOGRAPHY.footerSize,
      font: 'regular',
      color: BRAND_COLORS.secondaryText
    });
    this.text('aiCEV by Procucev', this.width / 2, PDF_LAYOUT.FOOTER_Y + 12, {
      fontSize: TYPOGRAPHY.footerSize,
      font: 'bold',
      color: BRAND_COLORS.secondaryText,
      align: 'center'
    });
    this.text(`PAGE ${pageNum} OF ${totalPages}`, PDF_LAYOUT.CONTENT_RIGHT, PDF_LAYOUT.FOOTER_Y + 12, {
      fontSize: TYPOGRAPHY.footerSize,
      font: 'bold',
      color: BRAND_COLORS.secondaryText,
      align: 'right'
    });
  }

  public roundedRect(x: number, y: number, w: number, h: number, _r?: number, options?: PdfShapeOptions): void {
    this.rect(x, y, w, h, options);
  }

  public badge(x: number, y: number, text: string, options?: { bgColor?: string; textColor?: string }): void {
    const bg = options?.bgColor || '#10B981';
    const tc = options?.textColor || '#FFFFFF';
    const w = text.length * 6 + 16;
    this.rect(x, y, w, 20, { fill: bg });
    this.text(text, x + 8, y + 14, { fontSize: 8.5, font: 'bold', color: tc });
  }

  public progressBar(
    x: number,
    y: number,
    w: number,
    h: number,
    pct: number,
    fillColor = '#10B981',
    bgColor = '#334155'
  ): void {
    this.rect(x, y, w, h, { fill: bgColor });
    const fw = Math.max(0, Math.min(w, (w * pct) / 100));
    this.rect(x, y, fw, h, { fill: fillColor });
  }

  public toBuffer(): Buffer {
    if (this.currentPageContent.length > 0) {
      this.pages.push(this.currentPageContent.join('\n'));
      this.currentPageContent = [];
    }
    const bodyObjects = buildPdfObjects(this.pages, this.width, this.height);
    return assemblePdfBuffer(bodyObjects);
  }

  public saveToFile(filePath: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, this.toBuffer());
  }
}
