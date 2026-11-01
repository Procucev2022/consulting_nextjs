import { afterEach, describe, expect, it, vi } from 'vitest';
import { D1_ROUTE_MESSAGES } from '../src/constants/d1';
import type { CloudflareD1Database, CloudflareD1PreparedStatement } from '../src/types/cloudflare';
import type { D1Record } from '../src/types/d1';
import type { PcbiAdminImportInput } from '../src/types/validation';
import { createWorkerAuthToken, handleAdminRoute } from '../src/workerAuth';
import { getPublishedPcbiPayload, handlePcbiAdminRoute, mapPcbiImportRow } from '../src/workerD1PcbiAdmin';

vi.mock('../src/utils/logger', () => ({ default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

type StoredVersion = Record<string, unknown> & { id: string; version: string; status: string; uploaded_at: string };

class TestStatement implements CloudflareD1PreparedStatement {
  private values: unknown[] = [];
  constructor(private readonly db: TestDatabase, private readonly sql: string) {}
  bind(...values: unknown[]): CloudflareD1PreparedStatement { this.values = values; return this; }
  async first<T>(): Promise<T | null> {
    const versions = this.db.versions;
    if (this.sql.includes('SELECT id FROM PCBIMasterVersion')) {
      return (versions.find((row) => row.version === this.values[0]) as T | undefined) || null;
    }
    if (this.sql.includes("status = 'PUBLISHED'")) {
      const row = versions.filter((version) => version.status === 'PUBLISHED')
        .sort((a, b) => String(b.published_at || '').localeCompare(String(a.published_at || '')))[0];
      return row ? ({ payload_json: row.payload_json } as T) : null;
    }
    if (this.sql.includes('SELECT * FROM PCBIMasterVersion WHERE version')) {
      return (versions.find((row) => row.version === this.values[0]) as T | undefined) || null;
    }
    return null;
  }
  async all<T>(): Promise<{ results: T[] }> {
    return { results: [...this.db.versions].sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at)) as T[] };
  }
  async run(): Promise<unknown> {
    if (this.sql.includes('INSERT INTO PCBIMasterVersion')) {
      const [id, version, uploadId, fileName, fileSize, uploadedBy, uploadedAt, effectiveDate, status, metrics, validation, payload] = this.values;
      this.db.versions.push({
        id, version, upload_id: uploadId, file_name: fileName, file_size_mb: fileSize, uploaded_by: uploadedBy,
        uploaded_at: uploadedAt, effective_date: effectiveDate, status, metrics_json: metrics,
        validation_report_json: validation, payload_json: payload, published_at: null, published_by: null
      } as StoredVersion);
    } else if (this.sql.includes("SET status = 'ARCHIVED'")) {
      this.db.versions.forEach((row) => {
        if (row.status === 'PUBLISHED' && row.version !== this.values[0]) row.status = 'ARCHIVED';
      });
    } else if (this.sql.includes("SET status = 'PUBLISHED'")) {
      const [publishedAt, publishedBy, version] = this.values;
      const row = this.db.versions.find((entry) => entry.version === version);
      if (row) Object.assign(row, { status: 'PUBLISHED', published_at: publishedAt, published_by: publishedBy });
    }
    return { success: true };
  }
}

class TestDatabase implements CloudflareD1Database {
  readonly versions: StoredVersion[] = [];
  readonly prepared: string[] = [];
  batch?: (statements: CloudflareD1PreparedStatement[]) => Promise<unknown[]>;
  constructor(withBatch = true) {
    if (withBatch) this.batch = async (statements) => Promise.all(statements.map((statement) => statement.run()));
  }
  prepare(sql: string): CloudflareD1PreparedStatement {
    this.prepared.push(sql);
    return new TestStatement(this, sql);
  }
}

const importPayload = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  version: 'V3.0',
  file_name: 'pcbi-master.csv',
  file_size_mb: 0.4,
  uploaded_by: 'Admin User',
  worksheets: [{ sheetName: 'Master', detectedType: 'PCBI_MASTER', rowCount: 1, columnCount: 4 }],
  mappings: {
    PCBI_MASTER: [
      { excelColumn: 'ID', mappedField: 'pcbi_id' },
      { excelColumn: 'Name', mappedField: 'benchmark_name' },
      { excelColumn: 'Unit', mappedField: 'benchmark_unit' },
      { excelColumn: 'Currency', mappedField: 'currency' },
      { excelColumn: 'Sector', mappedField: 'sector' },
      { excelColumn: 'Quality', mappedField: 'quality_rating' }
    ],
    WEEKLY_INDEX: [
      { excelColumn: 'ID', mappedField: 'pcbi_id' },
      { excelColumn: 'Date', mappedField: 'week_start' },
      { excelColumn: 'Value', mappedField: 'index_value' }
    ]
  },
  benchmarks: [{ ID: 'PCBI-STEEL-1', Name: 'Steel Flat', Unit: 'INR/MT', Currency: 'INR', Sector: 'Steel', Quality: 'A' }],
  weeklyIndices: [{ ID: 'PCBI-STEEL-1', Date: '2026-10-01', Value: 105 }],
  constituents: [],
  sources: [],
  unspscMappings: [],
  validationSummary: {
    totalRecords: 2, validRecords: 2, warningRecords: 0, errorRecords: 0, blockingErrorCount: 0,
    warningCount: 0, aQualityCount: 1, bQualityCount: 0, cQualityCount: 0, avgBenchmarkability: 100,
    dateStart: '2026-10-01', dateEnd: '2026-10-01', issues: []
  },
  ...overrides
});

