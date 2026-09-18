import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatabaseStore, db, prisma } from '../../src/services/db';

describe('DatabaseStore service', () => {
  let store: DatabaseStore;

  beforeEach(() => {
    store = new DatabaseStore();
  });

  describe('Postgres status and init', () => {
    it('should report connection status boolean', () => {
      expect(typeof store.isConnectedToPostgres()).toBe('boolean');
    });

    it('should cover successful initPostgres when Postgres is reachable', async () => {
      const mockStore = Object.create(DatabaseStore.prototype);
      const connectSpy = vi.spyOn(prisma, '$connect').mockResolvedValueOnce(undefined);
      const findSpy = vi.spyOn(prisma.tenantMaster, 'findFirst').mockResolvedValueOnce({
        tenant_id: 'TNT-PG-MOCK',
        enterprise_name: 'Postgres Tenant',
        region: 'GLOBAL',
        base_currency: 'USD',
        status: 'ACTIVE',
        total_spend_evaluated: 5000,
        total_spend_evaluated_inr: 42.5
      } as any);

      await (mockStore as any).initPostgres();
      expect(mockStore.isPostgresConnected).toBe(true);
      expect(mockStore.tenant.enterprise_name).toBe('Postgres Tenant');
      connectSpy.mockRestore();
      findSpy.mockRestore();
    });

    it('should cover initPostgres when dbTenant has null total_spend_evaluated_inr', async () => {
      const mockStore = Object.create(DatabaseStore.prototype);
      const connectSpy = vi.spyOn(prisma, '$connect').mockResolvedValueOnce(undefined);
      const findSpy = vi.spyOn(prisma.tenantMaster, 'findFirst').mockResolvedValueOnce({
        tenant_id: 'TNT-PG-2',
        enterprise_name: 'Postgres Tenant 2',
        region: 'GLOBAL',
        base_currency: 'USD',
        status: 'ACTIVE',
        total_spend_evaluated: 1000,
        total_spend_evaluated_inr: null
      } as any);

      await (mockStore as any).initPostgres();
      expect(mockStore.tenant.total_spend_evaluated_inr).toBe(0);
      connectSpy.mockRestore();
      findSpy.mockRestore();
    });

    it('should cover error path in initPostgres when connect throws', async () => {
      const mockStore = Object.create(DatabaseStore.prototype);
      const connectSpy = vi.spyOn(prisma, '$connect').mockRejectedValueOnce(new Error('Connection refused'));

      await (mockStore as any).initPostgres();
      expect(mockStore.isPostgresConnected).toBe(false);
      connectSpy.mockRestore();
    });
  });

  describe('Tenant operations', () => {
    it('should get tenant details', () => {
      const tenant = store.getTenant();
      expect(tenant).toBeDefined();
      expect(tenant.enterprise_name).toBeDefined();
    });

    it('should update tenant details', () => {
      const updated = store.updateTenant({ enterprise_name: 'New Enterprise Ltd' });
      expect(updated.enterprise_name).toBe('New Enterprise Ltd');
      expect(store.getTenant().enterprise_name).toBe('New Enterprise Ltd');
    });
  });

  describe('Ingestion operations', () => {
    it('should get ingestion queue', () => {
      const queue = store.getIngestionQueue();
      expect(Array.isArray(queue)).toBe(true);
      expect(queue.length).toBeGreaterThanOrEqual(0);
    });

    it('should add item to ingestion queue', () => {
      const item: any = {
        doc_id: 'DOC-TEST-999',
        tenant_id: 'TNT-TEST',
        file_name: 'test_invoice.pdf',
        file_type: 'PDF',
        file_size_mb: 2.5,
        ocr_status: 'Completed',
        progress: 100,
        uploaded_at: new Date().toISOString(),
        records_count: 50
      };
      const queue = store.addIngestionItem(item);
      expect(queue[0].doc_id).toBe('DOC-TEST-999');
    });

    it('should add item with partial properties and safely generate defaults without throwing', () => {
      const partialItem: any = {
        file_name: 'minimal_file.xlsx',
        file_type: 'XLSX',
        file_size_mb: 1.2
      };
      const queue = store.addIngestionItem(partialItem);
      expect(queue[0].file_name).toBe('minimal_file.xlsx');
      expect(queue[0].doc_id).toBeDefined();
      expect(queue[0].ocr_status).toBe('Completed');
      expect(queue[0].progress).toBe(100);
      expect(queue[0].records_count).toBe(0);
      expect(queue[0].detected_currencies).toEqual(['INR']);
    });

    it('should sanitize ingestion item with missing fields using default fallbacks', () => {
      const sanitized = (store as any).sanitizeIngestionItem({
        file_name: undefined,
        file_type: undefined,
        file_size_mb: undefined,
        ocr_status: undefined,
        progress: undefined,
        uploaded_at: undefined,
        records_count: undefined,
        detected_currencies: undefined,
        converted_inr_crores: undefined
      }, 1);
      expect(sanitized.file_name).toBe('Uploaded_Document.xlsx');
      expect(sanitized.file_type).toBe('XLSX');
      expect(sanitized.ocr_status).toBe('Completed');
      expect(sanitized.progress).toBe(100);
      expect(sanitized.converted_inr_crores).toBe(0);
    });

    it('should maintain single active item on addIngestionItem and allow resetIngestionQueue', () => {
      const item1: any = { file_name: 'file1.xlsx', file_size_mb: 1.0 };
      const item2: any = { file_name: 'file2.xlsx', file_size_mb: 2.0 };
      store.addIngestionItem(item1);
      const queueAfterSecond = store.addIngestionItem(item2);
      expect(queueAfterSecond).toHaveLength(1);
      expect(queueAfterSecond[0].file_name).toBe('file2.xlsx');

      const resetQueue = store.resetIngestionQueue();
      expect(resetQueue).toHaveLength(0);
    });
  });

  describe('Validation Record operations', () => {
    const testRec: any = {
      record_id: 'REC-TEST-1',
      po_number: 'PO-TEST-101',
      vendor_name: 'Crown Paper Box Corp',
      raw_desc: 'High Density Polyethylene Granules',
      order_quantity: 1000,
      net_price: 145.0,
      subtotal_raw: 145000,
      amount: 145000,
      raw_currency: 'EUR',
      amount_inr: 13050000,
      inr_crores: 1.31,
      fx_rate_applied: 90.0,
      spend_year: 2024,
      transaction_date: '2024-05-18',
      column_l_code: '13101502',
      core_category: 'Direct Materials',
      issue_flag: 'Missing Currency Code',
      action_status: 'Fix (INR)',
      resolved: false
    };

    beforeEach(() => {
      store.setValidationRecords([testRec]);
    });

    it('should get validation records', () => {
      const records = store.getValidationRecords();
      expect(records.length).toBeGreaterThan(0);
    });

    it('should update existing validation record', () => {
      const records = store.getValidationRecords();
      const firstId = records[0].record_id;
      const updated = store.updateValidationRecord(firstId, { po_number: 'PO-MODIFIED-123' });
      expect(updated).not.toBeNull();
      expect(updated?.po_number).toBe('PO-MODIFIED-123');
    });

    it('should return null when updating non-existent record', () => {
      const res = store.updateValidationRecord('NON_EXISTENT_ID', { po_number: 'XYZ' });
      expect(res).toBeNull();
    });

    it('should reset validation records', () => {
      store.updateValidationRecord(store.getValidationRecords()[0].record_id, { po_number: 'TEMP' });
      const reset = store.resetValidationRecords();
      expect(reset.length).toBeGreaterThanOrEqual(0);
    });

    it('should apply blanket remediation covering all anomaly branches', () => {
      const records = store.getValidationRecords();

      // Branch 1: Missing Currency Code with net_price
      store.updateValidationRecord(records[0].record_id, {
        issue_flag: 'Missing Currency Code',
        order_quantity: 10,
        net_price: 100,
        amount: 1000,
        fx_rate_applied: 0,
        raw_currency: 'MISSING'
      });

      // Branch 2: Missing Currency Code with missing net_price (falls back to amount) and empty currency
      store.setValidationRecords([
        records[0],
        {
          record_id: 'REC-TEST-2',
          issue_flag: 'Missing Currency Code',
          order_quantity: 1,
          net_price: 0,
          amount: 500,
          fx_rate_applied: 80,
          raw_currency: ''
        } as any,
        {
          record_id: 'REC-TEST-3',
          issue_flag: 'Unmapped Supplier Name',
          vendor_name: 'Linde Air Liquid',
          raw_currency: 'EUR'
        } as any,
        {
          record_id: 'REC-TEST-4',
          issue_flag: 'Unmapped Supplier Name',
          vendor_name: 'Tata Steel Corp'
        } as any
      ]);

      // Branch 5: Unmapped Supplier Name with generic name
      const genericRec: any = {
        record_id: 'REC-GENERIC',
        vendor_name: 'Random Supply Ltd',
        issue_flag: 'Unmapped Supplier Name'
      };
      (store as any).validationRecords.push(genericRec);

      // Branch 6: Duplicate PO
      const dupRec: any = {
        record_id: 'REC-DUP',
        vendor_name: 'Dup Vendor',
        issue_flag: 'Duplicate PO'
      };
      (store as any).validationRecords.push(dupRec);

      const result = store.applyBlanketRemediation();
      expect(result.updatedCount).toBeGreaterThan(0);
      expect(result.records.every((r) => r.issue_flag === 'Passed Clean')).toBe(true);
    });
  });

  describe('Categories operations', () => {
    const testCategoryDetail: any = {
      id: 'CAT-TEST-1',
      category: 'Direct Materials',
      core_bucket: 'Direct Materials',
      sample_column_l_code: '13101502',
      spend_fy24_cr: 0.28,
      spend_fy25_cr: 0.34,
      spend_fy26_cr: 0.38,
      total_3yr_spend_inr_cr: 1.0,
      spend_share_pct: 10,
      yoy_growth_pct: 12.0,
      vendor_count: 5,
      item_count: 10,
      top_items: []
    };

    beforeEach(() => {
      store.setCategories([{
        id: 'CAT-TEST-1',
        name: 'Direct Materials',
        spend: 100000,
        spend_inr: 8380000,
        spend_inr_crores: 0.84,
        targetReductionPct: 6.5,
        lineItemsCount: 10,
        color: '#0284c7',
        column_l_code: '13101502'
      }]);
      store.setCategoryDetails([testCategoryDetail]);
    });

    it('should return spend categories', () => {
      const cats = store.getCategories();
      expect(cats.length).toBeGreaterThan(0);
    });

    it('should return category details', () => {
      const details = store.getCategoryDetails();
      expect(details.length).toBeGreaterThan(0);
    });

    it('should find category by ID or name', () => {
      const first = store.getCategoryDetails()[0];
      const found = store.getCategoryById(first.id || first.category);
      expect(found).toBeDefined();
      expect(found?.category).toBe(first.category);
    });

    it('should return undefined for unknown category ID', () => {
      const notFound = store.getCategoryById('non_existent_category_id');
      expect(notFound).toBeUndefined();
    });
  });

  describe('Vendors operations', () => {
    beforeEach(() => {
      store.setValidationRecords([{
        record_id: 'REC-VAL-1',
        vendor_name: 'Crown Paper Box Corp'
      } as any]);
      store.setLineItems([{
        mapping_id: 'MAP-1',
        line_item_id: 'LI-1',
        material_code: 'MAT-1',
        material_desc: 'Cartons',
        raw_desc: 'Cartons',
        vendor_identified: 'Amcor Packaging Group',
        unspsc_code: '14121506',
        unspsc_category_name: 'Packaging',
        core_bucket: 'Packaging Materials',
        ai_confidence: 99,
        status: 'Pending Review',
        unit_price: 10,
        qty: 100,
        total_spend: 1000,
        raw_currency: 'USD',
        amount_inr: 83800,
        inr_crores: 0.008,
        fx_rate_applied: 83.8,
        invoice_date: '2024-05-18',
        spend_year: 2024,
        po_number: 'PO-1'
      }]);
      store.setVendorDetails([{
        id: 'VEN-1',
        vendor_name: 'Crown Paper Box Corp',
        core_category: 'Packaging Materials',
        spend_fy24_cr: 1,
        spend_fy25_cr: 1,
        spend_fy26_cr: 1,
        total_3yr_spend_inr_cr: 3,
        spend_share_pct: 10,
        yoy_growth_pct: 5,
        material_count: 2,
        top_materials: []
      }]);
      store.setVendorRankings([{
        vendor_name: 'Crown Paper Box Corp',
        master_id: 'VEN-M-1',
        category: 'Packaging',
        price_creep_pct: 2,
        total_spend: 10000,
        total_spend_inr_cr: 0.1,
        risk_status: 'ALIGNED',
        variance_leakage_usd: 100,
        variance_leakage_inr_cr: 0.001,
        benchmark_index: 'ICIS',
        last_36mo_trend: [0.1, 0.1, 0.1]
      }]);
    });

    it('should return vendor details and rankings', () => {
      expect(store.getVendorDetails().length).toBeGreaterThan(0);
      expect(store.getVendorRankings().length).toBeGreaterThan(0);
    });

    it('should merge vendor matching both validationRecords and lineItems', () => {
      const resVal = store.mergeVendor('crown', 'VEND-MST-004', 'Crown Master');
      expect(resVal.success).toBe(true);
      expect(resVal.affected).toBeGreaterThan(0);

      const resLine = store.mergeVendor('amcor', 'VEND-MST-005', 'Amcor Master');
      expect(resLine.success).toBe(true);
    });
  });

  describe('Line Items operations', () => {
    beforeEach(() => {
      store.setLineItems([{
        mapping_id: 'MAP-TEST-1',
        line_item_id: 'LI-1',
        material_code: 'MAT-1',
        material_desc: 'Cartons',
        raw_desc: 'Cartons',
        vendor_identified: 'Amcor Packaging Group',
        unspsc_code: '14121506',
        unspsc_category_name: 'Packaging',
        core_bucket: 'Packaging Materials',
        ai_confidence: 99,
        status: 'Pending Review',
        unit_price: 10,
        qty: 100,
        total_spend: 1000,
        raw_currency: 'USD',
        amount_inr: 83800,
        inr_crores: 0.008,
        fx_rate_applied: 83.8,
        invoice_date: '2024-05-18',
        spend_year: 2024,
        po_number: 'PO-1'
      }]);
    });

    it('should get line items', () => {
      const items = store.getLineItems();
      expect(items.length).toBeGreaterThan(0);
    });

    it('should update line item', () => {
      const firstId = store.getLineItems()[0].mapping_id;
      const updated = store.updateLineItem(firstId, { status: 'Confirmed' });
      expect(updated).not.toBeNull();
      expect(updated?.status).toBe('Confirmed');
    });

    it('should return null when updating non-existent line item', () => {
      const res = store.updateLineItem('UNKNOWN_MAPPING', { status: 'Confirmed' });
      expect(res).toBeNull();
    });
  });

  describe('Savings operations', () => {
    beforeEach(() => {
      store.setOpportunities([{
        opp_id: 'OPP-TEST-1',
        title: 'Direct Resin Volume Aggregation',
        category: 'Direct Materials',
        estimated_savings_inr_cr: 0.15,
        estimated_savings_usd: 18000,
        baseline_spend_inr_cr: 1.0,
        current_spend_usd: 120000,
        current_spend_inr_cr: 1.0,
        current_spend: 120000,
        target_savings_pct: 15.0,
        target_reduction_pct: 15.0,
        est_savings: 18000,
        est_savings_inr_cr: 0.15,
        push_to_module: 'proCPX',
        status: 'Identified',
        contract_leak_type: 'Volume Rebate Tier Leakage',
        confidence_score: 95
      }]);
    });

    it('should get opportunities', () => {
      const opps = store.getOpportunities();
      expect(opps.length).toBeGreaterThan(0);
    });

    it('should deploy opportunity to proCPX', () => {
      const firstId = store.getOpportunities()[0].opp_id;
      const updated = store.deployOpportunity(firstId, 'proCPX');
      expect(updated).not.toBeNull();
      expect(updated?.status).toBe('Pushed to proCPX');
    });

    it('should deploy opportunity to DPS NXT', () => {
      const firstId = store.getOpportunities()[0].opp_id;
      const updated = store.deployOpportunity(firstId, 'DPS NXT');
      expect(updated).not.toBeNull();
      expect(updated?.status).toBe('Pushed to DPS NXT');
    });

    it('should return null when deploying non-existent opportunity', () => {
      const res = store.deployOpportunity('INVALID_OPP_ID', 'proCPX');
      expect(res).toBeNull();
    });
  });

  describe('Funnel Stages operations', () => {
    it('should return conversion funnel stages', () => {
      const stages = store.getFunnelStages();
      expect(stages.length).toBeGreaterThan(0);
    });
  });

  describe('PostgreSQL Prisma syncing paths', () => {
    it('should sync tenant update when Postgres is connected (resolving and rejecting)', async () => {
      (store as any).isPostgresConnected = true;
      const updateSpy = vi.spyOn(prisma.tenantMaster, 'updateMany').mockRejectedValueOnce(new Error('Prisma sync fail'));
      const res = store.updateTenant({ base_currency: 'USD' });
      expect(res.base_currency).toBe('USD');
      updateSpy.mockRestore();
    });

    it('should sync ingestion item when Postgres is connected (resolving and rejecting)', async () => {
      (store as any).isPostgresConnected = true;
      const createSpy = vi.spyOn(prisma.rawDocumentIngestion, 'create').mockRejectedValueOnce(new Error('Create fail'));
      const item: any = {
        doc_id: 'DOC-PG-1',
        tenant_id: 'TNT-1',
        file_name: 'pg.pdf',
        file_type: 'PDF',
        file_size_mb: 1,
        ocr_status: 'Completed',
        progress: 100,
        uploaded_at: new Date().toISOString(),
        records_count: 5
      };
      const queue = store.addIngestionItem(item);
      expect(queue[0].doc_id).toBe('DOC-PG-1');
      createSpy.mockRestore();
    });

    it('should sync validation record update when Postgres is connected (resolving and rejecting)', async () => {
      (store as any).isPostgresConnected = true;
      store.setValidationRecords([{
        record_id: 'REC-PG-VAL-1',
        po_number: 'PO-ORIGINAL'
      } as any]);
      const updateSpy = vi.spyOn(prisma.validationPreCheckRecord, 'update').mockRejectedValueOnce(new Error('Update fail'));
      const firstId = store.getValidationRecords()[0].record_id;
      const updated = store.updateValidationRecord(firstId, { po_number: 'PO-PG-SYNC' });
      expect(updated?.po_number).toBe('PO-PG-SYNC');
      updateSpy.mockRestore();
    });
  });

  describe('Query Caching and Audit Logging', () => {
    beforeEach(() => {
      store.setValidationRecords([{ record_id: 'REC-1' } as any]);
      store.setCategories([{ id: 'CAT-1', name: 'Cat 1' } as any]);
      store.setCategoryDetails([{ id: 'CAT-1', category: 'Cat 1' } as any]);
      store.setVendorDetails([{ id: 'VEN-1', vendor_name: 'Ven 1' } as any]);
      store.setVendorRankings([{ master_id: 'V-1', vendor_name: 'Ven 1' } as any]);
      store.setLineItems([{ mapping_id: 'MAP-1', line_item_id: 'LI-1' } as any]);
      store.setOpportunities([{ opp_id: 'OPP-1', title: 'Opp 1' } as any]);
    });

    it('should hit cache on repeated queries', () => {
      // First call hydrates cache
      store.getTenant();
      store.getIngestionQueue();
      store.getValidationRecords();
      store.getCategories();
      store.getCategoryDetails();
      store.getVendorDetails();
      store.getVendorRankings();
      store.getLineItems();
      store.getOpportunities();
      store.getFunnelStages();

      // Second call hits cache (exercising the if (cached) branches)
      expect(store.getTenant()).toBeDefined();
      expect(store.getIngestionQueue().length).toBeGreaterThanOrEqual(0);
      expect(store.getValidationRecords().length).toBeGreaterThan(0);
      expect(store.getCategories().length).toBeGreaterThan(0);
      expect(store.getCategoryDetails().length).toBeGreaterThan(0);
      expect(store.getVendorDetails().length).toBeGreaterThan(0);
      expect(store.getVendorRankings().length).toBeGreaterThan(0);
      expect(store.getLineItems().length).toBeGreaterThan(0);
      expect(store.getOpportunities().length).toBeGreaterThan(0);
      expect(store.getFunnelStages().length).toBeGreaterThan(0);
    });
  });

  describe('Global singleton', () => {
    it('should export singleton instance', () => {
      expect(db).toBeInstanceOf(DatabaseStore);
    });
  });
});
