import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { clearScopedModule2Cache, handleScopedModule2Route } from '../../src/services/workerD1Module2Scoped';
import { DEFAULT_CACHE_TTL_MS } from '../../src/constants/db';
import {
  MODULE2_D1_PENDING_ROUTES, MODULE2_D1_PROFILE_LIST_BUDGET_BYTES, MODULE2_D1_SCOPED_MESSAGES
} from '../../src/constants/module2D1Scoped';
import type { CloudflareD1Database } from '../../src/types/cloudflare';
import type { D1Record } from '../../src/types/d1';
import type { ProcurementTransactionScope } from '../../src/types/procurementTransactionD1';
import type { ScopedModule2FilterOptions, ScopedModule2RouteLoaders } from '../../src/types/module2D1ScopedRoutes';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { D1_LOCAL_SQLITE_PATH_ENV } from '../../src/constants/procurementTransactionD1';
import { Module2CategoryProfileHelper } from '../../src/services/module2CategoryProfileHelper';
import { getD1CategoryMappingsFixture } from '../../../tests/fixtures/d1CategoryMappings';
import { createWorkerDatabase } from '../helpers/workerCoreFixtures';
import { Module2CompactSourcingEngine } from '../../src/services/module2CompactSourcingEngine';
import { buildCategorySpecialisationFromD1 } from '../../src/services/workerD1CategorySpecialisation';
import { MODULE2_D1_CATEGORY_SPECIALISATION } from '../../src/constants/module2CategorySpecialisationD1';
import { handleScopedSpecialRoute } from '../../src/services/workerD1Module2ScopedSpecialRoutes';

const categoryMappings = getD1CategoryMappingsFixture();

