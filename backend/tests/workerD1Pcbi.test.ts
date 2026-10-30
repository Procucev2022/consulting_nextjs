import { afterEach, describe, expect, it, vi } from 'vitest';
import { D1_REPORTING, D1_ROUTE_MESSAGES } from '../src/constants/d1';
import { handlePcbiRoute } from '../src/workerD1Pcbi';
import type { CloudflareD1Database } from '../src/types/cloudflare';
import type { D1Record } from '../src/types/d1';

vi.mock('../src/utils/logger', () => ({ default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const database = (rows: D1Record[] = []): CloudflareD1Database => {
  const statement = {
    bind: vi.fn().mockReturnThis(), all: vi.fn().mockResolvedValue({ results: rows }),
    first: vi.fn(), run: vi.fn()
  };
  return { prepare: vi.fn().mockReturnValue(statement) };
};

const call = (db: CloudflareD1Database | undefined, path: string, query = '', headers = {}):
ReturnType<typeof handlePcbiRoute> => {
  const url = new URL(`https://edge.example/api/pcbi${path}${query}`);
  return handlePcbiRoute(db, path, new Request(url, { headers }), url);
};

describe('D1 PCBI reference data', () => {
  afterEach(() => vi.restoreAllMocks());

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

  it('returns a missing endpoint error for unsupported routes', async () => {
    expect(await call(database(), '/missing')).toEqual({
      status: 404, data: { success: false, message: D1_ROUTE_MESSAGES.unknownPcbi }
    });
  });
});
