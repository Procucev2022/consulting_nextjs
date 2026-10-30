import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { D1_ROUTE_MESSAGES } from '../src/constants/d1';
import {
  ensureD1Initialized,
  getCanonicalModule1Data,
  getCurrencyRatesFromD1,
  getIngestionDataFromD1,
  getProcurementCategoryMappingsFromD1,
  getTaxonomyFromD1,
  getTenantFromD1,
  handleCryptoRoute,
  handleSavingsRoute,
  lookupTaxonomyRecordFromD1
} from '../src/workerD1';
import {
  createWorkerDatabase,
  insertRows,
  runtimeEnvironment,
  WORKER_CORE_ENCRYPTION_KEY,
  type WorkerDatabaseFixture
} from './helpers/workerCoreFixtures';

const SAVINGS_CONSOLIDATED_URL = 'https://edge.example.com/api/savings/consolidated';
const SAVINGS_STATUS_PATH = '/api/savings/opportunity/status';
const ENCRYPT_URL = 'https://edge.example.com/api/crypto/encrypt';

const BASE_METRICS = {
  totalSpendCr: 100,
  sourceRowCount: 1200,
  validRowCount: 1100,
  excludedRowCount: 100,
  anomalyRowCount: 7,
  cleanSpendYieldPct: 98.5,
  billingMonths: 12
};

let fixture: WorkerDatabaseFixture;

beforeEach(() => {
  fixture = createWorkerDatabase();
});

afterEach(() => {
  fixture.close();
});

