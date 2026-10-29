/**
 * Test helper: reads a STORE-only ZIP archive so tests can verify names, CRCs, and payloads.
 */

import { computeCrc32 } from '../../src/services/evidenceZipWriter';

export interface StoredZipEntry {
  name: string;
  data: Uint8Array;
  crc32: number;
}

const END_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;

const findEndRecord = (view: DataView): number => {
  for (let offset = view.byteLength - 22; offset >= 0; offset -= 1) {
    if (view.getUint32(offset, true) === END_SIGNATURE) return offset;
  }
  throw new Error('End of central directory not found');
};

export const readStoredZip = (bytes: Uint8Array): StoredZipEntry[] => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const endOffset = findEndRecord(view);
  const entryCount = view.getUint16(endOffset + 10, true);
  let cursor = view.getUint32(endOffset + 16, true);
  const entries: StoredZipEntry[] = [];
  for (let index = 0; index < entryCount; index += 1) {
    if (view.getUint32(cursor, true) !== CENTRAL_SIGNATURE) throw new Error('Bad central directory signature');
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localOffset = view.getUint32(cursor + 42, true);
    const size = view.getUint32(cursor + 24, true);
    const name = new TextDecoder().decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));
    if (view.getUint32(localOffset, true) !== LOCAL_SIGNATURE) throw new Error('Bad local header signature');
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const data = bytes.subarray(dataStart, dataStart + size);
    entries.push({ name, data, crc32: view.getUint32(cursor + 16, true) });
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
};

export const crcMatches = (entry: StoredZipEntry): boolean => computeCrc32(entry.data) === entry.crc32;
