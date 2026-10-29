import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GRAPHQL_SCHEMA_SDL } from '../../src/constants/graphql';
import { createD1GraphqlResolvers } from '../../src/resolvers/d1GraphqlResolvers';
import type { CloudflareD1Database, CloudflareD1PreparedStatement } from '../../src/types/cloudflare';
import type { GraphQLContext } from '../../src/types/graphql';
import { createSqliteD1 } from '../helpers/evidenceSqlite';

const BACKEND_ROOT = path.resolve(__dirname, '..', '..');
const SCHEMA_SQL = fs.readFileSync(path.join(BACKEND_ROOT, 'd1-schema.sql'), 'utf8');
const TIMESTAMP = '2026-01-31T00:00:00.000Z';
const RESOLVER_NAMES = [
  'addIngestionItem',
  'categories',
  'categoryDetails',
  'dashboardOverview',
  'deployOpportunity',
  'funnelStages',
  'ingestionQueue',
  'lineItems',
  'mergeVendor',
  'opportunities',
  'queryMetrics',
  'tenant',
  'updateTenant',
  'updateValidationRecord',
  'validationRecords',
  'vendorDetails',
  'vendorRankings'
];
const READ_TABLES: Array<[string, string]> = [
  ['tenant', 'TenantMaster'],
  ['ingestionQueue', 'RawDocumentIngestion'],
  ['validationRecords', 'ValidationPreCheckRecord'],
  ['categories', 'SpendCategorySummary'],
  ['categoryDetails', 'CategoryYearDetail'],
  ['vendorDetails', 'VendorYearDetail'],
  ['vendorRankings', 'VendorPriceRank'],
  ['lineItems', 'LineItemMapping'],
  ['opportunities', 'SavingsOpportunity'],
  ['funnelStages', 'ConversionFunnelPhase']
];

const resolvers = createD1GraphqlResolvers();

interface ResolverFixture {
  d1: CloudflareD1Database;
  close: () => void;
}

interface StubOptions {
  firstRow?: Record<string, unknown> | null;
  runResult?: unknown;
  runError?: Error;
}

interface RecordedStatement {
  sql: string;
  values: unknown[];
}

const openFixture = (): ResolverFixture => {
  const db = new DatabaseSync(':memory:');
  db.exec(SCHEMA_SQL);
  return { d1: createSqliteD1(db), close: () => db.close() };
};

// Typed D1 double for paths the real database cannot easily produce (failed writes, D1 result shapes).
const createStubD1 = (options: StubOptions = {}): { d1: CloudflareD1Database; statements: RecordedStatement[] } => {
  const statements: RecordedStatement[] = [];
  const d1: CloudflareD1Database = {
    prepare: (sql: string): CloudflareD1PreparedStatement => {
      const recorded: RecordedStatement = { sql, values: [] };
      statements.push(recorded);
      const statement: CloudflareD1PreparedStatement = {
        bind: (...values: unknown[]): CloudflareD1PreparedStatement => {
          recorded.values = values;
          return statement;
        },
        first: async <T = Record<string, unknown>>(): Promise<T | null> => (options.firstRow ?? null) as T | null,
        all: async <T = Record<string, unknown>>(): Promise<{ results: T[] }> => ({ results: [] }),
        run: async (): Promise<unknown> => {
          if (options.runError) throw options.runError;
          return options.runResult;
        }
      };
      return statement;
    }
  };
  return { d1, statements };
};

const contextFor = (d1: CloudflareD1Database): GraphQLContext & { db: CloudflareD1Database } => ({
  db: d1,
  requestId: 'req-d1-resolvers',
  timestamp: TIMESTAMP
});

const execute = async (d1: CloudflareD1Database, sql: string, values: unknown[] = []): Promise<void> => {
  await d1.prepare(sql).bind(...values).run();
};

const insertTenant = (
  d1: CloudflareD1Database,
  tenantId: string,
  createdAt: string,
  updatedAt: string = createdAt,
  enterpriseName = 'Acme Chemicals'
): Promise<void> =>
  execute(
    d1,
    'INSERT INTO TenantMaster (tenant_id, enterprise_name, region, base_currency, status, major_sector, minor_sector, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [tenantId, enterpriseName, 'APAC', 'INR', 'ACTIVE', 'Chemicals', 'Specialty', createdAt, updatedAt]
  );

