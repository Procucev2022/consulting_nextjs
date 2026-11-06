import { materialMappingRecordSchema } from '../constants/validation';
import type { CloudflareD1Database } from '../types/cloudflare';
import type { AssessmentMaterialMappingD1Row } from '../types/module2ReviewD1';
import type {
  AssessmentMaterialMappingParseResult, AssessmentMaterialMappingReadContext, MaterialMappingEntry
} from '../types/module2MaterialMapping';
import { MODULE2_D1_MATERIAL_MAPPING_DIAGNOSTICS } from '../constants/module2D1Scoped';
import logger from '../utils/logger';

const parseAssessmentMaterialMapping = (row: AssessmentMaterialMappingD1Row): AssessmentMaterialMappingParseResult => {
  let payload: unknown;
  try {
    payload = JSON.parse(row.payload_json);
  } catch (error) {
    return { valid: false, reason: 'invalid-json', error, schemaIssuePaths: [] };
  }
  const mapping = materialMappingRecordSchema.safeParse(payload);
  if (!mapping.success) return {
    valid: false,
    reason: 'schema-invalid',
    error: new TypeError(MODULE2_D1_MATERIAL_MAPPING_DIAGNOSTICS.INVALID_SCHEMA_ERROR),
    schemaIssuePaths: mapping.error.issues.map((issue) => issue.path.map(String).join('.') || '$')
  };
  if (mapping.data.sourceMaterialId !== row.source_material_id) return {
    valid: false,
    reason: 'source-id-mismatch',
    error: new TypeError(MODULE2_D1_MATERIAL_MAPPING_DIAGNOSTICS.SOURCE_ID_MISMATCH_ERROR),
    schemaIssuePaths: []
  };
  return { valid: true, mapping: mapping.data };
};

export const loadAssessmentMaterialMappings = async (
  db: CloudflareD1Database,
  assessmentId: string,
  context?: AssessmentMaterialMappingReadContext
): Promise<MaterialMappingEntry[]> => {
  const response = await db.prepare(`
    SELECT assessment_id, source_material_id, payload_json, reviewed_by, updated_at
    FROM AssessmentMaterialMapping WHERE assessment_id = ?
  `).bind(assessmentId).all<AssessmentMaterialMappingD1Row>();
  const mappings: MaterialMappingEntry[] = [];
  let invalidJsonCount = 0;
  let schemaInvalidCount = 0;
  let sourceIdMismatchCount = 0;
  let firstError: unknown;
  const sampleSourceMaterialIds: string[] = [];
  const schemaIssuePaths: string[] = [];
  let omittedSampleCount = 0;
  const trackInvalidRow = (sourceMaterialId: string): void => {
    if (sampleSourceMaterialIds.length < MODULE2_D1_MATERIAL_MAPPING_DIAGNOSTICS.MAX_SAMPLE_SOURCE_IDS) {
      sampleSourceMaterialIds.push(sourceMaterialId);
      return;
    }
    omittedSampleCount += 1;
  };
  for (const row of response.results || []) {
    const parsed = parseAssessmentMaterialMapping(row);
    if (parsed.valid) {
      mappings.push(parsed.mapping);
      continue;
    }
    invalidJsonCount += Number(parsed.reason === 'invalid-json');
    schemaInvalidCount += Number(parsed.reason === 'schema-invalid');
    sourceIdMismatchCount += Number(parsed.reason === 'source-id-mismatch');
    firstError ??= parsed.error;
    trackInvalidRow(row.source_material_id);
    for (const path of parsed.schemaIssuePaths) {
      if (!schemaIssuePaths.includes(path) &&
        schemaIssuePaths.length < MODULE2_D1_MATERIAL_MAPPING_DIAGNOSTICS.MAX_SAMPLE_SOURCE_IDS) {
        schemaIssuePaths.push(path);
      }
    }
  }
  const invalidRecordCount = invalidJsonCount + schemaInvalidCount + sourceIdMismatchCount;
  if (invalidRecordCount > 0) {
    logger.warn(MODULE2_D1_MATERIAL_MAPPING_DIAGNOSTICS.MESSAGE, {
      action: MODULE2_D1_MATERIAL_MAPPING_DIAGNOSTICS.ACTION,
      assessmentId,
      tenantId: context?.tenantId,
      requestId: context?.requestId,
      invalidRecordCount,
      invalidJsonCount,
      schemaInvalidCount,
      sourceIdMismatchCount,
      sampleSourceMaterialIds,
      omittedSampleCount,
      schemaIssuePaths,
      fallback: MODULE2_D1_MATERIAL_MAPPING_DIAGNOSTICS.FALLBACK
    }, firstError);
  }
  return mappings;
};
