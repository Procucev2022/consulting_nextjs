import { PrismaClient } from '@prisma/client';
import {
  mockTenant,
  initialIngestionQueue,
  initialValidationRecords,
  conversionFunnelStages,
  initialSeedUsers
} from '../data/mockData';

import type {
  TenantMaster,
  RawDocumentIngestion,
  ValidationPreCheckRecord,
  SpendCategorySummary,
  CategoryYearDetail,
  VendorYearDetail,
  LineItemMapping,
  VendorPriceRank,
  SavingsOpportunity,
  ConversionFunnelPhase,
  UserRecord
} from '../types';

import type {
  PCBIBenchmarkMaster,
  PCBIBenchmarkComponent,
  PCBIWeeklyIndex,
  PCBIUNSPSCMapping,
  PCBIClientPurchaseTransaction,
  PCBIBasePurchase,
  PCBITransactionCalculation,
  PCBIDataQualityReport,
  PCBIExecutiveSummary,
  PCBIExplainabilityAudit,
  UpgradeRequestRecord,
  AdminOTPValidationSession
} from '../types/pcbi';

import {
  initialPCBIBenchmarks,
  initialPCBIBenchmarkComponents,
  initialPCBIWeeklyIndices,
  initialPCBIUNSPSCMappings
} from '../data/pcbiMasterData';
import { PCBICalculationEngine } from './pcbiCalculationEngine';
import { StrategicSourcingEngine } from './strategicSourcingEngine';
import { SavingsDeduplicationEngine } from './savingsDeduplicationEngine';
import { Module2StrategicSourcingEngine } from './module2StrategicSourcingEngine';
import type {
  CategoryStrategicSourcingProfile,
  Module2StrategicSourcingDashboardSummary,
  Module2ToModule4HandoffPackage
} from '../types/module2StrategicSourcing';
import type {
  SavingsOpportunityItem,
  SavingsWaterfallMetrics,
  OpportunityOverlapGroup,
  ActionPlanItem,
  SavingsOpportunityStatus,
  ActionOwner
} from '../types/savings';
import type { StrategicInputTransaction, StrategicSourcingResult } from '../types/strategicSourcing';

import logger from '../utils/logger';
import { queryCache } from '../utils/queryCache';
import { queryAuditor } from '../utils/queryAuditor';
import { CACHE_KEYS } from '../constants/db';

export const prisma = new PrismaClient({
  log: ['warn', 'error']
});

export class DatabaseStore {
  private isPostgresConnected: boolean = false;
  private tenant: TenantMaster = {
    ...mockTenant,
    total_spend_evaluated: 0,
    total_spend_evaluated_inr: 0
  };
  private ingestionQueue: RawDocumentIngestion[] = [];
  private validationRecords: ValidationPreCheckRecord[] = [];
  private categories: SpendCategorySummary[] = [];
  private categoryDetails: CategoryYearDetail[] = [];
  private vendorDetails: VendorYearDetail[] = [];
  private lineItems: LineItemMapping[] = [];
  private vendorRankings: VendorPriceRank[] = [];
  private opportunities: SavingsOpportunity[] = [];
  private funnelStages: ConversionFunnelPhase[] = conversionFunnelStages.map((stage) => ({
    ...stage,
    spend_inr_crores: 0
  }));
  private users: UserRecord[] = JSON.parse(JSON.stringify(initialSeedUsers));

  // PCBI State
  private pcbiBenchmarks: PCBIBenchmarkMaster[] = JSON.parse(JSON.stringify(initialPCBIBenchmarks));
  private pcbiComponents: PCBIBenchmarkComponent[] = JSON.parse(JSON.stringify(initialPCBIBenchmarkComponents));
  private pcbiIndices: PCBIWeeklyIndex[] = JSON.parse(JSON.stringify(initialPCBIWeeklyIndices));
  private pcbiUnspscMappings: PCBIUNSPSCMapping[] = JSON.parse(JSON.stringify(initialPCBIUNSPSCMappings));
  private pcbiEngine: PCBICalculationEngine;
  private pcbiLastCalculations: PCBITransactionCalculation[] = [];
  private pcbiLastBasePurchases: PCBIBasePurchase[] = [];
  private pcbiLastExecutiveSummary: PCBIExecutiveSummary | null = null;
  private pcbiLastDataQuality: PCBIDataQualityReport | null = null;
  // Strategic Sourcing & Savings Engine State (Module 2B & Module 4 - Prompt 100)
  private strategicEngine = new StrategicSourcingEngine();
  private savingsEngine = new SavingsDeduplicationEngine();
  private cachedActionPlans: ActionPlanItem[] = [];
  private cachedConsolidatedOpportunities: SavingsOpportunityItem[] = [];
  private cachedOverlaps: OpportunityOverlapGroup[] = [];
  private cachedWaterfallMetrics: SavingsWaterfallMetrics | null = null;
  // Module 2 Strategic Sourcing Cache (V1.0)
  private cachedModule2Profiles: CategoryStrategicSourcingProfile[] = [];
  private cachedModule2Summary: Module2StrategicSourcingDashboardSummary | null = null;
  private cachedModule2Handoff: Module2ToModule4HandoffPackage[] = [];

  // Upgrade Request State (Prompt 81)
  private upgradeRequests: UpgradeRequestRecord[] = [];
  private adminOtpSessions: Map<string, AdminOTPValidationSession> = new Map();