const insertIngestion = (
  d1: CloudflareD1Database,
  docId: string,
  uploadedAt: string,
  detectedCurrencies: string | null
): Promise<void> =>
  execute(
    d1,
    'INSERT INTO RawDocumentIngestion (doc_id, tenant_id, file_name, file_type, file_size_mb, uploaded_at, detected_currencies) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [docId, 'TNT-1', `${docId}.xlsx`, 'XLSX', 2.5, uploadedAt, detectedCurrencies]
  );

const insertValidationRecord = (d1: CloudflareD1Database, recordId: string, createdAt: string): Promise<void> =>
  execute(
    d1,
    'INSERT INTO ValidationPreCheckRecord (record_id, po_number, vendor_name, raw_desc, created_at) VALUES (?, ?, ?, ?, ?)',
    [recordId, `PO-${recordId}`, 'Acme Steel', 'Angle 50x50', createdAt]
  );

const insertCategory = (d1: CloudflareD1Database, id: string, spendCr: number): Promise<void> =>
  execute(d1, 'INSERT INTO SpendCategorySummary (id, name, spend_inr_crores) VALUES (?, ?, ?)', [
    id,
    `Category ${id}`,
    spendCr
  ]);

const insertCategoryDetail = (d1: CloudflareD1Database, id: string, rank: number): Promise<void> =>
  execute(d1, 'INSERT INTO CategoryYearDetail (id, rank, category) VALUES (?, ?, ?)', [id, rank, `Category ${id}`]);

const insertVendorDetail = (
  d1: CloudflareD1Database,
  id: string,
  vendorName: string,
  masterVendorId: string,
  totalCr: number
): Promise<void> =>
  execute(
    d1,
    'INSERT INTO VendorYearDetail (id, rank, vendor_name, master_vendor_id, primary_category, total_3yr_spend_inr_cr) VALUES (?, ?, ?, ?, ?, ?)',
    [id, 1, vendorName, masterVendorId, 'Steel', totalCr]
  );

const insertVendorRank = (d1: CloudflareD1Database, masterId: string, vendorName: string, totalCr: number): Promise<void> =>
  execute(
    d1,
    'INSERT INTO VendorPriceRank (vendor_name, master_id, category, total_spend, total_spend_inr_cr) VALUES (?, ?, ?, ?, ?)',
    [vendorName, masterId, 'Steel', totalCr, totalCr]
  );

const insertLineItem = (d1: CloudflareD1Database, mappingId: string): Promise<void> =>
  execute(
    d1,
    'INSERT INTO LineItemMapping (mapping_id, line_item_id, raw_desc, vendor_identified, unspsc_code, unspsc_category_name, core_bucket) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [mappingId, `LI-${mappingId}`, 'Angle 50x50', 'Acme Steel', '30101500', 'Structural shapes', 'Steel']
  );

const insertOpportunity = (d1: CloudflareD1Database, oppId: string, savingsCr: number): Promise<void> =>
  execute(
    d1,
    'INSERT INTO SavingsOpportunity (opp_id, category, est_savings_inr_cr, status, recommended_module) VALUES (?, ?, ?, ?, ?)',
    [oppId, 'Structural Steel', savingsCr, 'Identified', 'proCPX']
  );

const insertFunnelPhase = (d1: CloudflareD1Database, phaseNum: number): Promise<void> =>
  execute(
    d1,
    'INSERT INTO ConversionFunnelPhase (phase_num, phase_name, platform_actionable_focus, value_outcome_delivered, commercial_lock_in_metric) VALUES (?, ?, ?, ?, ?)',
    [phaseNum, `Phase ${phaseNum}`, 'Focus', 'Outcome', 'Metric']
  );

const EMPTY_QUERY_METRICS = {
  totalQueries: 0,
  slowQueries: 0,
  cacheHitRatio: 0,
  averageDurationMs: 0,
  recentAudits: []
};

const UPLOAD_ARGS = { input: { file_name: 'spend-2026.xlsx', file_type: 'XLSX', file_size_mb: 3.5 } };

