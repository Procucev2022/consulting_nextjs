import { D1_ROUTE_MESSAGES, D1_TABLES } from './constants/d1';
import { pcbiReferenceQuerySchema } from './constants/validation';
import { queryD1Rows, requireWorkerDb } from './services/workerD1Query';
import type { CloudflareD1Database } from './types/cloudflare';
import type { D1Record, WorkerD1Result } from './types/d1';
import logger from './utils/logger';

const normalizeBenchmark = (row: D1Record): D1Record => ({
  ...row,
  active: Boolean(row.active),
  applicable_sectors: typeof row.applicable_sectors === 'string'
    ? JSON.parse(row.applicable_sectors) : row.applicable_sectors
});

export const handlePcbiRoute = async (
  db: CloudflareD1Database | undefined,
  subPath: string,
  request: Request,
  url: URL
): Promise<WorkerD1Result> => {
  const database = requireWorkerDb(db);
  if (request.method !== 'GET') return {
    status: 405, data: { success: false, message: D1_ROUTE_MESSAGES.pcbiMethod }
  };
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const parsed = pcbiReferenceQuerySchema.safeParse({
    sector: url.searchParams.get('sector') ?? undefined,
    pcbiId: url.searchParams.get('pcbi_id') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined
  });
  if (!parsed.success) {
    logger.warn(D1_ROUTE_MESSAGES.invalidQuery, { requestId, errors: parsed.error.issues });
    return { status: 400, data: {
      success: false, message: D1_ROUTE_MESSAGES.invalidQuery, errors: parsed.error.issues
    } };
  }
  const { sector, pcbiId, limit } = parsed.data;
  const read = (sql: string, values: unknown[] = []): Promise<D1Record[]> =>
    queryD1Rows(database, sql, values, requestId);
  if (subPath === '/benchmarks' || subPath === '/master/benchmarks') {
    const rows = await read(`SELECT * FROM ${D1_TABLES.pcbiBenchmarks} WHERE active = 1 ORDER BY category, sub_category`);
    const benchmarks = rows.map(normalizeBenchmark);
    return { data: sector ? benchmarks.filter((row) =>
      row.sector === sector || row.benchmark_scope === 'GLOBAL' ||
      (Array.isArray(row.applicable_sectors) && row.applicable_sectors.includes(sector))) : benchmarks };
  }
  if (subPath.startsWith('/indices/') || subPath === '/indices' || subPath === '/index-trend') {
    const seriesId = subPath.startsWith('/indices/') ? decodeURIComponent(subPath.slice('/indices/'.length)) : pcbiId;
    return { data: await read(
      `SELECT * FROM ${D1_TABLES.pcbiWeeklyReference}${seriesId ? ' WHERE pcbi_id = ? AND component_id IS NULL' : ''} ` +
      'ORDER BY week_start DESC, id ASC LIMIT ?', seriesId ? [seriesId, limit] : [limit]
    ) };
  }
  if (subPath === '/components' || subPath === '/unspsc-mapping') {
    const table = subPath === '/components' ? D1_TABLES.pcbiComponents : D1_TABLES.pcbiMappings;
    const rows = await read(`SELECT * FROM ${table} WHERE active = 1${pcbiId ? ' AND pcbi_id = ?' : ''} ORDER BY id`,
      pcbiId ? [pcbiId] : []);
    return { data: rows.map((row) => ({ ...row, active: Boolean(row.active) })) };
  }
  if (subPath === '/dashboard') {
    const snapshots = await read(`SELECT * FROM ${D1_TABLES.pcbiSnapshot} ORDER BY commodity_name ASC`);
    return { data: {
      totalCommoditiesTracked: snapshots.length,
      activeAlertsCount: snapshots.filter((row) => Boolean(row.active_alert)).length,
      commodities: snapshots
    } };
  }
  return { status: 404, data: { success: false, message: D1_ROUTE_MESSAGES.unknownPcbi } };
};
