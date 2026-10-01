/**
 * 16:9 PDF Canvas Types & Options (Prompt 257)
 */

export interface PdfTextOptions {
  fontSize?: number;
  font?: 'regular' | 'bold' | 'italic';
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export interface PdfShapeOptions {
  fill?: string;
  stroke?: string;
  lineWidth?: number;
}

export interface WaterfallStage {
  label: string;
  valueDisplay: string;
  amount: number;
  type: 'total' | 'positive' | 'negative' | 'subtotal';
}