describe('createD1GraphqlResolvers', () => {
  it('exposes the resolver set that the GraphQL schema declares', () => {
    expect(Object.keys(resolvers).sort()).toEqual([...RESOLVER_NAMES].sort());
    for (const name of RESOLVER_NAMES) {
      expect(GRAPHQL_SCHEMA_SDL).toMatch(new RegExp(`^\\s+${name}\\b`, 'm'));
    }
  });
});

describe('D1 query resolvers', () => {
  let fixture: ResolverFixture;

  beforeEach(() => {
    fixture = openFixture();
  });

  afterEach(() => {
    fixture.close();
  });

  it('returns the earliest tenant by creation time', async () => {
    await insertTenant(fixture.d1, 'TNT-LATER', '2026-03-01 00:00:00');
    await insertTenant(fixture.d1, 'TNT-EARLIEST', '2026-01-01 00:00:00');

    expect(await resolvers.tenant({}, contextFor(fixture.d1))).toMatchObject({
      tenant_id: 'TNT-EARLIEST',
      enterprise_name: 'Acme Chemicals'
    });
  });

  it('returns empty collections and a null tenant when the tables have no rows', async () => {
    const context = contextFor(fixture.d1);

    expect(await resolvers.tenant({}, context)).toBeNull();
    expect(await resolvers.ingestionQueue({}, context)).toEqual([]);
    expect(await resolvers.validationRecords({}, context)).toEqual([]);
    expect(await resolvers.categories({}, context)).toEqual([]);
    expect(await resolvers.categoryDetails({}, context)).toEqual([]);
    expect(await resolvers.vendorDetails({}, context)).toEqual([]);
    expect(await resolvers.vendorRankings({}, context)).toEqual([]);
    expect(await resolvers.lineItems({}, context)).toEqual([]);
    expect(await resolvers.opportunities({}, context)).toEqual([]);
    expect(await resolvers.funnelStages({}, context)).toEqual([]);
  });

  it('lists ingestion documents newest first and parses stored currency lists', async () => {
    await insertIngestion(fixture.d1, 'DOC-OLD', '2026-01-01 00:00:00', '["INR","USD"]');
    await insertIngestion(fixture.d1, 'DOC-NEW', '2026-02-01 00:00:00', null);

    expect(await resolvers.ingestionQueue({}, contextFor(fixture.d1))).toMatchObject([
      { doc_id: 'DOC-NEW', detected_currencies: null },
      { doc_id: 'DOC-OLD', detected_currencies: ['INR', 'USD'] }
    ]);
  });

  it('rejects the whole ingestion list when a stored currency value is not valid JSON', async () => {
    await insertIngestion(fixture.d1, 'DOC-BAD', '2026-01-01 00:00:00', 'INR,USD');

    await expect(resolvers.ingestionQueue({}, contextFor(fixture.d1))).rejects.toThrow(SyntaxError);
  });

  it('lists validation records newest first', async () => {
    await insertValidationRecord(fixture.d1, 'REC-OLD', '2026-01-01 00:00:00');
    await insertValidationRecord(fixture.d1, 'REC-NEW', '2026-02-01 00:00:00');

    expect(await resolvers.validationRecords({}, contextFor(fixture.d1))).toMatchObject([
      { record_id: 'REC-NEW' },
      { record_id: 'REC-OLD' }
    ]);
  });

  it('orders spend categories from the largest spend in crores', async () => {
    await insertCategory(fixture.d1, 'CAT-SMALL', 1.5);
    await insertCategory(fixture.d1, 'CAT-LARGE', 12.5);

    expect(await resolvers.categories({}, contextFor(fixture.d1))).toMatchObject([
      { id: 'CAT-LARGE', spend_inr_crores: 12.5 },
      { id: 'CAT-SMALL', spend_inr_crores: 1.5 }
    ]);
  });

  it('returns only the requested category detail when an id is given', async () => {
    await insertCategoryDetail(fixture.d1, 'CAT-2', 2);
    await insertCategoryDetail(fixture.d1, 'CAT-1', 1);

    expect(await resolvers.categoryDetails({ id: 'CAT-2' }, contextFor(fixture.d1))).toMatchObject([{ id: 'CAT-2' }]);
    expect(await resolvers.categoryDetails({ id: 'CAT-MISSING' }, contextFor(fixture.d1))).toEqual([]);
  });

  it('orders all category details by rank when no id is given', async () => {
    await insertCategoryDetail(fixture.d1, 'CAT-3', 3);
    await insertCategoryDetail(fixture.d1, 'CAT-1', 1);
    await insertCategoryDetail(fixture.d1, 'CAT-2', 2);

    expect(await resolvers.categoryDetails({ id: undefined }, contextFor(fixture.d1))).toMatchObject([
      { id: 'CAT-1' },
      { id: 'CAT-2' },
      { id: 'CAT-3' }
    ]);
  });

  it('orders vendor details by three-year spend, largest first', async () => {
    await insertVendorDetail(fixture.d1, 'VYD-SMALL', 'Small Vendor', 'MV-S', 1);
    await insertVendorDetail(fixture.d1, 'VYD-LARGE', 'Large Vendor', 'MV-L', 9);

    expect(await resolvers.vendorDetails({}, contextFor(fixture.d1))).toMatchObject([
      { id: 'VYD-LARGE' },
      { id: 'VYD-SMALL' }
    ]);
  });

  it('orders vendor price rankings by total spend, largest first', async () => {
    await insertVendorRank(fixture.d1, 'MV-A', 'Alpha', 2);
    await insertVendorRank(fixture.d1, 'MV-B', 'Beta', 7);

    expect(await resolvers.vendorRankings({}, contextFor(fixture.d1))).toMatchObject([
      { master_id: 'MV-B' },
      { master_id: 'MV-A' }
    ]);
  });

  it('orders line item mappings by mapping id', async () => {
    await insertLineItem(fixture.d1, 'MAP-2');
    await insertLineItem(fixture.d1, 'MAP-1');

    expect(await resolvers.lineItems({}, contextFor(fixture.d1))).toMatchObject([
      { mapping_id: 'MAP-1' },
      { mapping_id: 'MAP-2' }
    ]);
  });

  it('orders savings opportunities by estimated savings, largest first', async () => {
    await insertOpportunity(fixture.d1, 'OPP-SMALL', 0.5);
    await insertOpportunity(fixture.d1, 'OPP-LARGE', 4);

    expect(await resolvers.opportunities({}, contextFor(fixture.d1))).toMatchObject([
      { opp_id: 'OPP-LARGE' },
      { opp_id: 'OPP-SMALL' }
    ]);
  });

  it('orders conversion funnel phases by phase number', async () => {
    await insertFunnelPhase(fixture.d1, 2);
    await insertFunnelPhase(fixture.d1, 1);

    expect(await resolvers.funnelStages({}, contextFor(fixture.d1))).toMatchObject([
      { phase_num: 1 },
      { phase_num: 2 }
    ]);
  });

  it('returns the query metrics placeholder with zeroed counters', async () => {
    expect(await resolvers.queryMetrics({}, contextFor(fixture.d1))).toEqual(EMPTY_QUERY_METRICS);
  });

  it.each(READ_TABLES)('propagates the database error when %s reads a missing %s table', async (resolverName, table) => {
    await execute(fixture.d1, `DROP TABLE ${table}`);

    await expect(resolvers[resolverName]({}, contextFor(fixture.d1))).rejects.toThrow(`no such table: ${table}`);
  });
});

