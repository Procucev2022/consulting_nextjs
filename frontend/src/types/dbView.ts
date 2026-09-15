/**
 * Database View & Telemetry Types (Frontend)
 */

export interface DBRecordCounts {
  users: number;
  tenants: number;
  rawDocuments: number;
  validationRecords: number;
  spendCategories: number;
  categoryYearDetails: number;
  vendorYearDetails: number;
  vendorPriceRanks: number;
  lineItemMappings: number;
  savingsOpportunities: number;
  conversionFunnelPhases: number;
}

export interface DBHealthData {
  isConnected: boolean;
  provider: string;
  host: string;
  databaseName: string;
  sslEnabled: boolean;
  latencyMs: number;
  errorMessage: string | null;
  serverTime: string;
  tablesCount: number;
  totalRecords: number;
  recordCounts: DBRecordCounts;
  cacheSize?: number;
}

export interface DBHealthStatusResponse {
  success: boolean;
  data: DBHealthData;
}

export interface DBTableData {
  tableName: string;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  columns: string[];
  rows: Record<string, any>[];
}

export interface DBTableDataResponse {
  success: boolean;
  data: DBTableData;
}

export interface DBTestConnectionResponse {
  success: boolean;
  message: string;
  latencyMs?: number;
  timestamp: string;
}
