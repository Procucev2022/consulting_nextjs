/**
 * Unit Tests for ZipArchiveBuilder (Prompt 305)
 */

import { describe, it, expect } from 'vitest';
import { ZipArchiveBuilder } from '../../src/utils/zipArchiveBuilder';

describe('ZipArchiveBuilder Unit Tests', () => {
  it('should correctly calculate IEEE 802.3 CRC-32 for buffers', () => {
    const testBuf = Buffer.from('123456789', 'utf-8');
    // Standard CRC-32 check value for "123456789" is 0xcbf43926
    const crc = ZipArchiveBuilder.calculateCrc32(testBuf);
    expect(crc).toBe(0xcbf43926);

    const emptyBuf = Buffer.alloc(0);
    expect(ZipArchiveBuilder.calculateCrc32(emptyBuf)).toBe(0);
  });

  it('should build a valid PKZIP buffer containing multiple files', () => {
    const builder = new ZipArchiveBuilder();
    builder.addFile('test1.txt', Buffer.from('Hello World 1', 'utf-8'));
    builder.addFile('test2.txt', Buffer.from('Hello World 2', 'utf-8'));

    const zipBuffer = builder.build();
    expect(zipBuffer).toBeInstanceOf(Buffer);
    expect(zipBuffer.length).toBeGreaterThan(100);

    // Verify PKZIP local file header signature: PK\x03\x04 (0x04034b50)
    expect(zipBuffer.readUInt32LE(0)).toBe(0x04034b50);

    // Verify End of Central Directory signature: PK\x05\x06 (0x06054b50)
    const eocdSignature = 0x06054b50;
    let foundEocd = false;
    for (let i = zipBuffer.length - 22; i >= 0; i--) {
      if (zipBuffer.readUInt32LE(i) === eocdSignature) {
        foundEocd = true;
        // Verify number of entries in EOCD matches 2
        expect(zipBuffer.readUInt16LE(i + 10)).toBe(2);
        break;
      }
    }
    expect(foundEocd).toBe(true);
  });
});
