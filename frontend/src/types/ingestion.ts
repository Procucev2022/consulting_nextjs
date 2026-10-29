import type { RawDocumentIngestion } from './models';

export interface IngestionUploadPayload {
  fileName: string;
  fileType: string;
  fileBase64?: string;
  parseTransactions?: boolean;
  fileSizeMb?: number;
  recordsCount?: number;
  buyerId?: string;
  tenant_id?: string;
  buyer_id?: string;
  assessment_id?: string;
  detectedCurrencies?: string[];
  convertedInrCrores?: number;
  datasetType?: string;
}

export interface IngestionUploadData {
  docId?: string;
  importedCount?: number;
  validationCount?: number;
  totalInrCrores?: number;
  detectedCurrencies?: string[];
  objectMeta?: { key: string; size: number; uploadedAt: string; bucket: string };
  ingestionQueue?: RawDocumentIngestion[];
}

export interface IngestionUploadResponse {
  success: boolean;
  data?: IngestionUploadData;
  message?: string;
}