const call = (
  db: CloudflareD1Database,
  path: string,
  method: 'GET' | 'POST' = 'GET',
  body?: unknown
): Promise<Awaited<ReturnType<typeof handlePcbiAdminRoute>>> => {
  const url = new URL(`https://edge.example/api/admin/pcbi${path}`);
  return handlePcbiAdminRoute(db, new Request(url, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  }), url);
};

describe('D1 PCBI master administration', () => {
  afterEach(() => vi.restoreAllMocks());

  it('persists a validated import and returns version metrics', async () => {
    const db = new TestDatabase();
    const response = await call(db, '/import', 'POST', importPayload());
    expect(response).toMatchObject({
      data: { success: true, version: 'V3.0', status: 'VALIDATED', pcbi_records: 1, weekly_index_records: 1 }
    });
    expect(db.versions[0]).toMatchObject({ version: 'V3.0', status: 'VALIDATED', file_name: 'pcbi-master.csv' });
    expect(JSON.parse(String(db.versions[0].metrics_json))).toMatchObject({ benchmark_count: 1, a_quality_count: 1 });
  });

  it('rejects malformed JSON payloads and blocking client validation results', async () => {
    const db = new TestDatabase();
    const malformed = new Request('https://edge.example/api/admin/pcbi/import', { method: 'POST', body: '{' });
    expect(await handlePcbiAdminRoute(db, malformed, new URL(malformed.url))).toMatchObject({ status: 400 });
    expect(await call(db, '/import', 'POST', importPayload({
      validationSummary: { ...importPayload().validationSummary as object, blockingErrorCount: 2 }
    }))).toMatchObject({ status: 422, data: { message: D1_ROUTE_MESSAGES.pcbiImportBlocked } });
    expect(db.versions).toHaveLength(0);
  });

  it('rejects empty masters, missing mapped fields, duplicate ids, and invalid weekly rows', async () => {
    const db = new TestDatabase();
    expect(await call(db, '/import', 'POST', importPayload({ benchmarks: [] }))).toMatchObject({ status: 422 });
    expect(await call(db, '/import', 'POST', importPayload({ benchmarks: [{ ID: 'PCBI-1', Name: '' }] }))).toMatchObject({ status: 422 });
    expect(await call(db, '/import', 'POST', importPayload({ benchmarks: [
      { ID: 'PCBI-1', Name: 'One', Unit: 'MT', Currency: 'INR' },
      { ID: 'PCBI-1', Name: 'Two', Unit: 'MT', Currency: 'INR' }
    ] }))).toMatchObject({ status: 422 });
    expect(await call(db, '/import', 'POST', importPayload({ weeklyIndices: [{ ID: 'PCBI-1', Date: 'yesterday', Value: -1 }] })))
      .toMatchObject({ status: 422 });
    expect(await call(db, '/import', 'POST', importPayload({
      benchmarks: [{ ID: '', Name: '', Unit: '', Currency: '' }],
      weeklyIndices: [{ ID: '', Date: 'not-a-date', Value: 'not-a-number' }]
    }))).toMatchObject({ status: 422, data: { errors: expect.arrayContaining([
      expect.objectContaining({ field: 'pcbi_id' }),
      expect.objectContaining({ field: 'benchmark_unit' }),
      expect.objectContaining({ field: 'currency' }),
      expect.objectContaining({ field: 'weeklyIndices.pcbi_id' }),
      expect.objectContaining({ field: 'weeklyIndices.index_value' })
    ]) } });
    expect(db.versions).toHaveLength(0);
  });

  it('uses worksheet row fields when a column mapping is absent', () => {
    const payload = { ...importPayload(), mappings: {} } as unknown as PcbiAdminImportInput;
    expect(mapPcbiImportRow({ pcbi_id: 'PCBI-ROW-1', benchmark_name: 'Row value' }, 'PCBI_MASTER', payload, [
      'pcbi_id', 'benchmark_name'
    ])).toEqual({ pcbi_id: 'PCBI-ROW-1', benchmark_name: 'Row value' });
  });

  it('rejects schema errors and duplicate version names', async () => {
    const db = new TestDatabase();
    expect(await call(db, '/import', 'POST', importPayload({ version: 'release-three' }))).toMatchObject({ status: 400 });
    await call(db, '/import', 'POST', importPayload());
    expect(await call(db, '/import', 'POST', importPayload())).toEqual({
      status: 409, data: { success: false, message: D1_ROUTE_MESSAGES.pcbiVersionConflict }
    });
  });

  it('returns stored version history and version details, including not found', async () => {
    const db = new TestDatabase();
    await call(db, '/import', 'POST', importPayload({ file_size_mb: 0, validationSummary: {
      ...importPayload().validationSummary as object, dateStart: null
    } }));
    expect(await call(db, '/versions')).toMatchObject({ data: { success: true, total: 1, active_version: null } });
    expect(await call(db, '/versions/V3.0')).toMatchObject({
      data: { success: true, version: { version: 'V3.0', status: 'VALIDATED', metrics: { benchmark_count: 1 } } }
    });
    expect(await call(db, '/versions/V9.0')).toEqual({
      status: 404, data: { success: false, message: D1_ROUTE_MESSAGES.pcbiVersionNotFound }
    });
  });

  it('publishes a validated version, archives the former active version, and supports non-batch D1 adapters', async () => {
    const db = new TestDatabase(false);
    await call(db, '/import', 'POST', importPayload());
    await call(db, '/import', 'POST', importPayload({ version: 'V4.0' }));
    await call(db, '/publish/V3.0', 'POST', { published_by: 'Admin User' });
    const published = await call(db, '/publish/V4.0', 'POST', { published_by: 'Second Admin' });
    expect(published).toMatchObject({ data: { success: true, activeVersion: 'V4.0', metrics: { benchmark_count: 1 } } });
    expect(db.versions.map((row) => [row.version, row.status])).toEqual([['V3.0', 'ARCHIVED'], ['V4.0', 'PUBLISHED']]);
    expect(await call(db, '/publish/V4.0', 'POST', { published_by: 'Second Admin' })).toMatchObject({
      data: { success: true, activeVersion: 'V4.0' }
    });
    expect((await call(db, '/versions')).data).toMatchObject({ active_version: 'V4.0' });
    expect(await getPublishedPcbiPayload(db)).toMatchObject({ version: 'V4.0' });
    db.versions[1].payload_json = '{invalid-json';
    expect(await getPublishedPcbiPayload(db)).toBeNull();
  });

  it('publishes through D1 batch and returns a null active version when none are published', async () => {
    const db = new TestDatabase();
    await call(db, '/import', 'POST', importPayload());
    expect(await call(db, '/publish/V3.0', 'POST', { published_by: 'Admin User' })).toMatchObject({
      data: { success: true, activeVersion: 'V3.0' }
    });
    expect((await call(db, '/versions')).data).toMatchObject({ active_version: 'V3.0' });
  });

  it('blocks malformed, missing, and draft publications', async () => {
    const db = new TestDatabase();
    expect(await call(db, '/publish/V3.0', 'POST', { published_by: '' })).toMatchObject({ status: 400 });
    expect(await call(db, '/publish/V3.0', 'POST', { published_by: 'Admin' })).toMatchObject({ status: 404 });
    const draft = importPayload({ validationSummary: { ...importPayload().validationSummary as object, blockingErrorCount: 1 } });
    // A blocked import cannot be persisted, so a draft row here exercises the publish state gate.
    db.versions.push({
      id: 'draft-id', version: 'V3.0', upload_id: 'draft-upload', status: 'DRAFT', uploaded_at: '2026-01-01',
      payload_json: JSON.stringify({ ...draft, validationSummary: { ...draft.validationSummary as object, blockingErrorCount: 0 } }),
      metrics_json: '{}'
    });
    expect(await call(db, '/publish/V3.0', 'POST', { published_by: 'Admin' })).toMatchObject({ status: 422 });
  });

  it('returns method and route errors', async () => {
    const db = new TestDatabase();
    expect(await call(db, '/versions', 'POST')).toMatchObject({ status: 405 });
    expect(await call(db, '/import', 'GET')).toMatchObject({ status: 405 });
    expect(await call(db, '/unknown')).toMatchObject({ status: 404 });
    expect(await call(db, '/publish/V3.0', 'GET')).toMatchObject({ status: 405 });
  });

  it('keeps PCBI administration behind the administrator authorization gate', async () => {
    const db = new TestDatabase();
    const url = new URL('https://edge.example/api/admin/pcbi/versions');
    expect(await handleAdminRoute(new Request(url), { DB: db, AUTH_SECRET: 'test-secret' }, url)).toMatchObject({ status: 403 });
    const token = await createWorkerAuthToken({ id: 'admin-1', email: 'admin@example.com', role: 'ADMIN', subscription_tier: 'GOLD' }, 'test-secret');
    const response = await handleAdminRoute(new Request(url, { headers: { Authorization: `Bearer ${token}` } }), { DB: db, AUTH_SECRET: 'test-secret' }, url);
    expect(response).toMatchObject({ status: 200, body: { success: true, total: 0, active_version: null } });
  });
});
