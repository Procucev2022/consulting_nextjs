/**
 * STORE-only ZIP writer for the evidence package. Entries are written without compression, so the
 * only dependency is a CRC-32 table computed once at module load.
 */

import {
  CRC32_BITS_PER_BYTE,
  CRC32_BYTE_MASK,
  CRC32_BYTE_SHIFT,
  CRC32_INITIAL_VALUE,
  CRC32_POLYNOMIAL,
  CRC32_TABLE_SIZE,
  DOS_EPOCH_YEAR,
  DOS_HOUR_SHIFT,
  DOS_MINUTE_SHIFT,
  DOS_MONTH_SHIFT,
  DOS_SECOND_STEP,
  DOS_YEAR_SHIFT,
  ZIP_CENTRAL_DIRECTORY_SIGNATURE,
  ZIP_CENTRAL_HEADER_BYTES,
  ZIP_CENTRAL_HEADER_LAYOUT,
  ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE,
  ZIP_END_RECORD_BYTES,
  ZIP_END_RECORD_LAYOUT,
  ZIP_LOCAL_FILE_HEADER_SIGNATURE,
  ZIP_LOCAL_HEADER_BYTES,
  ZIP_LOCAL_HEADER_LAYOUT,
  ZIP_MAX_ENTRIES,
  ZIP_MAX_OFFSET,
  ZIP_METHOD_STORE,
  ZIP_UTF8_FLAG,
  ZIP_VERSION_NEEDED
} from '../constants/evidenceZip';
import type { EvidenceDosStamp, EvidenceZipEntry } from '../types/evidenceWorkbook';

