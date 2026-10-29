/**
 * 16:9 PDF canvas for the Executive Brief. Coordinates are points with a top-left origin on the grid in PDF_LAYOUT.
 * Ported from the Express PdfCanvas at HEAD. Filesystem output and the logo image were removed for Workers.
 */
import type { PdfRgbColor, PdfShapeOptions, PdfTextOptions } from '../types/executiveBriefPdf';
import { assemblePdfBuffer, buildPdfObjects } from './pdfWriter';
import {
  BRAND_COLORS,
  PDF_LAYOUT,
  TYPOGRAPHY,
  toAsciiSafePresentationString
} from '../constants/executiveBriefLayoutConstants';
import {
  PDF_CHAR_WIDTH_RATIO,
  PDF_COLOR_CHANNEL_MAX,
  PDF_COLOR_DECIMALS,
  PDF_COORDINATE_DECIMALS,
  PDF_DEFAULT_LINE_WIDTH,
  PDF_FONT_RESOURCE_TAGS,
  PDF_GREEN_SHIFT,
  PDF_HEX_RADIX,
  PDF_RED_SHIFT,
  PDF_SHORT_HEX_LENGTH
} from '../constants/executiveBriefPdfConstants';

/**
 * Converts text to printable ASCII so every byte is valid in WinAnsi and the stream stays single-byte.
 * Non-ASCII characters that have no mapping become '?'.
 */
export const toPdfSafeText = (text: string): string =>
  toAsciiSafePresentationString(text).replace(/[^\x20-\x7E]/gu, '?');

const escapePdfString = (text: string): string =>
  text.replace(/\\/gu, '\\\\').replace(/\(/gu, '\\(').replace(/\)/gu, '\\)');

const parseHexColor = (hex: string): PdfRgbColor => {
  const clean = hex.replace('#', '');
  const expanded = clean.length === PDF_SHORT_HEX_LENGTH ? clean.split('').map((char) => char + char).join('') : clean;
  const value = parseInt(expanded, PDF_HEX_RADIX);
  return {
    r: ((value >> PDF_RED_SHIFT) & PDF_COLOR_CHANNEL_MAX) / PDF_COLOR_CHANNEL_MAX,
    g: ((value >> PDF_GREEN_SHIFT) & PDF_COLOR_CHANNEL_MAX) / PDF_COLOR_CHANNEL_MAX,
    b: (value & PDF_COLOR_CHANNEL_MAX) / PDF_COLOR_CHANNEL_MAX
  };
};

const formatColor = (color: PdfRgbColor): string =>
  `${color.r.toFixed(PDF_COLOR_DECIMALS)} ${color.g.toFixed(PDF_COLOR_DECIMALS)} ${color.b.toFixed(PDF_COLOR_DECIMALS)}`;

const splitLongWord = (word: string, maxChars: number): string[] =>
  Array.from({ length: Math.ceil(word.length / maxChars) }, (_value, index) =>
    word.slice(index * maxChars, (index + 1) * maxChars)
  );

export class PdfCanvas {
  private readonly width: number;
  private readonly height: number;
  private readonly pages: string[] = [];
  private currentPageContent: string[] = [];

  public constructor(width: number = PDF_LAYOUT.PAGE_W, height: number = PDF_LAYOUT.PAGE_H) {
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

  public measureText(text: string, fontSize: number): number {
    return toPdfSafeText(text).length * fontSize * PDF_CHAR_WIDTH_RATIO;
  }

  /**
   * Splits text into lines that fit maxWidth at fontSize. Words longer than one line are broken by character.
   * Always returns at least one line so that empty values still occupy a row.
   */
  public wrapLines(text: string, maxWidth: number, fontSize: number): string[] {
    const maxChars = Math.max(1, Math.floor(maxWidth / (fontSize * PDF_CHAR_WIDTH_RATIO)));
    const words = toPdfSafeText(text)
      .split(/\s+/u)
      .filter((word) => word.length > 0)
      .flatMap((word) => splitLongWord(word, maxChars));
    const lines: string[] = [];
    let current = '';
    words.forEach((word) => {
      const candidate = current.length === 0 ? word : `${current} ${word}`;
      if (candidate.length > maxChars && current.length > 0) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    });
    if (current.length > 0 || lines.length === 0) {
      lines.push(current);
    }
    return lines;
  }

  public rect(x: number, y: number, w: number, h: number, options?: PdfShapeOptions): void {
    const pdfY = this.height - y - h;
    if (options?.fill) {
      this.emit(`${formatColor(parseHexColor(options.fill))} rg`);
    }
    if (options?.stroke) {
      this.emit(`${formatColor(parseHexColor(options.stroke))} RG`);
      this.emit(`${(options.lineWidth ?? PDF_DEFAULT_LINE_WIDTH).toFixed(PDF_COORDINATE_DECIMALS)} w`);
    }
    const operator = options?.fill && options?.stroke ? 'B' : options?.fill ? 'f' : 'S';
    this.emit(
      `${x.toFixed(PDF_COORDINATE_DECIMALS)} ${pdfY.toFixed(PDF_COORDINATE_DECIMALS)} ` +
        `${w.toFixed(PDF_COORDINATE_DECIMALS)} ${h.toFixed(PDF_COORDINATE_DECIMALS)} re ${operator}`
    );
  }

  public line(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string = BRAND_COLORS.border,
    width: number = PDF_DEFAULT_LINE_WIDTH
  ): void {
    this.emit(`${formatColor(parseHexColor(color))} RG`);
    this.emit(`${width.toFixed(PDF_COORDINATE_DECIMALS)} w`);
    this.emit(
      `${x1.toFixed(PDF_COORDINATE_DECIMALS)} ${(this.height - y1).toFixed(PDF_COORDINATE_DECIMALS)} m ` +
        `${x2.toFixed(PDF_COORDINATE_DECIMALS)} ${(this.height - y2).toFixed(PDF_COORDINATE_DECIMALS)} l S`
    );
  }

  public text(str: string, x: number, y: number, options?: PdfTextOptions): void {
    const fontSize = options?.fontSize ?? TYPOGRAPHY.bodySize;
    const fontTag = PDF_FONT_RESOURCE_TAGS[options?.font ?? 'regular'];
    const color = parseHexColor(options?.color ?? BRAND_COLORS.primaryText);
    const align = options?.align ?? 'left';
    const approxWidth = this.measureText(str, fontSize);
    let adjustedX = x;
    if (align === 'center') {
      adjustedX = x - approxWidth / 2;
    } else if (align === 'right') {
      adjustedX = x - approxWidth;
    }
    this.emit('BT');
    this.emit(`${fontTag} ${fontSize.toFixed(PDF_COORDINATE_DECIMALS)} Tf`);
    this.emit(`${formatColor(color)} rg`);
    this.emit(
      `${adjustedX.toFixed(PDF_COORDINATE_DECIMALS)} ${(this.height - y).toFixed(PDF_COORDINATE_DECIMALS)} Td`
    );
    this.emit(`(${escapePdfString(toPdfSafeText(str))}) Tj`);
    this.emit('ET');
  }

  /**
   * Returns the complete PDF document. Pending page content is flushed first.
   */
  public toBytes(): Uint8Array {
    this.addPage();
    return assemblePdfBuffer(buildPdfObjects(this.pages, this.width, this.height));
  }

  private emit(command: string): void {
    this.currentPageContent.push(command);
  }
}
