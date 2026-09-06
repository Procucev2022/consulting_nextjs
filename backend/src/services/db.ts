import { PrismaClient } from '@prisma/client';
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
import logger from '../utils/logger';
import { queryCache } from '../utils/queryCache';
import { queryAuditor } from '../utils/queryAuditor';
import { CACHE_KEYS } from '../constants/db';

export const prisma = new PrismaClient({
  log: ['warn', 'error']
});

export class DatabaseStore {
  private isPostgresConnected: boolean = false;
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

  constructor() {
    this.initPostgres();
  }

  private async initPostgres() {
    try {
      await prisma.$connect();
      this.isPostgresConnected = true;
      logger.info('🐘 PostgreSQL connected successfully via Prisma', { source: 'DatabaseStore' });
      
      // Optionally hydrate from PostgreSQL if data exists
      const dbTenant = await prisma.tenantMaster.findFirst();
      if (dbTenant) {
        this.tenant = {
          tenant_id: dbTenant.tenant_id,
          enterprise_name: dbTenant.enterprise_name,
          region: dbTenant.region as any,
          base_currency: dbTenant.base_currency as any,
          status: dbTenant.status as any,
          total_spend_evaluated: dbTenant.total_spend_evaluated,
          total_spend_evaluated_inr: dbTenant.total_spend_evaluated_inr || undefined
        };
      }
    } catch (err: any) {
      this.isPostgresConnected = false;
      logger.warn('⚠️  PostgreSQL not reachable, running with resilient in-memory datastore', {
        source: 'DatabaseStore',
        tip: 'Start PostgreSQL using "docker compose up -d" or "npm run db:up", then run "npm run db:setup"'
      }, err);
    }
  }

  public isConnectedToPostgres(): boolean {
    return this.isPostgresConnected;
  }

  // Tenant
  public getTenant(): TenantMaster {
    const start = Date.now();
    const cached = queryCache.getCached<TenantMaster>(CACHE_KEYS.TENANT);
    if (cached) {
      queryAuditor.recordQueryAudit({
        queryId: `tenant-${Date.now()}`,
        operation: 'getTenant',
        model: 'TenantMaster',
        durationMs: Date.now() - start,
        cached: true,
        timestamp: new Date().toISOString()
      });
      return cached;
    }
    const result = { ...this.tenant };
    queryCache.setCached(CACHE_KEYS.TENANT, result);
    queryAuditor.recordQueryAudit({
      queryId: `tenant-${Date.now()}`,
      operation: 'getTenant',
      model: 'TenantMaster',
      durationMs: Date.now() - start,
      cached: false,
      timestamp: new Date().toISOString()
    });
    return result;
  }

  public updateTenant(updates: Partial<TenantMaster>): TenantMaster {
    this.tenant = { ...this.tenant, ...updates };
    queryCache.invalidateCache(CACHE_KEYS.TENANT);
    if (this.isPostgresConnected) {
      prisma.tenantMaster.updateMany({
        where: { tenant_id: this.tenant.tenant_id },
        data: {
          ...updates,
          region: updates.region as any,
          base_currency: updates.base_currency as any,
          status: updates.status as any
        }
      }).catch((e: any) => logger.error('Error syncing tenant to PostgreSQL', { source: 'DatabaseStore' }, e));
    }
    return { ...this.tenant };
  }

  // Ingestion
  public getIngestionQueue(): RawDocumentIngestion[] {
    const start = Date.now();
    const cached = queryCache.getCached<RawDocumentIngestion[]>(CACHE_KEYS.INGESTION_QUEUE);
    if (cached) {
      queryAuditor.recordQueryAudit({
        queryId: `ingestion-${Date.now()}`,
        operation: 'getIngestionQueue',
        model: 'RawDocumentIngestion',
        durationMs: Date.now() - start,
        cached: true,
        timestamp: new Date().toISOString()
      });
      return cached;
    }
    const result = [...this.ingestionQueue];
    queryCache.setCached(CACHE_KEYS.INGESTION_QUEUE, result);
    queryAuditor.recordQueryAudit({
      queryId: `ingestion-${Date.now()}`,
      operation: 'getIngestionQueue',
      model: 'RawDocumentIngestion',
      durationMs: Date.now() - start,
      cached: false,
      timestamp: new Date().toISOString()
    });
    return result;
  }

  public addIngestionItem(item: RawDocumentIngestion): RawDocumentIngestion[] {
    this.ingestionQueue = [item, ...this.ingestionQueue];
    queryCache.invalidateCache(CACHE_KEYS.INGESTION_QUEUE);
    if (this.isPostgresConnected) {
      prisma.rawDocumentIngestion.create({
        data: {
          doc_id: item.doc_id,
          tenant_id: item.tenant_id,
          file_name: item.file_name,
          file_type: item.file_type,
          file_size_mb: item.file_size_mb,
          ocr_status: item.ocr_status,
          progress: item.progress,
          uploaded_at: new Date(item.uploaded_at),
          records_count: item.records_count,
          detected_currencies: item.detected_currencies || [],
          converted_inr_crores: item.converted_inr_crores
        }
      }).catch((e: any) => logger.error('Error syncing ingestion to PostgreSQL', { source: 'DatabaseStore' }, e));
    }
    return [...this.ingestionQueue];
  }

