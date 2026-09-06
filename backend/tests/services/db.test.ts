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
      expect(mockStore.tenant.total_spend_evaluated_inr).toBeUndefined();
      connectSpy.mockRestore();
      findSpy.mockRestore();
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
      expect(queue.length).toBeGreaterThan(0);
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
  });

  describe('Validation Record operations', () => {
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
      expect(reset.length).toBeGreaterThan(0);
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
      if (records.length > 1) {
        store.updateValidationRecord(records[1].record_id, {
          issue_flag: 'Missing Currency Code',
          order_quantity: 1,
          net_price: 0,
          amount: 500,
          fx_rate_applied: 80,
          raw_currency: ''
        });
      }

      // Branch 3: Unmapped Supplier Name with 'linde'
      if (records.length > 2) {
        store.updateValidationRecord(records[2].record_id, {
          issue_flag: 'Unmapped Supplier Name',
          vendor_name: 'Linde Air Liquid',
          raw_currency: 'EUR'
        });
      }

      // Branch 4: Unmapped Supplier Name with 'tata'
      if (records.length > 3) {
        store.updateValidationRecord(records[3].record_id, {
          issue_flag: 'Unmapped Supplier Name',
          vendor_name: 'Tata Steel Corp'
        });
      }

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
    it('should return vendor details and rankings', () => {
      expect(store.getVendorDetails().length).toBeGreaterThan(0);
      expect(store.getVendorRankings().length).toBeGreaterThan(0);
    });

    it('should merge vendor matching both validationRecords and lineItems', () => {
      // 'crown' matches 'Crown Paper Box Corp' in validationRecords
      // 'amcor' matches 'Amcor Packaging Group' in lineItems
      const resVal = store.mergeVendor('crown', 'VEND-MST-004', 'Crown Master');
      expect(resVal.success).toBe(true);
      expect(resVal.affected).toBeGreaterThan(0);

      const resLine = store.mergeVendor('amcor', 'VEND-MST-005', 'Amcor Master');
      expect(resLine.success).toBe(true);
    });
  });

  describe('Line Items operations', () => {
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
      const updateSpy = vi.spyOn(prisma.validationPreCheckRecord, 'update').mockRejectedValueOnce(new Error('Update fail'));
      const firstId = store.getValidationRecords()[0].record_id;
      const updated = store.updateValidationRecord(firstId, { po_number: 'PO-PG-SYNC' });
      expect(updated?.po_number).toBe('PO-PG-SYNC');
      updateSpy.mockRestore();
    });
  });

  describe('Query Caching and Audit Logging', () => {
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
      expect(store.getIngestionQueue().length).toBeGreaterThan(0);
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
