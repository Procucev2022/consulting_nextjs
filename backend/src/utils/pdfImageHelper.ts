/**
 * PDF Image Helper for Official Logo Embedding (Prompt 283)
 * Decodes PNG scanlines and packages RGB + Alpha (/SMask) streams for PDF 1.4 XObjects.
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

export interface PreparedLogo {
  width: number;
  height: number;
  compRgb: Buffer;
  compAlpha: Buffer;
}

let cachedLogo: PreparedLogo | null = null;

export function paethPredictor(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

export function unfilterByte(filterType: number, rawVal: number, left: number, up: number, upLeft: number): number {
  switch (filterType) {
    case 1:
      return (rawVal + left) & 0xff;
    case 2:
      return (rawVal + up) & 0xff;
    case 3:
      return (rawVal + Math.floor((left + up) / 2)) & 0xff;
    case 4:
      return (rawVal + paethPredictor(left, up, upLeft)) & 0xff;
    default:
      return rawVal;
  }
}

export function unfilterScanlines(raw: Buffer, width: number, height: number): { rgb: Buffer; alpha: Buffer } {
  const bpp = 4;
  const stride = width * bpp;
  const rgb = Buffer.alloc(width * height * 3);
  const alpha = Buffer.alloc(width * height);
  let prevRow = Buffer.alloc(stride);
  let srcPos = 0;
  let rgbPos = 0;
  let alphaPos = 0;

  for (let y = 0; y < height; y++) {
    const filterType = raw[srcPos++];
    const row = Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const rawVal = raw[srcPos++];
      const left = x >= bpp ? row[x - bpp] : 0;
      const up = prevRow[x];
      const upLeft = x >= bpp ? prevRow[x - bpp] : 0;
      row[x] = unfilterByte(filterType, rawVal, left, up, upLeft);
    }
    prevRow = row;
    for (let x = 0; x < width; x++) {
      rgb[rgbPos++] = row[x * 4];
      rgb[rgbPos++] = row[x * 4 + 1];
      rgb[rgbPos++] = row[x * 4 + 2];
      alpha[alphaPos++] = row[x * 4 + 3];
    }
  }
  return { rgb, alpha };
}

export function getPreparedLogo(): PreparedLogo {
  if (cachedLogo) {
    return cachedLogo;
  }
  const logoPath = path.resolve(__dirname, '../../assets/aicev-logo.png');
  const buf = fs.readFileSync(logoPath);
  let pos = 8;
  const idats: Buffer[] = [];
  let width = 611;
  let height = 223;

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IHDR') {
      width = buf.readUInt32BE(pos + 8);
      height = buf.readUInt32BE(pos + 12);
    }
    if (type === 'IDAT') {
      idats.push(buf.subarray(pos + 8, pos + 8 + len));
    }
    pos += 12 + len;
  }

  const raw = zlib.inflateSync(Buffer.concat(idats));
  const { rgb, alpha } = unfilterScanlines(raw, width, height);

  cachedLogo = {
    width,
    height,
    compRgb: zlib.deflateSync(rgb),
    compAlpha: zlib.deflateSync(alpha)
  };
  return cachedLogo;
}