  // Validation Records
  public getValidationRecords(): ValidationPreCheckRecord[] {
    const start = Date.now();
    const cached = queryCache.getCached<ValidationPreCheckRecord[]>(CACHE_KEYS.VALIDATION_RECORDS);
    if (cached) {
      queryAuditor.recordQueryAudit({
        queryId: `val-${Date.now()}`,
        operation: 'getValidationRecords',
        model: 'ValidationPreCheckRecord',
        durationMs: Date.now() - start,
        cached: true,
        timestamp: new Date().toISOString()
      });
      return cached;
    }
    const result = [...this.validationRecords];
    queryCache.setCached(CACHE_KEYS.VALIDATION_RECORDS, result);
    queryAuditor.recordQueryAudit({
      queryId: `val-${Date.now()}`,
      operation: 'getValidationRecords',
      model: 'ValidationPreCheckRecord',
      durationMs: Date.now() - start,
      cached: false,
      timestamp: new Date().toISOString()
    });
    return result;
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

    queryCache.invalidateCache(CACHE_KEYS.VALIDATION_RECORDS);

    if (this.isPostgresConnected && updated) {
      prisma.validationPreCheckRecord.update({
        where: { record_id: recordId },
        data: { ...updates }
      }).catch((e: any) => logger.error('Error syncing validation record to PostgreSQL', { source: 'DatabaseStore' }, e));
    }
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

    queryCache.invalidateCache(CACHE_KEYS.VALIDATION_RECORDS);
    return { updatedCount, records: [...this.validationRecords] };
  }

  public resetValidationRecords(): ValidationPreCheckRecord[] {
    this.validationRecords = JSON.parse(JSON.stringify(initialValidationRecords));
    queryCache.invalidateCache(CACHE_KEYS.VALIDATION_RECORDS);
    return [...this.validationRecords];
  }

  // Categories
  public getCategories(): SpendCategorySummary[] {
    const start = Date.now();
    const cached = queryCache.getCached<SpendCategorySummary[]>(CACHE_KEYS.CATEGORIES_SUMMARY);
    if (cached) {
      queryAuditor.recordQueryAudit({
        queryId: `cat-${Date.now()}`,
        operation: 'getCategories',
        model: 'SpendCategorySummary',
        durationMs: Date.now() - start,
        cached: true,
        timestamp: new Date().toISOString()
      });
      return cached;
    }
    const result = [...this.categories];
    queryCache.setCached(CACHE_KEYS.CATEGORIES_SUMMARY, result);
    queryAuditor.recordQueryAudit({
      queryId: `cat-${Date.now()}`,
      operation: 'getCategories',
      model: 'SpendCategorySummary',
      durationMs: Date.now() - start,
      cached: false,
      timestamp: new Date().toISOString()
    });
    return result;
  }

  public getCategoryDetails(): CategoryYearDetail[] {
    const start = Date.now();
    const cached = queryCache.getCached<CategoryYearDetail[]>(CACHE_KEYS.CATEGORY_DETAILS);
    if (cached) {
      queryAuditor.recordQueryAudit({
        queryId: `catdet-${Date.now()}`,
        operation: 'getCategoryDetails',
        model: 'CategoryYearDetail',
        durationMs: Date.now() - start,
        cached: true,
        timestamp: new Date().toISOString()
      });
      return cached;
    }
    const result = [...this.categoryDetails];
    queryCache.setCached(CACHE_KEYS.CATEGORY_DETAILS, result);
    queryAuditor.recordQueryAudit({
      queryId: `catdet-${Date.now()}`,
      operation: 'getCategoryDetails',
      model: 'CategoryYearDetail',
      durationMs: Date.now() - start,
      cached: false,
      timestamp: new Date().toISOString()
    });
    return result;
  }

  public getCategoryById(id: string): CategoryYearDetail | undefined {
    return this.categoryDetails.find((c) => c.id === id || c.category.toLowerCase() === id.toLowerCase());
  }