describe('dashboardOverview', () => {
  let fixture: ResolverFixture;

  beforeEach(() => {
    fixture = openFixture();
  });

  afterEach(() => {
    fixture.close();
  });

  it('returns every dataset slice from a single resolver call', async () => {
    await insertTenant(fixture.d1, 'TNT-1', '2026-01-01 00:00:00');
    await insertCategory(fixture.d1, 'CAT-1', 12.5);
    await insertOpportunity(fixture.d1, 'OPP-1', 2.5);
    await insertFunnelPhase(fixture.d1, 1);
    await insertIngestion(fixture.d1, 'DOC-1', '2026-01-02 00:00:00', '["INR"]');
    await insertValidationRecord(fixture.d1, 'REC-1', '2026-01-03 00:00:00');

    expect(await resolvers.dashboardOverview({}, contextFor(fixture.d1))).toMatchObject({
      tenant: { tenant_id: 'TNT-1' },
      categories: [{ id: 'CAT-1' }],
      opportunities: [{ opp_id: 'OPP-1' }],
      funnelStages: [{ phase_num: 1 }],
      ingestionQueue: [{ doc_id: 'DOC-1', detected_currencies: ['INR'] }],
      validationRecords: [{ record_id: 'REC-1' }],
      queryMetrics: EMPTY_QUERY_METRICS
    });
  });

  it('returns a null tenant and empty slices for an empty database', async () => {
    expect(await resolvers.dashboardOverview({}, contextFor(fixture.d1))).toEqual({
      tenant: null,
      categories: [],
      opportunities: [],
      funnelStages: [],
      ingestionQueue: [],
      validationRecords: [],
      queryMetrics: EMPTY_QUERY_METRICS
    });
  });

  it('fails as a whole when one dataset query fails', async () => {
    await execute(fixture.d1, 'DROP TABLE SavingsOpportunity');

    await expect(resolvers.dashboardOverview({}, contextFor(fixture.d1))).rejects.toThrow(
      'no such table: SavingsOpportunity'
    );
  });
});

