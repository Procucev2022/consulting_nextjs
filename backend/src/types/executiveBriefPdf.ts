/**
 * Executive Brief PDF layout types.
 */
import type { PdfCanvas } from '../utils/pdfCanvas';

export interface PdfTextOptions {
  fontSize?: number;
  font?: 'regular' | 'bold' | 'italic';
  color?: string;
  align?: 'left' | 'center' | 'right';
  lineHeight?: number;
}

export interface PdfShapeOptions {
  fill?: string;
  stroke?: string;
  lineWidth?: number;
}

export interface PdfRgbColor {
  r: number;
  g: number;
  b: number;
}

export interface ExecutiveBriefPdfDocumentContext {
  clientName: string;
  totalPages: number;
}

export interface ExecutiveBriefPdfTextStyle {
  fontSize: number;
  font: 'regular' | 'bold' | 'italic';
  color: string;
}

export interface ExecutiveBriefPdfRow {
  label: string;
  value: string;
}

export interface ExecutiveBriefPdfLayoutPass {
  canvas: PdfCanvas;
  pageCount: number;
}