const jsonPost = (path: string, body: string): Request =>
  new Request(`https://edge.example.com${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body
  });

const seedMetrics = (overrides: Record<string, number | null> = {}, textMetrics: Record<string, string> = {}): void => {
  const numeric = { ...BASE_METRICS, ...overrides };
  const rows: Array<Array<string | number | null>> = [
    ...Object.entries(numeric).map(([key, value]) => [key, value, null]),
    ...Object.entries(textMetrics).map(([key, value]) => [key, null, value])
  ];
  insertRows(fixture.db, 'INSERT INTO DatasetMetricSummary (metric_key, metric_value, metric_text) VALUES (?, ?, ?)', rows);
};

describe('workerD1 binding guards', () => {
  it('reports a missing D1 binding before any query runs', async () => {
    await expect(ensureD1Initialized(undefined)).rejects.toThrow(D1_ROUTE_MESSAGES.missingBinding);
    await expect(getTenantFromD1(undefined)).rejects.toThrow(D1_ROUTE_MESSAGES.missingBinding);
    await expect(getCanonicalModule1Data(undefined)).rejects.toThrow(D1_ROUTE_MESSAGES.missingBinding);
    await expect(
      handleSavingsRoute(undefined, '/consolidated', jsonPost(SAVINGS_STATUS_PATH, '{}'), new URL(SAVINGS_CONSOLIDATED_URL))
    ).rejects.toThrow(D1_ROUTE_MESSAGES.missingBinding);
  });

  it('resolves when the binding answers the readiness probe', async () => {
    await expect(ensureD1Initialized(fixture.d1)).resolves.toBeUndefined();
  });
});

describe('workerD1 tenant and ingestion reads', () => {
  it('returns the earliest created tenant', async () => {
    insertRows(fixture.db, 'INSERT INTO TenantMaster (tenant_id, enterprise_name, created_at, updated_at) VALUES (?, ?, ?, ?)', [
      ['TNT-NEW', 'Newer Enterprise', '2026-03-01T00:00:00Z', '2026-03-01T00:00:00Z'],
      ['TNT-OLD', 'Original Enterprise', '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z']
    ]);

    await expect(getTenantFromD1(fixture.d1)).resolves.toMatchObject({
      tenant_id: 'TNT-OLD',
      enterprise_name: 'Original Enterprise'
    });
  });

  it('fails loudly when the seed contains no tenant', async () => {
    await expect(getTenantFromD1(fixture.d1)).rejects.toThrow('D1 seed does not contain a tenant record');
  });

  it('normalises currency lists and resolved flags, and summarises the validation records', async () => {
    insertRows(fixture.db, 'INSERT INTO RawDocumentIngestion (doc_id, tenant_id, file_name, uploaded_at, detected_currencies, converted_inr_crores) VALUES (?, ?, ?, ?, ?, ?)', [
      ['DOC-1', 'TNT-1', 'alpha.xlsx', '2026-02-01T00:00:00Z', '["INR","USD"]', 10.5],
      ['DOC-2', 'TNT-2', 'beta.csv', '2026-03-01T00:00:00Z', 'not-json', 3],
      ['DOC-3', 'TNT-1', 'gamma.xlsx', '2026-01-01T00:00:00Z', '{"unexpected":true}', 1],
      ['DOC-4', 'TNT-1', 'delta.xlsx', '2026-04-01T00:00:00Z', null, 0]
    ]);
    insertRows(fixture.db, 'INSERT INTO ValidationPreCheckRecord (record_id, po_number, vendor_name, raw_desc, issue_flag, action_status, resolved, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
      ['REC-1', 'PO-1', 'Acme', 'Item A', 'Passed Clean', 'Ready', 1, '2026-01-10T00:00:00Z'],
      ['REC-2', 'PO-2', 'Beta', 'Item B', 'Duplicate PO', 'Review', 0, '2026-01-11T00:00:00Z'],
      ['REC-3', 'PO-3', 'Gamma', 'Item C', 'Passed Clean', 'Ready', 1, '2026-01-12T00:00:00Z']
    ]);

    const data = await getIngestionDataFromD1(fixture.d1);
    const queue = data.queue as Array<Record<string, unknown>>;
    const records = data.validationRecords as Array<Record<string, unknown>>;

    expect(queue.map((row) => row.doc_id)).toEqual(['DOC-4', 'DOC-2', 'DOC-1', 'DOC-3']);
    expect(queue.map((row) => row.detected_currencies)).toEqual([[], [], ['INR', 'USD'], []]);
    expect(records.map((row) => row.record_id)).toEqual(['REC-3', 'REC-2', 'REC-1']);
    expect(records.map((row) => row.resolved)).toEqual([true, false, true]);
    expect(data.summary).toEqual({ totalFiles: 4, totalRecords: 3, cleanCount: 2, anomaliesCount: 1 });
  });

  it('scopes the ingestion queue to one tenant while keeping validation records global', async () => {
    insertRows(fixture.db, 'INSERT INTO RawDocumentIngestion (doc_id, tenant_id, file_name, uploaded_at) VALUES (?, ?, ?, ?)', [
      ['DOC-1', 'TNT-1', 'alpha.xlsx', '2026-02-01T00:00:00Z'],
      ['DOC-2', 'TNT-2', 'beta.csv', '2026-03-01T00:00:00Z']
    ]);
    insertRows(fixture.db, 'INSERT INTO ValidationPreCheckRecord (record_id, po_number, vendor_name, raw_desc, created_at) VALUES (?, ?, ?, ?, ?)', [
      ['REC-1', 'PO-1', 'Acme', 'Item A', '2026-01-10T00:00:00Z']
    ]);

    const data = await getIngestionDataFromD1(fixture.d1, 'TNT-1');

    expect((data.queue as Array<Record<string, unknown>>).map((row) => row.doc_id)).toEqual(['DOC-1']);
    expect(data.summary).toMatchObject({ totalFiles: 1, totalRecords: 1 });
  });
});

describe('workerD1 canonical Module 1 dataset', () => {
  it('builds the dataset from the metric, vendor, category, monthly and currency tables', async () => {
    seedMetrics({}, { reconciliationStatus: 'RECONCILED WITH NOTES' });
    insertRows(fixture.db, 'INSERT INTO VendorYearDetail (id, rank, vendor_name, master_vendor_id, primary_category, total_3yr_spend_inr_cr) VALUES (?, ?, ?, ?, ?, ?)', [
      ['V1', 1, 'Vendor One', 'MV-1', 'Chemicals', 60],
      ['V2', 2, 'Vendor Two', 'MV-2', 'Packaging', 20]
    ]);
    insertRows(fixture.db, 'INSERT INTO SpendCategorySummary (id, name, category, spend_inr_crores, share_pct, item_count, vendor_count) VALUES (?, ?, ?, ?, ?, ?, ?)', [
      ['C1', 'Chemicals', 'Direct Materials', 50, 50, 3, 2],
      ['C2', '', 'Packaging', 'n/a', 0, 0, 0]
    ]);
    insertRows(fixture.db, 'INSERT INTO Module1MonthlySpend (month_key, spend_inr_cr) VALUES (?, ?)', [
      ['2026-01', 40],
      ['2025-12', 30]
    ]);
    insertRows(fixture.db, 'INSERT INTO Module1CurrencyBreakdown (currency, spend_inr_cr, percentage) VALUES (?, ?, ?)', [
      ['INR', 30, 30],
      ['USD', 70, 70]
    ]);

    const canonical = await getCanonicalModule1Data(fixture.d1);

    expect(canonical).toMatchObject({
      validFxNormalizedSpendCr: 100,
      totalSpendCr: 100,
      sourceRowCount: 1200,
      validRowCount: 1100,
      validRecordsCount: 1100,
      excludedRowCount: 100,
      excludedRecordsCount: 100,
      anomalyRowCount: 7,
      anomalyRecordsCount: 7,
      cleanSpendYieldPct: 98.5,
      top10ConcentrationPct: 80,
      reconciliationStatus: 'RECONCILED WITH NOTES',
      billingMonths: 12
    });
    expect(canonical.supplierSpend).toEqual([
      { supplierName: 'Vendor One', spend_inr_cr: 60, sharePct: 60, paretoClass: 'A' },
      { supplierName: 'Vendor Two', spend_inr_cr: 20, sharePct: 20, paretoClass: 'A' }
    ]);
    expect(canonical.categorySpend).toEqual(expect.arrayContaining([
      { category: 'Chemicals', spend_inr_cr: 50, sharePct: 50, itemCount: 3, vendorCount: 2 },
      { category: 'Packaging', spend_inr_cr: 0, sharePct: 0, itemCount: 0, vendorCount: 0 }
    ]));
    expect(canonical.monthlySpend).toEqual([
      { month_key: '2025-12', spend_inr_cr: 30 },
      { month_key: '2026-01', spend_inr_cr: 40 }
    ]);
    expect(canonical.currencyBreakdown).toEqual([
      { currency: 'USD', spend_inr_cr: 70, percentage: 70 },
      { currency: 'INR', spend_inr_cr: 30, percentage: 30 }
    ]);
  });

  it('defaults the reconciliation status and reports zero concentration when total spend is zero', async () => {
    seedMetrics({ totalSpendCr: 0 });
    insertRows(fixture.db, 'INSERT INTO VendorYearDetail (id, rank, vendor_name, master_vendor_id, primary_category, total_3yr_spend_inr_cr) VALUES (?, ?, ?, ?, ?, ?)', [
      ['V1', 1, 'Vendor One', 'MV-1', 'Chemicals', 60]
    ]);

    const canonical = await getCanonicalModule1Data(fixture.d1);

    expect(canonical.reconciliationStatus).toBe('RECONCILED');
    expect(canonical.top10ConcentrationPct).toBe(0);
    expect(canonical.supplierSpend).toEqual([{ supplierName: 'Vendor One', spend_inr_cr: 60, sharePct: 0, paretoClass: 'A' }]);
  });

  it('fails loudly when no metric rows exist', async () => {
    await expect(getCanonicalModule1Data(fixture.d1)).rejects.toThrow(
      'D1 seed is missing required dataset metric: totalSpendCr'
    );
  });

  it('fails loudly when a required metric is stored as NULL', async () => {
    seedMetrics({ sourceRowCount: null });

    await expect(getCanonicalModule1Data(fixture.d1)).rejects.toThrow(
      'D1 seed is missing required dataset metric: sourceRowCount'
    );
  });

  it('fails loudly when a required metric holds non-numeric text', async () => {
    seedMetrics();
    fixture.db.prepare('UPDATE DatasetMetricSummary SET metric_value = ? WHERE metric_key = ?').run('abc', 'validRowCount');

    await expect(getCanonicalModule1Data(fixture.d1)).rejects.toThrow(
      'D1 seed is missing required dataset metric: validRowCount'
    );
  });

  it('reports a missing canonical dataset when an assessment has no stored canonical payload', async () => {
    await expect(getCanonicalModule1Data(fixture.d1, 'AIC-404')).rejects.toThrow(
      D1_ROUTE_MESSAGES.missingCanonical('AIC-404')
    );
  });
});

describe('workerD1 savings routes', () => {
  it('returns assessment-scoped metrics and never includes global opportunities for another assessment', async () => {
    insertRows(fixture.db, `INSERT INTO AssessmentRecord (
      assessment_id, customer_id, customer_name, industry, assessment_owner, total_spend_cr, validated_spend_cr,
      addressable_spend_cr, gross_opportunity_cr, overlap_deductions_cr, net_defensible_opportunity_cr,
      proven_opportunity_cr, potential_savings_cr
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      ['A1', 'T1', 'Client One', 'Chemicals', 'analyst@example.test', 80, 72, 60, 8, 2, 6, 4, 6]
    ]);
    insertRows(fixture.db, 'INSERT INTO AssessmentAnalysisRun (analysis_run_id, assessment_id, data_version_id, metrics_json) VALUES (?, ?, ?, ?)', [
      ['RUN-A1', 'A1', 'DV-A1', JSON.stringify({
        opportunities: [{ opportunity_id: 'A1-OPP', potential_savings_inr_cr: 8 }],
        actionPlans: [{ id: 'A1-ACT' }], overlaps: [{ id: 'A1-OVERLAP' }], validatedSavingsInrCr: 5
      })]
    ]);
    seedSavings();
    seedActionPlans();

    for (const [query, headers] of [
      ['?assessmentId=A1', {}], ['', { 'x-assessment-id': 'A1' }]
    ] as const) {
      const request = new Request(`${SAVINGS_CONSOLIDATED_URL}${query}`, { headers });
      const result = await handleSavingsRoute(fixture.d1, '/consolidated', request, new URL(request.url));
      expect(result.data).toMatchObject({
        dataScope: { assessmentId: 'A1' }, assessmentId: 'A1',
        opportunities: [{ opportunity_id: 'A1-OPP' }], actionPlans: [{ id: 'A1-ACT' }],
        overlaps: [{ id: 'A1-OVERLAP' }], totalGrossSavingsCr: 8, overlapDeductionCr: 2, netClientSavingsCr: 6,
        waterfallMetrics: {
          total_spend_inr_cr: 80, addressable_spend_inr_cr: 60,
          gross_potential_savings_inr_cr: 8, deduplicated_overlap_inr_cr: 2,
          net_potential_savings_inr_cr: 6, validated_savings_inr_cr: 5
        }
      });
      expect((result.data as { opportunities: Array<{ opportunity_id: string }> }).opportunities)
        .not.toContainEqual(expect.objectContaining({ opportunity_id: 'OPP-1' }));
    }
  });

  it('returns empty scoped collections when no run exists and rejects missing or mismatched scope', async () => {
    insertRows(fixture.db, 'INSERT INTO AssessmentRecord (assessment_id, customer_id, customer_name, industry, assessment_owner) VALUES (?, ?, ?, ?, ?)', [
      ['A1', 'T1', 'Client One', 'Chemicals', 'analyst@example.test']
    ]);
    const scoped = new Request(`${SAVINGS_CONSOLIDATED_URL}?assessmentId=A1`);
    expect((await handleSavingsRoute(fixture.d1, '/consolidated', scoped, new URL(scoped.url)).then((result) => result.data)))
      .toMatchObject({ dataScope: { assessmentId: 'A1' }, opportunities: [], actionPlans: [], overlaps: [] });
    const missingAssessment = new Request(`${SAVINGS_CONSOLIDATED_URL}?assessmentId=NOPE`);
    expect(await handleSavingsRoute(fixture.d1, '/consolidated', missingAssessment, new URL(missingAssessment.url)))
      .toMatchObject({ status: 404, data: { success: false } });
    const wrongTenant = new Request(`${SAVINGS_CONSOLIDATED_URL}?assessmentId=A1&tenantId=T2`);
    expect(await handleSavingsRoute(fixture.d1, '/consolidated', wrongTenant, new URL(wrongTenant.url)))
      .toMatchObject({ status: 404, data: { success: false } });
  });

  it('rejects malformed scope and requires an assessment identifier for a scoped savings request', async () => {
    const tenantOnly = new Request(`${SAVINGS_CONSOLIDATED_URL}?tenantId=T1`);
    expect(await handleSavingsRoute(fixture.d1, '/consolidated', tenantOnly, new URL(tenantOnly.url)))
      .toMatchObject({ status: 400, data: { success: false, message: D1_ROUTE_MESSAGES.savingsAssessmentRequired } });
    const invalid = new Request(`${SAVINGS_CONSOLIDATED_URL}?assessmentId=`);
    expect(await handleSavingsRoute(fixture.d1, '/consolidated', invalid, new URL(invalid.url)))
      .toMatchObject({ status: 400, data: { success: false, message: D1_ROUTE_MESSAGES.invalidDatasetScope } });
  });
  const seedSavings = (): void => {
    insertRows(fixture.db, 'INSERT INTO SavingsOpportunity (opp_id, category, title, est_savings_inr_cr, status) VALUES (?, ?, ?, ?, ?)', [
      ['OPP-1', 'Logistics', 'Freight consolidation', 1.25, 'Identified'],
      ['OPP-2', 'Packaging', 'Carton standardisation', 2.5, 'Identified']
    ]);
  };

  const seedActionPlans = (): void => {
    insertRows(fixture.db, 'INSERT INTO ActionPlanItem (id, opp_id, title, lever, category, est_savings_inr_cr, owner, quarter, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
      ['ACT-1', 'OPP-1', 'Negotiate freight lanes', 'E-Auctions', 'Logistics', 1.25, 'Procurement', 'Q4 2026', 'PLANNED', '2026-10-01', '2026-10-01'],
      ['ACT-2', 'OPP-2', 'Standardize carton grades', 'Supplier Consolidation', 'Packaging', 2.5, 'SCM', 'Q1 2027', 'IN_PROGRESS', '2026-10-02', '2026-10-02']
    ]);
    insertRows(fixture.db, 'INSERT INTO ActionPlanItemDetails (action_id, target_date, priority, comments) VALUES (?, ?, ?, ?)', [
      ['ACT-1', '2026-12-15', 'HIGH', 'Confirm lane baseline'],
      ['ACT-2', '2027-03-31', 'MEDIUM', null]
    ]);
  };

  it('nets consolidated gross savings against the earliest assessment overlap deduction', async () => {
    seedSavings();
    seedActionPlans();
    insertRows(fixture.db, 'INSERT INTO AssessmentRecord (assessment_id, customer_id, customer_name, industry, assessment_owner, total_spend_cr, validated_spend_cr, gross_opportunity_cr, addressable_spend_cr, overlap_deductions_cr, net_defensible_opportunity_cr, potential_savings_cr, savings_pct, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
      ['AIC-A', 'CUST-A', 'Alpha', 'Textile', 'analyst', 7.5, 7.5, 3, 7.5, 0.5, 2.5, 2.5, 33.3, 'APPROVED', '2026-01-05T00:00:00Z']
    ]);

    const result = await handleSavingsRoute(fixture.d1, '/consolidated', new Request(SAVINGS_CONSOLIDATED_URL), new URL(SAVINGS_CONSOLIDATED_URL));

    expect(result.status).toBeUndefined();
    expect(result.data).toMatchObject({
      totalGrossSavingsCr: 3.75,
      overlapDeductionCr: 0.5,
      netClientSavingsCr: 3.25,
      actionPlansCount: 2,
      waterfallMetrics: {
        total_spend_inr_cr: 7.5,
        addressable_spend_inr_cr: 7.5,
        gross_potential_savings_inr_cr: 3.75,
        deduplicated_overlap_inr_cr: 0.5,
        net_potential_savings_inr_cr: 3.25
      },
      actionPlans: [
        { id: 'ACT-1', status: 'Open', target_date: '2026-12-15', priority: 'HIGH' },
        { id: 'ACT-2', status: 'In Progress', target_date: '2027-03-31', priority: 'MEDIUM' }
      ]
    });
    expect((result.data as { opportunities: Array<{ opportunity_id: string }> }).opportunities.map((row) => row.opportunity_id)).toEqual(['OPP-2', 'OPP-1']);
  });

  it('applies no overlap deduction when no assessment exists yet', async () => {
    seedSavings();

    const result = await handleSavingsRoute(fixture.d1, '/consolidated', new Request(SAVINGS_CONSOLIDATED_URL), new URL(SAVINGS_CONSOLIDATED_URL));

    expect(result.data).toMatchObject({ totalGrossSavingsCr: 3.75, overlapDeductionCr: 0, netClientSavingsCr: 3.75 });
  });

  it('updates an opportunity status and returns the refreshed row', async () => {
    seedSavings();

    const result = await handleSavingsRoute(
      fixture.d1,
      '/opportunity/status',
      jsonPost(SAVINGS_STATUS_PATH, JSON.stringify({ opp_id: 'OPP-1', status: 'APPROVED' })),
      new URL(`https://edge.example.com${SAVINGS_STATUS_PATH}`)
    );

    expect(result.data).toMatchObject({ opp_id: 'OPP-1', status: 'APPROVED' });
    await expect(fixture.d1.prepare('SELECT status FROM SavingsOpportunity WHERE opp_id = ?').bind('OPP-1').first()).resolves.toEqual({ status: 'APPROVED' });
  });

  it.each([
    ['an empty object', '{}'],
    ['only an opportunity id', JSON.stringify({ opp_id: 'OPP-1' })],
    ['only a status', JSON.stringify({ status: 'APPROVED' })],
    ['a non-string opportunity id', JSON.stringify({ opp_id: 42, status: 'APPROVED' })],
    ['an unsupported status', JSON.stringify({ opp_id: 'OPP-1', status: 'Approved' })]
  ])('rejects a status update with %s', async (_label, body) => {
    const result = await handleSavingsRoute(
      fixture.d1,
      '/opportunity/status',
      jsonPost(SAVINGS_STATUS_PATH, body),
      new URL(`https://edge.example.com${SAVINGS_STATUS_PATH}`)
    );

    expect(result).toMatchObject({ status: 400, data: { success: false, message: 'Opportunity status validation failed.' } });
  });

  it('treats a malformed status-update body as missing fields instead of failing', async () => {
    const result = await handleSavingsRoute(
      fixture.d1,
      '/opportunity/status',
      jsonPost(SAVINGS_STATUS_PATH, '{"opp_id":'),
      new URL(`https://edge.example.com${SAVINGS_STATUS_PATH}`)
    );

    expect(result).toMatchObject({ status: 400, data: { success: false, message: 'Opportunity status validation failed.' } });
  });

  it('rejects updates for opportunities that are absent from D1', async () => {
    const result = await handleSavingsRoute(
      fixture.d1,
      '/opportunity/status',
      jsonPost(SAVINGS_STATUS_PATH, JSON.stringify({ opp_id: 'OPP-MISSING', status: 'APPROVED' })),
      new URL(`https://edge.example.com${SAVINGS_STATUS_PATH}`)
    );

    expect(result).toMatchObject({ status: 404, data: { success: false } });
  });

  it('updates persisted action-plan owner, status, priority and comments, then returns the refreshed plan', async () => {
    seedSavings();
    seedActionPlans();
    const path = '/api/savings/action-plan/update';

    const result = await handleSavingsRoute(
      fixture.d1,
      '/action-plan/update',
      jsonPost(path, JSON.stringify({ actionId: 'ACT-1', status: 'Completed', owner: 'Finance', priority: 'LOW', comments: 'Signed off' })),
      new URL(`https://edge.example.com${path}`)
    );

    expect(result).toMatchObject({ data: {
      id: 'ACT-1', status: 'Completed', owner: 'Finance', priority: 'LOW', comments: 'Signed off', target_date: '2026-12-15'
    } });
    await expect(fixture.d1.prepare('SELECT status, owner FROM ActionPlanItem WHERE id = ?').bind('ACT-1').first())
      .resolves.toEqual({ status: 'COMPLETED', owner: 'Finance' });
    await expect(fixture.d1.prepare('SELECT priority, comments FROM ActionPlanItemDetails WHERE action_id = ?').bind('ACT-1').first())
      .resolves.toEqual({ priority: 'LOW', comments: 'Signed off' });
  });

  it.each([
    ['invalid fields', JSON.stringify({ actionId: '', owner: 'Unknown' }), 400],
    ['no updates', JSON.stringify({ actionId: 'ACT-1' }), 400],
    ['unknown plan', JSON.stringify({ actionId: 'ACT-MISSING', status: 'Completed' }), 404],
    ['malformed JSON', '{"actionId":', 400]
  ])('rejects an action-plan update with %s', async (_label, body, status) => {
    seedActionPlans();
    const path = '/api/savings/action-plan/update';
    const result = await handleSavingsRoute(
      fixture.d1, '/action-plan/update', jsonPost(path, body), new URL(`https://edge.example.com${path}`)
    );
    expect(result.status).toBe(status);
  });

  it('rejects wrong methods and unknown savings endpoints without claiming successful updates', async () => {
    const getRequest = new Request(`https://edge.example.com${SAVINGS_STATUS_PATH}`);

    await expect(handleSavingsRoute(fixture.d1, '/opportunity/status', getRequest, new URL(getRequest.url))).resolves.toEqual({
      status: 405, data: { success: false, message: D1_ROUTE_MESSAGES.savingsMethod }
    });
    await expect(handleSavingsRoute(fixture.d1, '/unknown', new Request(SAVINGS_CONSOLIDATED_URL), new URL(SAVINGS_CONSOLIDATED_URL))).resolves.toEqual({
      status: 404, data: { success: false, message: D1_ROUTE_MESSAGES.unknownSavings }
    });
    await expect(handleSavingsRoute(fixture.d1, '/consolidated', jsonPost('/api/savings/consolidated', '{}'), new URL(SAVINGS_CONSOLIDATED_URL)))
      .resolves.toEqual({ status: 405, data: { success: false, message: D1_ROUTE_MESSAGES.savingsMethod } });
    await expect(handleSavingsRoute(fixture.d1, '/action-plan/update', new Request('https://edge.example.com/api/savings/action-plan/update'), new URL(SAVINGS_CONSOLIDATED_URL)))
      .resolves.toEqual({ status: 405, data: { success: false, message: D1_ROUTE_MESSAGES.savingsMethod } });
  });
});