describe('updateTenant', () => {
  let fixture: ResolverFixture;

  beforeEach(() => {
    fixture = openFixture();
  });

  afterEach(() => {
    fixture.close();
  });

  it('updates only the supplied fields and refreshes updated_at', async () => {
    await insertTenant(fixture.d1, 'TNT-1', '2026-01-01 00:00:00', '2020-01-01 00:00:00');

    const tenant = await resolvers.updateTenant(
      { input: { enterprise_name: 'Acme Chemicals Ltd' } },
      contextFor(fixture.d1)
    );

    expect(tenant).toMatchObject({
      tenant_id: 'TNT-1',
      enterprise_name: 'Acme Chemicals Ltd',
      region: 'APAC',
      base_currency: 'INR',
      status: 'ACTIVE',
      major_sector: 'Chemicals',
      minor_sector: 'Specialty'
    });
    expect(tenant).toEqual(expect.objectContaining({ updated_at: expect.not.stringMatching(/^2020-/) }));
  });

  it('writes every supplied field', async () => {
    await insertTenant(fixture.d1, 'TNT-1', '2026-01-01 00:00:00');

    const tenant = await resolvers.updateTenant(
      {
        input: {
          enterprise_name: 'Renamed Co',
          region: 'EMEA',
          base_currency: 'USD',
          status: 'SUSPENDED',
          major_sector: 'Metals',
          minor_sector: 'Steel'
        }
      },
      contextFor(fixture.d1)
    );

    expect(tenant).toMatchObject({
      enterprise_name: 'Renamed Co',
      region: 'EMEA',
      base_currency: 'USD',
      status: 'SUSPENDED',
      major_sector: 'Metals',
      minor_sector: 'Steel'
    });
  });

  it('binds null for unspecified fields so COALESCE keeps their stored values', async () => {
    const stub = createStubD1({ firstRow: { tenant_id: 'TNT-1' }, runResult: { success: true } });

    await resolvers.updateTenant({ input: { region: 'EMEA' } }, contextFor(stub.d1));

    expect(stub.statements[1].sql).toContain('UPDATE TenantMaster SET');
    expect(stub.statements[1].values).toEqual([null, 'EMEA', null, null, null, null, 'TNT-1']);
  });

  it('rejects when no tenant has been seeded', async () => {
    await expect(
      resolvers.updateTenant({ input: { enterprise_name: 'Ghost Co' } }, contextFor(fixture.d1))
    ).rejects.toThrow('D1 seed does not contain a tenant record');
  });

  it('propagates write failures', async () => {
    const stub = createStubD1({ firstRow: { tenant_id: 'TNT-1' }, runError: new Error('D1 write rejected') });

    await expect(resolvers.updateTenant({ input: {} }, contextFor(stub.d1))).rejects.toThrow('D1 write rejected');
  });
});