  constructor() {
    this.pcbiEngine = new PCBICalculationEngine(
      this.pcbiBenchmarks,
      this.pcbiComponents,
      this.pcbiIndices,
      this.pcbiUnspscMappings
    );
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
          total_spend_evaluated: 0,
          total_spend_evaluated_inr: 0
        };
      }
    } catch (err: any) {
      this.isPostgresConnected = false;
      logger.warn('⚠️  PostgreSQL connection unavailable - running with active high-performance datastore', {
        source: 'DatabaseStore',
        reason: err instanceof Error ? err.message.split('\n')[0] : String(err)
      });
    }
  }

  public isConnectedToPostgres(): boolean {
    return this.isPostgresConnected;
  }

  // Tenant
  public getTenant(buyerId?: string): TenantMaster {
    const start = Date.now();
    const queue = this.getIngestionQueue(buyerId);
    const totalSpendInrCr = queue.reduce((sum, doc) => sum + (doc.converted_inr_crores || 0), 0);
    const result: TenantMaster = {
      ...this.tenant,
      total_spend_evaluated_inr: totalSpendInrCr,
      total_spend_evaluated: Math.round(totalSpendInrCr * 10000000)
    };
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
      prisma.tenantMaster.upsert({
        where: { tenant_id: this.tenant.tenant_id },
        create: {
          tenant_id: this.tenant.tenant_id,
          enterprise_name: this.tenant.enterprise_name,
          region: this.tenant.region,
          base_currency: this.tenant.base_currency,
          status: this.tenant.status,
          total_spend_evaluated: this.tenant.total_spend_evaluated,
          total_spend_evaluated_inr: this.tenant.total_spend_evaluated_inr,
          major_sector: this.tenant.major_sector,
          minor_sector: this.tenant.minor_sector
        },
        update: {
          enterprise_name: updates.enterprise_name ?? this.tenant.enterprise_name,
          region: (updates.region as any) ?? this.tenant.region,
          base_currency: (updates.base_currency as any) ?? this.tenant.base_currency,
          status: (updates.status as any) ?? this.tenant.status,
          total_spend_evaluated: updates.total_spend_evaluated ?? this.tenant.total_spend_evaluated,
          total_spend_evaluated_inr: updates.total_spend_evaluated_inr ?? this.tenant.total_spend_evaluated_inr,
          major_sector: updates.major_sector ?? this.tenant.major_sector,
          minor_sector: updates.minor_sector ?? this.tenant.minor_sector
        }
      }).catch((e: any) => logger.error('Error syncing tenant to PostgreSQL', { source: 'DatabaseStore' }, e));
    }
    return { ...this.tenant };
  }

  private sanitizeIngestionItem(item: Partial<RawDocumentIngestion>, index: number): RawDocumentIngestion {
    return {
      doc_id: item.doc_id || `DOC-INGEST-${8800 + index}`,
      tenant_id: item.tenant_id || this.tenant?.tenant_id || 'TNT-GLOBAL-8902',
      file_name: item.file_name || 'Uploaded_Document.xlsx',
      file_type: (item.file_type as any) || 'XLSX',
      file_size_mb: item.file_size_mb || 1.0,
      ocr_status: (item.ocr_status as any) || 'Completed',
      progress: item.progress ?? 100,
      uploaded_at: item.uploaded_at || new Date().toISOString().replace('T', ' ').slice(0, 19),
      records_count: item.records_count ?? 0,
      detected_currencies: Array.isArray(item.detected_currencies) && item.detected_currencies.length > 0 ? item.detected_currencies : ['INR'],
      converted_inr_crores: item.converted_inr_crores ?? 0,
      unique_items_count: item.unique_items_count,
      unique_vendors_count: item.unique_vendors_count,
      material_groups_count: item.material_groups_count,
      plants_count: item.plants_count
    };
  }

  // Ingestion
  public getIngestionQueue(tenantId?: string): RawDocumentIngestion[] {
    const start = Date.now();
    const cacheKey = tenantId ? `${CACHE_KEYS.INGESTION_QUEUE}_${tenantId}` : CACHE_KEYS.INGESTION_QUEUE;
    const cached = queryCache.getCached<RawDocumentIngestion[]>(cacheKey);
    if (cached) {
      queryAuditor.recordQueryAudit({
        queryId: `ingestion-${Date.now()}`,
        operation: 'getIngestionQueue',
        model: 'RawDocumentIngestion',
        durationMs: Date.now() - start,
        cached: true,
        timestamp: new Date().toISOString()
      });
      return cached.map((item, idx) => this.sanitizeIngestionItem(item, idx));
    }
    const filteredQueue = tenantId
      ? this.ingestionQueue.filter((item) => item.tenant_id === tenantId)
      : this.ingestionQueue;
    const result = filteredQueue.map((item, idx) => this.sanitizeIngestionItem(item, idx));
    queryCache.setCached(cacheKey, result);
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

  public addIngestionItem(item: Partial<RawDocumentIngestion> & { file_name: string; file_type: any; file_size_mb: number }): RawDocumentIngestion[] {
    const fullItem: RawDocumentIngestion = {
      doc_id: item.doc_id || `DOC-INGEST-${Math.floor(1000 + Math.random() * 9000)}`,
      tenant_id: item.tenant_id || this.tenant.tenant_id,
      file_name: item.file_name,
      file_type: (item.file_type as any) || 'XLSX',
      file_size_mb: item.file_size_mb,
      ocr_status: (item.ocr_status as any) || 'Completed',
      progress: item.progress ?? 100,
      uploaded_at: item.uploaded_at || new Date().toISOString().replace('T', ' ').slice(0, 19),
      records_count: item.records_count ?? 0,
      detected_currencies: item.detected_currencies?.length ? item.detected_currencies : ['INR'],
      converted_inr_crores: item.converted_inr_crores ?? 0,
      unique_items_count: item.unique_items_count,
      unique_vendors_count: item.unique_vendors_count,
      material_groups_count: item.material_groups_count,
      plants_count: item.plants_count
    };
    // Replace or add document for this tenant/buyer
    this.ingestionQueue = [
      ...this.ingestionQueue.filter((doc) => doc.tenant_id !== fullItem.tenant_id && doc.doc_id !== fullItem.doc_id),
      fullItem
    ];
    queryCache.invalidateCache(CACHE_KEYS.INGESTION_QUEUE);
    if (fullItem.tenant_id) {
      queryCache.invalidateCache(`${CACHE_KEYS.INGESTION_QUEUE}_${fullItem.tenant_id}`);
    }
    if (this.isPostgresConnected) {
      prisma.rawDocumentIngestion.create({
        data: {
          doc_id: fullItem.doc_id,
          tenant_id: fullItem.tenant_id,
          file_name: fullItem.file_name,
          file_type: fullItem.file_type,
          file_size_mb: fullItem.file_size_mb,
          ocr_status: fullItem.ocr_status,
          progress: fullItem.progress,
          uploaded_at: new Date(fullItem.uploaded_at),
          records_count: fullItem.records_count,
          detected_currencies: fullItem.detected_currencies,
          converted_inr_crores: fullItem.converted_inr_crores
        }
      }).catch((e: any) => {
        logger.warn('PostgreSQL sync skipped - running with active in-memory store', { source: 'DatabaseStore', reason: e?.message?.split('\n')[0] });
        this.isPostgresConnected = false;
      });
    }
    return this.getIngestionQueue(fullItem.tenant_id);
  }

  public deleteIngestionItem(docId?: string, tenantId?: string): RawDocumentIngestion[] {
    if (docId) {
      this.ingestionQueue = this.ingestionQueue.filter((item) => item.doc_id !== docId);
      if (this.isPostgresConnected) {
        prisma.rawDocumentIngestion.deleteMany({
          where: { doc_id: docId }
        }).catch((e: any) => {
          logger.warn('PostgreSQL delete skipped', { source: 'DatabaseStore', docId, reason: e?.message?.split('\n')[0] });
          this.isPostgresConnected = false;
        });
      }
    } else if (tenantId) {
      this.ingestionQueue = this.ingestionQueue.filter((item) => item.tenant_id !== tenantId);
      if (this.isPostgresConnected) {
        prisma.rawDocumentIngestion.deleteMany({
          where: { tenant_id: tenantId }
        }).catch((e: any) => {
          logger.warn('PostgreSQL delete skipped', { source: 'DatabaseStore', tenantId, reason: e?.message?.split('\n')[0] });
          this.isPostgresConnected = false;
        });
      }
    } else {
      this.ingestionQueue = [];
      if (this.isPostgresConnected) {
        prisma.rawDocumentIngestion.deleteMany({}).catch((e: any) => {
          logger.warn('PostgreSQL clear skipped', { source: 'DatabaseStore', reason: e?.message?.split('\n')[0] });
          this.isPostgresConnected = false;
        });
      }
    }
    queryCache.invalidateCache(CACHE_KEYS.INGESTION_QUEUE);
    if (tenantId) {
      queryCache.invalidateCache(`${CACHE_KEYS.INGESTION_QUEUE}_${tenantId}`);
    }
    return this.getIngestionQueue(tenantId);
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
        const totalINR = (r.order_quantity || 1) * (r.net_price ?? 0) * fxRate;
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

  public setValidationRecords(records: ValidationPreCheckRecord[]): void {
    this.validationRecords = [...records];
    queryCache.invalidateCache(CACHE_KEYS.VALIDATION_RECORDS);
  }

  public setCategories(categories: SpendCategorySummary[]): void {
    this.categories = [...categories];
    queryCache.invalidateCache(CACHE_KEYS.CATEGORIES_SUMMARY);
  }

  public setCategoryDetails(details: CategoryYearDetail[]): void {
    this.categoryDetails = [...details];
    queryCache.invalidateCache(CACHE_KEYS.CATEGORY_DETAILS);
  }

  public setVendorDetails(details: VendorYearDetail[]): void {
    this.vendorDetails = [...details];
    queryCache.invalidateCache(CACHE_KEYS.VENDOR_DETAILS);
  }

  public setVendorRankings(rankings: VendorPriceRank[]): void {
    this.vendorRankings = [...rankings];
    queryCache.invalidateCache(CACHE_KEYS.VENDOR_RANKINGS);
  }

  public setLineItems(items: LineItemMapping[]): void {
    this.lineItems = [...items];
    queryCache.invalidateCache(CACHE_KEYS.LINE_ITEMS);
  }

  public setOpportunities(opps: SavingsOpportunity[]): void {
    this.opportunities = [...opps];
    queryCache.invalidateCache(CACHE_KEYS.SAVINGS_OPPORTUNITIES);
  }

  public resetValidationRecords(): ValidationPreCheckRecord[] {
    this.validationRecords = JSON.parse(JSON.stringify(initialValidationRecords));
    this.ingestionQueue = JSON.parse(JSON.stringify(initialIngestionQueue));
    queryCache.invalidateCache(CACHE_KEYS.VALIDATION_RECORDS);
    queryCache.invalidateCache(CACHE_KEYS.INGESTION_QUEUE);
    return [...this.validationRecords];
  }

  public resetIngestionQueue(): RawDocumentIngestion[] {
    this.ingestionQueue = JSON.parse(JSON.stringify(initialIngestionQueue));
    queryCache.invalidateCache(CACHE_KEYS.INGESTION_QUEUE);
    return [...this.ingestionQueue];
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
      if (r.vendor_name?.toLowerCase().includes(targetName.toLowerCase())) {
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
      if (li.vendor_identified?.toLowerCase().includes(targetName.toLowerCase())) {
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

  // Users & Authentication (PostgreSQL with resilient in-memory fallback)
  public async getUserByEmail(email: string): Promise<UserRecord | null> {
    const normalizedEmail = email.trim().toLowerCase();
    if (this.isPostgresConnected) {
      try {
        const u = await (prisma as any).user.findUnique({ where: { email: normalizedEmail } });
        if (u) return u as UserRecord;
      } catch (err: any) {
        logger.warn('Database query failed in getUserByEmail, falling back to local store', { email: normalizedEmail, error: err.message });
      }
    }
    const found = this.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    return found ? { ...found } : null;
  }

  public async getUserByEmailOrBuyerId(identifier: string): Promise<UserRecord | null> {
    const clean = identifier.trim();
    const normalizedEmail = clean.toLowerCase();
    if (this.isPostgresConnected) {
      try {
        const u = await (prisma as any).user.findFirst({
          where: {
            OR: [
              { email: normalizedEmail },
              { id: clean }
            ]
          }
        });
        if (u) return u as UserRecord;
      } catch (err: any) {
        logger.warn('Database query failed in getUserByEmailOrBuyerId, falling back to local store', { identifier: clean, error: err.message });
      }
    }
    const found = this.users.find((u) => u.email.toLowerCase() === normalizedEmail || u.id === clean);
    return found ? { ...found } : null;
  }

  public async getUserById(id: string): Promise<UserRecord | null> {
    if (this.isPostgresConnected) {
      try {
        const u = await (prisma as any).user.findUnique({ where: { id } });
        if (u) return u as UserRecord;
      } catch (err: any) {
        logger.warn('Database query failed in getUserById, falling back to local store', { id, error: err.message });
      }
    }
    const found = this.users.find((u) => u.id === id);
    return found ? { ...found } : null;
  }

  public async createUser(data: Omit<UserRecord, 'created_at' | 'updated_at'>): Promise<UserRecord> {
    const now = new Date();
    const newUser: UserRecord = {
      ...data,
      email: data.email.trim().toLowerCase(),
      created_at: now,
      updated_at: now
    };
    if (this.isPostgresConnected) {
      try {
        const created = await (prisma as any).user.create({
          data: {
            id: newUser.id,
            name: newUser.name,
            mobile_number: newUser.mobile_number,
            email: newUser.email,
            company_name: newUser.company_name,
            company_address: newUser.company_address,
            password_hash: newUser.password_hash,
            role: newUser.role,
            status: newUser.status,
            subscription_tier: newUser.subscription_tier || 'BRONZE'
          }
        });
        return created as UserRecord;
      } catch (err: any) {
        logger.warn('Database query failed in createUser, saving to local store', { email: data.email, error: err.message });
      }
    }
    this.users.push(newUser);
    return newUser;
  }

  public async updateUserPassword(id: string, passwordHash: string): Promise<boolean> {
    if (this.isPostgresConnected) {
      try {
        await (prisma as any).user.update({
          where: { id },
          data: { password_hash: passwordHash, updated_at: new Date() }
        });
        return true;
      } catch (err: any) {
        logger.warn('Database query failed in updateUserPassword, updating local store', { id, error: err.message });
      }
    }
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      this.users[idx].password_hash = passwordHash;
      this.users[idx].updated_at = new Date();
      return true;
    }
    return false;
  }

  public async getAllUsers(
    query?: { search?: string; role?: string; status?: string; tier?: string }
  ): Promise<UserRecord[]> {
    if (this.isPostgresConnected) {
      try {
        const whereClause: any = {};
        if (query?.role && query.role !== 'ALL') {
          whereClause.role = query.role.toUpperCase();
        }
        if (query?.status && query.status !== 'ALL') {
          whereClause.status = query.status.toUpperCase();
        }
        if (query?.tier && query.tier !== 'ALL') {
          whereClause.subscription_tier = query.tier.toUpperCase();
        }
        if (query?.search && query.search.trim() !== '') {
          const q = query.search.trim();
          whereClause.OR = [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { company_name: { contains: q, mode: 'insensitive' } },
            { mobile_number: { contains: q } }
          ];
        }

        const users = await (prisma as any).user.findMany({
          where: whereClause,
          orderBy: { created_at: 'desc' }
        });
        if (users && users.length > 0) {
          return users as UserRecord[];
        }
      } catch (err: any) {
        logger.warn('Database query failed in getAllUsers, falling back to local store', { query, error: err.message });
      }
    }

    let filtered = [...this.users];
    if (query?.role && query.role !== 'ALL') {
      filtered = filtered.filter((u) => u.role.toUpperCase() === query.role?.toUpperCase());
    }
    if (query?.status && query.status !== 'ALL') {
      filtered = filtered.filter((u) => u.status.toUpperCase() === query.status?.toUpperCase());
    }
    if (query?.tier && query.tier !== 'ALL') {
      filtered = filtered.filter((u) => u.subscription_tier?.toUpperCase() === query.tier?.toUpperCase());
    }
    if (query?.search && query.search.trim() !== '') {
      const q = query.search.trim().toLowerCase();
      filtered = filtered.filter((u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        Boolean(u.company_name?.toLowerCase().includes(q)) ||
        Boolean(u.mobile_number?.includes(q))
      );
    }
    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getUsers(): UserRecord[] {
    return [...this.users];
  }

  public async updateUserStatus(id: string, status: string): Promise<UserRecord | null> {
    const validStatus = status.toUpperCase();
    if (this.isPostgresConnected) {
      try {
        const updated = await (prisma as any).user.update({
          where: { id },
          data: { status: validStatus }
        });
        if (updated) return updated as UserRecord;
      } catch (err: any) {
        logger.warn('Database query failed in updateUserStatus, falling back to local store', { id, status: validStatus, error: err.message });
      }
    }

    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.users[idx] = {
      ...this.users[idx],
      status: validStatus as any,
      updated_at: new Date()
    };
    return { ...this.users[idx] };
  }

  public async updateUserTier(id: string, tier: string): Promise<UserRecord | null> {
    const validTier = tier.toUpperCase();
    if (this.isPostgresConnected) {
      try {
        const updated = await (prisma as any).user.update({
          where: { id },
          data: { subscription_tier: validTier }
        });
        const idx = this.users.findIndex((u) => u.id === id);
        if (idx !== -1) this.users[idx] = { ...updated } as UserRecord;
        return updated as UserRecord;
      } catch (err: any) {
        logger.warn('Failed to update user tier in PostgreSQL, falling back to local memory store', { id, tier: validTier, error: err.message });
      }
    }

    const found = this.users.find((u) => u.id === id);
    if (!found) return null;
    found.subscription_tier = validTier;
    found.updated_at = new Date();
    return { ...found };
  }

  // =========================================================================
  // PCBI BENCHMARK INTELLIGENCE STORE METHODS (Prompts 82 & 86)
  // =========================================================================

  public getPCBIBenchmarks(): PCBIBenchmarkMaster[] {
    return [...this.pcbiBenchmarks];
  }

  public addPCBIBenchmark(bm: PCBIBenchmarkMaster): PCBIBenchmarkMaster {
    const idx = this.pcbiBenchmarks.findIndex((b) => b.pcbi_id === bm.pcbi_id);
    if (idx >= 0) {
      this.pcbiBenchmarks[idx] = bm;
    } else {
      this.pcbiBenchmarks.push(bm);
    }
    this.refreshPCBI();
    return bm;
  }

  public getPCBIComponents(pcbiId?: string): PCBIBenchmarkComponent[] {
    if (pcbiId) {
      return this.pcbiComponents.filter((c) => c.pcbi_id === pcbiId);
    }
    return [...this.pcbiComponents];
  }

  public addPCBIComponent(comp: PCBIBenchmarkComponent): PCBIBenchmarkComponent {
    this.pcbiComponents.push(comp);
    this.refreshPCBI();
    return comp;
  }

  public getPCBIWeeklyIndices(pcbiId?: string): PCBIWeeklyIndex[] {
    if (pcbiId) {
      return this.pcbiIndices.filter((i) => i.pcbi_id === pcbiId);
    }
    return [...this.pcbiIndices];
  }

  public addPCBIWeeklyIndex(idx: PCBIWeeklyIndex): PCBIWeeklyIndex {
    this.pcbiIndices.push(idx);
    this.refreshPCBI();
    return idx;
  }

  public getPCBIUNSPSCMappings(): PCBIUNSPSCMapping[] {
    return [...this.pcbiUnspscMappings];
  }

  public addPCBIUNSPSCMapping(map: PCBIUNSPSCMapping): PCBIUNSPSCMapping {
    const idx = this.pcbiUnspscMappings.findIndex((m) => m.unspsc_code === map.unspsc_code);
    if (idx >= 0) {
      this.pcbiUnspscMappings[idx] = map;
    } else {
      this.pcbiUnspscMappings.push(map);
    }
    this.refreshPCBI();
    return map;
  }

  private refreshPCBI(): void {
    this.pcbiEngine.initMasterData(
      this.pcbiBenchmarks,
      this.pcbiComponents,
      this.pcbiIndices,
      this.pcbiUnspscMappings
    );
  }

  /**
   * Run PCBI calculations using client purchase transactions (from current validation/line-items baseline)
   */
  public runPCBICalculation(customTransactions?: PCBIClientPurchaseTransaction[]): {
    calculations: PCBITransactionCalculation[];
    basePurchases: PCBIBasePurchase[];
    dataQuality: PCBIDataQualityReport;
    executiveSummary: PCBIExecutiveSummary;
  } {
    let txList: PCBIClientPurchaseTransaction[] = [];

    if (customTransactions && customTransactions.length > 0) {
      txList = customTransactions;
    } else {
      // Build transactions from line items & validation records
      const validationList = this.getValidationRecords();
      if (validationList.length > 0) {
        txList = validationList.map((v, i) => ({
          id: v.record_id || `tx-${i + 1}`,
          sector: this.tenant.major_sector || 'Cement & Process',
          plant: 'Main Plant 1',
          po_number: v.po_number || `PO-2023-${1000 + i}`,
          po_date: v.transaction_date || (v.spend_year ? `${v.spend_year}-05-15` : '2023-06-01'),
          material_code: v.column_l_code || `MAT-${1000 + (i % 25)}`,
          short_text: v.raw_desc || 'Industrial Material Line Item',
          unspsc: undefined,
          vendor: v.vendor_name || 'Generic Vendor',
          quantity: v.order_quantity && v.order_quantity > 0 ? v.order_quantity : 100,
          uom: 'EA',
          currency: v.raw_currency || 'INR',
          unit_price: v.net_price && v.net_price > 0 ? v.net_price : (v.amount ? v.amount / 100 : 1500),
          total_value: v.amount_inr || (v.inr_crores ? v.inr_crores * 10000000 : 150000),
          source_row_number: i + 1,
          comparable_key: `${(v.column_l_code || `MAT-${1000 + (i % 25)}`).trim().toUpperCase()}|EA`
        }));
      } else {
        // Fallback default sample transactions matching Prompt 100 specifications
        txList = [
          // Prompt 100 Exact Test Case (Lubricant)
          {
            id: 'tx-prompt100-baseline',
            sector: 'Industrial Consumables',
            plant: 'Main Plant',
            po_number: 'PO-BASE-001',
            po_date: '2023-07-12',
            material_code: 'MAT-LUBRICANT-01',
            short_text: 'Industrial Lubricant Oil',
            vendor: 'ABC Vendor',
            quantity: 5000,
            uom: 'L',
            currency: 'INR',
            unit_price: 150.0,
            total_value: 750000.0,
            pcbi_id: 'PCBI-TEST-001',
            comparable_key: 'MAT-LUBRICANT-01|L'
          },
          {
            id: 'tx-prompt100-subsequent',
            sector: 'Industrial Consumables',
            plant: 'Main Plant',
            po_number: 'PO-CURR-002',
            po_date: '2023-09-28',
            material_code: 'MAT-LUBRICANT-01',
            short_text: 'Industrial Lubricant Oil',
            vendor: 'ABC Vendor',
            quantity: 10000,
            uom: 'L',
            currency: 'INR',
            unit_price: 180.0,
            total_value: 1800000.0,
            pcbi_id: 'PCBI-TEST-001',
            comparable_key: 'MAT-LUBRICANT-01|L'
          },
          // Bearing 6205 Composite
          {
            id: 'tx-brg-base',
            sector: 'Bearings & Assemblies',
            plant: 'Main Plant',
            po_number: 'PO-BRG-01',
            po_date: '2023-07-12',
            material_code: 'MAT-BRG-6205',
            short_text: 'Deep Groove Ball Bearing 6205',
            vendor: 'SKF India',
            quantity: 500,
            uom: 'EA',
            currency: 'INR',
            unit_price: 1000.0,
            total_value: 500000.0,
            pcbi_id: 'PCBI-BEARING-001',
            comparable_key: 'MAT-BRG-6205|EA'
          },
          {
            id: 'tx-brg-subsequent',
            sector: 'Bearings & Assemblies',
            plant: 'Main Plant',
            po_number: 'PO-BRG-02',
            po_date: '2023-09-28',
            material_code: 'MAT-BRG-6205',
            short_text: 'Deep Groove Ball Bearing 6205',
            vendor: 'SKF India',
            quantity: 5000,
            uom: 'EA',
            currency: 'INR',
            unit_price: 1200.0,
            total_value: 6000000.0,
            pcbi_id: 'PCBI-BEARING-001',
            comparable_key: 'MAT-BRG-6205|EA'
          }
        ];
      }
    }

    const result = this.pcbiEngine.calculate(txList);
    this.pcbiLastCalculations = result.calculations;
    this.pcbiLastBasePurchases = result.basePurchases;
    this.pcbiLastExecutiveSummary = result.executiveSummary;
    this.pcbiLastDataQuality = result.dataQuality;

    return result;
  }

  public getPCBILastCalculationResults() {
    if (!this.pcbiLastExecutiveSummary) {
      return this.runPCBICalculation();
    }
    return {
      calculations: this.pcbiLastCalculations,
      basePurchases: this.pcbiLastBasePurchases,
      dataQuality: this.pcbiLastDataQuality,
      executiveSummary: this.pcbiLastExecutiveSummary
    };
  }

  public getPCBIExplainabilityAudit(calcId: string): PCBIExplainabilityAudit | null {
    if (this.pcbiLastCalculations.length === 0) {
      this.runPCBICalculation();
    }
    return this.pcbiEngine.generateExplainabilityAudit(calcId, this.pcbiLastCalculations);
  }

  // =========================================================================
  // UPGRADE REQUEST & ADMIN OTP MANAGEMENT (Prompt 81)
  // =========================================================================

  public createUpgradeRequest(reqData: Omit<UpgradeRequestRecord, 'id' | 'status' | 'created_at'>): UpgradeRequestRecord {
    const record: UpgradeRequestRecord = {
      id: `upg-req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: 'PENDING_ADMIN_ACTION',
      created_at: new Date().toISOString(),
      ...reqData
    };
    this.upgradeRequests.unshift(record);
    return record;
  }

  public getUpgradeRequests(): UpgradeRequestRecord[] {
    return [...this.upgradeRequests];
  }

  public getUpgradeRequestById(id: string): UpgradeRequestRecord | null {
    return this.upgradeRequests.find((r) => r.id === id) || null;
  }

  public setAdminOtpSession(session: AdminOTPValidationSession): void {
    this.adminOtpSessions.set(session.request_id, session);
  }

  public getAdminOtpSession(requestId: string): AdminOTPValidationSession | null {
    return this.adminOtpSessions.get(requestId) || null;
  }

  public updateUpgradeRequest(id: string, updates: Partial<UpgradeRequestRecord>): UpgradeRequestRecord | null {
    const idx = this.upgradeRequests.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.upgradeRequests[idx] = {
      ...this.upgradeRequests[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    return { ...this.upgradeRequests[idx] };
  }

  public findUpgradeRequestByCode(code: string): UpgradeRequestRecord | null {
    const cleanCode = code.trim().toUpperCase();
    return this.upgradeRequests.find((r) => r.generated_unique_code === cleanCode) || null;
  }

  // =========================================================================
  // CONSOLIDATED SAVINGS & DE-DUPLICATION ENGINE (Module 4 - Prompt 100)
  // =========================================================================

  public getConsolidatedSavings(): {
    opportunities: SavingsOpportunityItem[];
    overlaps: OpportunityOverlapGroup[];
    waterfallMetrics: SavingsWaterfallMetrics;
    actionPlans: ActionPlanItem[];
    strategicSummary: StrategicSourcingResult['summary'];
  } {
    // 1. Run or get PCBI calculations
    const pcbiRes = this.getPCBILastCalculationResults();
    const pcbiCalcs = pcbiRes.calculations;
    const totalSpend = pcbiRes.executiveSummary.total_spend_inr || 100000000;
    const benchmarkableSpend = pcbiRes.executiveSummary.benchmarkable_spend_inr || 70000000;

    // 2. Build Strategic Sourcing transactions from current baseline
    const validationList = this.getValidationRecords();
    let strategicTxs: StrategicInputTransaction[] = [];
    if (validationList.length > 0) {
      strategicTxs = validationList.map((v, i) => ({
        id: v.record_id || `tx-${i + 1}`,
        po_number: v.po_number || `PO-${1000 + i}`,
        po_date: v.transaction_date || (v.spend_year ? `${v.spend_year}-05-15` : '2023-06-01'),
        vendor_name: v.vendor_name || 'Generic Vendor',
        material_code: v.column_l_code || `MAT-${1000 + (i % 25)}`,
        material_desc: v.raw_desc || 'Industrial Material Line Item',
        quantity: v.order_quantity && v.order_quantity > 0 ? v.order_quantity : 100,
        uom: 'EA',
        unit_price: v.net_price && v.net_price > 0 ? v.net_price : (v.amount ? v.amount / 100 : 1500),
        total_spend_inr: v.amount_inr || (v.inr_crores ? v.inr_crores * 10000000 : 150000),
        currency: v.raw_currency || 'INR',
        plant: 'Main Plant 1',
        spend_category: 'DIRECT MATERIALS'
      }));
    } else {
      strategicTxs = [
        // 1. Vendor Consolidation on Steel Plates (Tata Steel & JSW)
        {
          material_code: 'MAT-STL-PLT',
          material_desc: 'Structural Steel Plate 12mm',
          vendor_name: 'Tata Steel Ltd',
          plant: 'Jamshedpur',
          spend_category: 'DIRECT MATERIALS',
          quantity: 100,
          unit_price: 60000,
          total_spend_inr: 6000000
        },
        {
          material_code: 'MAT-STL-PLT',
          material_desc: 'Structural Steel Plate 12mm',
          vendor_name: 'JSW Steel Ltd',
          plant: 'Jamshedpur',
          spend_category: 'DIRECT MATERIALS',
          quantity: 40,
          unit_price: 62500,
          total_spend_inr: 2500000
        },
        // 2. PO Consolidation (5 small POs from SafetyFirst)
        ...[1, 2, 3, 4, 5].map((idx) => ({
          po_number: `PO-00${idx}`,
          material_code: 'MRO-HLMT-01',
          material_desc: 'Industrial Safety Helmet',
          vendor_name: 'SafetyFirst Corp',
          plant: 'Plant 1',
          spend_category: 'MRO',
          quantity: 100,
          unit_price: 1000,
          total_spend_inr: 100000
        })),
        // 3. E-Auction candidate (Corrugated Boxes)
        {
          material_code: 'PKG-CORR-BOX',
          material_desc: 'Corrugated Shipping Boxes 5-Ply',
          vendor_name: 'Packwell Industries',
          plant: 'Main Plant',
          spend_category: 'PACKING MATERIALS',
          quantity: 20000,
          unit_price: 150,
          total_spend_inr: 3000000
        },
        {
          material_code: 'PKG-CORR-BOX',
          material_desc: 'Corrugated Shipping Boxes 5-Ply',
          vendor_name: 'Boxmakers Corp',
          plant: 'Main Plant',
          spend_category: 'PACKING MATERIALS',
          quantity: 20000,
          unit_price: 150,
          total_spend_inr: 3000000
        }
      ];
    }

    // 3. Run Strategic Sourcing Engine
    const strategicResult = this.strategicEngine.analyzeAll(strategicTxs);

    // 4. Generate PCBI Opportunities
    const pcbiOpportunities: SavingsOpportunityItem[] = pcbiCalcs
      .filter((c) => c.opportunity_value > 0)
      .map((c, idx) => ({
        opportunity_id: `OPP-PCBI-${String(idx + 1).padStart(3, '0')}`,
        source_module: 'MODULE_3_PCBI',
        source_engine: 'PCBI_PRICE',
        category: c.sector || 'Direct Materials',
        item: c.material_code || 'Industrial Supply',
        vendor: c.vendor || 'Vendor',
        plant: c.plant || 'Main Plant 1',
        spend_inr: Math.round(c.actual_price * c.quantity),
        spend_inr_cr: Math.round(((c.actual_price * c.quantity) / 10000000) * 1000) / 1000,
        potential_savings_inr: Math.round(c.opportunity_value),
        potential_savings_inr_cr: Math.round((c.opportunity_value / 10000000) * 1000) / 1000,
        is_overlapping: false,
        net_savings_inr: Math.round(c.opportunity_value),
        net_savings_inr_cr: Math.round((c.opportunity_value / 10000000) * 1000) / 1000,
        status: 'IDENTIFIED',
        owner: 'Procurement',
        timeline: '30 Days',
        validation_notes: `PCBI Price Gap: ₹${c.price_gap_per_unit}/unit against benchmark ${c.base_pcbi_id}`,
        created_at: new Date().toISOString()
      }));

    // 5. Combine and deduplicate
    const combinedOpps = [...pcbiOpportunities, ...strategicResult.opportunities];
    const deduplicated = this.savingsEngine.deduplicateOpportunities(
      combinedOpps,
      totalSpend,
      benchmarkableSpend
    );

    this.cachedConsolidatedOpportunities = deduplicated.opportunities;
    this.cachedOverlaps = deduplicated.overlaps;
    this.cachedWaterfallMetrics = deduplicated.waterfallMetrics;

    // 6. Action plans for non-overlapping or high-value opportunities
    if (this.cachedActionPlans.length === 0) {
      this.cachedActionPlans = deduplicated.opportunities
        .filter((o) => !o.is_overlapping && o.net_savings_inr > 0)
        .slice(0, 10)
        .map((opp, idx) =>
          this.savingsEngine.convertToActionPlan(opp, {
            action: opp.source_engine === 'PCBI_PRICE'
              ? `Renegotiate contract price with ${opp.vendor} based on PCBI gap`
              : `Execute ${opp.source_engine.replace('_', ' ')} initiative for ${opp.item}`,
            priority: idx < 3 ? 'HIGH' : idx < 7 ? 'MEDIUM' : 'LOW'
          })
        );
    }

    return {
      opportunities: this.cachedConsolidatedOpportunities,
      overlaps: this.cachedOverlaps,
      waterfallMetrics: this.cachedWaterfallMetrics,
      actionPlans: this.cachedActionPlans,
      strategicSummary: strategicResult.summary
    };
  }

  public updateActionPlan(
    actionId: string,
    updates: {
      status?: 'Open' | 'In Progress' | 'Completed' | 'Deferred';
      owner?: ActionOwner;
      priority?: 'HIGH' | 'MEDIUM' | 'LOW';
      comments?: string;
    }
  ): ActionPlanItem | null {
    if (this.cachedActionPlans.length === 0) {
      this.getConsolidatedSavings();
    }
    const plan = this.cachedActionPlans.find((p) => p.id === actionId);
    if (!plan) return null;
    if (updates.status) plan.status = updates.status;
    if (updates.owner) plan.owner = updates.owner;
    if (updates.priority) plan.priority = updates.priority;
    if (updates.comments !== undefined) plan.comments = updates.comments;
    plan.updated_at = new Date().toISOString();
    return { ...plan };
  }

  public updateSavingsOpportunityStatus(
    oppId: string,
    status: SavingsOpportunityStatus
  ): SavingsOpportunityItem | null {
    if (this.cachedConsolidatedOpportunities.length === 0) {
      this.getConsolidatedSavings();
    }
    const opp = this.cachedConsolidatedOpportunities.find((o) => o.opportunity_id === oppId);
    if (!opp) return null;
    opp.status = status;
    return { ...opp };
  }

  // =========================================================================
  // MODULE 2 STRATEGIC SOURCING INTELLIGENCE (V1.0)
  // =========================================================================

  public getModule2StrategicTransactions(): StrategicInputTransaction[] {
    const validationList = this.getValidationRecords();
    if (validationList.length >= 10) {
      return validationList.map((v, i) => ({
        id: v.record_id || `TX-M2-${i + 1}`,
        po_number: v.po_number || `PO-${1000 + i}`,
        po_date: v.transaction_date || (v.spend_year ? `${v.spend_year}-05-15` : '2023-06-01'),
        vendor_name: v.vendor_name || 'Generic Vendor',
        material_code: v.column_l_code || `MAT-${1000 + (i % 25)}`,
        material_desc: v.raw_desc || 'Industrial Material Line Item',
        quantity: v.order_quantity && v.order_quantity > 0 ? v.order_quantity : 100,
        uom: 'EA',
        unit_price: v.net_price && v.net_price > 0 ? v.net_price : (v.amount ? v.amount / 100 : 1500),
        total_spend_inr: v.amount_inr || (v.inr_crores ? v.inr_crores * 10000000 : 150000),
        currency: v.raw_currency || 'INR',
        plant: 'Main Plant 1',
        spend_category: v.core_category || 'DIRECT MATERIALS',
        unspsc_code: '44101500',
        unspsc_commodity: v.core_category || 'Direct Materials'
      }));
    }

    // Default validated enterprise purchase transaction baseline
    return [
      // 1. Structural Steel Plates (High dispersion, e-auction & consolidation)
      {
        id: 'TX-STL-01',
        po_number: 'PO-STL-2023-01',
        po_date: '2023-01-15',
        material_code: 'MAT-STL-PLT-12',
        material_desc: 'Structural Steel Plate 12mm IS 2062 E250',
        vendor_name: 'Tata Steel Ltd',
        quantity: 50,
        uom: 'MT',
        unit_price: 60000,
        total_spend_inr: 3000000,
        currency: 'INR',
        plant: 'Jamshedpur',
        spend_category: 'Structural Steel Plates'
      },
      {
        id: 'TX-STL-02',
        po_number: 'PO-STL-2023-04',
        po_date: '2023-04-10',
        material_code: 'MAT-STL-PLT-12',
        material_desc: 'Structural Steel Plate 12mm IS 2062 E250',
        vendor_name: 'Tata Steel Ltd',
        quantity: 60,
        uom: 'MT',
        unit_price: 60500,
        total_spend_inr: 3630000,
        currency: 'INR',
        plant: 'Jamshedpur',
        spend_category: 'Structural Steel Plates'
      },
      {
        id: 'TX-STL-03',
        po_number: 'PO-STL-2023-06',
        po_date: '2023-06-20',
        material_code: 'MAT-STL-PLT-12',
        material_desc: 'Structural Steel Plate 12mm IS 2062 E250',
        vendor_name: 'JSW Steel Ltd',
        quantity: 40,
        uom: 'MT',
        unit_price: 63500,
        total_spend_inr: 2540000,
        currency: 'INR',
        plant: 'Bellary',
        spend_category: 'Structural Steel Plates'
      },
      {
        id: 'TX-STL-04',
        po_number: 'PO-STL-2023-09',
        po_date: '2023-09-05',
        material_code: 'MAT-STL-PLT-12',
        material_desc: 'Structural Steel Plate 12mm IS 2062 E250',
        vendor_name: 'Jindal Steel & Power',
        quantity: 30,
        uom: 'MT',
        unit_price: 65000,
        total_spend_inr: 1950000,
        currency: 'INR',
        plant: 'Angul',
        spend_category: 'Structural Steel Plates'
      },

      // 2. Hex Head Fasteners (High fragmentation, multiple vendors)
      {
        id: 'TX-FST-01',
        po_number: 'PO-FST-2023-02',
        po_date: '2023-02-10',
        material_code: 'MAT-FST-M16',
        material_desc: 'Hex Head High Tensile Bolt M16x65 Gr 8.8',
        vendor_name: 'Unbrako Fasteners',
        quantity: 20000,
        uom: 'PCS',
        unit_price: 45,
        total_spend_inr: 900000,
        currency: 'INR',
        plant: 'Plant 1',
        spend_category: 'Hex Head Fasteners & Bolts'
      },
      {
        id: 'TX-FST-02',
        po_number: 'PO-FST-2023-05',
        po_date: '2023-05-12',
        material_code: 'MAT-FST-M16',
        material_desc: 'Hex Head High Tensile Bolt M16x65 Gr 8.8',
        vendor_name: 'TVS Fasteners',
        quantity: 15000,
        uom: 'PCS',
        unit_price: 48,
        total_spend_inr: 720000,
        currency: 'INR',
        plant: 'Plant 1',
        spend_category: 'Hex Head Fasteners & Bolts'
      },
      {
        id: 'TX-FST-03',
        po_number: 'PO-FST-2023-07',
        po_date: '2023-07-22',
        material_code: 'MAT-FST-M16',
        material_desc: 'Hex Head High Tensile Bolt M16x65 Gr 8.8',
        vendor_name: 'Sundaram Fasteners Ltd',
        quantity: 10000,
        uom: 'PCS',
        unit_price: 52,
        total_spend_inr: 520000,
        currency: 'INR',
        plant: 'Plant 2',
        spend_category: 'Hex Head Fasteners & Bolts'
      },
      {
        id: 'TX-FST-04',
        po_number: 'PO-FST-2023-10',
        po_date: '2023-10-18',
        material_code: 'MAT-FST-M16',
        material_desc: 'Hex Head High Tensile Bolt M16x65 Gr 8.8',
        vendor_name: 'Precision Industrial Bolts',
        quantity: 5000,
        uom: 'PCS',
        unit_price: 58,
        total_spend_inr: 290000,
        currency: 'INR',
        plant: 'Plant 2',
        spend_category: 'Hex Head Fasteners & Bolts'
      },

      // 3. Corrugated Packaging (E-Auction Candidate)
      {
        id: 'TX-PKG-01',
        po_number: 'PO-PKG-2023-03',
        po_date: '2023-03-01',
        material_code: 'MAT-PKG-BOX-5P',
        material_desc: 'Corrugated Shipping Box 5-Ply 400x300x250mm',
        vendor_name: 'Packwell Industries',
        quantity: 25000,
        uom: 'BOX',
        unit_price: 140,
        total_spend_inr: 3500000,
        currency: 'INR',
        plant: 'Main Warehouse',
        spend_category: 'Corrugated Packaging Boxes'
      },
      {
        id: 'TX-PKG-02',
        po_number: 'PO-PKG-2023-06',
        po_date: '2023-06-15',
        material_code: 'MAT-PKG-BOX-5P',
        material_desc: 'Corrugated Shipping Box 5-Ply 400x300x250mm',
        vendor_name: 'Boxmakers Corp',
        quantity: 20000,
        uom: 'BOX',
        unit_price: 145,
        total_spend_inr: 2900000,
        currency: 'INR',
        plant: 'Main Warehouse',
        spend_category: 'Corrugated Packaging Boxes'
      },
      {
        id: 'TX-PKG-03',
        po_number: 'PO-PKG-2023-09',
        po_date: '2023-09-20',
        material_code: 'MAT-PKG-BOX-5P',
        material_desc: 'Corrugated Shipping Box 5-Ply 400x300x250mm',
        vendor_name: 'Amber Packaging Ltd',
        quantity: 15000,
        uom: 'BOX',
        unit_price: 152,
        total_spend_inr: 2280000,
        currency: 'INR',
        plant: 'Main Warehouse',
        spend_category: 'Corrugated Packaging Boxes'
      },

      // 4. Industrial Valves (Demonstrates unit mismatch and exclusions)
      {
        id: 'TX-VLV-01',
        po_number: 'PO-VLV-2023-04',
        po_date: '2023-04-12',
        material_code: 'MAT-VLV-BALL-50',
        material_desc: 'Forged Steel Ball Valve DN50 Class 300',
        vendor_name: 'Audco Valves Ltd',
        quantity: 20,
        uom: 'EA',
        unit_price: 12000,
        total_spend_inr: 240000,
        currency: 'INR',
        plant: 'Process Unit',
        spend_category: 'Industrial Process Valves'
      },
      {
        id: 'TX-VLV-02',
        po_number: 'PO-VLV-2023-08',
        po_date: '2023-08-14',
        material_code: 'MAT-VLV-BALL-50',
        material_desc: 'Forged Steel Ball Valve DN50 Class 300',
        vendor_name: 'L&T Valves Ltd',
        quantity: 15,
        uom: 'EA',
        unit_price: 12500,
        total_spend_inr: 187500,
        currency: 'INR',
        plant: 'Process Unit',
        spend_category: 'Industrial Process Valves'
      },
      {
        id: 'TX-VLV-03',
        po_number: 'PO-VLV-2023-11',
        po_date: '2023-11-02',
        material_code: 'MAT-VLV-BALL-50',
        material_desc: 'Forged Steel Ball Valve DN50 Class 300 Set of 2',
        vendor_name: 'Microfinish Valves',
        quantity: 5,
        uom: 'SET', // UNIT_MISMATCH exclusion trigger
        unit_price: 25000,
        total_spend_inr: 125000,
        currency: 'INR',
        plant: 'Process Unit',
        spend_category: 'Industrial Process Valves'
      },

      // 5. Specialty Lubricants (Single Supplier)
      {
        id: 'TX-LUB-01',
        po_number: 'PO-LUB-2023-02',
        po_date: '2023-02-18',
        material_code: 'MAT-LUB-SYN-46',
        material_desc: 'Synthetic Industrial Gear Oil ISO VG 46',
        vendor_name: 'Shell India Markets',
        quantity: 50,
        uom: 'DRUM',
        unit_price: 32000,
        total_spend_inr: 1600000,
        currency: 'INR',
        plant: 'Maintenance Shop',
        spend_category: 'Specialty Lubricants & Greases'
      },
      {
        id: 'TX-LUB-02',
        po_number: 'PO-LUB-2023-07',
        po_date: '2023-07-15',
        material_code: 'MAT-LUB-SYN-46',
        material_desc: 'Synthetic Industrial Gear Oil ISO VG 46',
        vendor_name: 'Shell India Markets',
        quantity: 40,
        uom: 'DRUM',
        unit_price: 32000,
        total_spend_inr: 1280000,
        currency: 'INR',
        plant: 'Maintenance Shop',
        spend_category: 'Specialty Lubricants & Greases'
      },

      // 6. One-off Turbine Overhaul (Non-recurring Capex)
      {
        id: 'TX-CPX-01',
        po_number: 'PO-CPX-2023-05',
        po_date: '2023-05-30',
        material_code: 'SRV-TRB-OVRHL',
        material_desc: 'Turbine Rotor Major Overhaul & Reblading Service',
        vendor_name: 'Siemens Energy India',
        quantity: 1,
        uom: 'JOB',
        unit_price: 7500000,
        total_spend_inr: 7500000,
        currency: 'INR',
        plant: 'Power Plant',
        spend_category: 'Turbine Capital Overhaul'
      }
    ];
  }

  public getModule2StrategicSourcingAnalysis(forceRefresh = false): {
    profiles: CategoryStrategicSourcingProfile[];
    summary: Module2StrategicSourcingDashboardSummary;
    handoffPackages: Module2ToModule4HandoffPackage[];
  } {
    if (!forceRefresh && this.cachedModule2Profiles.length > 0 && this.cachedModule2Summary) {
      return {
        profiles: this.cachedModule2Profiles,
        summary: this.cachedModule2Summary,
        handoffPackages: this.cachedModule2Handoff
      };
    }

    const txs = this.getModule2StrategicTransactions();
    const result = Module2StrategicSourcingEngine.analyze(txs);
    this.cachedModule2Profiles = result.profiles;
    this.cachedModule2Summary = result.summary;
    this.cachedModule2Handoff = result.handoffPackages;

    return result;
  }

  public getModule2StrategicProfile(categoryIdOrName: string): CategoryStrategicSourcingProfile | null {
    const analysis = this.getModule2StrategicSourcingAnalysis();
    const normalized = categoryIdOrName.trim().toLowerCase();
    return analysis.profiles.find(
      (p) =>
        p.categoryId.toLowerCase() === normalized ||
        p.categoryName.toLowerCase() === normalized
    ) || null;
  }

  public getModule2HandoffPackages(): Module2ToModule4HandoffPackage[] {
    const analysis = this.getModule2StrategicSourcingAnalysis();
    return analysis.handoffPackages;
  }
}

// Server-wide Singleton
export const db = new DatabaseStore();

