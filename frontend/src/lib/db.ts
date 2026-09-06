import {
  mockTenant,
  initialIngestionQueue,
  initialValidationRecords,
  spendCategoriesData,
  categoryYearWiseDetails,
  vendorYearWiseDetails,
  initialLineItemMappings,
  vendorVolatilityRankings,
  initialSavingsOpportunities,
  conversionFunnelStages
} from '../data/mockData';

import {
  TenantMaster,
  RawDocumentIngestion,
  ValidationPreCheckRecord,
  SpendCategorySummary,
  CategoryYearDetail,
  VendorYearDetail,
  LineItemMapping,
  VendorPriceRank,
  SavingsOpportunity,
  ConversionFunnelPhase
} from '../types';

import { convertToINR } from '../utils/currencyConverter';

// In-Memory Global Database Instance for Next.js Backend
class DatabaseStore {
  private tenant: TenantMaster = JSON.parse(JSON.stringify(mockTenant));
  private ingestionQueue: RawDocumentIngestion[] = JSON.parse(JSON.stringify(initialIngestionQueue));
  private validationRecords: ValidationPreCheckRecord[] = JSON.parse(JSON.stringify(initialValidationRecords));
  private categories: SpendCategorySummary[] = JSON.parse(JSON.stringify(spendCategoriesData));
  private categoryDetails: CategoryYearDetail[] = JSON.parse(JSON.stringify(categoryYearWiseDetails));
  private vendorDetails: VendorYearDetail[] = JSON.parse(JSON.stringify(vendorYearWiseDetails));
  private lineItems: LineItemMapping[] = JSON.parse(JSON.stringify(initialLineItemMappings));
  private vendorRankings: VendorPriceRank[] = JSON.parse(JSON.stringify(vendorVolatilityRankings));
  private opportunities: SavingsOpportunity[] = JSON.parse(JSON.stringify(initialSavingsOpportunities));
  private funnelStages: ConversionFunnelPhase[] = JSON.parse(JSON.stringify(conversionFunnelStages));

  // Tenant
  public getTenant(): TenantMaster {
    return { ...this.tenant };
  }

  public updateTenant(updates: Partial<TenantMaster>): TenantMaster {
    this.tenant = { ...this.tenant, ...updates };
    return { ...this.tenant };
  }

  // Ingestion
  public getIngestionQueue(): RawDocumentIngestion[] {
    return [...this.ingestionQueue];
  }

  public addIngestionItem(item: RawDocumentIngestion): RawDocumentIngestion[] {
    this.ingestionQueue = [item, ...this.ingestionQueue];
    return [...this.ingestionQueue];
  }

  // Validation Records
  public getValidationRecords(): ValidationPreCheckRecord[] {
    return [...this.validationRecords];
  }

  public updateValidationRecord(recordId: string, updates: Partial<ValidationPreCheckRecord>): ValidationPreCheckRecord | null {
    let updated: ValidationPreCheckRecord | null = null;
    this.validationRecords = this.validationRecords.map((rec) => {
      if (rec.record_id === recordId) {
        updated = { ...rec, ...updates };
        return updated;
      }
      return rec;
    });
    return updated;
  }

  public applyBlanketRemediation(): { updatedCount: number; records: ValidationPreCheckRecord[] } {
    let updatedCount = 0;
    this.validationRecords = this.validationRecords.map((r) => {
      let vendorName = r.vendor_name;
      let fxRate = r.fx_rate_applied || 83.8;
      let inrCrores = r.inr_crores;

      if (r.issue_flag === 'Missing Currency Code') {
        fxRate = 83.8;
        const totalINR = (r.order_quantity || 1) * (r.net_price || r.amount) * fxRate;
        inrCrores = Number((totalINR / 10000000).toFixed(4));
        updatedCount++;
      } else if (r.issue_flag === 'Unmapped Supplier Name') {
        if (vendorName.toLowerCase().includes('linde') || vendorName.toLowerCase().includes('air')) {
          vendorName = 'Linde India Industrial Gases (VEND-MST-004)';
        } else if (vendorName.toLowerCase().includes('tata')) {
          vendorName = 'Tata Steel Processing Ltd (VEND-MST-001)';
        } else {
          vendorName = `${vendorName} (VEND-RESOLVED)`;
        }
        updatedCount++;
      } else if (r.issue_flag === 'Duplicate PO') {
        updatedCount++;
      }

      return {
        ...r,
        vendor_name: vendorName,
        raw_currency: r.raw_currency === 'MISSING' || !r.raw_currency ? 'USD' : r.raw_currency,
        fx_rate_applied: fxRate,
        inr_crores: inrCrores,
        issue_flag: 'Passed Clean' as const,
        action_status: 'Ready' as const,
        resolved: true
      };
    });

    return { updatedCount, records: [...this.validationRecords] };
  }

