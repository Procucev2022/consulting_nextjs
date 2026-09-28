import type {
  TenantMaster,
  SpendCategorySummary,
  CategoryYearDetail,
  VendorYearDetail,
  VendorPriceRank,
  SavingsOpportunity,
  DashboardOverviewData
} from '../types';
import type { PCBIExplainabilityAudit } from '../types/pcbi';
import frontendLogger from './logger';
import { aiApiClient } from './aiApi';
import { authApiClient } from './authApi';
import { dbApiClient } from './dbApi';
import { savingsApiClient } from './savingsApi';
import { pcbiApiClient } from './pcbiApi';
import { ingestionApiClient } from './ingestionApi';
import { validateInput } from './validation';
import {
  apiUpdateTenantPayloadSchema,
  apiMergeVendorPayloadSchema,
  apiDeployOpportunityPayloadSchema,
  apiCalculateConversionPayloadSchema
} from '../constants/validation';
import { fetchDashboardOverview } from './graphqlClient';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export const apiClient = {
  // Tenant
  async getTenant(buyerId?: string): Promise<TenantMaster> {
    frontendLogger.debug('Fetching tenant master data', { buyerId });
    const url = buyerId ? `${API_BASE}/api/tenant?buyerId=${encodeURIComponent(buyerId)}` : `${API_BASE}/api/tenant`;
    const res = await fetch(url);
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

  // Ingestion Delegations
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
  async getCategories(): Promise<{ categories: SpendCategorySummary[]; categoryDetails: CategoryYearDetail[] }> {
    frontendLogger.debug('Fetching spend categories and year details');
    const res = await fetch(`${API_BASE}/api/categories`);
    const json = await res.json();
    return json.data;
  },

  async getCategoryDetails(): Promise<CategoryYearDetail[]> {
    frontendLogger.debug('Fetching category year details matrix');
    const res = await fetch(`${API_BASE}/api/categories?details=true`);
    const json = await res.json();
    return json.data.categoryDetails;
  },

  // Vendors
  async getVendors(): Promise<{ vendorRankings: VendorPriceRank[]; vendorDetails: VendorYearDetail[] }> {
    frontendLogger.debug('Fetching vendor price rankings and year details');
    const res = await fetch(`${API_BASE}/api/vendors`);
    const json = await res.json();
    return json.data;
  },

  async getVendorDetails(): Promise<VendorYearDetail[]> {
    frontendLogger.debug('Fetching vendor year details');
    const res = await fetch(`${API_BASE}/api/vendors?details=true`);
    const json = await res.json();
    return json.data.vendorDetails;
  },

  async mergeVendor(targetName: string, masterId: string, canonicalName: string): Promise<Record<string, unknown>> {
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

  // PCBI Benchmark Intelligence (Module 3 - Prompt 100)
  getPCBIDashboard: pcbiApiClient.getPCBIDashboard.bind(pcbiApiClient),
  async getPCBIExplainabilityAudit(id: string): Promise<PCBIExplainabilityAudit> {
    frontendLogger.debug('Fetching PCBI explainability audit record', { id });
    const res = await fetch(`${API_BASE}/api/pcbi/opportunity/${encodeURIComponent(id)}`);
    const json = await res.json();
    return json.audit;
  },

  // Consolidated Savings & De-Duplication (Module 4 - Prompt 100)
  getConsolidatedSavings: savingsApiClient.getConsolidatedSavings.bind(savingsApiClient),
  updateActionPlan: savingsApiClient.updateActionPlan.bind(savingsApiClient),
  updateSavingsOpportunityStatus: savingsApiClient.updateSavingsOpportunityStatus.bind(savingsApiClient),

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

  // Executive Report
  async getExecutiveReport() {
    frontendLogger.debug('Fetching executive report data');
    const res = await fetch(`${API_BASE}/api/report`);
    return await res.json();
  },

  // GraphQL Integration
  async getDashboardOverviewGraphQL(): Promise<DashboardOverviewData> {
    frontendLogger.debug('Calling batch GraphQL query for unified dashboard overview');
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
