import {
  D1_PCBI_CONSTITUENT_FIELDS, D1_PCBI_MASTER_FIELDS, D1_PCBI_UNSPSC_FIELDS,
  D1_PCBI_WEEKLY_FIELDS, D1_ROUTE_MESSAGES, D1_TABLES
} from './constants/d1';
import { pcbiReferenceQuerySchema } from './constants/validation';
import { queryD1Rows, requireWorkerDb } from './services/workerD1Query';
import type { CloudflareD1Database } from './types/cloudflare';
import type { D1Record, WorkerD1Result } from './types/d1';
import logger from './utils/logger';
import { getPublishedPcbiPayload, mapPcbiImportRow } from './workerD1PcbiAdmin';
import type { PcbiAdminImportInput } from './types/validation';

const numericValue = (value: unknown): number | null => {
  if (value === '' || value === undefined || value === null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const normalizedImportedBenchmarks = (payload: PcbiAdminImportInput): D1Record[] =>
  payload.benchmarks.map((row) => ({
    ...row,
    ...mapPcbiImportRow(row, 'PCBI_MASTER', payload, [...D1_PCBI_MASTER_FIELDS]),
    active: true,
    applicable_sectors: String(mapPcbiImportRow(row, 'PCBI_MASTER', payload, ['sector']).sector || '')
      .split(',').map((sector) => sector.trim()).filter(Boolean),
    benchmarkability_percent: numericValue(mapPcbiImportRow(row, 'PCBI_MASTER', payload, ['benchmarkability_percent']).benchmarkability_percent),
    residual_percent: numericValue(mapPcbiImportRow(row, 'PCBI_MASTER', payload, ['residual_percent']).residual_percent)
  }));

const normalizedImportedWeeklyRows = (payload: PcbiAdminImportInput): D1Record[] => {
  const benchmarks = normalizedImportedBenchmarks(payload);
  const benchmarkById = new Map(benchmarks.map((benchmark) => [String(benchmark.pcbi_id), benchmark]));
  return payload.weeklyIndices.map((row) => {
    const values = mapPcbiImportRow(row, 'WEEKLY_INDEX', payload, [...D1_PCBI_WEEKLY_FIELDS]);
    const parent = benchmarkById.get(String(values.pcbi_id));
    return {
      ...row,
      ...values,
      index_value: Number(values.index_value),
      unit: parent?.benchmark_unit,
      currency: values.currency || parent?.currency,
      source: values.source || parent?.benchmark_source
    };
  });
};

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
  const publishedPayload = await getPublishedPcbiPayload(database);
  if (subPath === '/benchmarks' || subPath === '/master/benchmarks') {
    const rows = publishedPayload
      ? normalizedImportedBenchmarks(publishedPayload).sort((a, b) =>
        String(a.category || '').localeCompare(String(b.category || '')) ||
        String(a.sub_category || '').localeCompare(String(b.sub_category || '')))
      : await read(`SELECT * FROM ${D1_TABLES.pcbiBenchmarks} WHERE active = 1 ORDER BY category, sub_category`);
    const benchmarks = rows.map(normalizeBenchmark);
    return { data: sector ? benchmarks.filter((row) =>
      row.sector === sector || row.benchmark_scope === 'GLOBAL' ||
      (Array.isArray(row.applicable_sectors) && row.applicable_sectors.includes(sector))) : benchmarks };
  }
  if (subPath.startsWith('/indices/') || subPath === '/indices' || subPath === '/index-trend') {
    const seriesId = subPath.startsWith('/indices/') ? decodeURIComponent(subPath.slice('/indices/'.length)) : pcbiId;
    const baseRows = publishedPayload
      ? normalizedImportedWeeklyRows(publishedPayload)
        .filter((row) => (!seriesId || row.pcbi_id === seriesId) && !row.component_id)
        .sort((a, b) => String(b.week_start).localeCompare(String(a.week_start)))
      : await read(
        `SELECT * FROM ${D1_TABLES.pcbiWeeklyReference}${seriesId ? ' WHERE pcbi_id = ? AND component_id IS NULL' : ''} ` +
        'ORDER BY week_start DESC, id ASC LIMIT ?', seriesId ? [seriesId, limit] : [limit]
      );
    const promotedRows = await read(`
      SELECT o.observation_id AS id, o.pcbi_id, o.observation_date AS week_start,
        date(o.observation_date, '+6 days') AS week_end, o.normalized_value AS index_value,
        o.normalized_currency AS currency, o.normalized_unit AS unit, s.source_name AS source,
        'A' AS quality_rating, NULL AS component_id
      FROM ${D1_TABLES.pcbiCommodityObservations} o
      INNER JOIN ${D1_TABLES.pcbiCommodityPromotions} p ON p.source_id = o.source_id
      INNER JOIN ${D1_TABLES.pcbiCommoditySources} s ON s.source_id = o.source_id
      WHERE o.status = 'VERIFIED' AND s.frequency = 'WEEKLY'${seriesId ? ' AND o.pcbi_id = ?' : ''}
      ORDER BY o.observation_date DESC`, seriesId ? [seriesId] : []);
    const weeklyRows = new Map<string, D1Record>();
    for (const row of baseRows) weeklyRows.set(`${String(row.pcbi_id)}:${String(row.week_start || row.week_date)}`, row);
    for (const row of promotedRows) weeklyRows.set(`${String(row.pcbi_id)}:${String(row.week_start)}`, row);
    const rows = [...weeklyRows.values()]
      .sort((a, b) => String(b.week_start || b.week_date).localeCompare(String(a.week_start || a.week_date)))
      .slice(0, limit);
    return { data: rows };
  }
  if (subPath === '/components' || subPath === '/unspsc-mapping') {
    if (publishedPayload && subPath === '/components') {
      const benchmarks = new Map(normalizedImportedBenchmarks(publishedPayload).map((benchmark) => [String(benchmark.pcbi_id), benchmark]));
      const rows: D1Record[] = publishedPayload.constituents.map((row, index): D1Record => {
        const values = mapPcbiImportRow(row, 'CONSTITUENTS', publishedPayload, [...D1_PCBI_CONSTITUENT_FIELDS]);
        const parent = benchmarks.get(String(values.pcbi_id));
        return {
          ...row, ...values, id: `${String(values.pcbi_id)}-${index + 1}`,
          component_name: values.constituent_name, benchmark_source: parent?.benchmark_source,
          benchmark_unit: parent?.benchmark_unit, currency: parent?.currency,
          geography: parent?.geography, quality_rating: values.quality_rating || parent?.quality_rating,
          active: true
        };
      }).filter((row) => (!pcbiId || row.pcbi_id === pcbiId) && Boolean(row.pcbi_id));
      return { data: rows };
    }
    if (publishedPayload && subPath === '/unspsc-mapping') {
      const rows: D1Record[] = publishedPayload.unspscMappings.map((row): D1Record => ({
        ...row,
        ...mapPcbiImportRow(row, 'UNSPSC_MAPPING', publishedPayload, [...D1_PCBI_UNSPSC_FIELDS]),
        active: true
      })).filter((row) => (!pcbiId || row.pcbi_id === pcbiId) && Boolean(row.pcbi_id));
      return { data: rows };
    }
    const table = subPath === '/components' ? D1_TABLES.pcbiComponents : D1_TABLES.pcbiMappings;
    const rows = await read(`SELECT * FROM ${table} WHERE active = 1${pcbiId ? ' AND pcbi_id = ?' : ''} ORDER BY id`, pcbiId ? [pcbiId] : []);
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
