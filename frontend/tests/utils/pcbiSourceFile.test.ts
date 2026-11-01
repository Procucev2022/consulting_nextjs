import { afterEach, describe, expect, it, vi } from 'vitest';
import { encodePCBIFileBase64 } from '../../src/utils/pcbiSourceFile';
import { UI_STRINGS } from '../../src/constants/uiStrings';

describe('encodePCBIFileBase64', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('encodes empty evidence files', async () => {
    const file = { arrayBuffer: async () => new ArrayBuffer(0) } as File;
    await expect(encodePCBIFileBase64(file)).resolves.toBe('');
  });

  it('encodes binary evidence in chunks without losing bytes', async () => {
    const bytes = new Uint8Array(40_000);
    for (let index = 0; index < bytes.length; index += 1) bytes[index] = index % 251;
    const file = { arrayBuffer: async () => bytes.buffer } as File;
    const encoded = await encodePCBIFileBase64(file);
    expect(encoded).toBe(btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')));
  });

  it('uses FileReader when Blob.arrayBuffer is unavailable', async () => {
    class ArrayBufferFileReader {
      result: ArrayBuffer | null = null;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      readAsArrayBuffer(): void {
        this.result = new Uint8Array([0, 1, 255]).buffer;
        this.onload?.();
      }
    }
    vi.stubGlobal('FileReader', ArrayBufferFileReader);

    const file = { arrayBuffer: undefined } as File;
    await expect(encodePCBIFileBase64(file)).resolves.toBe('AAH/');
  });

  it('falls back to FileReader when Blob.arrayBuffer rejects', async () => {
    class ArrayBufferFileReader {
      result: ArrayBuffer | null = null;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      readAsArrayBuffer(): void {
        this.result = new Uint8Array([65]).buffer;
        this.onload?.();
      }
    }
    vi.stubGlobal('FileReader', ArrayBufferFileReader);

    const file = { arrayBuffer: vi.fn().mockRejectedValue(new Error('unavailable')) } as unknown as File;
    await expect(encodePCBIFileBase64(file)).resolves.toBe('QQ==');
  });

  it('rejects when FileReader cannot return an ArrayBuffer', async () => {
    class InvalidFileReader {
      result: string | null = 'not-binary';
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      readAsArrayBuffer(): void {
        this.onload?.();
      }
    }
    vi.stubGlobal('FileReader', InvalidFileReader);

    const file = { arrayBuffer: undefined } as File;
    await expect(encodePCBIFileBase64(file)).rejects.toThrow(
      UI_STRINGS.pcbiCommodityDataLab.evidenceFileReadFailed
    );
  });

  it('propagates a FileReader failure when binary data cannot be read', async () => {
    const readError = new Error('FileReader failed');
    class FailedFileReader {
      result: ArrayBuffer | null = null;
      error = readError;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      readAsArrayBuffer(): void {
        this.onerror?.();
      }
    }
    vi.stubGlobal('FileReader', FailedFileReader);

    const file = { arrayBuffer: undefined } as File;
    await expect(encodePCBIFileBase64(file)).rejects.toBe(readError);
  });
});

