/**
 * Unit tests for the STORE-only ZIP writer and its CRC-32 table.
 */

import { describe, expect, it } from 'vitest';
import { ZIP_MAX_ENTRIES } from '../../src/constants/evidenceZip';
import { assertZipOffsetWithinLimit, buildStoredZip, computeCrc32 } from '../../src/services/evidenceZipWriter';
import { crcMatches, readStoredZip } from '../helpers/storedZip';

const encode = (text: string): Uint8Array => new TextEncoder().encode(text);

describe('computeCrc32', () => {
  it('matches the standard check value for "123456789"', () => {
    expect(computeCrc32(encode('123456789'))).toBe(0xcbf43926);
  });

  it('returns zero for empty input and a stable value for binary data', () => {
    expect(computeCrc32(new Uint8Array())).toBe(0);
    expect(computeCrc32(new Uint8Array([0, 255, 128]))).toBe(computeCrc32(new Uint8Array([0, 255, 128])));
  });
});

describe('buildStoredZip', () => {
  const modifiedAt = new Date('2026-10-01T10:20:30Z');

  it('round-trips names, sizes, CRCs, and payloads', () => {
    const payload = encode('hello evidence');
    const archive = buildStoredZip([{ name: 'a.txt', bytes: payload }, { name: '知.txt', bytes: new Uint8Array() }], modifiedAt);
    const entries = readStoredZip(archive);
    expect(entries.map((entry) => entry.name)).toEqual(['a.txt', '知.txt']);
    expect(new TextDecoder().decode(entries[0].data)).toBe('hello evidence');
    expect(entries[1].data.length).toBe(0);
    expect(entries.every(crcMatches)).toBe(true);
  });

  it('writes the DOS timestamp from the UTC modification time', () => {
    const archive = buildStoredZip([{ name: 'a.txt', bytes: encode('x') }], modifiedAt);
    const view = new DataView(archive.buffer, archive.byteOffset, archive.byteLength);
    const time = view.getUint16(10, true);
    const date = view.getUint16(12, true);
    expect(time >> 11).toBe(10);
    expect((time >> 5) & 0x3f).toBe(20);
    expect((time & 0x1f) * 2).toBe(30);
    expect(date >> 9).toBe(2026 - 1980);
    expect((date >> 5) & 0x0f).toBe(10);
    expect(date & 0x1f).toBe(1);
  });

  it('clamps timestamps before 1980 to the DOS epoch', () => {
    const archive = buildStoredZip([{ name: 'old.txt', bytes: encode('x') }], new Date('1970-01-01T00:00:00Z'));
    const view = new DataView(archive.buffer, archive.byteOffset, archive.byteLength);
    expect(view.getUint16(12, true) >> 9).toBe(0);
    expect(readStoredZip(archive)[0].name).toBe('old.txt');
  });

  it('writes an empty archive that still has a valid end record', () => {
    const archive = buildStoredZip([], modifiedAt);
    expect(archive.length).toBe(22);
    expect(readStoredZip(archive)).toEqual([]);
  });

  it('refuses more entries than the ZIP format can index', () => {
    const entries = Array.from({ length: ZIP_MAX_ENTRIES + 1 }, (_value, index) => ({ name: `f${index}`, bytes: new Uint8Array() }));
    expect(() => buildStoredZip(entries, modifiedAt)).toThrow(RangeError);
  });
});

describe('assertZipOffsetWithinLimit', () => {
  it('accepts in-range offsets and rejects offsets beyond the ZIP32 limit', () => {
    expect(() => assertZipOffsetWithinLimit(0)).not.toThrow();
    expect(() => assertZipOffsetWithinLimit(Number.MAX_SAFE_INTEGER)).toThrow(RangeError);
  });
});
