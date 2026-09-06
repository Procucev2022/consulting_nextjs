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

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export const apiClient = {
  // Tenant
  async getTenant(): Promise<TenantMaster> {
    const res = await fetch(`${API_BASE}/api/tenant`);
    const json = await res.json();
    return json.data;
  },

  async updateTenant(updates: Partial<TenantMaster>): Promise<TenantMaster> {
    const res = await fetch(`${API_BASE}/api/tenant`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const json = await res.json();
    return json.data;
  },

  // Ingestion
  async getIngestionData(): Promise<{ queue: RawDocumentIngestion[]; validationRecords: ValidationPreCheckRecord[] }> {
    const res = await fetch(`${API_BASE}/api/ingestion`);
    const json = await res.json();
    return json.data;
  },

  async addIngestionFile(fileData: Partial<RawDocumentIngestion>): Promise<RawDocumentIngestion[]> {
    const res = await fetch(`${API_BASE}/api/ingestion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fileData)
    });
    const json = await res.json();
    return json.data;
  },

  async updateValidationRecord(record_id: string, updates: Partial<ValidationPreCheckRecord>): Promise<ValidationPreCheckRecord> {
    const res = await fetch(`${API_BASE}/api/ingestion`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ record_id, ...updates })
    });
    const json = await res.json();
    return json.data;
  },

  async applyBlanketRemediation(): Promise<{ updatedCount: number; records: ValidationPreCheckRecord[] }> {
    const res = await fetch(`${API_BASE}/api/ingestion/remediate`, {
      method: 'POST'
    });
    const json = await res.json();
    return json.data;
  },

  async resetValidationRecords(): Promise<ValidationPreCheckRecord[]> {
    const res = await fetch(`${API_BASE}/api/ingestion`, {
      method: 'DELETE'
    });
    const json = await res.json();
    return json.data;
  },

  // Categories
  async getCategories(): Promise<{ categories: SpendCategorySummary[]; categoryDetails: CategoryYearDetail[] }> {
    const res = await fetch(`${API_BASE}/api/categories`);
    const json = await res.json();
    return json.data;
  },

  // Vendors
  async getVendors(): Promise<{ vendorRankings: VendorPriceRank[]; vendorDetails: VendorYearDetail[] }> {
    const res = await fetch(`${API_BASE}/api/vendors`);
    const json = await res.json();
    return json.data;
  },

  async mergeVendor(targetName: string, masterId: string, canonicalName: string) {
    const res = await fetch(`${API_BASE}/api/vendors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetName, masterId, canonicalName })
    });
    return await res.json();
  },

  // Savings
  async getSavingsOpportunities(): Promise<{ opportunities: SavingsOpportunity[]; totalPotentialSavingsCr: number }> {
    const res = await fetch(`${API_BASE}/api/savings`);
    const json = await res.json();
    return json.data;
  },

  async deployOpportunity(opp_id: string, targetModule: 'proCPX' | 'DPS NXT'): Promise<SavingsOpportunity> {
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
    const res = await fetch(`${API_BASE}/api/conversion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ annualSpendCr, savingsRate, saasFeeRate })
    });
    return await res.json();
  },

  // Report
  async getExecutiveReport() {
    const res = await fetch(`${API_BASE}/api/report`);
    return await res.json();
  }
};
