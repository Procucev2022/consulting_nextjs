import { expectApiFetchCall } from './apiFetchAssertions';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from '../../src/utils/api';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import { setProcurementCategoryMappings, resolveHumanReadableCategory } from '../../src/utils/procurementCategoryResolver';
import { conversionFunnelStages } from '../fixtures/mockData';
import { getD1CategoryMappingsFixture } from '../../../tests/fixtures/d1CategoryMappings';

const materialGroupMappings = getD1CategoryMappingsFixture();

describe('apiClient', () => {
  it('loads conversion stages from D1 and rejects HTTP failures', async () => {
    const data = conversionFunnelStages;
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data })));
    await expect(apiClient.getConversionStages()).resolves.toEqual(data);
    expectApiFetchCall(fetch, '/api/conversion');
    vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 503 }));
    await expect(apiClient.getConversionStages()).rejects.toThrow(UI_STRINGS.databaseData.conversionLoadFailed(503));
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: [{ phase_num: -1 }] })));
    await expect(apiClient.getConversionStages()).rejects.toThrow(UI_STRINGS.databaseData.invalidData);
  });
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    setProcurementCategoryMappings(materialGroupMappings);
    vi.restoreAllMocks();
  });

  it('loads category mappings from D1 and updates the shared resolver', async () => {
    const responseData = { mappings: { P11: 'Packing' }, categories: ['Packing'] };
    global.fetch = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: responseData })));
    await expect(apiClient.getProcurementCategoryMappings()).resolves.toEqual(responseData);
    expectApiFetchCall(global.fetch, '/api/procurement/category-mappings');
    expect(resolveHumanReadableCategory('P11')).toBe('Packing');
  });

  it('reports D1 category mapping HTTP and response errors', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(new Response('{}', { status: 503 }));
    await expect(apiClient.getProcurementCategoryMappings()).rejects.toThrow(UI_STRINGS.databaseData.procurementMappingsLoadFailed);
    global.fetch = vi.fn().mockResolvedValueOnce(new Response('{}'));
    await expect(apiClient.getProcurementCategoryMappings()).rejects.toThrow(UI_STRINGS.databaseData.procurementMappingsLoadFailed);
  });

  it('getTenant should perform GET /api/tenant and return data', async () => {
    const mockData = { tenant_id: 'TNT-123', enterprise_name: 'Test Enterprise' };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      headers: new Headers(),
      json: async () => ({ success: true, data: mockData })
    });

    const res = await apiClient.getTenant();
    expectApiFetchCall(global.fetch, '/api/tenant');
    expect(res).toEqual(mockData);
  });

  it('updateTenant should perform PUT /api/tenant and return data', async () => {
    const mockData = { tenant_id: 'TNT-123', region: 'EU' };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockData })
    });

    const res = await apiClient.updateTenant({ region: 'EU' });
    expectApiFetchCall(global.fetch, '/api/tenant', expect.objectContaining({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region: 'EU' })
      }));
    expect(res).toEqual(mockData);
  });

  it('getIngestionData should perform GET /api/ingestion and return data', async () => {
    const mockData = { queue: [], validationRecords: [] };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      headers: new Headers(),
      json: async () => ({ success: true, data: mockData })
    });

    const res = await apiClient.getIngestionData();
    expectApiFetchCall(global.fetch, '/api/ingestion');
    expect(res).toEqual(mockData);
  });

  it('addIngestionFile should perform POST /api/ingestion and return data', async () => {
    const mockFile = { file_name: 'test.xlsx' };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      headers: new Headers(),
      json: async () => ({ success: true, data: [mockFile] })
    });

    const res = await apiClient.addIngestionFile(mockFile);
    expectApiFetchCall(global.fetch, '/api/ingestion', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockFile)
      }));
    expect(res).toEqual([mockFile]);
  });

  it('updateValidationRecord should perform PATCH /api/ingestion and return data', async () => {
    const updated = { record_id: 'REC-1', po_number: 'PO-UPDATED' };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      headers: new Headers(),
      json: async () => ({ success: true, data: updated })
    });

    const res = await apiClient.updateValidationRecord('REC-1', { po_number: 'PO-UPDATED' });
    expectApiFetchCall(global.fetch, '/api/ingestion', expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record_id: 'REC-1', po_number: 'PO-UPDATED' })
      }));
    expect(res).toEqual(updated);
  });

  it('applyBlanketRemediation should perform POST /api/ingestion/remediate', async () => {
    const mockRes = { updatedCount: 5, skippedCount: 0, records: [] };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      headers: new Headers(),
      json: async () => ({ success: true, data: mockRes })
    });

    const res = await apiClient.applyBlanketRemediation();
    expectApiFetchCall(global.fetch, '/api/ingestion/remediate', expect.objectContaining({ method: 'POST' }));
    expect(res).toEqual(mockRes);
  });

  it('resetValidationRecords should perform DELETE /api/ingestion/validation-records', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      headers: new Headers(),
      json: async () => ({ success: true, data: [] })
    });

    const res = await apiClient.resetValidationRecords();
    expectApiFetchCall(global.fetch, '/api/ingestion/validation-records', expect.objectContaining({ method: 'DELETE' }));
    expect(res).toEqual([]);
  });

  it('getCategories should perform GET /api/categories', async () => {
    const mockData = { categories: [], categoryDetails: [] };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockData })
    });

    const res = await apiClient.getCategories();
    expectApiFetchCall(global.fetch, '/api/categories');
    expect(res).toEqual(mockData);
  });

  it('getVendors should perform GET /api/vendors', async () => {
    const mockData = { vendorRankings: [], vendorDetails: [] };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockData })
    });

    const res = await apiClient.getVendors();
    expectApiFetchCall(global.fetch, '/api/vendors');
    expect(res).toEqual(mockData);
  });

  it('mergeVendor should perform POST /api/vendors', async () => {
    const mockResp = { success: true, message: 'Merged' };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockResp
    });

    const res = await apiClient.mergeVendor('target', 'MST-1', 'Target Corp');
    expectApiFetchCall(global.fetch, '/api/vendors', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetName: 'target', masterId: 'MST-1', canonicalName: 'Target Corp' })
      }));
    expect(res).toEqual(mockResp);
  });

  it('getSavingsOpportunities should perform GET /api/savings', async () => {
    const mockData = { opportunities: [], totalPotentialSavingsCr: 12.5 };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockData })
    });

    const res = await apiClient.getSavingsOpportunities();
    expectApiFetchCall(global.fetch, '/api/savings');
    expect(res).toEqual(mockData);
  });

  it('deployOpportunity should perform POST /api/savings', async () => {
    const mockOpp = { opp_id: 'OPP-1', status: 'Deployed' };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockOpp })
    });

    const res = await apiClient.deployOpportunity('OPP-1', 'proCPX');
    expectApiFetchCall(global.fetch, '/api/savings', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opp_id: 'OPP-1', targetModule: 'proCPX' })
      }));
    expect(res).toEqual(mockOpp);
  });

  it('calculateCommercialSaaS should perform POST /api/conversion', async () => {
    const mockData = { estimatedSavingsCr: 50 };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockData
    });

    const res = await apiClient.calculateCommercialSaaS(500, 10, 1);
    expectApiFetchCall(global.fetch, '/api/conversion', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annualSpendCr: 500, savingsRate: 10, saasFeeRate: 1 })
      }));
    expect(res).toEqual(mockData);
  });

  it('getExecutiveReport should perform GET /api/report', async () => {
    const mockData = { success: true, data: { report: 'Executive' } };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockData
    });

    const res = await apiClient.getExecutiveReport();
    expectApiFetchCall(global.fetch, '/api/report');
    expect(res).toEqual(mockData);
  });

  it('getDashboardOverviewGraphQL should perform batch GraphQL query and return dashboard overview data', async () => {
    const mockOverview = {
      tenant: { enterprise_name: 'Test Tenant' },
      categories: [],
      opportunities: [],
      funnelStages: [],
      ingestionQueue: { items: [], pageInfo: { hasNextPage: false, endCursor: null } },
      validationRecords: { items: [], pageInfo: { hasNextPage: false, endCursor: null } },
      queryMetrics: {
        totalQueries: 5,
        slowQueries: 0,
        cacheHitRatio: 100,
        averageDurationMs: 1.2
      }
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { dashboardOverview: mockOverview }
      })
    });

    const res = await apiClient.getDashboardOverviewGraphQL();
    expectApiFetchCall(global.fetch, expect.stringContaining('/api/graphql'), expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' })
      }));
    expect(res).toEqual(mockOverview);
  });

  it('getPCBIDashboard should perform GET /api/pcbi/dashboard', async () => {
    const mockDash = { summary: { total_spend_inr_cr: 100 } };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockDash
    });

    const res = await apiClient.getPCBIDashboard();
    expectApiFetchCall(global.fetch, '/api/pcbi/dashboard');
    expect(res).toEqual(mockDash);
  });

  it('getConsolidatedSavings should perform GET /api/savings/consolidated', async () => {
    const mockData = { opportunities: [], overlaps: [], waterfallMetrics: {} };
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: mockData })));

    const res = await apiClient.getConsolidatedSavings();
    expectApiFetchCall(global.fetch, '/api/savings/consolidated');
    expect(res).toEqual(mockData);
  });

  it('updateActionPlan should perform POST /api/savings/action-plan/update', async () => {
    const mockPlan = { id: 'ACT-01', status: 'In Progress' };
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: mockPlan })));

    const res = await apiClient.updateActionPlan('ACT-01', { status: 'In Progress', owner: 'Procurement' });
    expectApiFetchCall(global.fetch, '/api/savings/action-plan/update', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId: 'ACT-01', status: 'In Progress', owner: 'Procurement' })
      }));
    expect(res).toEqual(mockPlan);
  });

  it('updateSavingsOpportunityStatus should perform POST /api/savings/opportunity/status', async () => {
    const mockOpp = { opportunity_id: 'OPP-01', status: 'APPROVED' };
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: mockOpp })));

    const res = await apiClient.updateSavingsOpportunityStatus('OPP-01', 'APPROVED');
    expectApiFetchCall(global.fetch, '/api/savings/opportunity/status', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opp_id: 'OPP-01', status: 'APPROVED' })
      }));
    expect(res).toEqual(mockOpp);
  });

  it('getDBMetrics should perform GET /api/db/metrics', async () => {
    const mockMetrics = { queryCount: 10 };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ data: mockMetrics })
    });

    const res = await apiClient.getDBMetrics();
    expectApiFetchCall(global.fetch, '/api/db/metrics');
    expect(res).toEqual(mockMetrics);
  });

  it('getDBTableData should perform GET /api/db/tables with query params', async () => {
    const mockData = { rows: [], total: 0 };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ data: mockData })
    });

    const res = await apiClient.getDBTableData('tenants', 1, 20, 'Acme');
    expectApiFetchCall(global.fetch, expect.stringContaining('/api/db/tables?table=tenants&page=1&limit=20&search=Acme'));
    expect(res).toEqual(mockData);
  });

  it('testDBConnection should perform POST /api/db/test-connection', async () => {
    const mockData = { success: true, latencyMs: 2.5 };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockData
    });

    const res = await apiClient.testDBConnection();
    expectApiFetchCall(global.fetch, '/api/db/test-connection', { method: 'POST' });
    expect(res).toEqual(mockData);
  });

  it('getVendorDetails should perform GET /api/vendors?details=true', async () => {
    const mockDetails = [{ vendor_name: 'Vendor A', year: 2024 }];
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ data: { vendorDetails: mockDetails } })
    });

    const res = await apiClient.getVendorDetails();
    expectApiFetchCall(global.fetch, '/api/vendors?details=true');
    expect(res).toEqual(mockDetails);
  });

  it('loads the D1 currency catalog and validates the response', async () => {
    const catalog = { USD: { currencyCode: 'USD', name: 'US Dollar', currentRate: 83, lastUpdated: '2026-10-30', coverageStatus: 'COVERED', source: 'D1' } };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: catalog })
    });
    await expect(apiClient.getCurrencyRates()).resolves.toEqual(catalog);
    expectApiFetchCall(global.fetch, '/api/currency');
  });

  it('rejects failed and malformed D1 currency catalog responses', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({ message: 'D1 unavailable' }) });
    await expect(apiClient.getCurrencyRates()).rejects.toThrow('D1 unavailable');
    (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: {} }) });
    await expect(apiClient.getCurrencyRates()).rejects.toThrow();
  });

  it('gets historical D1 conversion results and rejects missing or malformed rate results', async () => {
    const mockData = { amount: 100, fromCurrency: 'USD', amountINR: 8300, exchangeRate: 83, rateDate: '2024-12-31' };
    (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: mockData }) });

    const res1 = await apiClient.getCurrencyConversion('USD', 100, 2024);
    expectApiFetchCall(global.fetch, '/api/currency?from=USD&amount=100&date=2024');
    expect(res1).toEqual(mockData);

    (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: mockData }) });
    const res2 = await apiClient.getCurrencyConversion('USD', 100);
    expectApiFetchCall(global.fetch, '/api/currency?from=USD&amount=100');
    expect(res2).toEqual(mockData);

    (global.fetch as any).mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ message: 'No rate for date' }) });
    await expect(apiClient.getCurrencyConversion('USD', 100, '1900-01-01')).rejects.toThrow('No rate for date');
    (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: { exchangeRate: 83 } }) });
    await expect(apiClient.getCurrencyConversion('USD', 100)).rejects.toThrow();
  });

  it('getDBStatus should perform GET /api/db/status', async () => {
    const mockHealth = { status: 'healthy', latencyMs: 5 };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ data: mockHealth })
    });

    const res = await apiClient.getDBStatus();
    expectApiFetchCall(global.fetch, '/api/db/status');
    expect(res).toEqual(mockHealth);
  });

  it('getModule2OpportunityLedger fetches opportunity ledger with or without assessmentId', async () => {
    const mockLedger = [{ oppId: 'OPP-1' }];
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockLedger })
    });

    const res1 = await apiClient.getModule2OpportunityLedger('ASS-1');
    expectApiFetchCall(global.fetch, '/api/module2/sourcing/opportunity-ledger?assessmentId=ASS-1');
    expect(res1).toEqual(mockLedger);

    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockLedger })
    });
    const res2 = await apiClient.getModule2OpportunityLedger();
    expectApiFetchCall(global.fetch, '/api/module2/sourcing/opportunity-ledger');
    expect(res2).toEqual(mockLedger);
  });

  it('getModule2MathematicalBridge fetches mathematical bridge with or without assessmentId', async () => {
    const mockBridge = { totalIdentifiedSavingsCr: 12.5 };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockBridge })
    });

    const res1 = await apiClient.getModule2MathematicalBridge('ASS-1');
    expectApiFetchCall(global.fetch, '/api/module2/sourcing/bridge?assessmentId=ASS-1');
    expect(res1).toEqual(mockBridge);

    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockBridge })
    });
    const res2 = await apiClient.getModule2MathematicalBridge();
    expectApiFetchCall(global.fetch, '/api/module2/sourcing/bridge');
    expect(res2).toEqual(mockBridge);
  });

  describe('apiClient Input Validation Failures', () => {
    it('should throw validation error when updateTenant receives invalid data', async () => {
      await expect(apiClient.updateTenant({ enterprise_name: '' })).rejects.toThrow('Invalid tenant updates');
    });

    it('should throw validation error when addIngestionFile receives invalid data', async () => {
      await expect(apiClient.addIngestionFile({ file_name: '' })).rejects.toThrow('Invalid file data');
    });

    it('should throw validation error when updateValidationRecord receives invalid data', async () => {
      await expect(apiClient.updateValidationRecord('', { resolved: true })).rejects.toThrow('Invalid record update');
    });

    it('should throw validation error when mergeVendor receives invalid data', async () => {
      await expect(apiClient.mergeVendor('', 'M1', 'Name')).rejects.toThrow('Invalid vendor merge payload');
    });

    it('should throw validation error when deployOpportunity receives invalid data', async () => {
      await expect(apiClient.deployOpportunity('', 'proCPX')).rejects.toThrow('Invalid deploy payload');
    });

    it('should throw validation error when calculateCommercialSaaS receives invalid data', async () => {
      await expect(apiClient.calculateCommercialSaaS(-100, 10, 1)).rejects.toThrow('Invalid commercial metrics calculation');
    });

    it('should throw validation error when updateActionPlan receives invalid data', async () => {
      await expect(apiClient.updateActionPlan('', { status: 'In Progress' })).rejects.toThrow('Invalid action plan update');
    });

    it('should throw validation error when updateSavingsOpportunityStatus receives invalid data', async () => {
      await expect(apiClient.updateSavingsOpportunityStatus('', 'APPROVED')).rejects.toThrow('Invalid opportunity status update');
    });
  });
});

