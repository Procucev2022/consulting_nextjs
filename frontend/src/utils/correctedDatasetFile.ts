import {
  ASSESSMENT_UPLOAD_EXTENSIONS,
  ASSESSMENT_UPLOAD_MAX_BYTES,
  ASSESSMENT_UPLOAD_MAX_MB,
  BASE64_ENCODE_CHUNK_BYTES,
  UI_STRINGS
} from '../constants';
import type { CorrectedDatasetUploadPayload } from '../types/analysisOrchestration';

const readFileBuffer = async (file: File): Promise<ArrayBuffer> => {
  if (typeof file.arrayBuffer === 'function') {
    try {
      return await file.arrayBuffer();
    } catch {
      // Retain support for browsers whose File.arrayBuffer implementation rejects.
    }
  }
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) resolve(reader.result);
      else reject(new Error(UI_STRINGS.orchestration.correctedDatasetFileReadFailed));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
};

const encodeBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let offset = 0; offset < bytes.byteLength; offset += BASE64_ENCODE_CHUNK_BYTES) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + BASE64_ENCODE_CHUNK_BYTES));
  }
  return btoa(binary);
};

export const prepareCorrectedDatasetFile = async (file: File): Promise<Pick<
  CorrectedDatasetUploadPayload,
  'fileName' | 'fileSize' | 'checksum' | 'fileBase64'
>> => {
  if (file.size === 0) throw new Error(UI_STRINGS.orchestration.correctedDatasetFileEmpty);
  if (file.size > ASSESSMENT_UPLOAD_MAX_BYTES) {
    throw new Error(UI_STRINGS.orchestration.correctedDatasetFileTooLarge(ASSESSMENT_UPLOAD_MAX_MB));
  }
  if (!ASSESSMENT_UPLOAD_EXTENSIONS.some((extension) => file.name.toLowerCase().endsWith(extension))) {
    throw new Error(UI_STRINGS.orchestration.correctedDatasetFileInvalid);
  }
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error(UI_STRINGS.orchestration.correctedDatasetChecksumUnavailable);
  try {
    const buffer = await readFileBuffer(file);
    if (buffer.byteLength !== file.size) throw new Error(UI_STRINGS.orchestration.correctedDatasetFileReadFailed);
    const digest = await subtle.digest('SHA-256', buffer);
    const checksum = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
    return { fileName: file.name, fileSize: file.size, checksum, fileBase64: encodeBase64(buffer) };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === UI_STRINGS.orchestration.correctedDatasetFileReadFailed
    ) throw error;
    throw new Error(UI_STRINGS.orchestration.correctedDatasetFileReadFailed, { cause: error });
  }
};
