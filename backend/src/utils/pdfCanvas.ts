/**
 * 16:9 PDF Canvas Utility for Executive Brief (Prompt 257)
 * Pure TypeScript PDF 1.4 generation with zero external dependencies.
 */

import fs from 'fs';
import path from 'path';
import type { PdfTextOptions, PdfShapeOptions } from './pdfCanvasTypes';

export * from './pdfCanvasTypes';

export class PdfCanvas {
  private width: number;
  private height: number;
  private pages: string[] = [];
  private currentPageContent: string[] = [];

  constructor(width = 960, height = 540) {
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
    const asciiSafe = str.replace(/₹/g, 'Rs. ');
    return asciiSafe.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
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

  public roundedRect(x: number, y: number, w: number, h: number, r = 4, options?: PdfShapeOptions): void {
    this.rect(x + r, y, w - 2 * r, h, options);
    this.rect(x, y + r, w, h - 2 * r, options);
    this.rect(x + r, y + r, w - 2 * r, h - 2 * r, options);
  }

  public line(x1: number, y1: number, x2: number, y2: number, color = '#334155', width = 1): void {
    const pdfY1 = this.height - y1;
    const pdfY2 = this.height - y2;
    const { r, g, b } = this.parseHexColor(color);
    this.emit(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`);
    this.emit(`${width.toFixed(2)} w`);
    this.emit(`${x1.toFixed(2)} ${pdfY1.toFixed(2)} m ${x2.toFixed(2)} ${pdfY2.toFixed(2)} l s`);
  }

  public text(str: string, x: number, y: number, options?: PdfTextOptions): void {
    const fontSize = options?.fontSize || 12;
    const fontTag = options?.font === 'bold' ? '/F2' : options?.font === 'italic' ? '/F3' : '/F1';
    const color = options?.color || '#000000';
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
    const fontSize = options?.fontSize || 11;
    const lineHeight = options?.lineHeight || fontSize * 1.35;
    const words = str.split(' ');
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

  public badge(
    x: number,
    y: number,
    text: string,
    options?: { bgColor?: string; textColor?: string; fontSize?: number }
  ): void {
    const fontSize = options?.fontSize || 9;
    const paddingX = 8;
    const paddingY = 4;
    const textWidth = text.length * fontSize * 0.55;
    const badgeW = textWidth + paddingX * 2;
    const badgeH = fontSize + paddingY * 2;

    this.rect(x, y, badgeW, badgeH, { fill: options?.bgColor || '#2563EB' });
    this.text(text, x + paddingX, y + fontSize, {
      fontSize,
      font: 'bold',
      color: options?.textColor || '#FFFFFF'
    });
  }

  public kpiCard(
    x: number,
    y: number,
    w: number,
    h: number,
    title: string,
    value: string,
    subtitle: string,
    accentColor = '#2563EB'
  ): void {
    this.rect(x, y, w, h, { fill: '#1E293B', stroke: '#334155', lineWidth: 1 });
    this.rect(x, y, 4, h, { fill: accentColor });
    this.text(title.toUpperCase(), x + 16, y + 20, { fontSize: 10, font: 'bold', color: '#94A3B8' });
    this.text(value, x + 16, y + 52, { fontSize: 24, font: 'bold', color: '#F8FAFC' });
    this.text(subtitle, x + 16, y + 76, { fontSize: 10, font: 'regular', color: '#38BDF8' });
  }

  public progressBar(
    x: number,
    y: number,
    w: number,
    h: number,
    percent: number,
    fillColor = '#10B981',
    bgColor = '#334155'
  ): void {
    this.rect(x, y, w, h, { fill: bgColor });
    const fillW = Math.max(0, Math.min(w, (w * percent) / 100));
    if (fillW > 0) {
      this.rect(x, y, fillW, h, { fill: fillColor });
    }
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
    const rowHeight = 22;
    const headerHeight = 24;
    let curY = y;

    this.rect(x, curY, w, headerHeight, { fill: options?.headerBg || '#1E293B', stroke: '#334155', lineWidth: 1 });
    let curX = x;
    headers.forEach((h, i) => {
      this.text(h, curX + 8, curY + 16, { fontSize: 9, font: 'bold', color: '#F8FAFC' });
      curX += colWidths[i];
    });
    curY += headerHeight;

    rows.forEach((row, rowIdx) => {
      const bg = rowIdx % 2 === 0 ? '#0F172A' : (options?.rowAltBg || '#1E293B');
      this.rect(x, curY, w, rowHeight, { fill: bg, stroke: '#334155', lineWidth: 0.5 });
      let cellX = x;
      row.forEach((cell, colIdx) => {
        this.text(cell, cellX + 8, curY + 15, { fontSize: 8.5, font: 'regular', color: '#E2E8F0' });
        cellX += colWidths[colIdx];
      });
      curY += rowHeight;
    });

    return curY - y;
  }

  public renderHeader(slideTitle: string, categoryTag: string, pageNum: number): void {
    this.rect(0, 0, this.width, this.height, { fill: '#0F172A' });
    this.text(categoryTag.toUpperCase(), 40, 32, { fontSize: 10, font: 'bold', color: '#38BDF8' });
    this.text(slideTitle, 40, 56, { fontSize: 18, font: 'bold', color: '#F8FAFC' });
    this.badge(820, 24, 'PROCUCEV', { bgColor: '#2563EB', textColor: '#FFFFFF', fontSize: 9 });
    this.line(40, 70, 920, 70, '#334155', 1);
    this.text(`SLIDE ${pageNum}`, 805, 32, { fontSize: 8, font: 'bold', color: '#64748B', align: 'right' });
  }

  public renderFooter(clientName: string, confidentiality: string, pageNum: number, totalPages: number): void {
    this.line(40, 508, 920, 508, '#334155', 1);
    this.text(confidentiality.toUpperCase(), 40, 524, { fontSize: 8, font: 'regular', color: '#64748B' });
    this.text(`Client: ${clientName}`, 480, 524, { fontSize: 8, font: 'regular', color: '#64748B', align: 'center' });
    this.text(`Page ${pageNum} of ${totalPages}`, 920, 524, {
      fontSize: 8,
      font: 'bold',
      color: '#94A3B8',
      align: 'right'
    });
  }

  public toBuffer(): Buffer {
    if (this.currentPageContent.length > 0) {
      this.pages.push(this.currentPageContent.join('\n'));
      this.currentPageContent = [];
    }

    const totalPages = this.pages.length;
    const bodyObjects: string[] = [];

    const pageObjStartId = 3;
    const pageObjCount = totalPages * 2;
    const kids = Array.from({ length: totalPages }, (_, i) => `${pageObjStartId + i * 2} 0 R`).join(' ');

    bodyObjects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    bodyObjects.push(`2 0 obj\n<< /Type /Pages /Kids [ ${kids} ] /Count ${totalPages} >>\nendobj\n`);

    const fontRegularId = pageObjStartId + pageObjCount;
    const fontBoldId = fontRegularId + 1;
    const fontItalicId = fontBoldId + 1;

    this.pages.forEach((contentStream, idx) => {
      const pageId = pageObjStartId + idx * 2;
      const contentId = pageId + 1;
      const contentBytes = Buffer.from(contentStream, 'utf-8');

      bodyObjects.push(
        `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [ 0 0 ${this.width} ${this.height} ] ` +
          `/Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R /F3 ${fontItalicId} 0 R >> >> ` +
          `/Contents ${contentId} 0 R >>\nendobj\n`
      );

      bodyObjects.push(
        `${contentId} 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`
      );
    });

    bodyObjects.push(
      `${fontRegularId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n`
    );
    bodyObjects.push(
      `${fontBoldId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n`
    );
    bodyObjects.push(
      `${fontItalicId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>\nendobj\n`
    );

    let offset = 0;
    const header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    offset += Buffer.byteLength(header, 'utf-8');

    const offsets: number[] = [0];
    const chunks: Buffer[] = [Buffer.from(header, 'utf-8')];

    bodyObjects.forEach((objStr) => {
      offsets.push(offset);
      const b = Buffer.from(objStr, 'utf-8');
      chunks.push(b);
      offset += b.length;
    });

    const startXref = offset;
    const totalObjs = offsets.length;
    let xref = `xref\n0 ${totalObjs}\n0000000000 65535 f \n`;

    for (let i = 1; i < totalObjs; i++) {
      xref += `${offsets[i].toString().padStart(10, '0')} 00000 n \n`;
    }

    const trailer = `trailer\n<< /Size ${totalObjs} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;
    chunks.push(Buffer.from(xref, 'utf-8'));
    chunks.push(Buffer.from(trailer, 'utf-8'));

    return Buffer.concat(chunks);
  }

  public saveToFile(filePath: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const buf = this.toBuffer();
    fs.writeFileSync(filePath, buf);
  }
}
