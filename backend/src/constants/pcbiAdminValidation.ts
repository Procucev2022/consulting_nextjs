import { z } from 'zod';
import { D1_REPORTING } from './d1';

export const pcbiReferenceQuerySchema = z.object({
  sector: z.string().trim().min(1).max(120).optional(),
  pcbiId: z.string().trim().min(1).max(120).optional(),
  limit: z.coerce.number().int().min(1).max(D1_REPORTING.maxIndexLimit).default(D1_REPORTING.weeklyIndexLimit)
});

const pcbiAdminWorksheetSchema = z.object({
  sheetName: z.string().trim().min(1).max(200),
  detectedType: z.string().trim().min(1).max(40),
  rowCount: z.number().int().nonnegative(),
  columnCount: z.number().int().nonnegative()
}).passthrough();

const pcbiAdminColumnMappingSchema = z.object({
  excelColumn: z.string().trim().min(1).max(200),
  mappedField: z.string().trim().max(200),
  isRequired: z.boolean().optional(),
  status: z.string().max(40).optional()
}).passthrough();

const pcbiAdminValidationSummarySchema = z.object({
  totalRecords: z.number().int().nonnegative(),
  validRecords: z.number().int().nonnegative(),
  warningRecords: z.number().int().nonnegative(),
  errorRecords: z.number().int().nonnegative(),
  blockingErrorCount: z.number().int().nonnegative(),
  warningCount: z.number().int().nonnegative(),
  aQualityCount: z.number().int().nonnegative(),
  bQualityCount: z.number().int().nonnegative(),
  cQualityCount: z.number().int().nonnegative(),
  avgBenchmarkability: z.number().finite().min(0).max(100),
  dateStart: z.string().nullable(),
  dateEnd: z.string().nullable(),
  issues: z.array(z.unknown()).max(10000)
}).passthrough();

export const pcbiAdminImportSchema = z.object({
  version: z.string().trim().regex(/^V\d+\.\d+$/i),
  file_name: z.string().trim().min(1).max(500),
  file_size_mb: z.number().finite().nonnegative().max(1000),
  uploaded_by: z.string().trim().min(1).max(200),
  worksheets: z.array(pcbiAdminWorksheetSchema).max(100),
  mappings: z.record(z.string(), z.array(pcbiAdminColumnMappingSchema)).refine(
    (records) => Object.keys(records).length <= 20,
    'No more than 20 worksheet mappings are supported.'
  ),
  benchmarks: z.array(z.record(z.string(), z.unknown())).max(100000),
  weeklyIndices: z.array(z.record(z.string(), z.unknown())).max(500000),
  constituents: z.array(z.record(z.string(), z.unknown())).max(200000),
  sources: z.array(z.record(z.string(), z.unknown())).max(100000),
  unspscMappings: z.array(z.record(z.string(), z.unknown())).max(200000),
  validationSummary: pcbiAdminValidationSummarySchema
});

export const pcbiAdminPublishSchema = z.object({
  published_by: z.string().trim().min(1).max(200)
});