describe('workerD1 taxonomy catalogue', () => {
  const seedCatalogue = (): void => {
    insertRows(fixture.db, 'INSERT INTO UNSPSCCommodity (commodity_code, commodity_title, class_code, class_title, family_code, family_title, segment_code, segment_title, core_bucket, classification_status, taxonomy_version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
      ['11101501', 'Hydrochloric acid', '11101500', 'Acids', '11100000', 'Chemicals', '11000000', 'Chemicals & Materials', 'Direct Materials', 'CLASSIFIED', '2026.1'],
      ['11101502', 'Sulphuric acid', '11101500', 'Acids', '11100000', 'Chemicals', '11000000', 'Chemicals & Materials', 'Direct Materials', 'CLASSIFIED', '2026.1'],
      ['14111500', 'Copier paper', '14111500', 'Paper', '14110000', 'Paper products', '14000000', 'Paper', 'Indirect & MRO', 'CLASSIFIED', '2026.1'],
      ['31201500', 'Corrugated carton', '31201500', 'Cartons', '31200000', 'Packaging', '31000000', 'Packaging Materials', 'Packaging Materials', 'CLASSIFIED', '2026.1'],
      ['78101800', 'Freight forwarding', '78101800', 'Freight', '78100000', 'Transport', '78000000', 'Logistics', 'Logistics & Freight', 'CLASSIFIED', '2026.1']
    ]);
  };

  it('lists commodities in code order with the default page size when no filter is given', async () => {
    seedCatalogue();

    const rows = await getTaxonomyFromD1(fixture.d1, '', '', '');

    expect(Array.isArray(rows) && rows.map((row) => row.commodityCode)).toEqual(['11101501', '11101502', '14111500', '31201500', '78101800']);
    expect(Array.isArray(rows) && rows[0]).toEqual({
      commodityCode: '11101501',
      commodityTitle: 'Hydrochloric acid',
      classCode: '11101500',
      classTitle: 'Acids',
      familyCode: '11100000',
      familyTitle: 'Chemicals',
      segmentCode: '11000000',
      segmentTitle: 'Chemicals & Materials',
      coreBucket: 'Direct Materials',
      classificationStatus: 'CLASSIFIED'
    });
  });

  it('matches code or title fragments case-insensitively', async () => {
    seedCatalogue();

    const byTitle = await getTaxonomyFromD1(fixture.d1, 'ACID', '', '');
    const byCode = await getTaxonomyFromD1(fixture.d1, '78101800', '', '');

    expect(Array.isArray(byTitle) && byTitle.map((row) => row.commodityCode)).toEqual(['11101501', '11101502']);
    expect(Array.isArray(byCode) && byCode.map((row) => row.commodityCode)).toEqual(['78101800']);
  });

  it('filters by core bucket and treats the ALL sentinel as no filter', async () => {
    seedCatalogue();

    const packaging = await getTaxonomyFromD1(fixture.d1, '', 'Packaging Materials', '');
    const everything = await getTaxonomyFromD1(fixture.d1, '', 'ALL', '');
    const acidsInDirect = await getTaxonomyFromD1(fixture.d1, 'acid', 'Direct Materials', '');
    const paperInDirect = await getTaxonomyFromD1(fixture.d1, 'paper', 'Direct Materials', '');

    expect(Array.isArray(packaging) && packaging.map((row) => row.commodityCode)).toEqual(['31201500']);
    expect(Array.isArray(everything) && everything).toHaveLength(5);
    expect(Array.isArray(acidsInDirect) && acidsInDirect).toHaveLength(2);
    expect(paperInDirect).toEqual([]);
  });

  it('paginates with the requested limit and offset', async () => {
    seedCatalogue();

    const page = await getTaxonomyFromD1(fixture.d1, '', '', '', 2, 2);

    expect(Array.isArray(page) && page.map((row) => row.commodityCode)).toEqual(['14111500', '31201500']);
  });

  it('returns one record for an exact lookup, ignoring query and offset, and null when nothing matches', async () => {
    seedCatalogue();

    const found = await getTaxonomyFromD1(fixture.d1, 'ignored', '', '11101502', 50, 4);
    const missing = await getTaxonomyFromD1(fixture.d1, '', '', 'NOPE');

    expect(found).toMatchObject({ commodityCode: '11101502', commodityTitle: 'Sulphuric acid' });
    expect(missing).toBeNull();
  });

  it('looks up a single commodity record by code and returns undefined for unknown codes', async () => {
    seedCatalogue();

    await expect(lookupTaxonomyRecordFromD1(fixture.d1, '31201500')).resolves.toMatchObject({ commodityTitle: 'Corrugated carton' });
    await expect(lookupTaxonomyRecordFromD1(fixture.d1, 'NOPE')).resolves.toBeUndefined();
  });
});

