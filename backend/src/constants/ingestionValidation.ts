import { z } from 'zod';
import {
  D1_ROUTE_MESSAGES,
  D1_GRAPHQL_CURSOR_MAX_LENGTH,
  D1_GRAPHQL_CURSOR_KINDS,
  D1_GRAPHQL_CURSOR_VERSION,
  D1_INGESTION_PAGE_SIZE,
  D1_INGESTION_CURSOR_ID_MAX_LENGTH,
  D1_INGESTION_CURSOR_TIMESTAMP_MAX_LENGTH
} from './d1';

export const INGESTION_UPLOAD_MAX_FILE_BYTES = 10 * 1024 * 1024;
export const INGESTION_UPLOAD_MAX_BASE64_LENGTH = Math.ceil(INGESTION_UPLOAD_MAX_FILE_BYTES / 3) * 4;
export const INGESTION_UPLOAD_JSON_MAX_BYTES = INGESTION_UPLOAD_MAX_BASE64_LENGTH + 64 * 1024;
export const AI_EXTRACT_JSON_MAX_BYTES = INGESTION_UPLOAD_JSON_MAX_BYTES;
const INGESTION_BASE64_PATTERN = /^(?:data:[^;]+;base64,)?[A-Za-z0-9+/]*={0,2}$/u;

export const addIngestionFileSchema = z.object({
  doc_id: z.string().trim().min(1).max(120).optional(),
  tenant_id: z.string().trim().min(1).max(120).optional(),
  file_name: z.string().trim().min(1, 'File name is required').max(255),
  file_type: z.string().trim().min(1, 'File type is required').max(80).optional().default('XLSX'),
  file_size_mb: z.number().finite().positive('File size must be positive').max(100).optional().default(1),
  ocr_status: z.enum(['Completed', 'Parsing OCR', 'Pending', 'Error']).optional().default('Completed'),
  progress: z.number().finite().min(0).max(100).optional().default(100),
  uploaded_at: z.string().max(40).optional(),
  records_count: z.number().int().nonnegative('Records count must be non-negative').max(10_000_000).optional().default(0),
  detected_currencies: z.array(z.string().trim().regex(/^[A-Z]{3}$/u)).max(20).optional().default(['INR']),
  converted_inr_crores: z.number().finite().nonnegative().optional().default(0),
  unique_items_count: z.number().int().nonnegative().max(10_000_000).optional(),
  unique_vendors_count: z.number().int().nonnegative().max(10_000_000).optional(),
  material_groups_count: z.number().int().nonnegative().max(10_000_000).optional(),
  plants_count: z.number().int().nonnegative().max(10_000_000).optional()
});

export const uploadIngestionFileSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  fileType: z.enum(['XLSX', 'XLS', 'CSV', 'PDF']).optional(),
  fileBase64: z.preprocess(
    (value) => typeof value === 'string' ? value.replace(/\s+/gu, '') : value,
    z.string().max(INGESTION_UPLOAD_MAX_BASE64_LENGTH).regex(INGESTION_BASE64_PATTERN)
      .refine((value) => {
        const payload = value.slice(value.lastIndexOf(',') + 1);
        const hasPadding = payload.endsWith('=');
        return payload.length % 4 !== 1 && (!hasPadding || payload.length % 4 === 0);
      }, D1_ROUTE_MESSAGES.ingestionUploadBase64Invalid)
  ).optional(),
  fileSizeMb: z.number().finite().positive().max(100).optional(),
  recordsCount: z.number().int().nonnegative().max(10_000_000).optional(),
  convertedInrCrores: z.number().finite().nonnegative().optional(),
  detectedCurrencies: z.array(z.string().regex(/^[A-Z]{3}$/u)).max(20).optional(),
  parseTransactions: z.boolean().optional(),
  assessment_id: z.string().trim().min(1).max(120).optional(),
  datasetType: z.string().trim().max(120).optional()
}).superRefine((body, context) => {
  const uploadedFileBytes = (body.fileSizeMb ?? 0) * 1024 * 1024;
  if (body.fileBase64 && body.fileSizeMb !== undefined && uploadedFileBytes > INGESTION_UPLOAD_MAX_FILE_BYTES) {
    context.addIssue({ code: 'custom', path: ['fileSizeMb'], message: D1_ROUTE_MESSAGES.ingestionUploadFileTooLarge });
  }
});

export const ingestionDataQuerySchema = z.object({
  queueDocumentId: z.string().trim().min(1).max(D1_INGESTION_CURSOR_ID_MAX_LENGTH).optional(),
  queueAfterUploadedAt: z.string().trim().min(1).max(D1_INGESTION_CURSOR_TIMESTAMP_MAX_LENGTH).optional(),
  queueAfterDocId: z.string().trim().min(1).max(D1_INGESTION_CURSOR_ID_MAX_LENGTH).optional(),
  validationAfterCreatedAt: z.string().trim().min(1).max(D1_INGESTION_CURSOR_TIMESTAMP_MAX_LENGTH).optional(),
  validationAfterRecordId: z.string().trim().min(1).max(D1_INGESTION_CURSOR_ID_MAX_LENGTH).optional()
}).superRefine((input, context) => {
  if (Boolean(input.queueAfterUploadedAt) !== Boolean(input.queueAfterDocId)) {
    context.addIssue({ code: 'custom', path: ['queueAfterDocId'], message: 'Queue cursor timestamp and document ID must be supplied together.' });
  }
  if (Boolean(input.validationAfterCreatedAt) !== Boolean(input.validationAfterRecordId)) {
    context.addIssue({ code: 'custom', path: ['validationAfterRecordId'], message: 'Validation cursor timestamp and record ID must be supplied together.' });
  }
});

export const graphqlIngestionPageArgsSchema = z.object({
  first: z.number().int().min(1).max(D1_INGESTION_PAGE_SIZE).default(D1_INGESTION_PAGE_SIZE),
  after: z.string().trim().min(1).max(D1_GRAPHQL_CURSOR_MAX_LENGTH).optional()
});

export const graphqlIngestionCursorSchema = z.object({
  version: z.literal(D1_GRAPHQL_CURSOR_VERSION),
  kind: z.enum(D1_GRAPHQL_CURSOR_KINDS),
  tenantId: z.string().trim().min(1).max(D1_INGESTION_CURSOR_ID_MAX_LENGTH),
  timestamp: z.string().trim().min(1).max(D1_INGESTION_CURSOR_TIMESTAMP_MAX_LENGTH),
  id: z.string().trim().min(1).max(D1_INGESTION_CURSOR_ID_MAX_LENGTH)
});
