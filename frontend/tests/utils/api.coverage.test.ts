import { expectApiFetchCall } from './apiFetchAssertions';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../src/utils/api';
import frontendLogger from '../../src/utils/logger';
import { UI_STRINGS } from '../../src/constants/uiStrings';
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
    vi.restoreAllMocks();
    fetchMock.mockReset();
  });

  describe('D1 procurement category mappings', () => {
    it('returns the mapping payload and reports HTTP and schema failures with the UI message', async () => {
      const data = { mappings: { P11: 'Packing' }, categories: ['Packing'] };
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data }));
      await expect(apiClient.getProcurementCategoryMappings()).resolves.toEqual(data);
      expectApiFetchCall(fetchMock, '/api/procurement/category-mappings');

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
      expectApiFetchCall(fetchMock, '/api/tenant');
    });

    it('scopes the tenant read to the assigned tenant ID', async () => {
      const tenant = { tenant_id: 'TNT-2' };
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: tenant }));

      await expect(apiClient.getTenant('TNT 1/A')).resolves.toEqual(tenant);
      expectApiFetchCall(fetchMock, '/api/tenant?tenantId=TNT%201%2FA');
    });

    it('logs and exposes a correlated tenant read failure', async () => {
      const log = vi.spyOn(frontendLogger, 'error');
      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Tenant assignment pending' }), {
        status: 403, headers: { 'x-request-id': 'REQ-TENANT-403' }
      }));

      await expect(apiClient.getTenant('TNT-2')).rejects.toThrow(UI_STRINGS.module4.apiRequestFailed(
        UI_STRINGS.module4.apiOperations.tenant, 403, 'Tenant assignment pending', 'REQ-TENANT-403'
      ));
      expect(log).toHaveBeenCalledWith('Tenant master request failed', expect.objectContaining({
        tenantId: 'TNT-2', status: 403, requestId: 'REQ-TENANT-403'
      }));
      fetchMock.mockResolvedValueOnce(new Response('{}', {
        status: 500, headers: { 'x-request-id': 'REQ-TENANT-500' }
      }));
      await expect(apiClient.getTenant('TNT-2')).rejects.toThrow(UI_STRINGS.module4.apiRequestFailed(
        UI_STRINGS.module4.apiOperations.tenant, 500, UI_STRINGS.module4.tenantApiNoDetails, 'REQ-TENANT-500'
      ));
      log.mockRestore();
    });

    it('logs malformed tenant read responses with HTTP and request context', async () => {
      const log = vi.spyOn(frontendLogger, 'error');
      fetchMock.mockResolvedValueOnce(new Response('<html>upstream error</html>', {
        status: 502, headers: { 'x-request-id': 'REQ-TENANT-READ-502' }
      }));

      await expect(apiClient.getTenant('TNT-READ')).rejects.toThrow(UI_STRINGS.module4.apiInvalidResponse(
        UI_STRINGS.module4.apiOperations.tenant, 502, 'REQ-TENANT-READ-502'
      ));
      expect(log).toHaveBeenCalledWith('Tenant API response could not be parsed', expect.objectContaining({
        method: 'GET', path: '/api/tenant', statusCode: 502, tenantId: 'TNT-READ', requestId: 'REQ-TENANT-READ-502'
      }), expect.any(SyntaxError));
      log.mockRestore();
    });

    it('sends validated tenant updates with a PUT request', async () => {
      const tenant = { tenant_id: 'TNT-3', region: 'EU' };
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: tenant }));

      await expect(apiClient.updateTenant({ region: 'EU' })).resolves.toEqual(tenant);
      expectApiFetchCall(fetchMock, '/api/tenant', expect.objectContaining({ method: 'PUT', body: JSON.stringify({ region: 'EU' }) }));
    });

    it('rejects invalid tenant updates before calling the API', async () => {
      await expect(apiClient.updateTenant({ enterprise_name: '' })).rejects.toThrow('Invalid tenant updates');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('logs and returns the correlated error when tenant updates fail', async () => {
      const log = vi.spyOn(frontendLogger, 'error');
      fetchMock.mockResolvedValueOnce(new Response('{}', {
        status: 400,
        headers: { 'x-request-id': 'REQ-TENANT-400' }
      }));

      await expect(apiClient.updateTenant({ region: 'EU' })).rejects.toThrow(UI_STRINGS.module4.apiRequestFailed(
        UI_STRINGS.module4.apiOperations.tenantUpdate, 400, UI_STRINGS.module4.tenantApiNoDetails, 'REQ-TENANT-400'
      ));
      expect(log).toHaveBeenCalledWith('Tenant update request failed', expect.objectContaining({
        status: 400,
        requestId: 'REQ-TENANT-400',
        detail: UI_STRINGS.module4.tenantApiNoDetails
      }));
      log.mockRestore();
    });

    it('logs malformed tenant update responses and does not log submitted values', async () => {
      const log = vi.spyOn(frontendLogger, 'error');
      const info = vi.spyOn(frontendLogger, 'info');
      fetchMock.mockResolvedValueOnce(new Response('<html>upstream error</html>', {
        status: 200, headers: { 'x-request-id': 'REQ-TENANT-UPDATE-JSON' }
      }));

      await expect(apiClient.updateTenant({ total_spend_evaluated_inr: 75 })).rejects.toThrow(
        UI_STRINGS.module4.apiInvalidResponse(UI_STRINGS.module4.apiOperations.tenantUpdate, 200, 'REQ-TENANT-UPDATE-JSON')
      );
      expect(log).toHaveBeenCalledWith('Tenant API response could not be parsed', expect.objectContaining({
        method: 'PUT', path: '/api/tenant', statusCode: 200, operation: UI_STRINGS.module4.apiOperations.tenantUpdate,
        requestId: 'REQ-TENANT-UPDATE-JSON'
      }), expect.any(SyntaxError));
      expect(info).toHaveBeenCalledWith('Updating tenant configuration', { fields: ['total_spend_evaluated_inr'] });
      expect(info).not.toHaveBeenCalledWith('Updating tenant configuration', { updates: { total_spend_evaluated_inr: 75 } });
      log.mockRestore();
      info.mockRestore();
    });
  });

  describe('categories, vendors and merges', () => {
    it('loads spend categories and category year details', async () => {
      const data = { categories: [{ name: 'Packaging' }], categoryDetails: [] };
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data }));

      await expect(apiClient.getCategories()).resolves.toEqual(data);
      expectApiFetchCall(fetchMock, '/api/categories');
    });

    it('loads vendor price rankings', async () => {
      const data = { vendorRankings: [{ rank: 1 }], vendorDetails: [] };
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data }));

      await expect(apiClient.getVendors()).resolves.toEqual(data);
      expectApiFetchCall(fetchMock, '/api/vendors');
    });

    it('loads vendor year details', async () => {
      const vendorDetails = [{ vendor_name: 'Vendor A', year: 2025 }];
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: { vendorDetails } }));

      await expect(apiClient.getVendorDetails()).resolves.toEqual(vendorDetails);
      expectApiFetchCall(fetchMock, '/api/vendors?details=true');
    });

    it('logs dashboard HTTP, parse, and envelope failures while preserving request context', async () => {
      const log = vi.spyOn(frontendLogger, 'error');
      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ message: 'D1 read unavailable' }), {
        status: 503, headers: { 'x-request-id': 'REQ-CATEGORIES-503' }
      }));
      await expect(apiClient.getCategories()).rejects.toThrow(UI_STRINGS.databaseData.apiRequestFailed(
        UI_STRINGS.databaseData.apiOperations.categories, 503, 'D1 read unavailable', 'REQ-CATEGORIES-503'
      ));
      expect(log).toHaveBeenCalledWith('Dashboard API request failed', expect.objectContaining({
        method: 'GET', path: '/api/categories', statusCode: 503, requestId: 'REQ-CATEGORIES-503'
      }), expect.any(Error));

      fetchMock.mockResolvedValueOnce(new Response('<html>upstream error</html>', {
        status: 502, headers: { 'x-request-id': 'REQ-VENDORS-502' }
      }));
      await expect(apiClient.getVendors()).rejects.toThrow(UI_STRINGS.databaseData.apiInvalidResponse(
        UI_STRINGS.databaseData.apiOperations.vendors, 502, 'REQ-VENDORS-502'
      ));
      expect(log).toHaveBeenCalledWith('Dashboard API response could not be parsed', expect.objectContaining({
        path: '/api/vendors', statusCode: 502, requestId: 'REQ-VENDORS-502'
      }), expect.any(SyntaxError));

      fetchMock.mockResolvedValueOnce(jsonResponse({ success: false, data: {} }, 200));
      await expect(apiClient.getSavingsOpportunities()).rejects.toThrow(UI_STRINGS.databaseData.apiInvalidResponse(
        UI_STRINGS.databaseData.apiOperations.savings, 200, UI_STRINGS.common.notAvailable
      ));
      expect(log).toHaveBeenCalledWith('Dashboard API response envelope was invalid', expect.objectContaining({
        path: '/api/savings', statusCode: 200, requestId: UI_STRINGS.common.notAvailable
      }));
      log.mockRestore();
    });

    it('posts a validated vendor merge and rejects merges without a target name', async () => {
      const body = { success: true, message: 'Merged' };
      fetchMock.mockResolvedValueOnce(jsonResponse(body));

      await expect(apiClient.mergeVendor('target', 'MST-1', 'Target Corp')).resolves.toEqual(body);
      expectApiFetchCall(fetchMock, '/api/vendors', expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ targetName: 'target', masterId: 'MST-1', canonicalName: 'Target Corp' })
        }));

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
      expectApiFetchCall(fetchMock, '/api/savings');
    });

    it('deploys a validated opportunity and rejects deployments without an opportunity id', async () => {
      const deployed = { opp_id: 'OPP-1', status: 'Deployed' };
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: deployed }));

      await expect(apiClient.deployOpportunity('OPP-1', 'proCPX')).resolves.toEqual(deployed);
      expectApiFetchCall(fetchMock, '/api/savings', expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ opp_id: 'OPP-1', targetModule: 'proCPX' })
        }));

      fetchMock.mockClear();
      await expect(apiClient.deployOpportunity('', 'proCPX')).rejects.toThrow('Invalid deploy payload');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects unsuccessful, malformed, or mismatched D1 opportunity handoff responses', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Opportunity was not found.' }, 404));
      await expect(apiClient.deployOpportunity('OPP-404', 'proCPX')).rejects.toThrow('Opportunity was not found.');

      fetchMock.mockResolvedValueOnce(new Response('{}', { status: 503 }));
      await expect(apiClient.deployOpportunity('OPP-503', 'DPS NXT')).rejects.toThrow(
        UI_STRINGS.databaseData.opportunityHandoffFailed(503)
      );

      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: { opp_id: 'OTHER' } }));
      await expect(apiClient.deployOpportunity('OPP-1', 'proCPX')).rejects.toThrow(
        UI_STRINGS.databaseData.invalidOpportunityHandoff
      );

      fetchMock.mockResolvedValueOnce(new Response('invalid json', { status: 200 }));
      await expect(apiClient.deployOpportunity('OPP-1', 'proCPX')).rejects.toThrow(
        UI_STRINGS.databaseData.invalidOpportunityHandoff
      );
    });

  });

  describe('Module 2 ledger and bridge', () => {
    it('fetches the opportunity ledger with or without an assessment filter', async () => {
      const ledger = [{ oppId: 'OPP-1' }];
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: ledger }));

      await expect(apiClient.getModule2OpportunityLedger('ASS-1')).resolves.toEqual(ledger);
      expectApiFetchCall(fetchMock, '/api/module2/sourcing/opportunity-ledger?assessmentId=ASS-1');

      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: ledger }));

      await expect(apiClient.getModule2OpportunityLedger()).resolves.toEqual(ledger);
      expectApiFetchCall(fetchMock, '/api/module2/sourcing/opportunity-ledger', undefined, -1);
    });

    it('fetches the mathematical bridge with or without an assessment filter', async () => {
      const bridge = { totalIdentifiedSavingsCr: 12.5 };
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: bridge }));

      await expect(apiClient.getModule2MathematicalBridge('ASS-1')).resolves.toEqual(bridge);
      expectApiFetchCall(fetchMock, '/api/module2/sourcing/bridge?assessmentId=ASS-1');

      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: bridge }));

      await expect(apiClient.getModule2MathematicalBridge()).resolves.toEqual(bridge);
      expectApiFetchCall(fetchMock, '/api/module2/sourcing/bridge', undefined, -1);
    });
  });

  describe('conversion funnel and commercial projection', () => {
    it('loads validated conversion stages', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: conversionFunnelStages }));

      await expect(apiClient.getConversionStages()).resolves.toEqual(conversionFunnelStages);
      expectApiFetchCall(fetchMock, '/api/conversion');
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
      expectApiFetchCall(fetchMock, '/api/conversion', expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ annualSpendCr: 500, savingsRate: 10, saasFeeRate: 1 })
        }));

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
      expectApiFetchCall(fetchMock, '/api/report');
    });

    it('loads the dashboard overview through a single GraphQL request', async () => {
      const dashboardOverview = { tenant: { enterprise_name: 'Test Tenant' }, categories: [] };
      fetchMock.mockResolvedValueOnce(jsonResponse({ data: { dashboardOverview } }));

      await expect(apiClient.getDashboardOverviewGraphQL()).resolves.toEqual(dashboardOverview);
      expectApiFetchCall(fetchMock, expect.stringContaining('/api/graphql'), expect.objectContaining({ method: 'POST' }));
    });

    it('converts currency with and without a reference date', async () => {
      const converted = { amount: 100, fromCurrency: 'USD', amountINR: 8300, exchangeRate: 83, rateDate: '2024-12-31' };
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: converted }));

      await expect(apiClient.getCurrencyConversion('USD', 100, 2024)).resolves.toEqual(converted);
      expectApiFetchCall(fetchMock, '/api/currency?from=USD&amount=100&date=2024');

      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: converted }));

      await expect(apiClient.getCurrencyConversion('USD', 100)).resolves.toEqual(converted);
      expectApiFetchCall(fetchMock, '/api/currency?from=USD&amount=100', undefined, -1);
    });
  });

  describe('category details and Module 2 canonical data', () => {
    it('loads the category year-detail matrix', async () => {
      const categoryDetails = [{ category: 'Packaging', year: 2025 }];
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: { categoryDetails } }));

      await expect(apiClient.getCategoryDetails()).resolves.toEqual(categoryDetails);
      expectApiFetchCall(fetchMock, '/api/categories?details=true');
    });

    it('requests Module 2 line items with the optional limit and assessment filters', async () => {
      const lineItems = [{ line_id: 'LI-1' }];
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: { lineItems } }));

      await expect(apiClient.getModule2CanonicalLineItems(25, 'ASM-1')).resolves.toEqual(lineItems);
      expectApiFetchCall(fetchMock, '/api/module2/sourcing/line-items?limit=25&assessmentId=ASM-1');
    });

    it('keeps a zero limit and returns an empty list when the response has no line items', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true }));

      await expect(apiClient.getModule2CanonicalLineItems(0)).resolves.toEqual([]);
      expectApiFetchCall(fetchMock, '/api/module2/sourcing/line-items?limit=0');
    });

    it('sends no filters when Module 2 line items are requested without arguments', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: {} }));

      await expect(apiClient.getModule2CanonicalLineItems()).resolves.toEqual([]);
      expectApiFetchCall(fetchMock, '/api/module2/sourcing/line-items?');
    });

    it('loads the canonical Module 2 input with an encoded assessment id only when one is given', async () => {
      const canonicalInput = { assessment: 'ASM 2' };
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: canonicalInput }));

      await expect(apiClient.getModule2CanonicalInput('ASM 2')).resolves.toEqual(canonicalInput);
      expectApiFetchCall(fetchMock, '/api/module2/sourcing/canonical-input?assessmentId=ASM%202');

      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: canonicalInput }));

      await expect(apiClient.getModule2CanonicalInput()).resolves.toEqual(canonicalInput);
      expectApiFetchCall(fetchMock, '/api/module2/sourcing/canonical-input', undefined, -1);
    });
  });
});