vi.mock('../../src/utils/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

const transaction = (id: string, amount: number, category: string, vendor = 'Supplier A'): D1Record => ({
  id, vendor_name: vendor, material_desc: 'Industrial paper roll', quantity: 10, unit_price: amount / 10,
  total_spend_inr: amount, po_number: 'PO1', po_line: 10, po_date: '2026-01-01', vendor_code: vendor,
  material_code: id, uom: 'KG', currency: 'INR', plant: 'Plant', spend_category: category
});

const database = (datasets: Record<string, D1Record[]> = {
  A1: [transaction('T1', 100, 'Packing'), transaction('T2', 200, 'STEEL'),
    transaction('T3', 300, 'Packing', 'Supplier B')],
  A2: [transaction('T4', 900, 'Chemicals', 'Other Client Supplier')]
}) => {
  const categoryMappingRows = Object.entries(categoryMappings).map(([material_group_code, category_name]) => ({
    material_group_code, category_name
  }));
  const all = vi.fn();
  const bind = vi.fn().mockImplementation((...values: string[]) => ({
    all: () => { all(...values); return Promise.resolve({ results: datasets[values[0]] || [] }); }
  }));
  const prepare = vi.fn().mockReturnValue({ bind, all: () => Promise.resolve({ results: categoryMappingRows }) });
  return { db: { prepare } as unknown as CloudflareD1Database, prepare, bind, all };
};

const call = (db: CloudflareD1Database, path: string, query = '?assessmentId=A1', headers = {}) => {
  const url = new URL(`https://edge.test/api/module2/sourcing${path}${query}`);
  return handleScopedModule2Route(db, path, new Request(url, { headers }), url);
};

describe('assessment-scoped D1 sourcing adapter', () => {
  beforeEach(() => clearScopedModule2Cache());
  afterEach(() => vi.restoreAllMocks());

  it('uses validated INR amounts and excludes rejected populations from scoped sourcing', async () => {
    const fixture = createWorkerDatabase();
    const analyze = vi.spyOn(Module2CompactSourcingEngine, 'analyze');
    const insert = fixture.db.prepare('INSERT INTO ProcurementTransaction (transaction_id, tenant_id, assessment_id, ' +
      'supplier_name, short_text, material_group, order_quantity, order_unit, net_price, currency, total_inr_raw, raw_json) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    try {
      for (const [id, inclusionStatus] of [['VALID-USD', 'VALID'], ['EXCLUDED', 'EXCLUDED'], ['ANOMALY', 'ANOMALY']]) {
        insert.run(id, 'T1', 'A1', 'Vendor', 'Paper', 'Packing', 2, 'KG', 10, 'USD', 3000,
          JSON.stringify({ inclusionStatus, lineSpendInr: 40, inrUnitPrice: 20, transactionDate: '2026-01-01' }));
      }
      insert.run('LEGACY-INR', 'T1', 'A1', 'Vendor', 'Paper', 'Packing', 1, 'KG', 10, 'INR', 10, '{}');
      expect((await call(fixture.d1, '/dashboard'))?.data).toMatchObject({ totalSpendAnalyzedInr: 50 });
      expect(analyze.mock.calls[0][0]).toEqual([
        expect.objectContaining({ id: 'VALID-USD', unit_price: 20, total_spend_inr: 40, po_date: '2026-01-01' }),
        expect.objectContaining({ id: 'LEGACY-INR', unit_price: 10, total_spend_inr: 10 })
      ]);
    } finally { fixture.close(); }
  });

  it('delegates unselected and already scoped row endpoints without querying', async () => {
    const fixture = database();
    expect(await call(fixture.db, '/dashboard', '')).toBeNull();
    expect(await call(fixture.db, '/line-items')).toBeNull();
    expect(await call(fixture.db, '/canonical-input')).toBeNull();
    expect((await call(fixture.db, '/dashboard', '?assessmentId='))?.status).toBe(400);
    expect((await call(fixture.db, '/dashboard', '?tenantId='))?.status).toBe(400);
    expect(fixture.prepare).not.toHaveBeenCalled();
  });

  it('runs the existing engine on only the selected D1 rows and preserves the frontend profile contract', async () => {
    const fixture = database();
    const evidenceBuilder = vi.spyOn(Module2CategoryProfileHelper, 'enrichEvidenceChain');
    const first = await call(fixture.db, '/dashboard', '?assessmentId=A1&tenantId=T1', { 'x-request-id': 'req-1' });
    expect(first?.data).toMatchObject({ totalSpendAnalyzedInr: 600, categoriesAnalyzedCount: 2 });
    expect(fixture.prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE assessment_id = ? AND tenant_id = ?'));
    expect(fixture.bind).toHaveBeenCalledWith('A1', 'T1');
    const categories = await call(fixture.db, '/categories', '?assessmentId=A1&tenantId=T1');
    expect((categories?.data as any).profiles.every((profile: any) => profile.scorecard && profile.suppliers)).toBe(true);
    expect((categories?.data as any).count).toBe(2);
    expect(fixture.all).toHaveBeenCalledTimes(1);
    expect(evidenceBuilder.mock.calls.every(([, records]) => records.length === 0)).toBe(true);
    const second = await call(fixture.db, '/overview', '?assessmentId=A2&tenantId=T1');
    expect(second?.data).toMatchObject({ totalSpendAnalyzedInr: 900, categoriesAnalyzedCount: 1 });
    expect(JSON.stringify(first)).not.toContain('Other Client Supplier');
    expect(fixture.prepare.mock.calls.every(([sql]) => !sql.includes('SavingsOpportunity'))).toBe(true);
  });

  it('rejects audit dossier requests scoped only to a tenant', async () => {
    const fixture = database();
    expect(await call(fixture.db, '/export', '?tenantId=T1')).toMatchObject({
      status: 409, data: { success: false }
    });
    expect(fixture.prepare).not.toHaveBeenCalled();
  });

  it('supports selected profiles, exact category ids, category names and missing-category responses', async () => {
    const fixture = database();
    const categories = (await call(fixture.db, '/profiles'))?.data as any;
    const profile = categories.profiles[0];
    const detail = (await call(fixture.db, `/category/${encodeURIComponent(profile.categoryId)}`))?.data as any;
    expect(detail).toMatchObject({ categoryId: profile.categoryId, totalSpendInr: profile.totalSpendInr });
    expect(detail.transactionEvidenceRecords).toHaveLength(profile.transactionCount);
    expect((await call(fixture.db, `/category/${encodeURIComponent(profile.categoryName)}`))?.data)
      .toMatchObject({ categoryId: profile.categoryId, totalSpendInr: profile.totalSpendInr });
    expect(profile.transactionEvidenceRecords).toBeUndefined();
    expect(profile.detailsOmitted).toBe(true);
    expect(profile.exclusions).toEqual([]);
    expect(profile.levers).toEqual([]);
    expect(await call(fixture.db, '/category/missing')).toEqual({
      status: 404, data: { success: false, message: MODULE2_D1_SCOPED_MESSAGES.missingCategory }
    });
  });

  it('aggregates suppliers across this assessment categories and returns actual vendor rankings', async () => {
    const fixture = database();
    const response = (await call(fixture.db, '/suppliers'))?.data as any;
    expect(response.count).toBe(2);
    expect(response.suppliers.find((row: any) => row.supplierName === 'Supplier A'))
      .toMatchObject({ totalSpendInr: 300, totalTransactions: 2, categories: expect.arrayContaining(['Packing', 'STEEL']) });
    for (const route of ['/top50-vendors', '/top-50-vendors']) {
      const ranked = (await call(fixture.db, route))?.data as any;
      expect(ranked.top50).toHaveLength(2);
      expect(ranked.top50.every((row: any) => row.vendorName !== 'Other Client Supplier')).toBe(true);
    }
  });

  it('returns assessment-derived handoffs and ledgers without global seeded opportunities', async () => {
    const fixture = database();
    expect((await call(fixture.db, '/handoff'))?.data).toHaveProperty('packages');
    expect((await call(fixture.db, '/opportunity-ledger'))?.data).toHaveProperty('ledger');
    const attribution = await call(fixture.db, '/attribution-ledger');
    expect(attribution).toEqual(await call(fixture.db, '/opportunity-ledger'));
    const supplierRisk = (await call(fixture.db, '/supplier-risk'))?.data as {
      supplierRisk: Array<Record<string, unknown>>; count: number;
    };
    expect(supplierRisk.count).toBe(2);
    expect(supplierRisk.supplierRisk).toEqual(expect.arrayContaining([
      expect.objectContaining({
        materialGroup: 'Packing', primarySupplierSharePct: 75, riskClassification: 'SINGLE_SOURCE_DOMINANT'
      }),
      expect.objectContaining({ materialGroup: 'STEEL', riskClassification: 'SINGLE_SOURCE_DOMINANT' })
    ]));
    expect((await call(fixture.db, '/po-consolidation'))?.data).toMatchObject({ poConsolidation: [], count: 0 });
    expect((await call(fixture.db, '/recurring-spend'))?.data).toMatchObject({
      recurringSpend: expect.arrayContaining([expect.objectContaining({ category: 'Packing' })]), count: 2
    });
    expect(Array.isArray((await call(fixture.db, '/opportunities'))?.data)).toBe(true);
    expect((await call(fixture.db, '/consolidated-savings'))?.data).toHaveProperty('opportunities');
    expect((await call(fixture.db, '/direct-price-improvement'))?.data).toMatchObject({ assessmentId: 'A1' });
  });

  it('builds Lever 6 category priorities from scoped D1 transactions without planning estimates', async () => {
    const fixture = database({ A1: [
      transaction('CS-1', 80000000, 'Major', 'Supplier A'),
      transaction('CS-1B', 10000000, 'Major', 'Supplier B'),
      transaction('CS-2', 3000000, 'Medium', 'Supplier B'),
      transaction('CS-3', 100000, 'Minor', '')
    ] });
    const result = await call(fixture.db, '/category-specialisation', '?assessmentId=A1&tenantId=T1');
    const data = result?.data as Record<string, any>;
    expect(data).toMatchObject({
      assessmentId: 'A1', summary: {
        tenantId: 'T1', totalProcurementSpendInr: 93100000, grossTentativeOpportunityBaseInr: 0
      },
      opportunityHeadAssumptions: [], overlapItems: []
    });
    expect(data.categories).toEqual(expect.arrayContaining([
      expect.objectContaining({ categoryName: 'Major', priority: 'PRIORITY_A', annualSpendInr: 90000000 }),
      expect.objectContaining({ categoryName: 'Medium', priority: 'PRIORITY_B', annualSpendInr: 3000000 }),
      expect.objectContaining({ categoryName: 'Minor', priority: 'PRIORITY_C', annualSpendInr: 100000 })
    ]));
    expect(MODULE2_D1_PENDING_ROUTES.has('/category-specialisation')).toBe(false);
    expect(await call(fixture.db, '/category-specialisation', '?tenantId=T1')).toMatchObject({ status: 409 });
  });

  it('uses available price evidence and safe labels when optional assessment context is empty', () => {
    const transactions = [transaction('CS-PRICE', 10000000, 'Price evidence', 'Supplier')]
      .map((row) => ({ ...row, material_code: 'MAT-PRICE', plant: 'PLANT-1' }));
    const analysis = Module2CompactSourcingEngine.analyze(transactions);
    const profiles = analysis.profiles.map((profile) => ({
      ...profile,
      priceDispersion: { ...profile.priceDispersion, priceDispersionPct: 25 } as NonNullable<typeof profile.priceDispersion>
    }));
    const result = buildCategorySpecialisationFromD1({
      assessmentId: 'A1', tenantId: '', customerName: '', calculatedAt: '',
      scopedAnalysis: { transactions, analysis: { ...analysis, profiles } }
    });
    expect(result.customerName).toBe('Assessment customer unavailable');
    expect(result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(result.categories[0].priceVariationCoefficient).toBe(0.25);
  });

  it('handles zero analyzed spend and unavailable category evidence without creating an estimate', () => {
    const transactions = [transaction('CS-ZERO', 1, 'Unquantified', '')]
      .map((row) => ({ ...row, vendor_code: '', total_spend_inr: 0 }));
    const analysis = Module2CompactSourcingEngine.analyze(transactions);
    const profiles = analysis.profiles.map((profile) => ({
      ...profile, totalSpendInr: -1, priceDispersion: undefined
    }));
    const result = buildCategorySpecialisationFromD1({
      assessmentId: 'A1', tenantId: '', customerName: '', calculatedAt: '',
      scopedAnalysis: {
        transactions,
        analysis: { ...analysis, profiles, summary: { ...analysis.summary, totalSpendAnalyzedInr: 0 } }
      }
    });

    expect(result).toMatchObject({
      customerName: MODULE2_D1_CATEGORY_SPECIALISATION.UNKNOWN_CUSTOMER,
      summary: { totalProcurementSpendInr: 0, categoriesAssessedCount: 1 },
      categories: [expect.objectContaining({
        priority: 'PRIORITY_C', annualSpendInr: 0, spendSharePct: 0,
        topSupplierConcentrationPct: 0, herfindahlIndex: 0,
        priceVariationCoefficient: 0, requiresSpecialisedManagement: false
      })]
    });
    expect(result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(result.categories[0].dataLimitations)
      .toContain(MODULE2_D1_CATEGORY_SPECIALISATION.PRICE_VARIATION_UNAVAILABLE);
    expect(result.summary.grossTentativeOpportunityBaseInr).toBe(0);
  });

  it('requires assessment scope for specialised routes and applies alternate sourcing defaults', async () => {
    const db = {
      prepare: vi.fn(() => ({
        bind: vi.fn(() => ({ all: vi.fn(async () => ({ results: [] })) })),
        all: vi.fn(async () => ({ results: [] }))
      }))
    } as unknown as CloudflareD1Database;
    const filters: ScopedModule2FilterOptions = { eauctionOptions: {}, directPriceOptions: {} };
    const loaders: ScopedModule2RouteLoaders = {
      loadAnalysis: vi.fn(async () => ({
        transactions: [], analysis: Module2CompactSourcingEngine.analyze([])
      })),
      loadCustomerName: vi.fn(async () => '')
    };
    const missingScope = {} as ProcurementTransactionScope;
    const requestUrl = new URL('https://edge.test/api/module2');

    expect(await handleScopedSpecialRoute(
      db, '/payment-terms', missingScope, requestUrl, 'req-payment', filters, loaders
    )).toMatchObject({ status: 409 });
    expect(await handleScopedSpecialRoute(
      db, '/alternate-sourcing', missingScope, requestUrl, 'req-alternate-missing', filters, loaders
    )).toMatchObject({ status: 409 });

    const result = await handleScopedSpecialRoute(
      db, '/alternate-sourcing', { assessmentId: 'A1' } as ProcurementTransactionScope,
      requestUrl, 'req-alternate-default', filters, loaders
    );
    expect(result).toMatchObject({ data: { assessmentId: 'A1' } });
  });

  it('builds e-auction candidates only from the selected D1 assessment and rejects invalid filters', async () => {
    const candidateRows = [
      transaction('EA-1', 500000, 'Resin', 'Supplier A'),
      transaction('EA-2', 400000, 'Resin', 'Supplier B'),
      transaction('EA-3', 300000, 'Resin', 'Supplier A')
    ].map((row, index) => ({
      ...row, id: `EA-${index + 1}`, material_code: 'MAT-RESIN', uom: 'KG',
      po_number: `PO-${index + 1}`, vendor_code: index === 1 ? 'SUP-B' : 'SUP-A',
      po_date: ['2025-04-01', '2025-05-01', '2026-03-01'][index], plant: `P-${index + 1}`
    }));
    const fixture = database({ A1: candidateRows, A2: [transaction('OTHER', 9000000, 'Resin', 'Other Client')] });
    const result = await call(fixture.db, '/e-auction', '?assessmentId=A1&financialYear=FY2025-26');
    const data = result?.data as Record<string, any>;
    expect(data).toMatchObject({
      assessmentId: 'A1', selectedFinancialYear: 'FY2025-26', totalSpendReviewedInr: 1200000,
      candidateCategoriesCount: 1, candidateMaterialsCount: 1,
      commerciallyValidatedSavingsInr: 0, planningAssumptions: []
    });
    expect(data.categories[0].materials[0]).toMatchObject({
      materialCode: 'MAT-RESIN', supplierCount: 2, poCount: 3, addressableSpendInr: 1200000,
      suitability: 'Candidate for Review'
    });
    expect(JSON.stringify(result)).not.toContain('Other Client');
    expect((await call(fixture.db, '/e-auction', '?assessmentId=A1&financialYear=FY25'))?.status).toBe(400);
    expect((await call(fixture.db, '/e-auction', '?assessmentId=A1&suitability=APPROVED'))?.status).toBe(400);
  });

  it('builds direct-price history from scoped D1 transactions and validates its filters', async () => {
    const rows = [
      transaction('DP-1', 100000, 'Resin', 'Supplier A'),
      transaction('DP-2', 200000, 'Resin', 'Supplier B')
    ].map((row, index) => ({ ...row, id: `DP-${index + 1}`, material_code: 'MAT-DP', uom: 'KG',
      po_number: `PO-DP-${index + 1}`, po_date: `2025-0${index + 4}-01`, vendor_code: `SUP-${index + 1}` }));
    const fixture = database({ A1: rows, A2: [transaction('OTHER-DP', 9000000, 'Resin', 'Other Client')] });
    const response = await call(fixture.db, '/direct-price-improvement', '?assessmentId=A1&financialYear=FY2025-26');
    const result = response?.data as Record<string, any>;
    expect(result).toMatchObject({
      assessmentId: 'A1', selectedFinancialYear: 'FY2025-26', actualSpendInr: 300000,
      totalEligibleTransactions: 2, commerciallyValidatedSavingsInr: 0, itemsWithOpportunityCount: 1
    });
    expect(result.items[0]).toMatchObject({
      materialCode: 'MAT-DP', qualificationStatus: 'QUALIFIED', historicalLostOpportunityInr: 100000
    });
    expect(JSON.stringify(response)).not.toContain('Other Client');
    expect((await call(fixture.db, '/direct-price-improvement', '?assessmentId=A1&financialYear=FY25'))?.status)
      .toBe(400);
    expect((await call(fixture.db, '/direct-price-improvement', '?assessmentId=A1&category='))?.status).toBe(400);
  });

  it('builds vendor consolidation from the selected assessment and applies validated filters', async () => {
    const rows = [
      { ...transaction('VC-1', 100, 'Resin', 'Supplier A'), material_code: 'MAT-1', vendor_code: 'SUP-A',
        uom: 'KG', plant: 'P1', unspsc_code: '12345678', unspsc_category: 'Resins' },
      { ...transaction('VC-2', 200, 'Resin', 'Supplier B'), material_code: 'MAT-1', vendor_code: 'SUP-B',
        uom: 'KG', plant: 'P2', unspsc_code: '12345678', unspsc_category: 'Resins' },
      { ...transaction('VC-3', 50, 'MRO', 'Supplier C'), material_code: 'MAT-2', vendor_code: 'SUP-C',
        uom: 'EA', plant: 'P3' }
    ];
    const fixture = database({ A1: rows, A2: [transaction('OTHER-VC', 9000, 'Resin', 'Other Client')] });
    const result = await call(fixture.db, '/vendor-consolidation');
    expect(result?.data).toMatchObject({
      assessmentId: 'A1', totalAssessmentSpendInr: 350, distinctSuppliersCount: 3,
      sameMaterialOpportunities: [expect.objectContaining({ materialCode: 'MAT-1', supplierCount: 2 })],
      estimatedSavingsInr: null, actualSavingsCr: 0
    });
    expect(JSON.stringify(result)).not.toContain('Other Client');
    const filtered = await call(fixture.db, '/vendor-consolidation', '?assessmentId=A1&category=Resin&supplierCode=SUP-A');
    expect(filtered?.data).toMatchObject({ allTransactionsCount: 1, totalAssessmentSpendInr: 100 });
    expect((await call(fixture.db, '/vendor-consolidation', '?assessmentId=A1&status=INVALID'))?.status).toBe(400);
    expect((await call(fixture.db, '/vendor-consolidation', '?tenantId=T1'))?.status).toBe(409);
    expect(await call(fixture.db, '/vendor-consolidation', '')).toBeNull();
  });

  it('returns PO consolidation recommendations from repeated scoped purchase orders', async () => {
    const transactions = Array.from({ length: 5 }, (_, index) => ({
      ...transaction(`PO-TX-${index + 1}`, 100, 'Packing'),
      po_number: `PO-${index + 1}`,
      po_date: `2026-0${index + 1}-01`
    }));
    const fixture = database({ A1: transactions });
    const response = (await call(fixture.db, '/po-consolidation'))?.data as {
      poConsolidation: Array<Record<string, unknown>>; count: number;
    };
    expect(response.count).toBe(1);
    expect(response.poConsolidation[0]).toMatchObject({ poCount: 5, totalSpendInr: 500, category: 'Packing' });
  });

  it('supports header and tenant-only scopes and normalizes nullable or numeric row fields', async () => {
    const nullable = transaction('nullable', 10, 'Packing');
    for (const key of ['po_number', 'po_line', 'po_date', 'vendor_code', 'material_code', 'uom', 'currency', 'plant',
      'spend_category']) nullable[key] = null;
    const fixture = database({ T1: [nullable], A1: [transaction('T1', 20, 'Packing')] });
    expect((await call(fixture.db, '/dashboard', '', { 'x-tenant-id': 'T1' }))?.data)
      .toMatchObject({ totalSpendAnalyzedInr: 10 });
    expect(fixture.prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE assessment_id IS NULL AND tenant_id = ?'));
    expect((await call(fixture.db, '/dashboard', '', { 'x-assessment-id': 'A1' }))?.data)
      .toMatchObject({ totalSpendAnalyzedInr: 20 });
  });

  it('coalesces parallel reads, honors refresh and TTL, and isolates different database bindings', async () => {
    let now = 0;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    const fixture = database();
    await Promise.all([call(fixture.db, '/dashboard'), call(fixture.db, '/categories')]);
    expect(fixture.all).toHaveBeenCalledTimes(1);
    await call(fixture.db, '/dashboard', '?assessmentId=A1&refresh=true');
    expect(fixture.all).toHaveBeenCalledTimes(2);
    now += DEFAULT_CACHE_TTL_MS + 1;
    await call(fixture.db, '/dashboard');
    expect(fixture.all).toHaveBeenCalledTimes(3);
    const different = database({ A1: [transaction('different', 1, 'Packing')] });
    expect((await call(different.db, '/dashboard'))?.data).toMatchObject({ totalSpendAnalyzedInr: 1 });
  });

  it('evicts failures and propagates invalid input rows rather than reusing another assessment', async () => {
    const fixture = database({ A1: [{ id: 'bad' }] });
    await expect(call(fixture.db, '/dashboard')).rejects.toThrow();
    await expect(call(fixture.db, '/dashboard')).rejects.toThrow();
    expect(fixture.all).toHaveBeenCalledTimes(2);
  });

  it('loads the complete seeded assessment without reading legacy or another customer transactions', async () => {
    const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite');
    const sqlite = new DatabaseSync(process.env[D1_LOCAL_SQLITE_PATH_ENV], { readOnly: true });
    const binding = { prepare: (sql: string) => ({
      bind: (...values: unknown[]) => ({ all: async () => ({ results: sqlite.prepare(sql).all(...values) }) }),
      all: async () => ({ results: sqlite.prepare(sql).all() })
    }) } as unknown as CloudflareD1Database;
    try {
      const result = await call(binding, '/categories', '?assessmentId=AIC-2026-0002');
      const profiles = (result?.data as any).profiles;
      const count = profiles.reduce((total: number, profile: any) => total + profile.transactionCount, 0);
      expect(count).toBe(23570);
      expect(Buffer.byteLength(JSON.stringify(result))).toBeLessThan(MODULE2_D1_PROFILE_LIST_BUDGET_BYTES);
    } finally { sqlite.close(); }
  });
});
