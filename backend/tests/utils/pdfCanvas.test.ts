import { describe, expect, it } from 'vitest';
import { PdfCanvas, toPdfSafeText } from '../../src/utils/pdfCanvas';
import { assemblePdfBuffer, buildPdfObjects } from '../../src/utils/pdfWriter';

const decode = (bytes: Uint8Array): string => Buffer.from(bytes).toString('latin1');

const crossReferenceOffsetsPointAtObjects = (text: string): boolean => {
  const startXref = Number(/startxref\n(\d+)\n%%EOF\n$/u.exec(text)?.[1]);
  const lines = text.slice(startXref).split('\n');
  const objectCount = Number(lines[1].split(' ')[1]);
  for (let objectNumber = 1; objectNumber < objectCount; objectNumber += 1) {
    const offset = Number(lines[2 + objectNumber].slice(0, 10));
    if (!text.startsWith(`${objectNumber} 0 obj`, offset)) {
      return false;
    }
  }
  return true;
};

describe('pdfWriter', () => {
  it('builds catalog, page tree, page and content objects, then three fonts in object-number order', () => {
    const objects = buildPdfObjects(['BT ET', 'BT ET'], 960, 540).map(decode);
    expect(objects).toHaveLength(2 + 2 * 2 + 3);
    expect(objects[0]).toContain('/Type /Catalog');
    expect(objects[1]).toContain('/Count 2');
    expect(objects[2]).toContain('/MediaBox [ 0 0 960 540 ]');
    expect(objects[3]).toContain('/Length 5');
    expect(objects[objects.length - 1]).toContain('/BaseFont /Helvetica-Oblique');
  });

  it('assembles a PDF whose cross-reference offsets point at every object', () => {
    const text = decode(assemblePdfBuffer(buildPdfObjects(['BT ET'], 960, 540)));
    expect(text.startsWith('%PDF-1.4\n%')).toBe(true);
    expect(text.endsWith('%%EOF\n')).toBe(true);
    expect(crossReferenceOffsetsPointAtObjects(text)).toBe(true);
  });
});

describe('PdfCanvas', () => {
  it('defaults to the 16:9 page grid and counts the open page', () => {
    const canvas = new PdfCanvas();
    expect(canvas.getWidth()).toBe(960);
    expect(canvas.getHeight()).toBe(540);
    expect(canvas.getPageCount()).toBe(0);
    canvas.text('first page', 10, 10);
    expect(canvas.getPageCount()).toBe(1);
    canvas.addPage();
    canvas.addPage();
    expect(canvas.getPageCount()).toBe(1);
  });

  it('draws rectangles with fill, stroke, both, or neither', () => {
    const canvas = new PdfCanvas(200, 100);
    canvas.rect(1, 2, 3, 4);
    canvas.rect(1, 2, 3, 4, { fill: '#abc' });
    canvas.rect(1, 2, 3, 4, { stroke: '#112233', lineWidth: 2 });
    canvas.rect(1, 2, 3, 4, { fill: '#ffffff', stroke: '#000000' });
    const text = decode(canvas.toBytes());
    expect(text).toContain('0.667 0.733 0.800 rg');
    expect(text).toContain('2.00 w');
    expect(text).toContain(' re S');
    expect(text).toContain(' re f');
    expect(text).toContain(' re B');
  });

  it('draws lines with the default and explicit colour and width', () => {
    const canvas = new PdfCanvas(200, 100);
    canvas.line(0, 0, 50, 0);
    canvas.line(0, 10, 50, 10, '#ff0000', 0.5);
    const text = decode(canvas.toBytes());
    expect(text).toContain('1.00 w');
    expect(text).toContain('0.50 w');
    expect(text).toContain(' l S');
  });

  it('positions left, centred, and right-aligned text and defaults the style', () => {
    const canvas = new PdfCanvas(200, 100);
    canvas.text('plain', 5, 5);
    canvas.text('centre', 100, 50, { align: 'center', font: 'bold', fontSize: 9, color: '#123456' });
    canvas.text('right', 100, 60, { align: 'right', font: 'italic' });
    canvas.text('left', 10, 70, { color: '#abcdef' });
    const text = decode(canvas.toBytes());
    expect(text).toContain('/F1 11.00 Tf');
    expect(text).toContain('/F2 9.00 Tf');
    expect(text).toContain('/F3 11.00 Tf');
    expect(text).toContain('(centre) Tj');
    expect(text).toContain('(right) Tj');
    expect(text).toContain('(left) Tj');
  });

  it('wraps text to the requested width and breaks words longer than one line', () => {
    const canvas = new PdfCanvas();
    expect(canvas.wrapLines('alpha beta gamma', 1000, 10)).toEqual(['alpha beta gamma']);
    expect(canvas.wrapLines('alpha beta gamma', 60, 10)).toEqual(['alpha beta', 'gamma']);
    expect(canvas.wrapLines('abcdefghijklmnop', 60, 10)).toEqual(['abcdefghijk', 'lmnop']);
  });

  it('returns one empty line for blank input so an empty value still occupies a row', () => {
    const canvas = new PdfCanvas();
    expect(canvas.wrapLines('', 100, 10)).toEqual(['']);
    expect(canvas.wrapLines('   ', 100, 10)).toEqual(['']);
  });

  it('measures text with the shared character width ratio', () => {
    const canvas = new PdfCanvas();
    expect(canvas.measureText('abcd', 10)).toBeCloseTo(20.8, 5);
  });

  it('escapes parentheses and backslashes inside text operators', () => {
    const canvas = new PdfCanvas();
    canvas.text('a(b)c\\d', 0, 0);
    expect(decode(canvas.toBytes())).toContain('(a\\(b\\)c\\\\d) Tj');
  });
});

describe('toPdfSafeText', () => {
  it('maps rupee signs and replaces characters outside printable ASCII', () => {
    expect(toPdfSafeText('₹5 é')).toBe('Rs. 5 ?');
    expect(toPdfSafeText('plain ASCII')).toBe('plain ASCII');
  });
});
