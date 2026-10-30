import type { CloudflareD1Database, CloudflareD1PreparedStatement } from './cloudflare';

export interface IngestionWorkbookInput {
  db: CloudflareD1Database;
  bytes: Uint8Array;
  fileName: string;
  fileType: string;
  docId: string;
  tenantId: string;
  assessmentId?: string;
}

export interface IngestionWorkbookResult {
  importedCount: number;
  validationCount: number;
  totalInrCrores: number;
  detectedCurrencies: string[];
}

export interface IngestionWorkbookRow {
  [key: string]: string | number | boolean | Date | null | undefined;
}

export interface IngestionWorkbookFieldMap {
  poNumber?: string;
  poLine?: string;
  transactionDate?: string;
  supplierCode?: string;
  supplierName?: string;
  materialCode?: string;
  description?: string;
  materialGroup?: string;
  plant?: string;
  storageLocation?: string;
  quantity?: string;
  orderUnit?: string;
  netPrice?: string;
  currency?: string;
  totalInr?: string;
  totalInrCrores?: string;
  priceUnit?: string;
  deletionIndicator?: string;
  itemCategory?: string;
  accountAssignmentCategory?: string;
}

export interface IngestionWorkbookNormalizedRow {
  sourceRowNumber: number;
  poValue: string | null;
  poNumber: string;
  supplierName: string;
  materialCode: string | null;
  description: string;
  transactionDate: string | null;
  currency: string;
  quantity: number;
  netPrice: number;
  amount: number;
}

export interface IngestionWorkbookFxRateRow {
  rate_date: string;
  inr_per_unit: number;
}

export interface IngestionWorkbookPreparedRow {
  currency: string;
  amountInr: number | null;
  transactionStatement: CloudflareD1PreparedStatement;
  validationStatement: CloudflareD1PreparedStatement;
}
