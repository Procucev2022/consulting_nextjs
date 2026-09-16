import type {
  TenantMaster,
  RawDocumentIngestion,
  ValidationPreCheckRecord,
  SpendCategorySummary,
  CategoryYearDetail,
  VendorYearDetail,
  VendorPriceRank,
  SavingsOpportunity,
  DashboardOverviewData
} from '../types';
import type { DBHealthData, DBTableData, DBTestConnectionResponse } from '../types/dbView';
import frontendLogger from './logger';
import { aiApiClient } from './aiApi';
import { validateInput } from './validation';
import {
  apiUpdateTenantPayloadSchema,
  apiAddIngestionFilePayloadSchema,
  apiUpdateValidationRecordPayloadSchema,
  apiMergeVendorPayloadSchema,
  apiDeployOpportunityPayloadSchema,
  apiCalculateConversionPayloadSchema
} from '../constants/validation';
import { fetchDashboardOverview } from './graphqlClient';
import { authApiClient } from './authApi';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export const apiClient = {
  // Tenant
  async getTenant(): Promise<TenantMaster> {
    frontendLogger.debug('Fetching tenant master data');
    const res = await fetch(`${API_BASE}/api/tenant`);
    const json = await res.json();
    frontendLogger.info('Tenant data fetched successfully');
    return json.data;
  },

  async updateTenant(updates: Partial<TenantMaster>): Promise<TenantMaster> {
    frontendLogger.info('Updating tenant configuration', { updates });
    const validation = validateInput(apiUpdateTenantPayloadSchema, updates);
    if (!validation.success) {
      throw new Error(`Invalid tenant updates: ${JSON.stringify(validation.errors)}`);
    }

    const res = await fetch(`${API_BASE}/api/tenant`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validation.data)
    });
    const json = await res.json();
    frontendLogger.info('Tenant updated successfully');
    return json.data;
  },

  // Ingestion
  async getIngestionData(buyerId?: string): Promise<{
    queue: RawDocumentIngestion[];
    validationRecords: ValidationPreCheckRecord[];
  }> {
    frontendLogger.debug('Fetching ingestion queue and validation records', { buyerId });
    const query = buyerId ? `?buyerId=${encodeURIComponent(buyerId)}` : '';
    const res = await fetch(`${API_BASE}/api/ingestion${query}`);
    const json = await res.json();
    return json.data;
  },

  async addIngestionFile(fileData: Partial<RawDocumentIngestion>): Promise<RawDocumentIngestion[]> {
    frontendLogger.info('Submitting ingestion file', { fileName: fileData.file_name });
    const validation = validateInput(apiAddIngestionFilePayloadSchema, fileData);
    if (!validation.success) {
      throw new Error(`Invalid file data: ${JSON.stringify(validation.errors)}`);
    }

    const res = await fetch(`${API_BASE}/api/ingestion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validation.data)
    });
    const json = await res.json();
    return json.data;
  },

  async uploadDocumentToObjectStore(payload: {
    fileName: string;
    fileType: string;
    fileBase64?: string;
    fileSizeMb?: number;
    recordsCount?: number;
    convertedInrCrores?: number;
    detectedCurrencies?: string[];
    datasetType?: string;
  }): Promise<{
    objectMeta: any;
    ingestionQueue: RawDocumentIngestion[];
  }> {
    frontendLogger.info('Uploading document to Object Store', { fileName: payload.fileName });
    const res = await fetch(`${API_BASE}/api/ingestion/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message || 'Failed to upload document to Object Store');
    }
    return json.data;
  },

  async updateValidationRecord(
    recordId: string,
    updates: Partial<ValidationPreCheckRecord>
  ): Promise<ValidationPreCheckRecord> {
    frontendLogger.info('Updating validation pre-check record', { record_id: recordId, updates });
    const validation = validateInput(apiUpdateValidationRecordPayloadSchema, {
      record_id: recordId,
      ...updates
    });
    if (!validation.success) {
      throw new Error(`Invalid record update: ${JSON.stringify(validation.errors)}`);
    }

    const res = await fetch(`${API_BASE}/api/ingestion`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validation.data)
    });
    const json = await res.json();
    return json.data;
  },

  async applyBlanketRemediation(): Promise<{ updatedCount: number; records: ValidationPreCheckRecord[] }> {
    frontendLogger.info('Executing blanket AI remediation across anomalous records');
    const res = await fetch(`${API_BASE}/api/ingestion/remediate`, {
      method: 'POST'
    });
    const json = await res.json();
    return json.data;
  },

  async resetValidationRecords(): Promise<ValidationPreCheckRecord[]> {
    frontendLogger.warn('Resetting validation records to baseline');
    const res = await fetch(`${API_BASE}/api/ingestion`, {
      method: 'DELETE'
    });
    const json = await res.json();
    return json.data;
  },

  async deleteIngestionDocument(docId?: string, buyerId?: string): Promise<RawDocumentIngestion[]> {
    frontendLogger.info('Deleting ingestion document', { docId, buyerId });
    let endpoint = docId ? `${API_BASE}/api/ingestion/document/${encodeURIComponent(docId)}` : `${API_BASE}/api/ingestion/document`;
    if (buyerId) {
      endpoint += `?buyerId=${encodeURIComponent(buyerId)}`;
    }
    const res = await fetch(endpoint, {
      method: 'DELETE'
    });
    const json = await res.json();
    return json.data;
  },

  // Categories
  async getCategories(): Promise<{ categories: SpendCategorySummary[]; categoryDetails: CategoryYearDetail[] }> {
    frontendLogger.debug('Fetching taxonomy categories and yearly spend breakdowns');
    const res = await fetch(`${API_BASE}/api/categories`);
    const json = await res.json();
    return json.data;
  },

  // Vendors
  async getVendors(): Promise<{ vendorRankings: VendorPriceRank[]; vendorDetails: VendorYearDetail[] }> {
    frontendLogger.debug('Fetching vendor price rankings and volatility metrics');
    const res = await fetch(`${API_BASE}/api/vendors`);
    const json = await res.json();
    return json.data;
  },

  async mergeVendor(targetName: string, masterId: string, canonicalName: string) {
    frontendLogger.info('Executing vendor consolidation merge', { targetName, masterId, canonicalName });
    const validation = validateInput(apiMergeVendorPayloadSchema, { targetName, masterId, canonicalName });
    if (!validation.success) {
      throw new Error(`Invalid vendor merge payload: ${JSON.stringify(validation.errors)}`);
    }

    const res = await fetch(`${API_BASE}/api/vendors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validation.data)
    });
    return await res.json();
  },

  // Savings
  async getSavingsOpportunities(): Promise<{ opportunities: SavingsOpportunity[]; totalPotentialSavingsCr: number }> {
    frontendLogger.debug('Fetching savings engine opportunities');
    const res = await fetch(`${API_BASE}/api/savings`);
    const json = await res.json();
    return json.data;
  },

  async deployOpportunity(opp_id: string, targetModule: 'proCPX' | 'DPS NXT'): Promise<SavingsOpportunity> {
    frontendLogger.info('Deploying opportunity to module', { opp_id, targetModule });
    const validation = validateInput(apiDeployOpportunityPayloadSchema, { opp_id, targetModule });
    if (!validation.success) {
      throw new Error(`Invalid deploy payload: ${JSON.stringify(validation.errors)}`);
    }

    const res = await fetch(`${API_BASE}/api/savings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validation.data)
    });
    const json = await res.json();
    return json.data;
  },

  // Conversion
  async calculateCommercialSaaS(annualSpendCr: number, savingsRate: number, saasFeeRate: number) {
    frontendLogger.debug('Calculating SaaS commercial projection', { annualSpendCr, savingsRate, saasFeeRate });
    const validation = validateInput(apiCalculateConversionPayloadSchema, { annualSpendCr, savingsRate, saasFeeRate });
    if (!validation.success) {
      throw new Error(`Invalid commercial metrics calculation: ${JSON.stringify(validation.errors)}`);
    }

    const res = await fetch(`${API_BASE}/api/conversion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validation.data)
    });
    return await res.json();
  },

  // Report
  async getExecutiveReport() {
    frontendLogger.info('Generating executive intelligence summary report');
    const res = await fetch(`${API_BASE}/api/report`);
    return await res.json();
  },

  // GraphQL Streamlined Batch Fetching
  async getDashboardOverviewGraphQL(): Promise<DashboardOverviewData> {
    frontendLogger.info('Fetching aggregated dashboard overview via GraphQL apiClient wrapper');
    return await fetchDashboardOverview();
  },

  // Currency
  async getCurrencyConversion(from: string, amount: number, dateOrYear?: string | number) {
    frontendLogger.debug('Calling currency conversion API', { from, amount, dateOrYear });
    const query = new URLSearchParams({
      from,
      amount: String(amount),
      ...(dateOrYear ? { date: String(dateOrYear) } : {})
    });
    const res = await fetch(`${API_BASE}/api/currency?${query.toString()}`);
    const json = await res.json();
    return json.data;
  },

  // Auth & Admin Delegations
  register: authApiClient.register.bind(authApiClient),
  login: authApiClient.login.bind(authApiClient),
  getMe: authApiClient.getMe.bind(authApiClient),
  getAdminUsers: authApiClient.getAdminUsers.bind(authApiClient),
  updateAdminUserStatus: authApiClient.updateAdminUserStatus.bind(authApiClient),
  getStoredToken: authApiClient.getStoredToken.bind(authApiClient),
  getStoredUser: authApiClient.getStoredUser.bind(authApiClient),
  setStoredSession: authApiClient.setStoredSession.bind(authApiClient),
  clearStoredSession: authApiClient.clearStoredSession.bind(authApiClient),

  // Database View & Telemetry
  async getDBStatus(): Promise<DBHealthData> {
    frontendLogger.debug('Fetching database status & health telemetry');
    const res = await fetch(`${API_BASE}/api/db/status`);
    const json = await res.json();
    return json.data;
  },

  async getDBMetrics(): Promise<Record<string, unknown>> {
    frontendLogger.debug('Fetching database optimization metrics');
    const res = await fetch(`${API_BASE}/api/db/metrics`);
    const json = await res.json();
    return json.data;
  },

  async getDBTableData(table: string, page = 1, limit = 20, search = ''): Promise<DBTableData> {
    frontendLogger.debug('Fetching database table data', { table, page, limit, search });
    const query = new URLSearchParams({
      table,
      page: String(page),
      limit: String(limit),
      ...(search ? { search } : {})
    });
    const res = await fetch(`${API_BASE}/api/db/tables?${query.toString()}`);
    const json = await res.json();
    return json.data;
  },

  async testDBConnection(): Promise<DBTestConnectionResponse> {
    frontendLogger.info('Testing live database round-trip ping');
    const res = await fetch(`${API_BASE}/api/db/test-connection`, { method: 'POST' });
    return await res.json();
  },

  // Google Gemini AI Services
  checkAiConfig: aiApiClient.checkConfig.bind(aiApiClient),
  extractDocumentAi: aiApiClient.extractDocument.bind(aiApiClient),
  categorizeItemsAi: aiApiClient.categorizeItems.bind(aiApiClient),
  generateExecutiveSummaryAi: aiApiClient.generateExecutiveSummary.bind(aiApiClient),
  analyzeAnomaliesAi: aiApiClient.analyzeAnomalies.bind(aiApiClient)
};

export { aiApiClient, authApiClient };




