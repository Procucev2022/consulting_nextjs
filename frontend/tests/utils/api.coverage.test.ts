import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../src/utils/api';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import { AUTH_STORAGE_KEYS } from '../../src/constants/auth';
import { conversionFunnelStages } from '../fixtures/mockData';

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('apiClient coverage', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
    window.localStorage.clear();
  });

  describe('D1 procurement category mappings', () => {
    it('returns the mapping payload and reports HTTP and schema failures with the UI message', async () => {
      const data = { mappings: { P11: 'Packing' }, categories: ['Packing'] };
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data }));
      await expect(apiClient.getProcurementCategoryMappings()).resolves.toEqual(data);
      expect(fetchMock).toHaveBeenCalledWith('/api/procurement/category-mappings');

      fetchMock.mockResolvedValueOnce(new Response('{}', { status: 503 }));
      await expect(apiClient.getProcurementCategoryMappings()).rejects.toThrow(
        UI_STRINGS.databaseData.procurementMappingsLoadFailed
      );

      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: {} }));
      await expect(apiClient.getProcurementCategoryMappings()).rejects.toThrow(
        UI_STRINGS.databaseData.procurementMappingsLoadFailed
      );
    });
  });

  describe('tenant', () => {
    it('reads the default tenant when no buyer is given', async () => {
      const tenant = { tenant_id: 'TNT-1' };
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: tenant }));

      await expect(apiClient.getTenant()).resolves.toEqual(tenant);
      expect(fetchMock).toHaveBeenCalledWith('/api/tenant');
    });

    it('scopes the tenant read to the requested buyer with an encoded buyerId', async () => {
      const tenant = { tenant_id: 'TNT-2' };
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: tenant }));

      await expect(apiClient.getTenant('Buyer 1/A')).resolves.toEqual(tenant);
      expect(fetchMock).toHaveBeenCalledWith('/api/tenant?buyerId=Buyer%201%2FA');
    });

    it('sends validated tenant updates with a PUT request', async () => {
      const tenant = { tenant_id: 'TNT-3', region: 'EU' };
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: tenant }));

      await expect(apiClient.updateTenant({ region: 'EU' })).resolves.toEqual(tenant);
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/tenant',
        expect.objectContaining({ method: 'PUT', body: JSON.stringify({ region: 'EU' }) })
      );
    });

    it('rejects invalid tenant updates before calling the API', async () => {
      await expect(apiClient.updateTenant({ enterprise_name: '' })).rejects.toThrow('Invalid tenant updates');
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('categories, vendors and merges', () => {
    it('loads spend categories and category year details', async () => {
      const data = { categories: [{ name: 'Packaging' }], categoryDetails: [] };
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data }));

      await expect(apiClient.getCategories()).resolves.toEqual(data);
      expect(fetchMock).toHaveBeenCalledWith('/api/categories');
    });

    it('loads vendor price rankings', async () => {
      const data = { vendorRankings: [{ rank: 1 }], vendorDetails: [] };
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data }));

      await expect(apiClient.getVendors()).resolves.toEqual(data);
      expect(fetchMock).toHaveBeenCalledWith('/api/vendors');
    });

    it('loads vendor year details', async () => {
      const vendorDetails = [{ vendor_name: 'Vendor A', year: 2025 }];
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: { vendorDetails } }));

      await expect(apiClient.getVendorDetails()).resolves.toEqual(vendorDetails);
      expect(fetchMock).toHaveBeenCalledWith('/api/vendors?details=true');
    });

    it('posts a validated vendor merge and rejects merges without a target name', async () => {
      const body = { success: true, message: 'Merged' };
      fetchMock.mockResolvedValueOnce(jsonResponse(body));

      await expect(apiClient.mergeVendor('target', 'MST-1', 'Target Corp')).resolves.toEqual(body);
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/vendors',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ targetName: 'target', masterId: 'MST-1', canonicalName: 'Target Corp' })
        })
      );

      fetchMock.mockClear();
      await expect(apiClient.mergeVendor('', 'MST-1', 'Target Corp')).rejects.toThrow('Invalid vendor merge payload');
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('savings, opportunities and PCBI audit', () => {
    it('loads the savings opportunity list', async () => {
      const data = { opportunities: [], totalPotentialSavingsCr: 12.5 };
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data }));

      await expect(apiClient.getSavingsOpportunities()).resolves.toEqual(data);
      expect(fetchMock).toHaveBeenCalledWith('/api/savings');
    });

    it('deploys a validated opportunity and rejects deployments without an opportunity id', async () => {
      const deployed = { opp_id: 'OPP-1', status: 'Deployed' };
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: deployed }));

      await expect(apiClient.deployOpportunity('OPP-1', 'proCPX')).resolves.toEqual(deployed);
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/savings',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ opp_id: 'OPP-1', targetModule: 'proCPX' })
        })
      );

      fetchMock.mockClear();
      await expect(apiClient.deployOpportunity('', 'proCPX')).rejects.toThrow('Invalid deploy payload');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('loads the PCBI explainability audit for an encoded opportunity id', async () => {
      const audit = { transaction_id: 'TX 1', material_code: 'MAT-01' };
      fetchMock.mockResolvedValueOnce(jsonResponse({ audit }));

      await expect(apiClient.getPCBIExplainabilityAudit('TX 1')).resolves.toEqual(audit);
      expect(fetchMock).toHaveBeenCalledWith('/api/pcbi/opportunity/TX%201');
    });
  });

  describe('Module 2 ledger and bridge', () => {
    it('persists validated manual and provisional taxonomy decisions through the D1 bulk route', async () => {
      window.localStorage.setItem(AUTH_STORAGE_KEYS.AUTH_TOKEN, 'coverage-token');
      const mappings = [{
        sourceMaterialId: 'MAT-1', unspscCode: '12345678', reviewStatus: 'PROVISIONAL' as const,
        confidenceScore: 0.8, mappingMethod: 'CONTEXTUAL_HEURISTIC' as const
      }];
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, message: 'saved', mappings }));
      await expect(apiClient.updateModule2MaterialMappings({ assessmentId: 'ASM-1', mappings })).resolves.toMatchObject({
        success: true, mappings
      });
      expect(fetchMock).toHaveBeenCalledWith('/api/module2/sourcing/vendor-consolidation/mappings/bulk-update',
        expect.objectContaining({
          method: 'POST', body: JSON.stringify({ assessmentId: 'ASM-1', mappings }),
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer coverage-token' }
        }));

      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, mappings }));
      await expect(apiClient.updateModule2MaterialMapping({
        assessmentId: 'ASM-1', ...mappings[0]
      })).resolves.toEqual(mappings[0]);

      fetchMock.mockClear();
      await expect(apiClient.updateModule2MaterialMappings({ assessmentId: 'ASM-1', mappings: [] } as never))
        .rejects.toThrow(UI_STRINGS.toasts.module2MappingFailed(UI_STRINGS.toasts.invalidMappingPayload));
      expect(fetchMock).not.toHaveBeenCalled();

      fetchMock.mockResolvedValueOnce(jsonResponse({ success: false, message: 'Mapping target not found' }, 404));
      await expect(apiClient.updateModule2MaterialMappings({ assessmentId: 'ASM-1', mappings }))
        .rejects.toThrow(UI_STRINGS.toasts.module2MappingFailed('Mapping target not found'));
    });

    it('fetches the opportunity ledger with or without an assessment filter', async () => {
      const ledger = [{ oppId: 'OPP-1' }];
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: ledger }));

      await expect(apiClient.getModule2OpportunityLedger('ASS-1')).resolves.toEqual(ledger);
      expect(fetchMock).toHaveBeenCalledWith('/api/module2/sourcing/opportunity-ledger?assessmentId=ASS-1');

      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: ledger }));

      await expect(apiClient.getModule2OpportunityLedger()).resolves.toEqual(ledger);
      expect(fetchMock).toHaveBeenLastCalledWith('/api/module2/sourcing/opportunity-ledger');
    });

    it('fetches the mathematical bridge with or without an assessment filter', async () => {
      const bridge = { totalIdentifiedSavingsCr: 12.5 };
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: bridge }));

      await expect(apiClient.getModule2MathematicalBridge('ASS-1')).resolves.toEqual(bridge);
      expect(fetchMock).toHaveBeenCalledWith('/api/module2/sourcing/bridge?assessmentId=ASS-1');

      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: bridge }));

      await expect(apiClient.getModule2MathematicalBridge()).resolves.toEqual(bridge);
      expect(fetchMock).toHaveBeenLastCalledWith('/api/module2/sourcing/bridge');
    });
  });

  describe('conversion funnel and commercial projection', () => {
    it('loads validated conversion stages', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: conversionFunnelStages }));

      await expect(apiClient.getConversionStages()).resolves.toEqual(conversionFunnelStages);
      expect(fetchMock).toHaveBeenCalledWith('/api/conversion');
    });

    it('reports HTTP and schema failures for conversion stages', async () => {
      fetchMock.mockResolvedValueOnce(new Response('{}', { status: 503 }));
      await expect(apiClient.getConversionStages()).rejects.toThrow(
        UI_STRINGS.databaseData.conversionLoadFailed(503)
      );

      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: [{ phase_num: -1 }] }));
      await expect(apiClient.getConversionStages()).rejects.toThrow(UI_STRINGS.databaseData.invalidData);
    });

    it('posts a validated commercial projection and rejects non-positive spend', async () => {
      const projection = { estimatedSavingsCr: 50 };
      fetchMock.mockResolvedValueOnce(jsonResponse(projection));

      await expect(apiClient.calculateCommercialSaaS(500, 10, 1)).resolves.toEqual(projection);
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/conversion',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ annualSpendCr: 500, savingsRate: 10, saasFeeRate: 1 })
        })
      );

      fetchMock.mockClear();
      await expect(apiClient.calculateCommercialSaaS(-100, 10, 1)).rejects.toThrow(
        'Invalid commercial metrics calculation'
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('executive report, GraphQL dashboard and currency', () => {
    it('loads the executive report payload', async () => {
      const report = { success: true, data: { report: 'Executive' } };
      fetchMock.mockResolvedValueOnce(jsonResponse(report));

      await expect(apiClient.getExecutiveReport()).resolves.toEqual(report);
      expect(fetchMock).toHaveBeenCalledWith('/api/report');
    });

    it('loads the dashboard overview through a single GraphQL request', async () => {
      const dashboardOverview = { tenant: { enterprise_name: 'Test Tenant' }, categories: [] };
      fetchMock.mockResolvedValueOnce(jsonResponse({ data: { dashboardOverview } }));

      await expect(apiClient.getDashboardOverviewGraphQL()).resolves.toEqual(dashboardOverview);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/graphql'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('converts currency with and without a reference date', async () => {
      const converted = { from: 'USD', amount: 100, converted: 8300 };
      fetchMock.mockResolvedValueOnce(jsonResponse({ data: converted }));

      await expect(apiClient.getCurrencyConversion('USD', 100, 2024)).resolves.toEqual(converted);
      expect(fetchMock).toHaveBeenCalledWith('/api/currency?from=USD&amount=100&date=2024');

      fetchMock.mockResolvedValueOnce(jsonResponse({ data: converted }));

      await expect(apiClient.getCurrencyConversion('USD', 100)).resolves.toEqual(converted);
      expect(fetchMock).toHaveBeenLastCalledWith('/api/currency?from=USD&amount=100');
    });
  });

  describe('category details and Module 2 canonical data', () => {
    it('loads the category year-detail matrix', async () => {
      const categoryDetails = [{ category: 'Packaging', year: 2025 }];
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: { categoryDetails } }));

      await expect(apiClient.getCategoryDetails()).resolves.toEqual(categoryDetails);
      expect(fetchMock).toHaveBeenCalledWith('/api/categories?details=true');
    });

    it('requests Module 2 line items with the optional limit and assessment filters', async () => {
      const lineItems = [{ line_id: 'LI-1' }];
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: { lineItems } }));

      await expect(apiClient.getModule2CanonicalLineItems(25, 'ASM-1')).resolves.toEqual(lineItems);
      expect(fetchMock).toHaveBeenCalledWith('/api/module2/sourcing/line-items?limit=25&assessmentId=ASM-1');
    });

    it('scopes Module 2 line items to a tenant when requested', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: { lineItems: [] } }));

      await expect(apiClient.getModule2CanonicalLineItems(undefined, undefined, 'TENANT-7')).resolves.toEqual([]);
      expect(fetchMock).toHaveBeenCalledWith('/api/module2/sourcing/line-items?tenantId=TENANT-7');
    });

    it('keeps a zero limit and returns an empty list when the response has no line items', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true }));

      await expect(apiClient.getModule2CanonicalLineItems(0)).resolves.toEqual([]);
      expect(fetchMock).toHaveBeenCalledWith('/api/module2/sourcing/line-items?limit=0');
    });

    it('sends no filters when Module 2 line items are requested without arguments', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: {} }));

      await expect(apiClient.getModule2CanonicalLineItems()).resolves.toEqual([]);
      expect(fetchMock).toHaveBeenCalledWith('/api/module2/sourcing/line-items?');
    });

    it('loads the canonical Module 2 input with an encoded assessment id only when one is given', async () => {
      const canonicalInput = { assessment: 'ASM 2' };
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: canonicalInput }));

      await expect(apiClient.getModule2CanonicalInput('ASM 2')).resolves.toEqual(canonicalInput);
      expect(fetchMock).toHaveBeenCalledWith('/api/module2/sourcing/canonical-input?assessmentId=ASM%202');

      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: canonicalInput }));

      await expect(apiClient.getModule2CanonicalInput()).resolves.toEqual(canonicalInput);
      expect(fetchMock).toHaveBeenLastCalledWith('/api/module2/sourcing/canonical-input');
    });
  });
});