describe('workerD1 currency and category reference data', () => {
  it('returns the latest reference rate per currency with a source fallback and zero rate when none exists', async () => {
    insertRows(fixture.db, 'INSERT INTO FxCurrencyMaster (currency, currency_name, coverage_status, approved_source, fx_master_version) VALUES (?, ?, ?, ?, ?)', [
      ['USD', 'US Dollar', 'FULL', 'RBI', 'FX-2026'],
      ['EUR', 'Euro', 'PARTIAL', 'ECB', 'FX-2026'],
      ['GBP', 'Pound Sterling', 'PARTIAL', null, 'FX-2026']
    ]);
    insertRows(fixture.db, 'INSERT INTO FxReferenceRate (currency, rate_date, inr_per_unit, source_name, fx_master_version) VALUES (?, ?, ?, ?, ?)', [
      ['USD', '2026-01-01', 83.1, 'RBI-OLD', 'FX-2026'],
      ['USD', '2026-02-01', 86.5, 'Yahoo', 'FX-2026'],
      ['EUR', '2026-01-15', 92, null, 'FX-2026']
    ]);

    const rates = await getCurrencyRatesFromD1(fixture.d1);

    expect(rates.USD).toEqual({
      ticker: 'USDINR=X',
      currencyPair: 'USD / INR',
      currencyCode: 'USD',
      name: 'US Dollar',
      currentRate: 86.5,
      lastUpdated: '2026-02-01',
      coverageStatus: 'FULL',
      source: 'Yahoo'
    });
    expect(rates.EUR).toMatchObject({ currentRate: 92, lastUpdated: '2026-01-15', source: 'ECB' });
    expect(rates.GBP).toMatchObject({ currentRate: 0, lastUpdated: null, source: null });
  });

  it('maps procurement material groups to categories with a sorted, de-duplicated category list', async () => {
    insertRows(fixture.db, 'INSERT INTO ProcurementCategoryMapping (material_group_code, category_name) VALUES (?, ?)', [
      ['P11', 'Packing'],
      ['P12', 'Packing'],
      ['S03', 'PRINTING & STATIONARY']
    ]);

    const withoutRequestId = await getProcurementCategoryMappingsFromD1(fixture.d1);
    const withRequestId = await getProcurementCategoryMappingsFromD1(fixture.d1, 'req-42');

    expect(withoutRequestId).toEqual({
      mappings: { P11: 'Packing', P12: 'Packing', S03: 'PRINTING & STATIONARY' },
      categories: ['PRINTING & STATIONARY', 'Packing']
    });
    expect(withRequestId).toEqual(withoutRequestId);
  });
});

