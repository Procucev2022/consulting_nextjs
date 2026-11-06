import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetch as workerFetch } from '../src/worker';
import { getTaxonomyFromD1 } from '../src/workerD1';
import { D1_SCHEMA_QUERY } from '../src/constants/d1';
import type { CloudflareD1Database, CloudflareEnvironment, CloudflareExecutionContext } from '../src/types/cloudflare';

vi.mock('../src/services/workerTenantAccess', () => ({
  authorizeTenantRequest: vi.fn(async (request: Request, environment: CloudflareEnvironment) => ({ request, environment }))
}));

const context: CloudflareExecutionContext = { waitUntil: vi.fn(), passThroughOnException: vi.fn() };
const row = {
  commodity_code: '12345678', commodity_title: 'Database commodity',
  class_code: '12345600', class_title: 'Database class',
  family_code: '12340000', family_title: 'Database family',
  segment_code: '12000000', segment_title: 'Database segment',
  core_bucket: 'Direct Materials', classification_status: 'CLASSIFIED'
};

describe('D1 commodity catalog and live schema routes', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('returns bounded catalog pages with offsets and correlation headers', async () => {
    const all = vi.fn().mockResolvedValue({ results: [row] });
    const bind = vi.fn().mockReturnValue({ all });
    const prepare = vi.fn().mockReturnValue({ bind, first: vi.fn().mockResolvedValue({ ok: 1 }) });
    const response = await workerFetch(new Request('https://edge.example/api/taxonomy?limit=1000&offset=1000', { headers: { 'x-request-id': 'catalog-request' } }), { DB: { prepare } as unknown as CloudflareD1Database }, context);
    expect(response.status, await response.clone().text()).toBe(200);
    expect(response.headers.get('x-request-id')).toBe('catalog-request');
    expect(response.headers.get('Access-Control-Expose-Headers')).toBe('X-Request-Id');
    expect(bind).toHaveBeenCalledWith(1000, 1000);
    expect(prepare).toHaveBeenCalledWith(expect.stringContaining('LIMIT ? OFFSET ?'));
    await expect(response.json()).resolves.toMatchObject({ success: true, data: [{ commodityCode: row.commodity_code }], total: 1 });
  });

  it.each(['limit=1001', 'limit=0', 'limit=abc', 'offset=-1', 'offset=1.5', 'category=invalid', `q=${'x'.repeat(201)}`])('rejects invalid pagination and search inputs before database access: %s', async (query) => {
    const prepare = vi.fn();
    const response = await workerFetch(new Request(`https://edge.example/api/taxonomy?${query}`), { DB: { prepare } as unknown as CloudflareD1Database }, context);
    expect(response.status).toBe(400);
    expect(prepare).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({ success: false, message: 'Validation failed', errors: expect.any(Array) });
  });

  it('preserves lookup and category filtering with parameterized SQL', async () => {
    const all = vi.fn().mockResolvedValueOnce({ results: [row] }).mockResolvedValueOnce({ results: [] }).mockResolvedValueOnce({ results: [] });
    const bind = vi.fn().mockReturnValue({ all });
    const db = { prepare: vi.fn().mockReturnValue({ bind }) } as unknown as CloudflareD1Database;
    await expect(getTaxonomyFromD1(db, '', 'Direct Materials', row.commodity_code, 1000, 1000)).resolves.toMatchObject({ commodityCode: row.commodity_code });
    expect(bind).toHaveBeenNthCalledWith(1, row.commodity_code, `%${row.commodity_code}%`, `%${row.commodity_code}%`, `%${row.commodity_code}%`, 'Direct Materials', 1, 0);
    await expect(getTaxonomyFromD1(db, '', '', 'missing')).resolves.toBeNull();
    await expect(getTaxonomyFromD1(db, '', 'Packaging Materials', '')).resolves.toEqual([]);
    expect(bind).toHaveBeenLastCalledWith('Packaging Materials', 50, 0);
  });

  it('serves category mappings and category names from D1', async () => {
    const mappings = [
      { material_group_code: 'P11', category_name: 'Packing' },
      { material_group_code: 'S03', category_name: 'PRINTING & STATIONARY' }
    ];
    const all = vi.fn().mockResolvedValue({ results: mappings });
    const first = vi.fn().mockResolvedValue({ ok: 1 });
    const prepare = vi.fn().mockReturnValue({ all, first });
    const response = await workerFetch(
      new Request('https://edge.example/api/procurement/category-mappings'),
      { DB: { prepare } as unknown as CloudflareD1Database },
      context
    );
    expect(response.status).toBe(200);
    expect(prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT material_group_code, category_name FROM ProcurementCategoryMapping'));
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        mappings: { P11: 'Packing', S03: 'PRINTING & STATIONARY' },
        categories: ['PRINTING & STATIONARY', 'Packing']
      }
    });
  });

  it('renders actual SQLite table definitions and columns from D1', async () => {
    const schemaRows = [
      { table_name: 'PersistedOnly', table_sql: 'CREATE TABLE PersistedOnly (id TEXT, payload TEXT)', column_name: 'id', column_cid: 0 },
      { table_name: 'PersistedOnly', table_sql: 'CREATE TABLE PersistedOnly (id TEXT, payload TEXT)', column_name: 'payload', column_cid: 1 }
    ];
    const all = vi.fn().mockResolvedValue({ results: schemaRows });
    const first = vi.fn().mockResolvedValue({ ok: 1 });
    const prepare = vi.fn(() => ({ all, first }));
    const response = await workerFetch(new Request('https://edge.example/api/db/schema'), { DB: { prepare } as unknown as CloudflareD1Database }, context);
    expect(response.status, await response.clone().text()).toBe(200);
    expect(prepare.mock.calls.filter(([query]) => query === D1_SCHEMA_QUERY)).toHaveLength(1);
    expect(prepare).toHaveBeenCalledWith(D1_SCHEMA_QUERY);
    await expect(response.json()).resolves.toMatchObject({ success: true, data: [{ entity_name: 'PersistedOnly', primary_attributes: 'id, payload', ddl: schemaRows[0].table_sql, sample_records: [] }] });
  });
});
