import { afterEach, describe, expect, it, vi } from 'vitest';
import { D1_REPORTING, D1_ROUTE_MESSAGES } from '../src/constants/d1';
import { clearD1ReferenceDataCache } from '../src/services/d1ReferenceDataCache';
import { handlePcbiRoute } from '../src/workerD1Pcbi';
import { clearPublishedPcbiPayloadCache } from '../src/workerD1PcbiAdmin';
import type { CloudflareD1Database } from '../src/types/cloudflare';
import type { D1Record } from '../src/types/d1';
import type { PcbiAdminImportInput } from '../src/types/validation';

vi.mock('../src/utils/logger', () => ({ default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const database = (rows: D1Record[] = [], publishedPayload?: Record<string, unknown>): CloudflareD1Database => {
  const statement = {
    bind: vi.fn().mockReturnThis(), all: vi.fn().mockResolvedValue({ results: rows }),
    first: vi.fn().mockResolvedValue(publishedPayload ? { payload_json: JSON.stringify(publishedPayload) } : null), run: vi.fn()
  };
  const publishedStatement = {
    bind: vi.fn().mockReturnThis(),
    all: vi.fn().mockResolvedValue({ results: publishedPayload ? [{ payload_json: JSON.stringify(publishedPayload) }] : [] }),
    first: vi.fn(), run: vi.fn()
  };
  return { prepare: vi.fn().mockImplementation((sql: string) =>
    sql.includes('payload_json') ? publishedStatement : statement) };
};

const activeMasterPayload = (): Record<string, unknown> => ({
  version: 'V3.0', file_name: 'pcbi.csv', file_size_mb: 0.2, uploaded_by: 'Admin',
  worksheets: [],
  mappings: {
    PCBI_MASTER: [
      { excelColumn: 'ID', mappedField: 'pcbi_id' },
      { excelColumn: 'Name', mappedField: 'benchmark_name' },
      { excelColumn: 'Unit', mappedField: 'benchmark_unit' },
      { excelColumn: 'Currency', mappedField: 'currency' },
      { excelColumn: 'Sector', mappedField: 'sector' },
      { excelColumn: 'Quality', mappedField: 'quality_rating' },
      { excelColumn: 'Source', mappedField: 'benchmark_source' }
    ],
    WEEKLY_INDEX: [
      { excelColumn: 'ID', mappedField: 'pcbi_id' },
      { excelColumn: 'Date', mappedField: 'week_start' },
      { excelColumn: 'Value', mappedField: 'index_value' }
    ],
    CONSTITUENTS: [
      { excelColumn: 'ID', mappedField: 'pcbi_id' },
      { excelColumn: 'Name', mappedField: 'constituent_name' },
      { excelColumn: 'Weight', mappedField: 'weight_percent' }
    ],
    UNSPSC_MAPPING: [
      { excelColumn: 'Code', mappedField: 'unspsc_code' },
      { excelColumn: 'ID', mappedField: 'pcbi_id' }
    ]
  },
  benchmarks: [{ ID: 'PCBI-STEEL', Name: 'Steel flat', Unit: 'INR/MT', Currency: 'INR', Sector: 'Steel', Quality: 'A', Source: 'D1 Source' }],
  weeklyIndices: [{ ID: 'PCBI-STEEL', Date: '2026-10-01', Value: '105' }],
  constituents: [{ ID: 'PCBI-STEEL', Name: 'Iron ore', Weight: 60 }],
  sources: [],
  unspscMappings: [{ Code: '30100000', ID: 'PCBI-STEEL' }],
  validationSummary: {
    totalRecords: 3, validRecords: 3, warningRecords: 0, errorRecords: 0, blockingErrorCount: 0,
    warningCount: 0, aQualityCount: 1, bQualityCount: 0, cQualityCount: 0,
    avgBenchmarkability: 100, dateStart: '2026-10-01', dateEnd: '2026-10-01', issues: []
  }
});

const call = (db: CloudflareD1Database | undefined, path: string, query = '', headers = {}):
ReturnType<typeof handlePcbiRoute> => {
  const url = new URL(`https://edge.example/api/pcbi${path}${query}`);
  return handlePcbiRoute(db, path, new Request(url, { headers }), url);
};

describe('D1 PCBI reference data', () => {
  afterEach(() => {
    clearPublishedPcbiPayloadCache();
    clearD1ReferenceDataCache();
    vi.restoreAllMocks();
  });

  it('fails when D1 is unavailable, rather than returning embedded benchmarks', async () => {
    await expect(call(undefined, '/benchmarks')).rejects.toThrow(D1_ROUTE_MESSAGES.missingBinding);
  });

  it('rejects writes to reference read endpoints without querying or changing data', async () => {
    const db = database();
    const request = new Request('https://edge.example/api/pcbi/benchmarks', { method: 'POST', body: '{}' });
    expect(await handlePcbiRoute(db, '/benchmarks', request, new URL(request.url))).toEqual({
      status: 405, data: { success: false, message: D1_ROUTE_MESSAGES.pcbiMethod }
    });
    expect(db.prepare).not.toHaveBeenCalled();
  });

  it.each(['0', '-2', '1.5', 'invalid', '1001'])('rejects invalid index limit %s before querying', async (limit) => {
    const db = database();
    expect(await call(db, '/indices', `?limit=${limit}`)).toMatchObject({
      status: 400, data: { success: false, message: D1_ROUTE_MESSAGES.invalidQuery }
    });
    expect(db.prepare).not.toHaveBeenCalled();
  });

  it('normalizes persisted benchmark JSON and filters sectors using persisted applicability', async () => {
    const db = database([
      { id: 'steel', sector: 'Steel', applicable_sectors: '["Cement"]', active: 1 },
      { id: 'global', benchmark_scope: 'GLOBAL', active: 1 },
      { id: 'textile', sector: 'Textile', applicable_sectors: ['Textile'], active: 0 },
      { id: 'cement', sector: 'Cement', active: 1 }
    ]);
    const result = await call(db, '/master/benchmarks', '?sector=Cement');
    expect(result.data).toEqual([
      { id: 'steel', sector: 'Steel', applicable_sectors: ['Cement'], active: true },
      { id: 'global', benchmark_scope: 'GLOBAL', applicable_sectors: undefined, active: true },
      { id: 'cement', sector: 'Cement', applicable_sectors: undefined, active: true }
    ]);
    expect((await call(db, '/benchmarks')).data).toHaveLength(4);
    expect(db.prepare).toHaveBeenCalledTimes(2);
  });

  it('caches the published payload by D1 binding and avoids loading it for the dashboard', async () => {
    const payloadDb = database([], activeMasterPayload());
    await call(payloadDb, '/master/benchmarks');
    await call(payloadDb, '/master/benchmarks');
    const payloadReads = vi.mocked(payloadDb.prepare).mock.calls.filter(([sql]) => String(sql).includes('payload_json'));
    expect(payloadReads).toHaveLength(1);

    const dashboardDb = database([{ commodity_name: 'Steel', active_alert: 0 }]);
    await call(dashboardDb, '/dashboard');
    expect(vi.mocked(dashboardDb.prepare).mock.calls.some(([sql]) => String(sql).includes('payload_json'))).toBe(false);
  });

  it('returns archived monthly observations with an assessment-free date and series filter', async () => {
    const rows: D1Record[] = [{
      pcbi_id: 'PCBI-IND-COP-ROD-001', observation_date: '2021-04-01', value_inr: 695420,
      original_value: 9320, original_currency: 'USD', fx_rate: 74.6159, unit: 'INR/MT',
      source: 'LME/JPC', status: 'VALIDATED', observation_frequency: 'MONTHLY'
    }];
    const db = database(rows);
    const result = await call(db, '/historical-observations',
      '?pcbiId=PCBI-IND-COP-ROD-001&startDate=2021-04-01&endDate=2021-12-31&limit=20');

    expect(result.data).toEqual({ archiveOnly: true, frequency: 'MONTHLY', count: 1, observations: rows });
    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('FROM PCBIHistoricalObservation WHERE pcbi_id = ? AND observation_date >= ? AND observation_date <= ?'));
    expect(db.prepare('').bind).toHaveBeenCalledWith('PCBI-IND-COP-ROD-001', '2021-04-01', '2021-12-31', 20);
  });

  it.each([
    '?startDate=2022-01-01&endDate=2021-01-01',
    '?startDate=not-a-date',
    '?limit=501'
  ])('rejects invalid monthly observation filters before querying: %s', async (query) => {
    const db = database();
    expect(await call(db, '/historical-observations', query)).toMatchObject({
      status: 400, data: { success: false, message: D1_ROUTE_MESSAGES.invalidQuery }
    });
    expect(db.prepare).not.toHaveBeenCalled();
  });

  it('reads a complete weekly series with a bound identifier and limit', async () => {
    const rows = [{ pcbi_id: 'PCBI-STEEL', week_start: '2026-01-01', index_value: 105 }];
    const db = database(rows);
    expect((await call(db, '/indices/PCBI-STEEL', '?limit=12', { 'x-request-id': 'req-1' })).data).toEqual(rows);
    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('FROM PCBIWeeklyReference WHERE pcbi_id = ?'));
    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('pcbi_id = ? AND component_id IS NULL'));
    expect(db.prepare('').bind).toHaveBeenCalledWith('PCBI-STEEL', 12);
    await call(db, '/indices', '?pcbi_id=PCBI-STEEL');
    expect(db.prepare('').bind).toHaveBeenCalledWith('PCBI-STEEL', D1_REPORTING.weeklyIndexLimit);
    await call(db, '/index-trend');
    expect(db.prepare('').bind).toHaveBeenCalledWith(D1_REPORTING.weeklyIndexLimit);
  });

  it.each(['/components', '/unspsc-mapping'])('returns persisted %s with optional series filtering', async (path) => {
    const db = database([{ id: 'one', active: 1 }, { id: 'two', active: 0 }]);
    expect((await call(db, path)).data).toEqual([{ id: 'one', active: true }, { id: 'two', active: false }]);
    await call(db, path, '?pcbi_id=PCBI-STEEL');
    expect(db.prepare('').bind).toHaveBeenCalledWith('PCBI-STEEL');
  });

  it('builds the dashboard exclusively from D1 snapshots', async () => {
    const rows = [{ commodity_name: 'Steel', active_alert: 1 }, { commodity_name: 'Cotton', active_alert: 0 }];
    expect((await call(database(rows), '/dashboard')).data).toEqual({
      totalCommoditiesTracked: 2, activeAlertsCount: 1, commodities: rows
    });
  });

  it('serves normalized published D1 master and weekly index rows after version activation', async () => {
    const payload = activeMasterPayload();
    const db = database([], payload);
    const benchmarks = await call(db, '/master/benchmarks', '?sector=Steel');
    expect(benchmarks.data).toMatchObject([{
      pcbi_id: 'PCBI-STEEL', benchmark_name: 'Steel flat', benchmark_unit: 'INR/MT',
      currency: 'INR', sector: 'Steel', active: true, applicable_sectors: ['Steel']
    }]);
    expect((await call(db, '/indices/PCBI-STEEL')).data).toMatchObject([{
      pcbi_id: 'PCBI-STEEL', week_start: '2026-10-01', index_value: 105, unit: 'INR/MT', currency: 'INR'
    }]);
    expect((await call(db, '/components', '?pcbi_id=PCBI-STEEL')).data).toMatchObject([{
      component_name: 'Iron ore', weight_percent: 60, benchmark_unit: 'INR/MT', active: true
    }]);
    expect((await call(db, '/unspsc-mapping')).data).toMatchObject([{
      unspsc_code: '30100000', pcbi_id: 'PCBI-STEEL', active: true
    }]);
  });

  it('handles unfiltered observation history and multi-row published reference sets', async () => {
    const payload = activeMasterPayload() as unknown as PcbiAdminImportInput;
    payload.mappings.PCBI_MASTER = [
      ...payload.mappings.PCBI_MASTER,
      { excelColumn: 'Category', mappedField: 'category' },
      { excelColumn: 'Subcategory', mappedField: 'sub_category' },
      { excelColumn: 'Benchmarkability', mappedField: 'benchmarkability_percent' },
      { excelColumn: 'Residual', mappedField: 'residual_percent' }
    ];
    payload.benchmarks = [
      { ID: 'PCBI-ZINC', Name: 'Zinc', Unit: 'INR/MT', Currency: 'INR', Sector: 'Steel', Quality: 'A', Source: 'D1', Category: 'Zinc', Subcategory: 'A', Benchmarkability: '90', Residual: '' },
      { ID: 'PCBI-ALU-Z', Name: 'Aluminium Z', Unit: 'INR/MT', Currency: 'INR', Sector: 'Steel', Quality: 'B', Source: 'D1', Category: 'Aluminium', Subcategory: 'Z', Benchmarkability: 'invalid', Residual: '4' },
      { ID: 'PCBI-ALU-A', Name: 'Aluminium A', Unit: 'INR/MT', Currency: 'INR', Sector: 'Steel', Quality: 'A', Source: 'D1', Category: 'Aluminium', Subcategory: 'A', Benchmarkability: '95', Residual: '5' }
    ];
    payload.weeklyIndices = [
      { ID: 'PCBI-STEEL', Date: '2026-10-01', Value: '105' },
      { ID: 'PCBI-STEEL', Date: '2026-11-01', Value: '110' }
    ];
    payload.constituents = [
      { ID: 'PCBI-STEEL', Name: 'Iron ore', Weight: 60 },
      { ID: 'PCBI-STEEL', Name: 'Coking coal', Weight: 40 }
    ];
    payload.unspscMappings = [
      { Code: '30100000', ID: 'PCBI-STEEL' },
      { Code: '30110000', ID: 'PCBI-STEEL' }
    ];
    const db = database([], payload);

    expect((await call(db, '/historical-observations')).data).toMatchObject({ archiveOnly: true, count: 0 });
    expect((await call(db, '/master/benchmarks', '?sector=Steel')).data).toMatchObject([
      { pcbi_id: 'PCBI-ALU-A' }, { pcbi_id: 'PCBI-ALU-Z' }, { pcbi_id: 'PCBI-ZINC' }
    ]);
    expect((await call(db, '/index-trend')).data).toHaveLength(2);
    expect((await call(db, '/components')).data).toHaveLength(2);
    expect((await call(db, '/unspsc-mapping')).data).toHaveLength(2);
  });

  it('falls back to seeded reference tables if the stored published payload is corrupt', async () => {
    const db = database([{ pcbi_id: 'SEEDED', active: 1 }], { version: 'invalid' });
    expect((await call(db, '/benchmarks')).data).toMatchObject([{ pcbi_id: 'SEEDED', active: true }]);
  });

  it('returns a missing endpoint error for unsupported routes', async () => {
    expect(await call(database(), '/missing')).toEqual({
      status: 404, data: { success: false, message: D1_ROUTE_MESSAGES.unknownPcbi }
    });
  });
});