describe('workerD1 crypto route', () => {
  it('returns the readiness payload for GET requests and for other crypto paths', async () => {
    const readiness = { data: { message: 'Crypto endpoint ready' } };

    await expect(handleCryptoRoute(new Request('https://edge.example.com/api/crypto'), new URL('https://edge.example.com/api/crypto'), runtimeEnvironment())).resolves.toEqual(readiness);
    await expect(handleCryptoRoute(new Request(ENCRYPT_URL), new URL(ENCRYPT_URL), runtimeEnvironment())).resolves.toEqual(readiness);
  });

  it.each([
    ['an empty object', '{}'],
    ['a non-string plaintext', JSON.stringify({ plaintext: 42 })],
    ['malformed JSON', '{"plaintext": ']
  ])('rejects %s with a 400 and no encryption attempt', async (_label, body) => {
    const result = await handleCryptoRoute(jsonPost('/api/crypto/encrypt', body), new URL(ENCRYPT_URL), runtimeEnvironment());

    expect(result).toEqual({ data: { success: false, message: 'plaintext is required' }, status: 400 });
  });

  it('refuses to encrypt when the configured key is not 32 bytes', async () => {
    const result = await handleCryptoRoute(
      jsonPost('/api/crypto/encrypt', JSON.stringify({ plaintext: 'secret' })),
      new URL(ENCRYPT_URL),
      runtimeEnvironment({ APP_ENCRYPTION_KEY: 'too-short' })
    );

    expect(result).toEqual({ data: { success: false, message: 'APP_ENCRYPTION_KEY must be 32 bytes' }, status: 500 });
  });

  it('fails when the runtime configuration lacks AUTH_SECRET', async () => {
    await expect(
      handleCryptoRoute(
        jsonPost('/api/crypto/encrypt', JSON.stringify({ plaintext: 'secret' })),
        new URL(ENCRYPT_URL),
        runtimeEnvironment({ AUTH_SECRET: undefined })
      )
    ).rejects.toThrow('AUTH_SECRET must be configured in the deployment environment');
  });

  it('encrypts with AES-256-GCM and returns a payload that decrypts back to the plaintext', async () => {
    const plaintext = 'Invoice 42: 1.5 crore';

    const result = await handleCryptoRoute(
      jsonPost('/api/crypto/encrypt', JSON.stringify({ plaintext })),
      new URL(ENCRYPT_URL),
      runtimeEnvironment()
    );
    const payload = result.data as { success: boolean; algorithm: string; iv: string; tag: string; ciphertext: string; compact: string };
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(WORKER_CORE_ENCRYPTION_KEY), { name: 'AES-GCM' }, false, ['decrypt']);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: Buffer.from(payload.iv, 'base64') },
      key,
      Buffer.concat([Buffer.from(payload.ciphertext, 'base64'), Buffer.from(payload.tag, 'base64')])
    );

    expect(payload).toMatchObject({ success: true, algorithm: 'aes-256-gcm' });
    expect(Buffer.from(payload.iv, 'base64')).toHaveLength(12);
    expect(Buffer.from(payload.tag, 'base64')).toHaveLength(16);
    expect(payload.compact).toBe(`aes256gcm:${payload.iv}:${payload.tag}:${payload.ciphertext}`);
    expect(new TextDecoder().decode(decrypted)).toBe(plaintext);
  });

  it('uses a fresh nonce for every encryption of the same plaintext', async () => {
    const body = JSON.stringify({ plaintext: 'same text' });

    const first = (await handleCryptoRoute(jsonPost('/api/crypto/encrypt', body), new URL(ENCRYPT_URL), runtimeEnvironment())).data as { iv: string; ciphertext: string };
    const second = (await handleCryptoRoute(jsonPost('/api/crypto/encrypt', body), new URL(ENCRYPT_URL), runtimeEnvironment())).data as { iv: string; ciphertext: string };

    expect(first.iv).not.toBe(second.iv);
    expect(first.ciphertext).not.toBe(second.ciphertext);
  });
});
