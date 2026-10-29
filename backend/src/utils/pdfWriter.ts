/**
 * PDF 1.4 object assembly for the Executive Brief. Pure JavaScript: no filesystem access and no image assets, so it
 * runs on Cloudflare Workers. Pages use three base-14 Helvetica fonts (F1 regular, F2 bold, F3 italic) with
 * WinAnsi encoding. Content streams are stored uncompressed.
 */
import {
  PDF_BASE_FONTS,
  PDF_BINARY_MARKER,
  PDF_FIRST_PAGE_OBJECT_ID,
  PDF_FONT_ENCODING,
  PDF_HEADER_LINE,
  PDF_TRAILER_ROOT_REFERENCE,
  PDF_XREF_FREE_ENTRY,
  PDF_XREF_IN_USE_SUFFIX,
  PDF_XREF_OFFSET_WIDTH
} from '../constants/executiveBriefPdfConstants';

const encoder = new TextEncoder();

const encodeText = (text: string): Uint8Array => encoder.encode(text);

const concatBytes = (parts: Uint8Array[]): Uint8Array => {
  const total = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.byteLength;
  });
  return output;
};

const indirectObject = (objectId: number, body: string): Uint8Array =>
  encodeText(`${objectId} 0 obj\n${body}\nendobj\n`);

const streamObject = (objectId: number, content: string): Uint8Array => {
  const contentBytes = encodeText(content);
  return concatBytes([
    encodeText(`${objectId} 0 obj\n<< /Length ${contentBytes.byteLength} >>\nstream\n`),
    contentBytes,
    encodeText('\nendstream\nendobj\n')
  ]);
};

const fontObject = (objectId: number, baseFont: string): Uint8Array =>
  indirectObject(objectId, `<< /Type /Font /Subtype /Type1 /BaseFont /${baseFont} /Encoding /${PDF_FONT_ENCODING} >>`);

/**
 * Builds the indirect objects in object-number order: catalog (1), page tree (2), then a page and its content stream
 * for each page, followed by the three font dictionaries.
 */
export const buildPdfObjects = (pages: string[], width: number, height: number): Uint8Array[] => {
  const pageCount = pages.length;
  const kids = pages.map((_page, index) => `${PDF_FIRST_PAGE_OBJECT_ID + index * 2} 0 R`).join(' ');
  const regularFontId = PDF_FIRST_PAGE_OBJECT_ID + pageCount * 2;
  const boldFontId = regularFontId + 1;
  const italicFontId = boldFontId + 1;
  const objects: Uint8Array[] = [
    indirectObject(1, '<< /Type /Catalog /Pages 2 0 R >>'),
    indirectObject(2, `<< /Type /Pages /Kids [ ${kids} ] /Count ${pageCount} >>`)
  ];
  pages.forEach((content, index) => {
    const pageId = PDF_FIRST_PAGE_OBJECT_ID + index * 2;
    const contentId = pageId + 1;
    objects.push(indirectObject(
      pageId,
      `<< /Type /Page /Parent 2 0 R /MediaBox [ 0 0 ${width} ${height} ] ` +
        `/Resources << /Font << /F1 ${regularFontId} 0 R /F2 ${boldFontId} 0 R /F3 ${italicFontId} 0 R >> >> ` +
        `/Contents ${contentId} 0 R >>`
    ));
    objects.push(streamObject(contentId, content));
  });
  objects.push(fontObject(regularFontId, PDF_BASE_FONTS.regular));
  objects.push(fontObject(boldFontId, PDF_BASE_FONTS.bold));
  objects.push(fontObject(italicFontId, PDF_BASE_FONTS.italic));
  return objects;
};

/**
 * Assembles the header, the indirect objects, the cross-reference table, and the trailer. Offsets are byte positions.
 */
export const assemblePdfBuffer = (objects: Uint8Array[]): Uint8Array => {
  const header = concatBytes([
    encodeText(`${PDF_HEADER_LINE}%`),
    Uint8Array.from(PDF_BINARY_MARKER),
    encodeText('\n')
  ]);
  let position = header.byteLength;
  const offsets = objects.map((object) => {
    const offset = position;
    position += object.byteLength;
    return offset;
  });
  const xrefEntries = offsets
    .map((offset) => `${offset.toString().padStart(PDF_XREF_OFFSET_WIDTH, '0')}${PDF_XREF_IN_USE_SUFFIX}`)
    .join('');
  const objectCount = objects.length + 1;
  const xref = `xref\n0 ${objectCount}\n${PDF_XREF_FREE_ENTRY}${xrefEntries}`;
  const trailer = `trailer\n<< /Size ${objectCount} /Root ${PDF_TRAILER_ROOT_REFERENCE} >>\nstartxref\n${position}\n%%EOF\n`;
  return concatBytes([header, ...objects, encodeText(xref), encodeText(trailer)]);
};
