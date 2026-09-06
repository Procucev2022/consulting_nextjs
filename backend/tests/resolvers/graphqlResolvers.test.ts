import { describe, it, expect } from 'vitest';
import { rootResolvers } from '../../src/resolvers/graphqlResolvers';

describe('GraphQL Root Resolvers', () => {
  const mockContext = {
    requestId: 'test-req-1',
    tenantId: 'tenant_default',
    timestamp: new Date().toISOString()
  };

  describe('Query Resolvers', () => {
    it('should resolve tenant query', async () => {
      const tenant = await rootResolvers.tenant({}, mockContext);
      expect(tenant).toBeDefined();
      expect(tenant.enterprise_name).toBeDefined();
    });

    it('should resolve ingestionQueue query', async () => {
      const queue = await rootResolvers.ingestionQueue({}, mockContext);
      expect(Array.isArray(queue)).toBe(true);
      expect(queue.length).toBeGreaterThan(0);
    });

    it('should resolve validationRecords query', async () => {
      const records = await rootResolvers.validationRecords({}, mockContext);
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThan(0);
    });

    it('should resolve categories query', async () => {
      const categories = await rootResolvers.categories({}, mockContext);
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should resolve categoryDetails query with and without id', async () => {
      const allDetails = await rootResolvers.categoryDetails({}, mockContext);
      expect(Array.isArray(allDetails)).toBe(true);
      expect(allDetails.length).toBeGreaterThan(0);

      const singleDetail = await rootResolvers.categoryDetails({ id: allDetails[0].id }, mockContext);
      expect(singleDetail.length).toBe(1);
      expect(singleDetail[0].id).toBe(allDetails[0].id);

      const nonExistent = await rootResolvers.categoryDetails({ id: 'non-existent-id' }, mockContext);
      expect(nonExistent).toEqual([]);
    });

    it('should resolve vendorDetails query', async () => {
      const details = await rootResolvers.vendorDetails({}, mockContext);
      expect(Array.isArray(details)).toBe(true);
    });

    it('should resolve vendorRankings query', async () => {
      const rankings = await rootResolvers.vendorRankings({}, mockContext);
      expect(Array.isArray(rankings)).toBe(true);
    });

    it('should resolve lineItems query', async () => {
      const items = await rootResolvers.lineItems({}, mockContext);
      expect(Array.isArray(items)).toBe(true);
    });

    it('should resolve opportunities query', async () => {
      const opps = await rootResolvers.opportunities({}, mockContext);
      expect(Array.isArray(opps)).toBe(true);
    });

    it('should resolve funnelStages query', async () => {
      const stages = await rootResolvers.funnelStages({}, mockContext);
      expect(Array.isArray(stages)).toBe(true);
    });

    it('should resolve queryMetrics query', async () => {
      const metrics = await rootResolvers.queryMetrics({}, mockContext);
      expect(metrics).toBeDefined();
      expect(metrics.totalQueries).toBeDefined();
    });

    it('should resolve dashboardOverview batch composite query', async () => {
      const overview = await rootResolvers.dashboardOverview({}, mockContext);
      expect(overview).toBeDefined();
      expect(overview.tenant).toBeDefined();
      expect(Array.isArray(overview.categories)).toBe(true);
      expect(Array.isArray(overview.opportunities)).toBe(true);
      expect(Array.isArray(overview.funnelStages)).toBe(true);
      expect(Array.isArray(overview.ingestionQueue)).toBe(true);
      expect(Array.isArray(overview.validationRecords)).toBe(true);
      expect(overview.queryMetrics).toBeDefined();
    });
  });

  describe('Mutation Resolvers', () => {
    it('should resolve updateTenant mutation', async () => {
      const updated = await rootResolvers.updateTenant(
        { input: { enterprise_name: 'GraphQL Corp' } },
        mockContext
      );
      expect(updated.enterprise_name).toBe('GraphQL Corp');
    });

    it('should resolve addIngestionItem mutation', async () => {
      const added = await rootResolvers.addIngestionItem(
        {
          input: {
            file_name: 'test_graphql.csv',
            file_type: 'CSV',
            file_size_mb: 2.5,
            records_count: 50
          }
        },
        mockContext
      );
      expect(added.file_name).toBe('test_graphql.csv');
      expect(added.records_count).toBe(50);
      expect(added.ocr_status).toBe('Completed');

      const addedDefault = await rootResolvers.addIngestionItem(
        {
          input: {
            file_name: 'test_graphql_default.csv',
            file_type: 'CSV',
            file_size_mb: 1.0
          }
        },
        mockContext
      );
      expect(addedDefault.records_count).toBe(0);
    });

    it('should resolve updateValidationRecord mutation', async () => {
      const records = await rootResolvers.validationRecords({}, mockContext);
      const targetRecord = records[0];

      const updated = await rootResolvers.updateValidationRecord(
        {
          input: {
            record_id: targetRecord.record_id,
            resolved: true,
            action_status: 'Resolved'
          }
        },
        mockContext
      );
      expect(updated?.record_id).toBe(targetRecord.record_id);
      expect(updated?.resolved).toBe(true);
    });

    it('should resolve mergeVendor mutation', async () => {
      const result = await rootResolvers.mergeVendor(
        {
          input: {
            targetName: 'Acme',
            masterId: 'VEND-ACME-001',
            canonicalName: 'Acme International'
          }
        },
        mockContext
      );
      expect(result.success).toBe(true);
      expect(typeof result.affected).toBe('number');
    });

    it('should resolve deployOpportunity mutation', async () => {
      const opps = await rootResolvers.opportunities({}, mockContext);
      const targetOpp = opps[0];

      const deployed = await rootResolvers.deployOpportunity(
        {
          id: targetOpp.opp_id,
          targetModule: 'proCPX'
        },
        mockContext
      );
      expect(deployed?.opp_id).toBe(targetOpp.opp_id);
      expect(deployed?.status).toBe('Pushed to proCPX');
    });
  });
});
