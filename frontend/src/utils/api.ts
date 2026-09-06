import {
  TenantMaster,
  RawDocumentIngestion,
  ValidationPreCheckRecord,
  SpendCategorySummary,
  CategoryYearDetail,
  VendorYearDetail,
  VendorPriceRank,
  SavingsOpportunity,
  ConversionFunnelPhase
} from '../types';
import frontendLogger from './logger';

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
    const res = await fetch(`${API_BASE}/api/tenant`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const json = await res.json();
    frontendLogger.info('Tenant updated successfully');
    return json.data;
  },



  // Ingestion
  async getIngestionData(): Promise<{ queue: RawDocumentIngestion[]; validationRecords: ValidationPreCheckRecord[] }> {
    frontendLogger.debug('Fetching ingestion queue and validation records');
    const res = await fetch(`${API_BASE}/api/ingestion`);
    const json = await res.json();
    return json.data;
  },

  async addIngestionFile(fileData: Partial<RawDocumentIngestion>): Promise<RawDocumentIngestion[]> {
    frontendLogger.info('Submitting ingestion file', { fileName: fileData.file_name });
    const res = await fetch(`${API_BASE}/api/ingestion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fileData)
    });
    const json = await res.json();
    return json.data;
  },

  async updateValidationRecord(record_id: string, updates: Partial<ValidationPreCheckRecord>): Promise<ValidationPreCheckRecord> {
    frontendLogger.info('Updating validation pre-check record', { record_id, updates });
    const res = await fetch(`${API_BASE}/api/ingestion`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ record_id, ...updates })
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
    const res = await fetch(`${API_BASE}/api/vendors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetName, masterId, canonicalName })
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
    const res = await fetch(`${API_BASE}/api/savings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opp_id, targetModule })
    });
    const json = await res.json();
    return json.data;
  },

  // Conversion
  async calculateCommercialSaaS(annualSpendCr: number, savingsRate: number, saasFeeRate: number) {
    frontendLogger.debug('Calculating SaaS commercial projection', { annualSpendCr, savingsRate, saasFeeRate });
    const res = await fetch(`${API_BASE}/api/conversion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ annualSpendCr, savingsRate, saasFeeRate })
    });
    return await res.json();
  },

  // Report
  async getExecutiveReport() {
    frontendLogger.info('Generating executive intelligence summary report');
    const res = await fetch(`${API_BASE}/api/report`);
    return await res.json();
  }
};

