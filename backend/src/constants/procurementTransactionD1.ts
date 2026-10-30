import { z } from 'zod';
import { D1_TABLES } from './d1';

export const procurementTransactionScopeSchema = z.object({
  tenantId: z.string().trim().min(1).optional(),
  assessmentId: z.string().trim().min(1).optional()
}).strict();

export const D1_LOCAL_SQLITE_PATH_ENV = 'D1_LOCAL_SQLITE_PATH';
export const localD1SqlitePathSchema = z.string().trim().min(1);

export const procurementRawLedgerSchema = z.object({
  recordId: z.string().min(1), sourceRow: z.number(), sourceFile: z.string(),
  poNumber: z.string(), poLine: z.union([z.string(), z.number()]),
  documentDateRaw: z.union([z.string(), z.number()]), supplierCode: z.string(), supplierName: z.string(),
  materialCode: z.string(), shortText: z.string(), materialGroup: z.string(), plant: z.string(),
  orderQuantity: z.number(), orderUnit: z.string(), netPrice: z.number(), currency: z.string(),
  totalInrRaw: z.number(), totalInCrsRaw: z.number()
}).passthrough();

export const PROCUREMENT_TRANSACTION_SQL = {
  select: `SELECT raw_json FROM ${D1_TABLES.transactions} WHERE `,
  legacyFilter: 'assessment_id IS NULL',
  assessmentFilter: 'assessment_id = ?',
  tenantFilter: 'tenant_id = ?',
  order: ' ORDER BY source_row_number ASC'
} as const;

export const PROCUREMENT_TRANSACTION_ERRORS = {
  malformedRows: 'Procurement records could not be loaded because D1 returned malformed transaction rows. Restore the verified source data and retry.',
  invalidLocalPath: 'The configured D1_LOCAL_SQLITE_PATH is empty or does not identify an existing SQLite database file. Seed the isolated D1 database and set D1_LOCAL_SQLITE_PATH to its file path.'
} as const;
