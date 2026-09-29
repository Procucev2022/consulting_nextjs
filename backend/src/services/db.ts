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

export class DatabaseStore {
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
    logger.info('⚡ High-performance Cloudflare Edge Datastore initialized', { source: 'DatabaseStore' });
  }

  public isConnected(): boolean {
    return true;
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
    return this.getIngestionQueue(fullItem.tenant_id);
  }

  public deleteIngestionItem(docId?: string, tenantId?: string): RawDocumentIngestion[] {
    if (docId) {
      this.ingestionQueue = this.ingestionQueue.filter((item) => item.doc_id !== docId);
    } else if (tenantId) {
      this.ingestionQueue = this.ingestionQueue.filter((item) => item.tenant_id !== tenantId);
    } else {
      this.ingestionQueue = [];
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

  // Users & Authentication (High-performance Edge Store)
  public getUsers(): UserRecord[] {
    return [...this.users];
  }

  public async getUserByEmail(email: string): Promise<UserRecord | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const found = this.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    return found ? { ...found } : null;
  }

  public async getUserByEmailOrBuyerId(identifier: string): Promise<UserRecord | null> {
    const clean = identifier.trim();
    const normalizedEmail = clean.toLowerCase();
    const found = this.users.find((u) => u.email.toLowerCase() === normalizedEmail || u.id === clean);
    return found ? { ...found } : null;
  }

  public async getUserById(id: string): Promise<UserRecord | null> {
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
    this.users.push(newUser);
    return newUser;
  }

  public async updateUserPassword(id: string, passwordHash: string): Promise<boolean> {
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

  public async updateUserStatus(id: string, status: string): Promise<UserRecord | null> {
    const validStatus = status.toUpperCase();
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
}

// Server-wide Singleton
export const db = new DatabaseStore();