  // Vendors
  public getVendorDetails(): VendorYearDetail[] {
    const start = Date.now();
    const cached = queryCache.getCached<VendorYearDetail[]>(CACHE_KEYS.VENDOR_DETAILS);
    if (cached) {
      queryAuditor.recordQueryAudit({
        queryId: `vend-${Date.now()}`,
        operation: 'getVendorDetails',
        model: 'VendorYearDetail',
        durationMs: Date.now() - start,
        cached: true,
        timestamp: new Date().toISOString()
      });
      return cached;
    }
    const result = [...this.vendorDetails];
    queryCache.setCached(CACHE_KEYS.VENDOR_DETAILS, result);
    queryAuditor.recordQueryAudit({
      queryId: `vend-${Date.now()}`,
      operation: 'getVendorDetails',
      model: 'VendorYearDetail',
      durationMs: Date.now() - start,
      cached: false,
      timestamp: new Date().toISOString()
    });
    return result;
  }

  public getVendorRankings(): VendorPriceRank[] {
    const start = Date.now();
    const cached = queryCache.getCached<VendorPriceRank[]>(CACHE_KEYS.VENDOR_RANKINGS);
    if (cached) {
      queryAuditor.recordQueryAudit({
        queryId: `rank-${Date.now()}`,
        operation: 'getVendorRankings',
        model: 'VendorPriceRank',
        durationMs: Date.now() - start,
        cached: true,
        timestamp: new Date().toISOString()
      });
      return cached;
    }
    const result = [...this.vendorRankings];
    queryCache.setCached(CACHE_KEYS.VENDOR_RANKINGS, result);
    queryAuditor.recordQueryAudit({
      queryId: `rank-${Date.now()}`,
      operation: 'getVendorRankings',
      model: 'VendorPriceRank',
      durationMs: Date.now() - start,
      cached: false,
      timestamp: new Date().toISOString()
    });
    return result;
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

    queryCache.invalidateCache([CACHE_KEYS.VALIDATION_RECORDS, CACHE_KEYS.LINE_ITEMS]);

    return { success: true, affected };
  }

  // Line Items
  public getLineItems(): LineItemMapping[] {
    const start = Date.now();
    const cached = queryCache.getCached<LineItemMapping[]>(CACHE_KEYS.LINE_ITEMS);
    if (cached) {
      queryAuditor.recordQueryAudit({
        queryId: `li-${Date.now()}`,
        operation: 'getLineItems',
        model: 'LineItemMapping',
        durationMs: Date.now() - start,
        cached: true,
        timestamp: new Date().toISOString()
      });
      return cached;
    }
    const result = [...this.lineItems];
    queryCache.setCached(CACHE_KEYS.LINE_ITEMS, result);
    queryAuditor.recordQueryAudit({
      queryId: `li-${Date.now()}`,
      operation: 'getLineItems',
      model: 'LineItemMapping',
      durationMs: Date.now() - start,
      cached: false,
      timestamp: new Date().toISOString()
    });
    return result;
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
    queryCache.invalidateCache(CACHE_KEYS.LINE_ITEMS);
    return updated;
  }

  // Savings
  public getOpportunities(): SavingsOpportunity[] {
    const start = Date.now();
    const cached = queryCache.getCached<SavingsOpportunity[]>(CACHE_KEYS.SAVINGS_OPPORTUNITIES);
    if (cached) {
      queryAuditor.recordQueryAudit({
        queryId: `opp-${Date.now()}`,
        operation: 'getOpportunities',
        model: 'SavingsOpportunity',
        durationMs: Date.now() - start,
        cached: true,
        timestamp: new Date().toISOString()
      });
      return cached;
    }
    const result = [...this.opportunities];
    queryCache.setCached(CACHE_KEYS.SAVINGS_OPPORTUNITIES, result);
    queryAuditor.recordQueryAudit({
      queryId: `opp-${Date.now()}`,
      operation: 'getOpportunities',
      model: 'SavingsOpportunity',
      durationMs: Date.now() - start,
      cached: false,
      timestamp: new Date().toISOString()
    });
    return result;
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
    queryCache.invalidateCache(CACHE_KEYS.SAVINGS_OPPORTUNITIES);
    return updated;
  }

  // Funnel & Realization
  public getFunnelStages(): ConversionFunnelPhase[] {
    const start = Date.now();
    const cached = queryCache.getCached<ConversionFunnelPhase[]>(CACHE_KEYS.CONVERSION_FUNNEL);
    if (cached) {
      queryAuditor.recordQueryAudit({
        queryId: `funnel-${Date.now()}`,
        operation: 'getFunnelStages',
        model: 'ConversionFunnelPhase',
        durationMs: Date.now() - start,
        cached: true,
        timestamp: new Date().toISOString()
      });
      return cached;
    }
    const result = [...this.funnelStages];
    queryCache.setCached(CACHE_KEYS.CONVERSION_FUNNEL, result);
    queryAuditor.recordQueryAudit({
      queryId: `funnel-${Date.now()}`,
      operation: 'getFunnelStages',
      model: 'ConversionFunnelPhase',
      durationMs: Date.now() - start,
      cached: false,
      timestamp: new Date().toISOString()
    });
    return result;
  }
}

// Server-wide Singleton
export const db = new DatabaseStore();
