import { apiFetch } from './apiFetch';
import type {
  TenantMaster,
  CategoryDetailsApiData,
  CategoriesApiData,
  SavingsOpportunitiesApiData,
  VendorsApiData,
  VendorDetailsApiData,
  ApiUpdateTenantPayload,
  CategoryYearDetail,
  VendorYearDetail,
  DashboardOverviewData,
  LineItemMapping,
  ConversionFunnelPhase
} from '../types';
import frontendLogger from './logger';
import { aiApiClient } from './aiApi';
import { authApiClient } from './authApi';
import { adminAuthApiClient } from './adminAuthApi';
import { dbApiClient } from './dbApi';
import { savingsApiClient } from './savingsApi';
import { pcbiApiClient } from './pcbiApi';
import { ingestionApiClient } from './ingestionApi';
import { validateInput } from './validation';
import {
  apiUpdateTenantPayloadSchema,
  apiMergeVendorPayloadSchema,
  apiCalculateConversionPayloadSchema,
  conversionStagesResponseSchema,
  procurementCategoryMappingsResponseSchema
} from '../constants/validation';
import { PROCUREMENT_CATEGORY_MAPPINGS_API_PATH } from '../constants/procurementCategoryMapping';
import { setProcurementCategoryMappings } from './procurementCategoryResolver';
import { fetchDashboardOverview } from './graphqlClient';
import { UI_STRINGS } from '../constants/uiStrings';
import { currencyApiClient } from './currencyApi';
import { readDashboardApiData, readTenantApiResponse } from './apiResponse';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export const apiClient = {
  async getProcurementCategoryMappings() {
    frontendLogger.debug('Fetching procurement category mappings from D1');
    const res = await apiFetch(`${API_BASE}${PROCUREMENT_CATEGORY_MAPPINGS_API_PATH}`);
    const requestId = res.headers.get('x-request-id');
    if (!res.ok) {
      const message = UI_STRINGS.databaseData.procurementMappingsLoadFailed;
      frontendLogger.error('D1 procurement category mapping request failed', { status: res.status, requestId, message });
      throw new Error(message);
    }
    const parsed = procurementCategoryMappingsResponseSchema.safeParse(await res.json());
    if (!parsed.success) {
      const message = UI_STRINGS.databaseData.procurementMappingsLoadFailed;
      frontendLogger.error('D1 procurement category mapping response was invalid', {
        requestId, issues: parsed.error.issues, message
      });
      throw new Error(message);
    }
    setProcurementCategoryMappings(parsed.data.data.mappings);
    frontendLogger.info('Loaded procurement category mappings from D1', {
      mappingCount: Object.keys(parsed.data.data.mappings).length,
      categoryCount: parsed.data.data.categories.length,
      requestId
    });
    return parsed.data.data;
  },

  // Tenant
  async getTenant(tenantId?: string): Promise<TenantMaster> {
    frontendLogger.debug('Fetching tenant master data', { tenantId });
    const url = tenantId ? `${API_BASE}/api/tenant?tenantId=${encodeURIComponent(tenantId)}` : `${API_BASE}/api/tenant`;
    const res = await apiFetch(url);
    const json = await readTenantApiResponse(
      res, 'GET', UI_STRINGS.module4.apiOperations.tenant, tenantId
    );
    const requestId = res.headers.get('x-request-id') || UI_STRINGS.common.notAvailable;
    if (!res.ok) {
      const detail = typeof json?.message === 'string' ? json.message : UI_STRINGS.module4.tenantApiNoDetails;
      frontendLogger.error('Tenant master request failed', { tenantId, status: res.status, requestId, detail });
      throw new Error(UI_STRINGS.module4.apiRequestFailed(
        UI_STRINGS.module4.apiOperations.tenant, res.status, detail, requestId
      ));
    }
    frontendLogger.info('Tenant data fetched successfully', { tenantId: json.data?.tenant_id, requestId });
    return json.data;
  },

  async updateTenant(updates: ApiUpdateTenantPayload): Promise<TenantMaster> {
    const payload: ApiUpdateTenantPayload = {
      enterprise_name: updates.enterprise_name,
      region: updates.region,
      base_currency: updates.base_currency,
      total_spend_evaluated: updates.total_spend_evaluated,
      total_spend_evaluated_inr: updates.total_spend_evaluated_inr,
      major_sector: updates.major_sector,
      minor_sector: updates.minor_sector,
      status: updates.status
    };
    const validation = validateInput(apiUpdateTenantPayloadSchema, payload);
    if (!validation.success) {
      throw new Error(`Invalid tenant updates: ${JSON.stringify(validation.errors)}`);
    }
    const updatedFields = Object.entries(validation.data)
      .filter(([, value]) => value !== undefined)
      .map(([field]) => field);
    frontendLogger.info('Updating tenant configuration', { fields: updatedFields });

    const res = await apiFetch(`${API_BASE}/api/tenant`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validation.data)
    });
    const json = await readTenantApiResponse(
      res, 'PUT', UI_STRINGS.module4.apiOperations.tenantUpdate
    );
    const requestId = res.headers.get('x-request-id') || UI_STRINGS.common.notAvailable;
    if (!res.ok) {
      const detail = typeof json?.message === 'string' ? json.message : UI_STRINGS.module4.tenantApiNoDetails;
      frontendLogger.error('Tenant update request failed', { status: res.status, requestId, detail });
      throw new Error(UI_STRINGS.module4.apiRequestFailed(
        UI_STRINGS.module4.apiOperations.tenantUpdate, res.status, detail, requestId
      ));
    }
    frontendLogger.info('Tenant updated successfully', { tenantId: json.data?.tenant_id, requestId });
    return json.data;
  },

  // Ingestion Delegations
  getCanonicalModule1: ingestionApiClient.getCanonicalModule1.bind(ingestionApiClient),
  getIngestionData: ingestionApiClient.getIngestionData.bind(ingestionApiClient),
  addIngestionFile: ingestionApiClient.addIngestionFile.bind(ingestionApiClient),
  uploadDocumentToObjectStore: ingestionApiClient.uploadDocumentToObjectStore.bind(ingestionApiClient),
  deleteIngestionFile: ingestionApiClient.deleteIngestionFile.bind(ingestionApiClient),
  updateValidationRecord: ingestionApiClient.updateValidationRecord.bind(ingestionApiClient),
  applyBlanketRemediation: ingestionApiClient.applyBlanketRemediation.bind(ingestionApiClient),
  resetValidationRecords: ingestionApiClient.resetValidationRecords.bind(ingestionApiClient),
  deleteIngestionDocument: ingestionApiClient.deleteIngestionDocument.bind(ingestionApiClient),
  resetBlanketData: ingestionApiClient.resetBlanketData.bind(ingestionApiClient),

  // Categories
  async getCategories(): Promise<CategoriesApiData> {
    frontendLogger.debug('Fetching spend categories and year details');
    const res = await apiFetch(`${API_BASE}/api/categories`);
    return readDashboardApiData<CategoriesApiData>(
      res, '/api/categories', UI_STRINGS.databaseData.apiOperations.categories
    );
  },

  async getCategoryDetails(): Promise<CategoryYearDetail[]> {
    frontendLogger.debug('Fetching category year details matrix');
    const res = await apiFetch(`${API_BASE}/api/categories?details=true`);
    const data = await readDashboardApiData<CategoryDetailsApiData>(
      res, '/api/categories', UI_STRINGS.databaseData.apiOperations.categoryDetails
    );
    return data.categoryDetails;
  },

  // Vendors
  async getVendors(): Promise<VendorsApiData> {
    frontendLogger.debug('Fetching vendor price rankings and year details');
    const res = await apiFetch(`${API_BASE}/api/vendors`);
    return readDashboardApiData<VendorsApiData>(
      res, '/api/vendors', UI_STRINGS.databaseData.apiOperations.vendors
    );
  },

  // Module 2 Canonical Data
  async getModule2CanonicalLineItems(limit?: number, assessmentId?: string): Promise<LineItemMapping[]> {
    frontendLogger.debug('Fetching canonical Module 2 line items', { limit, assessmentId });
    const query = new URLSearchParams();
    if (limit != null) query.set('limit', String(limit));
    if (assessmentId) query.set('assessmentId', assessmentId);
    const res = await apiFetch(`${API_BASE}/api/module2/sourcing/line-items?${query.toString()}`);
    const json = await res.json();
    return json.data?.lineItems || [];
  },

  async getModule2CanonicalInput(assessmentId?: string): Promise<unknown> {
    frontendLogger.debug('Fetching canonical Module 2 input contract', { assessmentId });
    const query = assessmentId ? `?assessmentId=${encodeURIComponent(assessmentId)}` : '';
    const res = await apiFetch(`${API_BASE}/api/module2/sourcing/canonical-input${query}`);
    const json = await res.json();
    return json.data;
  },

  async getModule2OpportunityLedger(assessmentId?: string): Promise<unknown> {
    frontendLogger.debug('Fetching canonical Module 2 opportunity ledger', { assessmentId });
    const query = assessmentId ? `?assessmentId=${encodeURIComponent(assessmentId)}` : '';
    const res = await apiFetch(`${API_BASE}/api/module2/sourcing/opportunity-ledger${query}`);
    const json = await res.json();
    return json.data;
  },

  async getModule2MathematicalBridge(assessmentId?: string): Promise<unknown> {
    frontendLogger.debug('Fetching canonical Module 2 mathematical bridge', { assessmentId });
    const query = assessmentId ? `?assessmentId=${encodeURIComponent(assessmentId)}` : '';
    const res = await apiFetch(`${API_BASE}/api/module2/sourcing/bridge${query}`);
    const json = await res.json();
    return json.data;
  },

  async getVendorDetails(): Promise<VendorYearDetail[]> {
    frontendLogger.debug('Fetching vendor year details');
    const res = await apiFetch(`${API_BASE}/api/vendors?details=true`);
    const data = await readDashboardApiData<VendorDetailsApiData>(
      res, '/api/vendors', UI_STRINGS.databaseData.apiOperations.vendorDetails
    );
    return data.vendorDetails;
  },

  async mergeVendor(targetName: string, masterId: string, canonicalName: string): Promise<Record<string, unknown>> {
    frontendLogger.info('Executing vendor consolidation merge', { targetName, masterId, canonicalName });
    const validation = validateInput(apiMergeVendorPayloadSchema, { targetName, masterId, canonicalName });
    if (!validation.success) {
      throw new Error(`Invalid vendor merge payload: ${JSON.stringify(validation.errors)}`);
    }

    const res = await apiFetch(`${API_BASE}/api/vendors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validation.data)
    });
    return await res.json();
  },

  // Savings
  async getSavingsOpportunities(): Promise<SavingsOpportunitiesApiData> {
    frontendLogger.debug('Fetching savings engine opportunities');
    const res = await apiFetch(`${API_BASE}/api/savings`);
    return readDashboardApiData<SavingsOpportunitiesApiData>(
      res, '/api/savings', UI_STRINGS.databaseData.apiOperations.savings
    );
  },

  deployOpportunity: savingsApiClient.deployOpportunity.bind(savingsApiClient),

  // PCBI Benchmark Intelligence (Module 3 - Prompt 100)
  getPCBIDashboard: pcbiApiClient.getPCBIDashboard.bind(pcbiApiClient),
  getPCBIMasterBenchmarks: pcbiApiClient.getPCBIMasterBenchmarks.bind(pcbiApiClient),
  getPCBIWeeklyIndices: pcbiApiClient.getPCBIWeeklyIndices.bind(pcbiApiClient),
  // Consolidated Savings & De-Duplication (Module 4 - Prompt 100)
  getConsolidatedSavings: savingsApiClient.getConsolidatedSavings.bind(savingsApiClient),
  updateActionPlan: savingsApiClient.updateActionPlan.bind(savingsApiClient),
  updateSavingsOpportunityStatus: savingsApiClient.updateSavingsOpportunityStatus.bind(savingsApiClient),

  // Conversion
  async getConversionStages(): Promise<ConversionFunnelPhase[]> {
    frontendLogger.debug('Fetching D1 conversion funnel stages');
    const res = await apiFetch(`${API_BASE}/api/conversion`);
    if (!res.ok) {
      const message = UI_STRINGS.databaseData.conversionLoadFailed(res.status);
      frontendLogger.error('Conversion funnel load failed', { status: res.status, requestId: res.headers.get('x-request-id'), message });
      throw new Error(message);
    }
    const json = await res.json();
    const parsed = conversionStagesResponseSchema.safeParse(json);
    if (!parsed.success) throw new Error(UI_STRINGS.databaseData.invalidData);
    return parsed.data.data;
  },

  async calculateCommercialSaaS(annualSpendCr: number, savingsRate: number, saasFeeRate: number) {
    frontendLogger.debug('Calculating SaaS commercial projection', { annualSpendCr, savingsRate, saasFeeRate });
    const validation = validateInput(apiCalculateConversionPayloadSchema, { annualSpendCr, savingsRate, saasFeeRate });
    if (!validation.success) {
      throw new Error(`Invalid commercial metrics calculation: ${JSON.stringify(validation.errors)}`);
    }

    const res = await apiFetch(`${API_BASE}/api/conversion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validation.data)
    });
    return await res.json();
  },

  // Executive Report
  async getExecutiveReport() {
    frontendLogger.debug('Fetching executive report data');
    const res = await apiFetch(`${API_BASE}/api/report`);
    return await res.json();
  },

  // GraphQL Integration
  async getDashboardOverviewGraphQL(): Promise<DashboardOverviewData> {
    frontendLogger.debug('Calling batch GraphQL query for unified dashboard overview');
    return await fetchDashboardOverview();
  },

  // Currency
  getCurrencyRates: currencyApiClient.getCurrencyRates.bind(currencyApiClient),
  getCurrencyConversion: currencyApiClient.getCurrencyConversion.bind(currencyApiClient),

  // Auth & Admin Delegations
  register: authApiClient.register.bind(authApiClient),
  login: authApiClient.login.bind(authApiClient),
  getMe: authApiClient.getMe.bind(authApiClient),
  createAdminUser: adminAuthApiClient.createAdminUser.bind(adminAuthApiClient),
  getAdminUsers: authApiClient.getAdminUsers.bind(authApiClient),
  getAdminTenants: authApiClient.getAdminTenants.bind(authApiClient),
  assignAdminUserTenant: authApiClient.assignAdminUserTenant.bind(authApiClient),
  updateAdminUserStatus: authApiClient.updateAdminUserStatus.bind(authApiClient),
  updateAdminUserTier: authApiClient.updateAdminUserTier.bind(authApiClient),
  getStoredToken: authApiClient.getStoredToken.bind(authApiClient),
  getStoredUser: authApiClient.getStoredUser.bind(authApiClient),
  setStoredSession: authApiClient.setStoredSession.bind(authApiClient),
  clearStoredSession: authApiClient.clearStoredSession.bind(authApiClient),
  getSimulatedTier: authApiClient.getSimulatedTier.bind(authApiClient),
  setSimulatedTier: authApiClient.setSimulatedTier.bind(authApiClient),

  // Database View & Telemetry Delegations
  getDBStatus: dbApiClient.getDBStatus.bind(dbApiClient),
  getDBMetrics: dbApiClient.getDBMetrics.bind(dbApiClient),
  getDBTableData: dbApiClient.getDBTableData.bind(dbApiClient),
  testDBConnection: dbApiClient.testDBConnection.bind(dbApiClient),

  // Google Gemini AI Services
  checkAiConfig: aiApiClient.checkConfig.bind(aiApiClient),
  extractDocumentAi: aiApiClient.extractDocument.bind(aiApiClient),
  categorizeItemsAi: aiApiClient.categorizeItems.bind(aiApiClient),
  generateExecutiveSummaryAi: aiApiClient.generateExecutiveSummary.bind(aiApiClient),
  analyzeAnomaliesAi: aiApiClient.analyzeAnomalies.bind(aiApiClient)
};

export { aiApiClient, authApiClient, dbApiClient, savingsApiClient, pcbiApiClient, ingestionApiClient };