describe('addIngestionItem', () => {
  let fixture: ResolverFixture;

  beforeEach(() => {
    fixture = openFixture();
  });

  afterEach(() => {
    fixture.close();
  });

  it('inserts a completed ingestion document for the tenant and returns it', async () => {
    await insertTenant(fixture.d1, 'TNT-1', '2026-01-01 00:00:00');

    const document = await resolvers.addIngestionItem(
      { input: { ...UPLOAD_ARGS.input, records_count: 420 } },
      contextFor(fixture.d1)
    );

    expect(document).toMatchObject({
      doc_id: expect.stringMatching(/^DOC-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
      tenant_id: 'TNT-1',
      file_name: 'spend-2026.xlsx',
      file_type: 'XLSX',
      file_size_mb: 3.5,
      records_count: 420,
      ocr_status: 'Completed',
      progress: 100
    });
  });

  it('stores zero records when the count is omitted and gives each upload its own id', async () => {
    await insertTenant(fixture.d1, 'TNT-1', '2026-01-01 00:00:00');
    const context = contextFor(fixture.d1);

    const first = await resolvers.addIngestionItem(UPLOAD_ARGS, context);
    const second = await resolvers.addIngestionItem(UPLOAD_ARGS, context);

    expect(first).toMatchObject({ records_count: 0 });
    expect(second).toMatchObject({ records_count: 0 });
    expect(first).not.toEqual(second);
  });

  it('rejects without inserting a row when no tenant has been seeded', async () => {
    await expect(resolvers.addIngestionItem(UPLOAD_ARGS, contextFor(fixture.d1))).rejects.toThrow(
      'D1 seed does not contain a tenant record'
    );
    expect(await fixture.d1.prepare('SELECT COUNT(*) AS total FROM RawDocumentIngestion').first()).toEqual({ total: 0 });
  });

  it('propagates insert failures', async () => {
    const stub = createStubD1({ firstRow: { tenant_id: 'TNT-1' }, runError: new Error('insert rejected') });

    await expect(resolvers.addIngestionItem(UPLOAD_ARGS, contextFor(stub.d1))).rejects.toThrow('insert rejected');
  });
});

describe('updateValidationRecord', () => {
  let fixture: ResolverFixture;

  beforeEach(() => {
    fixture = openFixture();
  });

  afterEach(() => {
    fixture.close();
  });

  it('updates the supplied fields and keeps stored values for the omitted ones', async () => {
    await insertValidationRecord(fixture.d1, 'REC-1', '2026-01-01 00:00:00');

    const record = await resolvers.updateValidationRecord(
      { input: { record_id: 'REC-1', action_status: 'Resolved' } },
      contextFor(fixture.d1)
    );

    expect(record).toMatchObject({ record_id: 'REC-1', issue_flag: 'Passed Clean', action_status: 'Resolved', resolved: 1 });
  });

  it('stores the resolved flag as 1 or 0 and keeps the previous value when it is omitted', async () => {
    await insertValidationRecord(fixture.d1, 'REC-2', '2026-01-01 00:00:00');
    const context = contextFor(fixture.d1);

    expect(await resolvers.updateValidationRecord({ input: { record_id: 'REC-2', resolved: false } }, context)).toMatchObject({
      resolved: 0
    });
    expect(
      await resolvers.updateValidationRecord({ input: { record_id: 'REC-2', issue_flag: 'Duplicate PO' } }, context)
    ).toMatchObject({ issue_flag: 'Duplicate PO', resolved: 0 });
    expect(await resolvers.updateValidationRecord({ input: { record_id: 'REC-2', resolved: true } }, context)).toMatchObject({
      resolved: 1
    });
  });

  it('returns null when no validation record matches the id', async () => {
    expect(
      await resolvers.updateValidationRecord(
        { input: { record_id: 'REC-MISSING', action_status: 'Resolved' } },
        contextFor(fixture.d1)
      )
    ).toBeNull();
  });

  it('binds null for omitted flags and 0 when resolved is false', async () => {
    const stub = createStubD1({ runResult: { success: true } });

    await resolvers.updateValidationRecord({ input: { record_id: 'REC-1', resolved: false } }, contextFor(stub.d1));

    expect(stub.statements[0].values).toEqual([null, null, 0, 'REC-1']);
  });

  it('propagates write failures', async () => {
    const stub = createStubD1({ runError: new Error('update rejected') });

    await expect(
      resolvers.updateValidationRecord({ input: { record_id: 'REC-1', resolved: true } }, contextFor(stub.d1))
    ).rejects.toThrow('update rejected');
  });
});

describe('mergeVendor', () => {
  let fixture: ResolverFixture;

  beforeEach(() => {
    fixture = openFixture();
  });

  afterEach(() => {
    fixture.close();
  });

  const MERGE_ARGS = { input: { targetName: 'Acme Stl', masterId: 'MV-1', canonicalName: 'Acme Steel' } };

  it('renames every vendor detail row for the master vendor and leaves other vendors alone', async () => {
    await insertVendorDetail(fixture.d1, 'VYD-1', 'Acme Stl', 'MV-1', 4);
    await insertVendorDetail(fixture.d1, 'VYD-2', 'Acme Stl Ltd', 'MV-1', 2);
    await insertVendorDetail(fixture.d1, 'VYD-3', 'Beta Metals', 'MV-2', 3);

    await resolvers.mergeVendor(MERGE_ARGS, contextFor(fixture.d1));

    const rows = await fixture.d1.prepare('SELECT id, vendor_name FROM VendorYearDetail ORDER BY id').all();
    expect(rows.results).toEqual([
      { id: 'VYD-1', vendor_name: 'Acme Steel' },
      { id: 'VYD-2', vendor_name: 'Acme Steel' },
      { id: 'VYD-3', vendor_name: 'Beta Metals' }
    ]);
  });

  it('reports the number of rows changed from the D1 result metadata', async () => {
    const stub = createStubD1({ runResult: { success: true, meta: { changes: 3 } } });

    expect(await resolvers.mergeVendor(MERGE_ARGS, contextFor(stub.d1))).toEqual({ success: true, affected: 3 });
    expect(stub.statements[0].sql).toContain('UPDATE VendorYearDetail SET vendor_name = ? WHERE master_vendor_id = ?');
    expect(stub.statements[0].values).toEqual(['Acme Steel', 'MV-1']);
  });

  it('reports zero affected rows when the master vendor has no detail rows', async () => {
    const stub = createStubD1({ runResult: { success: true, meta: { changes: 0 } } });

    expect(await resolvers.mergeVendor(MERGE_ARGS, contextFor(stub.d1))).toEqual({ success: true, affected: 0 });
  });

  it('reports zero affected rows when the result has no metadata block', async () => {
    const stub = createStubD1({ runResult: { success: true } });

    expect(await resolvers.mergeVendor(MERGE_ARGS, contextFor(stub.d1))).toEqual({ success: true, affected: 0 });
  });

  it('propagates write failures', async () => {
    const stub = createStubD1({ runError: new Error('merge rejected') });

    await expect(resolvers.mergeVendor(MERGE_ARGS, contextFor(stub.d1))).rejects.toThrow('merge rejected');
  });
});

describe('deployOpportunity', () => {
  let fixture: ResolverFixture;

  beforeEach(() => {
    fixture = openFixture();
  });

  afterEach(() => {
    fixture.close();
  });

  it('marks the opportunity deployed to the chosen module and leaves other opportunities unchanged', async () => {
    await insertOpportunity(fixture.d1, 'OPP-1', 2.5);
    await insertOpportunity(fixture.d1, 'OPP-2', 1);

    const deployed = await resolvers.deployOpportunity(
      { id: 'OPP-1', targetModule: 'DPS NXT' },
      contextFor(fixture.d1)
    );

    expect(deployed).toMatchObject({ opp_id: 'OPP-1', status: 'DEPLOYED', recommended_module: 'DPS NXT' });
    expect(await resolvers.opportunities({}, contextFor(fixture.d1))).toMatchObject([
      { opp_id: 'OPP-1', status: 'DEPLOYED' },
      { opp_id: 'OPP-2', status: 'Identified', recommended_module: 'proCPX' }
    ]);
  });

  it('returns null when no opportunity matches the id', async () => {
    expect(await resolvers.deployOpportunity({ id: 'OPP-MISSING', targetModule: 'proCPX' }, contextFor(fixture.d1))).toBeNull();
  });

  it('binds the target module, deployed status and opportunity id in that order', async () => {
    const stub = createStubD1({ runResult: { success: true } });

    await resolvers.deployOpportunity({ id: 'OPP-1', targetModule: 'DPS NXT' }, contextFor(stub.d1));

    expect(stub.statements[0].values).toEqual(['DPS NXT', 'DEPLOYED', 'OPP-1']);
  });

  it('propagates write failures', async () => {
    const stub = createStubD1({ runError: new Error('deploy rejected') });

    await expect(resolvers.deployOpportunity({ id: 'OPP-1', targetModule: 'proCPX' }, contextFor(stub.d1))).rejects.toThrow(
      'deploy rejected'
    );
  });
});
