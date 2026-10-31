import { PCBI_FILE_BASE64_CHUNK_SIZE } from '../constants/pcbiDataLab';
import { UI_STRINGS } from '../constants/uiStrings';

const readFileArrayBuffer = async (file: File): Promise<ArrayBuffer> => {
  if (typeof file.arrayBuffer === 'function') {
    try {
      return await file.arrayBuffer();
    } catch {
      // The FileReader fallback handles browsers that expose a failing arrayBuffer implementation.
    }
  }

  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error(UI_STRINGS.pcbiCommodityDataLab.evidenceFileReadFailed));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
};

export const encodePCBIFileBase64 = async (file: File): Promise<string> => {
  const bytes = new Uint8Array(await readFileArrayBuffer(file));
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += PCBI_FILE_BASE64_CHUNK_SIZE) {
    const chunk = bytes.subarray(offset, offset + PCBI_FILE_BASE64_CHUNK_SIZE);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
};
