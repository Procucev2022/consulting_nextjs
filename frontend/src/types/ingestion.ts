import type {
  MaterialGroupSummary,
  MonthWiseSummary,
  PlantSummary,
  RawDocumentIngestion,
  ValidationPreCheckRecord
} from './models';

export interface DocumentIngestionAnalytics {
  materialGroupSummaries: MaterialGroupSummary[];
  plantSummaries: PlantSummary[];
  monthWiseSummaries: MonthWiseSummary[];
  uniqueItemsCount: number;
  uniqueVendorsCount: number;
}

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
  user_id?: string;
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

export interface IngestionQueuePageCursor {
  uploadedAt: string;
  docId: string;
}

export interface ValidationRecordPageCursor {
  createdAt: string;
  recordId: string;
}

export interface IngestionPageRequest {
  queueCursor?: IngestionQueuePageCursor;
  validationCursor?: ValidationRecordPageCursor;
  queueDocumentId?: string;
  userId?: string;
}

export interface IngestionPageMetadata<TCursor> {
  hasMore: boolean;
  nextCursor: TCursor | null;
}

export interface IngestionDataResponse {
  queue: RawDocumentIngestion[];
  validationRecords: ValidationPreCheckRecord[];
  availableDocuments?: RawDocumentIngestion[];
  documentAnalytics?: DocumentIngestionAnalytics;
  pagination?: {
    queue: IngestionPageMetadata<IngestionQueuePageCursor>;
    validationRecords: IngestionPageMetadata<ValidationRecordPageCursor>;
  };
  summary?: {
    totalFiles: number;
    totalRecords: number;
    cleanCount: number;
    anomaliesCount: number;
    allResolvedCount: number;
    pendingActionsCount: number;
    conversionCount: number;
    vendorDuplicationCount: number;
    itemDuplicationCount: number;
    totalSpendCr: number;
    pendingSpendCr: number;
  };
}
