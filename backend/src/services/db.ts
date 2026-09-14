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
  initialUsers
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
  private users: UserRecord[] = JSON.parse(JSON.stringify(initialUsers));

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
      converted_inr_crores: item.converted_inr_crores ?? 732.41,
      unique_items_count: item.unique_items_count,
      unique_vendors_count: item.unique_vendors_count,
      material_groups_count: item.material_groups_count,
      plants_count: item.plants_count
    };
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
      return cached.map((item, idx) => this.sanitizeIngestionItem(item, idx));
    }
    const result = this.ingestionQueue.map((item, idx) => this.sanitizeIngestionItem(item, idx));
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
    // Ingestion queue maintains the single active uploaded document
    this.ingestionQueue = [fullItem];
    queryCache.invalidateCache(CACHE_KEYS.INGESTION_QUEUE);
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
      }).catch((e: any) => logger.error('Error syncing ingestion to PostgreSQL', { source: 'DatabaseStore' }, e));
    }
    return this.getIngestionQueue();
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

  // Users & Authentication
  public async getUserByEmail(email: string): Promise<UserRecord | null> {
    const normalizedEmail = email.trim().toLowerCase();
    if (this.isPostgresConnected) {
      try {
        const u = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (u) return u as UserRecord;
      } catch (err: any) {
        logger.warn('Failed to fetch user by email from PostgreSQL, falling back to local memory', { email: normalizedEmail, error: err.message });
      }
    }
    const found = this.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    return found ? { ...found } : null;
  }

  public async getUserById(id: string): Promise<UserRecord | null> {
    if (this.isPostgresConnected) {
      try {
        const u = await prisma.user.findUnique({ where: { id } });
        if (u) return u as UserRecord;
      } catch (err: any) {
        logger.warn('Failed to fetch user by id from PostgreSQL, falling back to local memory', { id, error: err.message });
      }
    }
    const found = this.users.find((u) => u.id === id);
    return found ? { ...found } : null;
  }

  public async createUser(data: Omit<UserRecord, 'created_at' | 'updated_at'>): Promise<UserRecord> {
    const now = new Date();
    const newRecord: UserRecord = {
      ...data,
      email: data.email.trim().toLowerCase(),
      created_at: now,
      updated_at: now
    };

    if (this.isPostgresConnected) {
      try {
        const created = await prisma.user.create({
          data: {
            id: newRecord.id,
            name: newRecord.name,
            mobile_number: newRecord.mobile_number,
            email: newRecord.email,
            company_name: newRecord.company_name,
            company_address: newRecord.company_address,
            password_hash: newRecord.password_hash,
            role: newRecord.role,
            status: newRecord.status
          }
        });
        this.users.push({ ...created });
        return created as UserRecord;
      } catch (err: any) {
        logger.warn('Failed to persist new user to PostgreSQL, falling back to local memory store', { error: err.message });
      }
    }

    this.users.push(newRecord);
    return newRecord;
  }

  public async getAllUsers(query?: { search?: string; role?: string; status?: string }): Promise<UserRecord[]> {
    let allUsers: UserRecord[] = [];
    if (this.isPostgresConnected) {
      try {
        allUsers = (await prisma.user.findMany({ orderBy: { created_at: 'desc' } })) as UserRecord[];
      } catch (err: any) {
        logger.warn('Failed to query users from PostgreSQL, falling back to local memory store', { error: err.message });
        allUsers = [...this.users];
      }
    } else {
      allUsers = [...this.users];
    }

    if (!query) return allUsers;

    let filtered = allUsers;
    if (query.role && query.role !== 'ALL') {
      filtered = filtered.filter((u) => u.role.toUpperCase() === query.role?.toUpperCase());
    }
    if (query.status && query.status !== 'ALL') {
      filtered = filtered.filter((u) => u.status.toUpperCase() === query.status?.toUpperCase());
    }
    if (query.search) {
      const q = query.search.trim().toLowerCase();
      filtered = filtered.filter((u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.company_name.toLowerCase().includes(q) ||
        u.mobile_number.includes(q)
      );
    }
    return filtered;
  }

  public async updateUserStatus(id: string, status: string): Promise<UserRecord | null> {
    const validStatus = status.toUpperCase();
    if (this.isPostgresConnected) {
      try {
        const updated = await prisma.user.update({
          where: { id },
          data: { status: validStatus }
        });
        const idx = this.users.findIndex((u) => u.id === id);
        if (idx !== -1) this.users[idx] = { ...updated } as UserRecord;
        return updated as UserRecord;
      } catch (err: any) {
        logger.warn('Failed to update user status in PostgreSQL, falling back to local memory store', { id, status: validStatus, error: err.message });
      }
    }

    const found = this.users.find((u) => u.id === id);
    if (!found) return null;
    found.status = validStatus;
    found.updated_at = new Date();
    return { ...found };
  }
}

// Server-wide Singleton
export const db = new DatabaseStore();
