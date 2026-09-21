import { PrismaD1 } from '@prisma/adapter-d1';
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

import logger from '../utils/logger';
import { queryCache } from '../utils/queryCache';
import { queryAuditor } from '../utils/queryAuditor';
import { CACHE_KEYS } from '../constants/db';
export let prisma: PrismaClient =
  typeof (globalThis as any).WebSocketPair === 'undefined'
    ? new PrismaClient({ log: ['warn', 'error'] })
    : (null as any);

export class DatabaseStore {
  private isPostgresConnected: boolean = false;
  private d1: any = null;
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
  private users: UserRecord[] = JSON.parse(JSON.stringify(initialSeedUsers));

  constructor() {
    try {
      if (typeof (globalThis as any).WebSocketPair === 'undefined') {
        prisma = new PrismaClient({ log: ['warn', 'error'] });
        if (process.env.DATABASE_URL) {
          this.initPostgres();
        }
      }
    } catch {
      // In edge runtime before initD1
    }
  }

  public async initD1(d1Database: any) {
    if (!d1Database) return;
    this.d1 = d1Database;
    if (this.isPostgresConnected && prisma) return;
    try {
      const adapter = new PrismaD1(d1Database);
      prisma = new PrismaClient({ adapter, log: ['warn', 'error'] } as any);
      await prisma.$connect();
      this.isPostgresConnected = true;
      logger.info('⚡ Cloudflare D1 connected successfully via Prisma D1 Adapter', { source: 'DatabaseStore' });
      await this.hydrateFromDb();
    } catch (err: any) {
      this.isPostgresConnected = false;
      logger.error('⚠️  Cloudflare D1 initialization error', {
        source: 'DatabaseStore',
        reason: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      });
    }
  }

  private async hydrateFromDb() {
    try {
      const dbTenant = await prisma.tenantMaster.findFirst();
      if (dbTenant) {
        this.tenant = {
          tenant_id: dbTenant.tenant_id,
          enterprise_name: dbTenant.enterprise_name,
          region: dbTenant.region as any,
          base_currency: dbTenant.base_currency as any,
          status: dbTenant.status as any,
          total_spend_evaluated: 0,
          total_spend_evaluated_inr: 0,
          major_sector: dbTenant.major_sector || undefined,
          minor_sector: dbTenant.minor_sector || undefined
        };
      }
    } catch {
      // Ignore hydration errors
    }
  }

  private async initPostgres() {
    try {
      if (!prisma) return;
      await prisma.$connect();
      this.isPostgresConnected = true;
      logger.info('🗄️ Database connected successfully via Prisma', { source: 'DatabaseStore' });
      await this.hydrateFromDb();
    } catch (err: any) {
      this.isPostgresConnected = false;
      logger.warn('⚠️  Database connection unavailable - running with active high-performance datastore', {
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
          detected_currencies: JSON.stringify(fullItem.detected_currencies),
          converted_inr_crores: fullItem.converted_inr_crores
        }
      }).catch((e: any) => {
        logger.warn('Database sync skipped - running with active in-memory store', { source: 'DatabaseStore', reason: e?.message?.split('\n')[0] });
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

  // Users & Authentication (Cloudflare D1 & PostgreSQL with resilient in-memory fallback)
  public async getUserByEmail(email: string): Promise<UserRecord | null> {
    const normalizedEmail = email.trim().toLowerCase();
    if (this.d1) {
      try {
        const u = await this.d1.prepare('SELECT * FROM User WHERE LOWER(email) = ?').bind(normalizedEmail).first();
        if (u) return u as UserRecord;
      } catch (err: any) {
        logger.warn('D1 query failed in getUserByEmail', { email: normalizedEmail, error: err.message });
      }
    }
    if (this.isPostgresConnected && prisma) {
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
    if (this.d1) {
      try {
        const u = await this.d1.prepare('SELECT * FROM User WHERE LOWER(email) = ? OR id = ?').bind(normalizedEmail, clean).first();
        if (u) return u as UserRecord;
      } catch (err: any) {
        logger.warn('D1 query failed in getUserByEmailOrBuyerId', { identifier: clean, error: err.message });
      }
    }
    if (this.isPostgresConnected && prisma) {
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
    if (this.d1) {
      try {
        const u = await this.d1.prepare('SELECT * FROM User WHERE id = ?').bind(id).first();
        if (u) return u as UserRecord;
      } catch (err: any) {
        logger.warn('D1 query failed in getUserById', { id, error: err.message });
      }
    }
    if (this.isPostgresConnected && prisma) {
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
    if (this.d1) {
      try {
        await this.d1.prepare(`
          INSERT INTO User (id, name, mobile_number, email, company_name, company_address, password_hash, role, status, subscription_tier, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          newUser.id,
          newUser.name,
          newUser.mobile_number,
          newUser.email,
          newUser.company_name,
          newUser.company_address,
          newUser.password_hash,
          newUser.role,
          newUser.status,
          newUser.subscription_tier || 'BRONZE',
          newUser.created_at.toISOString(),
          newUser.updated_at.toISOString()
        ).run();
        this.users.push(newUser);
        return newUser;
      } catch (err: any) {
        logger.error('D1 insert failed in createUser', { email: data.email, error: err.message });
      }
    }
    if (this.isPostgresConnected && prisma) {
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
    if (this.d1) {
      try {
        await this.d1.prepare('UPDATE User SET password_hash = ?, updated_at = ? WHERE id = ?')
          .bind(passwordHash, new Date().toISOString(), id).run();
        return true;
      } catch (err: any) {
        logger.warn('D1 query failed in updateUserPassword', { id, error: err.message });
      }
    }
    if (this.isPostgresConnected && prisma) {
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
    if (this.d1) {
      try {
        const res = await this.d1.prepare('SELECT * FROM User ORDER BY created_at DESC').all();
        if (res?.results && res.results.length > 0) {
          let users = res.results as UserRecord[];
          if (query?.role && query.role !== 'ALL') {
            users = users.filter((u) => u.role.toUpperCase() === query.role?.toUpperCase());
          }
          if (query?.status && query.status !== 'ALL') {
            users = users.filter((u) => u.status.toUpperCase() === query.status?.toUpperCase());
          }
          if (query?.tier && query.tier !== 'ALL') {
            users = users.filter((u) => u.subscription_tier?.toUpperCase() === query.tier?.toUpperCase());
          }
          return users;
        }
      } catch (err: any) {
        logger.warn('D1 query failed in getAllUsers', { error: err.message });
      }
    }
    if (this.isPostgresConnected && prisma) {
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
            { name: { contains: q } },
            { email: { contains: q } },
            { company_name: { contains: q } },
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
}

// Server-wide Singleton
export const db = new DatabaseStore();
