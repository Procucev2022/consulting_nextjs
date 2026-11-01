import { afterEach, describe, expect, it, vi } from 'vitest';
import { ASSESSMENT_UPLOAD_MAX_BYTES, ASSESSMENT_UPLOAD_MAX_MB, UI_STRINGS } from '../../src/constants';
import { prepareCorrectedDatasetFile } from '../../src/utils/correctedDatasetFile';

const uploadStrings = UI_STRINGS.orchestration;
const asFile = (name = 'corrected.csv', contents = 'po,amount\n1,2'): File =>
  new File([contents], name, { type: 'text/csv' });

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('prepareCorrectedDatasetFile', () => {
  it('returns base64 content, exact file size, and a SHA-256 checksum', async () => {
    const file = asFile();
    const result = await prepareCorrectedDatasetFile(file);
    expect(result).toMatchObject({
      fileName: file.name,
      fileSize: file.size,
      fileBase64: btoa('po,amount\n1,2'),
      checksum: expect.stringMatching(/^[a-f0-9]{64}$/u)
    });
  });

  it('rejects empty, oversized, and unsupported files before reading them', async () => {
    await expect(prepareCorrectedDatasetFile(asFile('empty.csv', '')))
      .rejects.toThrow(uploadStrings.correctedDatasetFileEmpty);
    const oversized = asFile();
    Object.defineProperty(oversized, 'size', { value: ASSESSMENT_UPLOAD_MAX_BYTES + 1 });
    await expect(prepareCorrectedDatasetFile(oversized))
      .rejects.toThrow(uploadStrings.correctedDatasetFileTooLarge(ASSESSMENT_UPLOAD_MAX_MB));
    await expect(prepareCorrectedDatasetFile(asFile('corrected.pdf')))
      .rejects.toThrow(uploadStrings.correctedDatasetFileInvalid);
  });

  it('requires browser SHA-256 support', async () => {
    vi.stubGlobal('crypto', {});
    await expect(prepareCorrectedDatasetFile(asFile()))
      .rejects.toThrow(uploadStrings.correctedDatasetChecksumUnavailable);
  });

  it('falls back to FileReader when File.arrayBuffer rejects', async () => {
    const file = asFile();
    Object.defineProperty(file, 'arrayBuffer', { configurable: true, value: vi.fn().mockRejectedValue(new Error('unavailable')) });
    class SuccessfulFileReader {
      result: ArrayBuffer | string | null = null;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      error: Error | null = null;
      readAsArrayBuffer(): void {
        this.result = new ArrayBuffer(file.size);
        new Uint8Array(this.result).set(new TextEncoder().encode('po,amount\n1,2'));
        this.onload?.();
      }
    }
    vi.stubGlobal('FileReader', SuccessfulFileReader);
    await expect(prepareCorrectedDatasetFile(file)).resolves.toMatchObject({ fileName: file.name, fileSize: file.size });
  });

  it('reports unreadable FileReader results and read errors with the centralized message', async () => {
    const file = asFile();
    Object.defineProperty(file, 'arrayBuffer', { configurable: true, value: undefined });
    class FailedFileReader {
      result: ArrayBuffer | string | null = null;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      error: Error | null = new Error('read failed');
      readAsArrayBuffer(): void { this.onerror?.(); }
    }
    vi.stubGlobal('FileReader', FailedFileReader);
    await expect(prepareCorrectedDatasetFile(file)).rejects.toThrow(uploadStrings.correctedDatasetFileReadFailed);

    class InvalidResultReader extends FailedFileReader {
      readAsArrayBuffer(): void {
        this.result = 'not-an-array-buffer';
        this.onload?.();
      }
    }
    vi.stubGlobal('FileReader', InvalidResultReader);
    await expect(prepareCorrectedDatasetFile(file)).rejects.toThrow(uploadStrings.correctedDatasetFileReadFailed);
  });

  it('rejects mismatched byte counts and maps checksum failures to a readable error', async () => {
    const file = asFile();
    Object.defineProperty(file, 'arrayBuffer', { configurable: true, value: vi.fn().mockResolvedValue(new ArrayBuffer(1)) });
    await expect(prepareCorrectedDatasetFile(file)).rejects.toThrow(uploadStrings.correctedDatasetFileReadFailed);

    Object.defineProperty(file, 'arrayBuffer', { configurable: true, value: vi.fn().mockResolvedValue(new ArrayBuffer(file.size)) });
    vi.spyOn(globalThis.crypto.subtle, 'digest').mockRejectedValueOnce(new Error('digest failed'));
    await expect(prepareCorrectedDatasetFile(file)).rejects.toThrow(uploadStrings.correctedDatasetFileReadFailed);
  });
});
