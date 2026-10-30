import { materialMappingRecordSchema } from '../constants/validation';
import type { CloudflareD1Database } from '../types/cloudflare';
import type { AssessmentMaterialMappingD1Row } from '../types/module2ReviewD1';
import type { MaterialMappingEntry } from '../types/module2MaterialMapping';

export const loadAssessmentMaterialMappings = async (
  db: CloudflareD1Database,
  assessmentId: string
): Promise<MaterialMappingEntry[]> => {
  const response = await db.prepare(`
    SELECT assessment_id, source_material_id, payload_json, reviewed_by, updated_at
    FROM AssessmentMaterialMapping WHERE assessment_id = ?
  `).bind(assessmentId).all<AssessmentMaterialMappingD1Row>();
  const mappings: MaterialMappingEntry[] = [];
  for (const row of response.results || []) {
    try {
      const mapping = materialMappingRecordSchema.safeParse(JSON.parse(row.payload_json));
      if (mapping.success && mapping.data.sourceMaterialId === row.source_material_id) {
        mappings.push(mapping.data);
      }
    } catch {
      continue;
    }
  }
  return mappings;
};
