/**
 * PDF Writer Utility for PDF 1.4 Binary Buffer Assembly
 */

import { getPreparedLogo } from './pdfImageHelper';

export function buildPdfObjects(pages: string[], width: number, height: number): (string | Buffer)[] {
  const totalPages = pages.length;
  const bodyObjects: (string | Buffer)[] = [];
  const pageObjStartId = 3;
  const pageObjCount = totalPages * 2;
  const kids = Array.from({ length: totalPages }, (_, i) => `${pageObjStartId + i * 2} 0 R`).join(' ');

  bodyObjects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  bodyObjects.push(`2 0 obj\n<< /Type /Pages /Kids [ ${kids} ] /Count ${totalPages} >>\nendobj\n`);

  const fontRegularId = pageObjStartId + pageObjCount;
  const fontBoldId = fontRegularId + 1;
  const fontItalicId = fontBoldId + 1;
  const logoImgId = fontItalicId + 1;
  const logoMaskId = logoImgId + 1;

  pages.forEach((contentStream, idx) => {
    const pageId = pageObjStartId + idx * 2;
    const contentId = pageId + 1;
    const contentBytes = Buffer.from(contentStream, 'utf-8');

    bodyObjects.push(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [ 0 0 ${width} ${height} ] ` +
        `/Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R /F3 ${fontItalicId} 0 R >> ` +
        `/XObject << /Im1 ${logoImgId} 0 R >> >> ` +
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

  const logo = getPreparedLogo();
  const imgHeader = Buffer.from(
    `${logoImgId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /SMask ${logoMaskId} 0 R ` +
      `/Length ${logo.compRgb.length} >>\nstream\n`
  );
  const imgFooter = Buffer.from('\nendstream\nendobj\n');
  bodyObjects.push(Buffer.concat([imgHeader, logo.compRgb, imgFooter]));

  const maskHeader = Buffer.from(
    `${logoMaskId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} ` +
      `/ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /Length ${logo.compAlpha.length} >>\nstream\n`
  );
  const maskFooter = Buffer.from('\nendstream\nendobj\n');
  bodyObjects.push(Buffer.concat([maskHeader, logo.compAlpha, maskFooter]));

  return bodyObjects;
}

export function assemblePdfBuffer(bodyObjects: (string | Buffer)[]): Buffer {
  let offset = 0;
  const header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  offset += Buffer.byteLength(header, 'utf-8');
  const offsets: number[] = [0];
  const chunks: Buffer[] = [Buffer.from(header, 'utf-8')];

  bodyObjects.forEach((obj) => {
    offsets.push(offset);
    const b = typeof obj === 'string' ? Buffer.from(obj, 'utf-8') : obj;
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
  chunks.push(Buffer.from(xref));
  chunks.push(Buffer.from(trailer));
  return Buffer.concat(chunks);
}