  public resetValidationRecords(): ValidationPreCheckRecord[] {
    this.validationRecords = JSON.parse(JSON.stringify(initialValidationRecords));
    return [...this.validationRecords];
  }

  // Categories
  public getCategories(): SpendCategorySummary[] {
    return [...this.categories];
  }

  public getCategoryDetails(): CategoryYearDetail[] {
    return [...this.categoryDetails];
  }

  public getCategoryById(id: string): CategoryYearDetail | undefined {
    return this.categoryDetails.find((c) => c.id === id || c.category.toLowerCase() === id.toLowerCase());
  }

  // Vendors
  public getVendorDetails(): VendorYearDetail[] {
    return [...this.vendorDetails];
  }

  public getVendorRankings(): VendorPriceRank[] {
    return [...this.vendorRankings];
  }

  public mergeVendor(targetName: string, masterId: string, canonicalName: string): { success: boolean; affected: number } {
    let affected = 0;
    this.validationRecords = this.validationRecords.map((r) => {
      if (r.vendor_name.toLowerCase().includes(targetName.toLowerCase())) {
        affected++;
        return {
          ...r,
          vendor_name: `${canonicalName} (${masterId})`,
          issue_flag: 'Passed Clean' as const,
          action_status: 'Ready' as const,
          resolved: true
        };
      }
      return r;
    });

    this.lineItems = this.lineItems.map((li) => {
      if (li.vendor_identified.toLowerCase().includes(targetName.toLowerCase())) {
        return {
          ...li,
          vendor_identified: `${canonicalName} (${masterId})`,
          master_supplier_id: masterId
        };
      }
      return li;
    });

    return { success: true, affected };
  }

  // Line Items
  public getLineItems(): LineItemMapping[] {
    return [...this.lineItems];
  }

  public updateLineItem(mappingId: string, updates: Partial<LineItemMapping>): LineItemMapping | null {
    let updated: LineItemMapping | null = null;
    this.lineItems = this.lineItems.map((item) => {
      if (item.mapping_id === mappingId) {
        updated = { ...item, ...updates };
        return updated;
      }
      return item;
    });
    return updated;
  }

  // Savings
  public getOpportunities(): SavingsOpportunity[] {
    return [...this.opportunities];
  }

  public deployOpportunity(oppId: string, targetModule: 'proCPX' | 'DPS NXT'): SavingsOpportunity | null {
    let updated: SavingsOpportunity | null = null;
    const statusText = targetModule === 'proCPX' ? 'Pushed to proCPX' : 'Pushed to DPS NXT';
    this.opportunities = this.opportunities.map((opp) => {
      if (opp.opp_id === oppId) {
        updated = { ...opp, status: statusText as any };
        return updated;
      }
      return opp;
    });
    return updated;
  }

  // Funnel & Realization
  public getFunnelStages(): ConversionFunnelPhase[] {
    return [...this.funnelStages];
  }
}

// Global Singleton for server environment
const globalForDb = globalThis as unknown as { dbStore: DatabaseStore };
export const db = globalForDb.dbStore || new DatabaseStore();
if (process.env.NODE_ENV !== 'production') globalForDb.dbStore = db;