const buildCrc32Table = (): Uint32Array => {
  const table = new Uint32Array(CRC32_TABLE_SIZE);
  for (let index = 0; index < CRC32_TABLE_SIZE; index += 1) {
    let value = index;
    for (let bit = 0; bit < CRC32_BITS_PER_BYTE; bit += 1) {
      value = (value & 1) === 1 ? CRC32_POLYNOMIAL ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
};

const CRC32_TABLE = buildCrc32Table();

export const computeCrc32 = (bytes: Uint8Array): number => {
  let crc = CRC32_INITIAL_VALUE;
  for (const byte of bytes) {
    crc = CRC32_TABLE[(crc ^ byte) & CRC32_BYTE_MASK] ^ (crc >>> CRC32_BYTE_SHIFT);
  }
  return (crc ^ CRC32_INITIAL_VALUE) >>> 0;
};

const toDosDateTime = (value: Date): EvidenceDosStamp => {
  const year = Math.max(value.getUTCFullYear(), DOS_EPOCH_YEAR);
  const time = (value.getUTCHours() << DOS_HOUR_SHIFT) |
    (value.getUTCMinutes() << DOS_MINUTE_SHIFT) |
    Math.floor(value.getUTCSeconds() / DOS_SECOND_STEP);
  const date = ((year - DOS_EPOCH_YEAR) << DOS_YEAR_SHIFT) |
    ((value.getUTCMonth() + 1) << DOS_MONTH_SHIFT) |
    value.getUTCDate();
  return { time, date };
};

const buildLocalHeader = (
  name: Uint8Array,
  entry: EvidenceZipEntry,
  crc: number,
  stamp: EvidenceDosStamp
): Uint8Array => {
  const view = new DataView(new ArrayBuffer(ZIP_LOCAL_HEADER_BYTES + name.length));
  const size = entry.bytes.length;
  view.setUint32(ZIP_LOCAL_HEADER_LAYOUT.SIGNATURE, ZIP_LOCAL_FILE_HEADER_SIGNATURE, true);
  view.setUint16(ZIP_LOCAL_HEADER_LAYOUT.VERSION_NEEDED, ZIP_VERSION_NEEDED, true);
  view.setUint16(ZIP_LOCAL_HEADER_LAYOUT.FLAGS, ZIP_UTF8_FLAG, true);
  view.setUint16(ZIP_LOCAL_HEADER_LAYOUT.METHOD, ZIP_METHOD_STORE, true);
  view.setUint16(ZIP_LOCAL_HEADER_LAYOUT.TIME, stamp.time, true);
  view.setUint16(ZIP_LOCAL_HEADER_LAYOUT.DATE, stamp.date, true);
  view.setUint32(ZIP_LOCAL_HEADER_LAYOUT.CRC32, crc, true);
  view.setUint32(ZIP_LOCAL_HEADER_LAYOUT.COMPRESSED_SIZE, size, true);
  view.setUint32(ZIP_LOCAL_HEADER_LAYOUT.UNCOMPRESSED_SIZE, size, true);
  view.setUint16(ZIP_LOCAL_HEADER_LAYOUT.NAME_LENGTH, name.length, true);
  view.setUint16(ZIP_LOCAL_HEADER_LAYOUT.EXTRA_LENGTH, 0, true);
  const header = new Uint8Array(view.buffer);
  header.set(name, ZIP_LOCAL_HEADER_BYTES);
  return header;
};

const buildCentralHeader = (
  name: Uint8Array,
  entry: EvidenceZipEntry,
  crc: number,
  stamp: EvidenceDosStamp,
  localOffset: number
): Uint8Array => {
  const view = new DataView(new ArrayBuffer(ZIP_CENTRAL_HEADER_BYTES + name.length));
  const size = entry.bytes.length;
  view.setUint32(ZIP_CENTRAL_HEADER_LAYOUT.SIGNATURE, ZIP_CENTRAL_DIRECTORY_SIGNATURE, true);
  view.setUint16(ZIP_CENTRAL_HEADER_LAYOUT.VERSION_MADE_BY, ZIP_VERSION_NEEDED, true);
  view.setUint16(ZIP_CENTRAL_HEADER_LAYOUT.VERSION_NEEDED, ZIP_VERSION_NEEDED, true);
  view.setUint16(ZIP_CENTRAL_HEADER_LAYOUT.FLAGS, ZIP_UTF8_FLAG, true);
  view.setUint16(ZIP_CENTRAL_HEADER_LAYOUT.METHOD, ZIP_METHOD_STORE, true);
  view.setUint16(ZIP_CENTRAL_HEADER_LAYOUT.TIME, stamp.time, true);
  view.setUint16(ZIP_CENTRAL_HEADER_LAYOUT.DATE, stamp.date, true);
  view.setUint32(ZIP_CENTRAL_HEADER_LAYOUT.CRC32, crc, true);
  view.setUint32(ZIP_CENTRAL_HEADER_LAYOUT.COMPRESSED_SIZE, size, true);
  view.setUint32(ZIP_CENTRAL_HEADER_LAYOUT.UNCOMPRESSED_SIZE, size, true);
  view.setUint16(ZIP_CENTRAL_HEADER_LAYOUT.NAME_LENGTH, name.length, true);
  view.setUint32(ZIP_CENTRAL_HEADER_LAYOUT.LOCAL_HEADER_OFFSET, localOffset, true);
  const header = new Uint8Array(view.buffer);
  header.set(name, ZIP_CENTRAL_HEADER_BYTES);
  return header;
};

const buildEndRecord = (entryCount: number, directorySize: number, directoryOffset: number): Uint8Array => {
  const view = new DataView(new ArrayBuffer(ZIP_END_RECORD_BYTES));
  view.setUint32(ZIP_END_RECORD_LAYOUT.SIGNATURE, ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE, true);
  view.setUint16(ZIP_END_RECORD_LAYOUT.ENTRIES_ON_DISK, entryCount, true);
  view.setUint16(ZIP_END_RECORD_LAYOUT.ENTRIES_TOTAL, entryCount, true);
  view.setUint32(ZIP_END_RECORD_LAYOUT.CENTRAL_DIRECTORY_SIZE, directorySize, true);
  view.setUint32(ZIP_END_RECORD_LAYOUT.CENTRAL_DIRECTORY_OFFSET, directoryOffset, true);
  return new Uint8Array(view.buffer);
};

const concatBytes = (parts: readonly Uint8Array[]): Uint8Array => {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
};

export const buildStoredZip = (entries: readonly EvidenceZipEntry[], modifiedAt: Date): Uint8Array => {
  if (entries.length > ZIP_MAX_ENTRIES) {
    throw new RangeError(`ZIP archive supports at most ${ZIP_MAX_ENTRIES} entries, received ${entries.length}`);
  }
  const encoder = new TextEncoder();
  const stamp = toDosDateTime(modifiedAt);
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const crc = computeCrc32(entry.bytes);
    const local = buildLocalHeader(name, entry, crc, stamp);
    centralParts.push(buildCentralHeader(name, entry, crc, stamp, offset));
    localParts.push(local, entry.bytes);
    offset += local.length + entry.bytes.length;
    if (offset > ZIP_MAX_OFFSET) {
      throw new RangeError('ZIP archive exceeds the 4 GiB offset limit of the STORE format');
    }
  }
  const centralDirectory = concatBytes(centralParts);
  const endRecord = buildEndRecord(entries.length, centralDirectory.length, offset);
  return concatBytes([...localParts, centralDirectory, endRecord]);
};
