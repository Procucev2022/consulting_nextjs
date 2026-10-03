import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { PdfCanvas } from '../../src/utils/pdfCanvas';
import {
  getPreparedLogo,
  paethPredictor,
  unfilterByte,
  unfilterScanlines
} from '../../src/utils/pdfImageHelper';

describe('PdfCanvas Utility Unit Tests (Prompt 257)', () => {
  it('initializes with default and custom 16:9 dimensions', () => {
    const defaultCanvas = new PdfCanvas();
    expect(defaultCanvas.getWidth()).toBe(960);
    expect(defaultCanvas.getHeight()).toBe(540);
    expect(defaultCanvas.getPageCount()).toBe(0);

    const customCanvas = new PdfCanvas(1280, 720);
    expect(customCanvas.getWidth()).toBe(1280);
    expect(customCanvas.getHeight()).toBe(720);
  });

  it('adds pages and increments page count', () => {
    const canvas = new PdfCanvas(960, 540);
    canvas.rect(10, 10, 100, 100, { fill: '#2563EB' });
    expect(canvas.getPageCount()).toBe(1);

    canvas.addPage();
    canvas.rect(20, 20, 200, 200, { fill: '#10B981' });
    expect(canvas.getPageCount()).toBe(2);
  });

  it('renders shapes: rect, roundedRect, and line with strokes and fills', () => {
    const canvas = new PdfCanvas(960, 540);
    // 3-digit hex fill
    canvas.rect(10, 10, 50, 50, { fill: '#FFF', stroke: '#000', lineWidth: 2 });
    // Fill only
    canvas.rect(20, 20, 60, 60, { fill: '#2563EB' });
    // Stroke only
    canvas.rect(30, 30, 70, 70, { stroke: '#EF4444', lineWidth: 1.5 });
    // Rounded rect
    canvas.roundedRect(40, 40, 100, 80, 5, { fill: '#1E293B' });
    // Line
    canvas.line(0, 0, 960, 540, '#334155', 2);

    const buf = canvas.toBuffer();
    expect(buf.length).toBeGreaterThan(500);
  });

  it('renders text with different alignments, fonts, and Rupee sanitization', () => {
    const canvas = new PdfCanvas(960, 540);
    // Alignments
    canvas.text('Left Aligned Text with ₹93.60 Cr', 50, 50, { fontSize: 12, font: 'regular', align: 'left' });
    canvas.text('Center Aligned (with parens & backslash \\)', 480, 100, { fontSize: 14, font: 'bold', align: 'center' });
    canvas.text('Right Aligned', 900, 150, { fontSize: 10, font: 'italic', align: 'right' });

    const buf = canvas.toBuffer();
    const pdfStr = buf.toString('latin1');
    expect(pdfStr).toContain('Rs. 93.60 Cr'); // Rupee converted to ASCII-safe Rs.
    expect(pdfStr).toContain('\\(with parens');
  });

  it('renders textBlock wrapping words across multiple lines', () => {
    const canvas = new PdfCanvas(960, 540);
    const longText = 'This is a long sentence designed to test the automatic word wrapping capabilities of the textBlock method in the PDF canvas utility to ensure clean presentation.';
    const heightUsed = canvas.textBlock(longText, 50, 50, 200, { fontSize: 10, font: 'regular' });
    expect(heightUsed).toBeGreaterThan(30);

    // Single line block
    const shortHeight = canvas.textBlock('Short', 50, 200, 400);
    expect(shortHeight).toBeGreaterThan(0);
  });

  it('renders executive components: badge, kpiCard, progressBar, and table', () => {
    const canvas = new PdfCanvas(960, 540);
    canvas.badge(50, 50, 'PROCUCEV VERIFIED', { bgColor: '#10B981', textColor: '#FFFFFF' });
    canvas.kpiCard(50, 90, 200, 80, 'Spend Evaluated', 'Rs. 5,920.35 Cr', '31,671 Records', '#2563EB');
    canvas.progressBar(50, 190, 200, 10, 65, '#10B981', '#334155');

    const headers = ['Category', 'Spend', 'Share'];
    const rows = [
      ['Direct Materials', 'Rs. 1,842.10 Cr', '31.1%'],
      ['Fuels & Energy', 'Rs. 1,624.50 Cr', '27.4%']
    ];
    const tableHeight = canvas.table(50, 220, 500, headers, rows, [250, 150, 100]);
    expect(tableHeight).toBeGreaterThan(50);
  });

  it('renders standard header and footer', () => {
    const canvas = new PdfCanvas(960, 540);
    canvas.renderHeader('Executive Presentation Title', 'Diagnostic', 1);
    canvas.renderFooter('UltraTech Cement Limited', 'CONFIDENTIAL', 1, 30);

    const buf = canvas.toBuffer();
    const pdfStr = buf.toString('latin1');
    expect(pdfStr).toContain('aiCEV by Procucev');
    expect(pdfStr).toContain('UltraTech Cement Limited');
    expect(pdfStr).toContain('PAGE 1 OF 30');
  });

  it('generates valid PDF binary structure and saves to file', () => {
    const canvas = new PdfCanvas(960, 540);
    canvas.renderHeader('Test Slide', 'Test', 1);
    canvas.text('Hello World', 100, 100);

    const buf = canvas.toBuffer();
    expect(buf.toString('latin1', 0, 8)).toBe('%PDF-1.4');
    expect(buf.toString('latin1')).toContain('%%EOF');

    // Save to temp file
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-test-'));
    const tempFile = path.join(tempDir, 'subfolder', 'test.pdf');
    canvas.saveToFile(tempFile);

    expect(fs.existsSync(tempFile)).toBe(true);
    expect(fs.statSync(tempFile).size).toBeGreaterThan(500);

    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('loads and caches prepared logo from filesystem asset', () => {
    const logo1 = getPreparedLogo();
    expect(logo1).toBeDefined();
    expect(logo1.width).toBeGreaterThan(0);
    expect(logo1.height).toBeGreaterThan(0);
    expect(logo1.compRgb.length).toBeGreaterThan(100);
    expect(logo1.compAlpha.length).toBeGreaterThan(100);

    const logo2 = getPreparedLogo();
    expect(logo2).toBe(logo1);
  });

  it('calculates Paeth predictor correctly across all 3 conditions', () => {
    expect(paethPredictor(10, 10, 10)).toBe(10);
    expect(paethPredictor(50, 10, 10)).toBe(50);
    expect(paethPredictor(10, 50, 10)).toBe(50);
    expect(paethPredictor(10, 20, 15)).toBe(15);
  });

  it('unfilters byte across all filter types 0, 1, 2, 3, 4 and default', () => {
    expect(unfilterByte(0, 42, 10, 20, 5)).toBe(42);
    expect(unfilterByte(1, 42, 10, 20, 5)).toBe((42 + 10) & 0xff);
    expect(unfilterByte(2, 42, 10, 20, 5)).toBe((42 + 20) & 0xff);
    expect(unfilterByte(3, 42, 10, 20, 5)).toBe((42 + Math.floor((10 + 20) / 2)) & 0xff);
    expect(unfilterByte(4, 42, 10, 20, 5)).toBe((42 + paethPredictor(10, 20, 5)) & 0xff);
    expect(unfilterByte(99, 42, 10, 20, 5)).toBe(42);
  });

  it('unfilters scanlines for RGBA raw buffers', () => {
    const raw = Buffer.from([0, 255, 0, 0, 255, 0, 255, 0, 128]);
    const { rgb, alpha } = unfilterScanlines(raw, 2, 1);
    expect(rgb.length).toBe(6);
    expect(alpha.length).toBe(2);
    expect(rgb[0]).toBe(255);
    expect(alpha[0]).toBe(255);
    expect(alpha[1]).toBe(128);
  });
});
