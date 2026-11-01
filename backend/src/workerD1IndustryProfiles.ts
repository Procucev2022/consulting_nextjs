import { D1_TABLES, D1_ROUTE_MESSAGES } from './constants/d1';
import { industryProfileQuerySchema } from './constants/validation';
import { queryD1Rows, requireWorkerDb } from './services/workerD1Query';
import type { CloudflareD1Database } from './types/cloudflare';
import type { D1Record, WorkerD1Result } from './types/d1';
import logger from './utils/logger';

interface IndustryProfileStorageRow extends D1Record {
  profile_json: string;
}

const parseProfile = (row: IndustryProfileStorageRow): Record<string, unknown> => {
  const parsed: unknown = JSON.parse(row.profile_json);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`D1 industry profile ${String(row.profile_id)} is not a JSON object`);
  }
  return parsed as Record<string, unknown>;
};

export const handleIndustryProfilesRoute = async (
  db: CloudflareD1Database | undefined,
  request: Request,
  url: URL
): Promise<WorkerD1Result> => {
  const database = requireWorkerDb(db);
  if (request.method !== 'GET') {
    return { status: 405, data: { success: false, message: D1_ROUTE_MESSAGES.industryProfileMethod } };
  }
  const parsed = industryProfileQuerySchema.safeParse({
    majorSector: url.searchParams.get('majorSector') ?? undefined
  });
  if (!parsed.success) {
    const requestId = request.headers.get('x-request-id') || undefined;
    logger.warn('Industry profile query rejected by validation', { requestId, issues: parsed.error.issues });
    return { status: 400, data: { success: false, message: D1_ROUTE_MESSAGES.industryProfileInvalid, errors: parsed.error.issues } };
  }
  const requestId = request.headers.get('x-request-id') || undefined;
  const profiles = await queryD1Rows<IndustryProfileStorageRow>(database, `
    SELECT profile_id, major_sector, minor_sector, profile_json
    FROM ${D1_TABLES.industryProfiles}
    ${parsed.data.majorSector ? 'WHERE major_sector = ?' : ''}
    ORDER BY major_sector, minor_sector
  `, parsed.data.majorSector ? [parsed.data.majorSector] : [], requestId);
  const presets = await queryD1Rows<D1Record>(database, `
    SELECT client_name AS clientName, major_sector AS majorSector, minor_sector AS minorSector
    FROM ${D1_TABLES.industrySectorPresets} ORDER BY client_name
  `, [], requestId);
  try {
    return {
      data: {
        success: true,
        profiles: profiles.map(parseProfile),
        presets: presets.map((row) => ({
          clientName: String(row.clientName),
          majorSector: String(row.majorSector),
          minorSector: String(row.minorSector)
        }))
      }
    };
  } catch (error) {
    logger.error('Industry profile JSON could not be decoded from D1', { requestId }, error);
    return { status: 500, data: { success: false, message: D1_ROUTE_MESSAGES.industryProfileCorrupt } };
  }
};
