/**
 * Standalone Zero-Dependency PKZIP Archive Builder (Prompt 305)
 * Builds standard RFC 1951 / PKZIP compliant .zip archives using Node.js built-in zlib.
 */

import zlib from 'zlib';

export interface ZipEntry {
  filename: string;
  data: Buffer;
}

export class ZipArchiveBuilder {
  private static crcTable: Uint32Array | null = null;
  private entries: ZipEntry[] = [];

  private static getCrcTable(): Uint32Array {
    if (!ZipArchiveBuilder.crcTable) {
      const table = new Uint32Array(256);
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
          c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[n] = c;
      }
      ZipArchiveBuilder.crcTable = table;
    }
    return ZipArchiveBuilder.crcTable;
  }

  public static calculateCrc32(buf: Buffer): number {
    const table = ZipArchiveBuilder.getCrcTable();
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  public addFile(filename: string, content: Buffer): this {
    this.entries.push({ filename, data: content });
    return this;
  }

  public build(): Buffer {
    const now = new Date();
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

    const localParts: Buffer[] = [];
    const centralParts: Buffer[] = [];
    let offset = 0;

    for (const entry of this.entries) {
      const nameBuf = Buffer.from(entry.filename, 'utf-8');
      const uncompressed = entry.data;
      const compressed = zlib.deflateRawSync(uncompressed);
      const crc = ZipArchiveBuilder.calculateCrc32(uncompressed);

      // Local File Header (30 bytes + filename + data)
      const localHeader = Buffer.alloc(30);
      localHeader.writeUInt32LE(0x04034b50, 0); // signature
      localHeader.writeUInt16LE(20, 4);         // version needed (2.0)
      localHeader.writeUInt16LE(0x0800, 6);     // UTF-8 filename flag
      localHeader.writeUInt16LE(8, 8);          // compression method (deflate)
      localHeader.writeUInt16LE(dosTime, 10);
      localHeader.writeUInt16LE(dosDate, 12);
      localHeader.writeUInt32LE(crc, 14);
      localHeader.writeUInt32LE(compressed.length, 18);
      localHeader.writeUInt32LE(uncompressed.length, 22);
      localHeader.writeUInt16LE(nameBuf.length, 26);
      localHeader.writeUInt16LE(0, 28);         // extra field length

      localParts.push(localHeader, nameBuf, compressed);

      // Central Directory Header (46 bytes + filename)
      const centralHeader = Buffer.alloc(46);
      centralHeader.writeUInt32LE(0x02014b50, 0); // signature
      centralHeader.writeUInt16LE(20, 4);         // version made by
      centralHeader.writeUInt16LE(20, 6);         // version needed
      centralHeader.writeUInt16LE(0x0800, 8);     // UTF-8 flag
      centralHeader.writeUInt16LE(8, 10);         // compression method (deflate)
      centralHeader.writeUInt16LE(dosTime, 12);
      centralHeader.writeUInt16LE(dosDate, 14);
      centralHeader.writeUInt32LE(crc, 16);
      centralHeader.writeUInt32LE(compressed.length, 20);
      centralHeader.writeUInt32LE(uncompressed.length, 24);
      centralHeader.writeUInt16LE(nameBuf.length, 28);
      centralHeader.writeUInt16LE(0, 30);         // extra field length
      centralHeader.writeUInt16LE(0, 32);         // comment length
      centralHeader.writeUInt16LE(0, 34);         // disk number start
      centralHeader.writeUInt16LE(0, 36);         // internal file attributes
      centralHeader.writeUInt32LE(0, 38);         // external file attributes
      centralHeader.writeUInt32LE(offset, 42);    // relative offset of local header

      centralParts.push(centralHeader, nameBuf);

      offset += localHeader.length + nameBuf.length + compressed.length;
    }

    const centralDirectory = Buffer.concat(centralParts);
    const centralDirOffset = offset;
    const centralDirSize = centralDirectory.length;

    // End of Central Directory (EOCD, 22 bytes)
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);            // signature
    eocd.writeUInt16LE(0, 4);                     // disk number
    eocd.writeUInt16LE(0, 6);                     // disk with central dir
    eocd.writeUInt16LE(this.entries.length, 8);   // entries on this disk
    eocd.writeUInt16LE(this.entries.length, 10);  // total entries
    eocd.writeUInt32LE(centralDirSize, 12);       // central dir size
    eocd.writeUInt32LE(centralDirOffset, 16);     // central dir offset
    eocd.writeUInt16LE(0, 20);                    // comment length

    return Buffer.concat([...localParts, centralDirectory, eocd]);
  }
}
