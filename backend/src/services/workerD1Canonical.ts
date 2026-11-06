import { assessmentD1ObjectSchema } from '../constants/assessmentD1';
import { D1_ROUTE_MESSAGES } from '../constants/d1';
import { queryD1Rows } from './workerD1Query';
import type { CloudflareD1Database } from '../types/cloudflare';
import type { D1Record } from '../types/d1';

export const loadCanonicalAssessmentFromD1 = async (
  db: CloudflareD1Database, assessmentId: string, tenantId: string
): Promise<D1Record> => {
  if (!tenantId) throw new Error(D1_ROUTE_MESSAGES.tenantScopeRequired);
  const rows = await queryD1Rows(db,
    'SELECT entry_type, payload_json FROM AssessmentStoreEntry AS entry WHERE assessment_id = ? ' +
    'AND EXISTS (SELECT 1 FROM AssessmentRecord AS assessment WHERE assessment.assessment_id = entry.assessment_id AND assessment.tenant_id = ?) ' +
    "AND entry_type IN ('canonical_module1', 'assessment', 'run') " +
    "ORDER BY CASE entry_type WHEN 'canonical_module1' THEN 0 WHEN 'assessment' THEN 1 ELSE 2 END, " +
    "json_extract(payload_json, '$.createdAt') DESC", [assessmentId, tenantId]);
  for (const row of rows) {
    const payload = assessmentD1ObjectSchema.parse(JSON.parse(String(row.payload_json)));
    if (row.entry_type === 'run' && payload.isSuperseded === true) continue;
    const canonical = row.entry_type === 'canonical_module1' ? payload : payload.canonicalModule1;
    const parsed = assessmentD1ObjectSchema.safeParse(canonical);
    if (parsed.success) return parsed.data;
  }
  throw new Error(D1_ROUTE_MESSAGES.missingCanonical(assessmentId));
};
