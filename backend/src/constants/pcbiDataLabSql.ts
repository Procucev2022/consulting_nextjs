import { D1_TABLES } from './d1';

export const SQL_PCBI_CUSTOMER_SPEND_BY_UNSPSC = `
WITH current_version AS (
  SELECT d.assessment_id, d.data_version_id
  FROM ${D1_TABLES.dataVersions} d
  WHERE d.data_version_id = (
    SELECT latest.data_version_id FROM ${D1_TABLES.dataVersions} latest
    WHERE latest.assessment_id = d.assessment_id
    ORDER BY latest.version_number DESC, latest.uploaded_at DESC, latest.data_version_id DESC LIMIT 1
  )
)
SELECT COALESCE(
    CASE WHEN json_valid(am.payload_json) THEN NULLIF(TRIM(json_extract(am.payload_json, '$.assignedUnspscCode')), '') END,
    CASE WHEN json_valid(mm.payload_json) THEN NULLIF(TRIM(json_extract(mm.payload_json, '$.assignedUnspscCode')), '') END,
    CASE WHEN json_valid(tx.raw_json) THEN NULLIF(TRIM(json_extract(tx.raw_json, '$.unspscCode')), '') END,
    CASE WHEN json_valid(tx.raw_json) THEN NULLIF(TRIM(json_extract(tx.raw_json, '$.unspsc_code')), '') END
  ) AS unspsc_code,
  COALESCE(SUM(CASE
    WHEN COALESCE(tx.total_inr_raw, 0) > 0 THEN tx.total_inr_raw
    WHEN COALESCE(tx.total_in_cr_raw, 0) > 0 THEN tx.total_in_cr_raw * ?1
    ELSE 0
  END), 0) AS spend_inr,
  COUNT(*) AS transaction_count
FROM ${D1_TABLES.transactions} tx
LEFT JOIN current_version cv ON cv.assessment_id = tx.assessment_id
LEFT JOIN ${D1_TABLES.assessmentMaterialMappings} am
  ON am.assessment_id = tx.assessment_id
  AND am.source_material_id = UPPER(TRIM(COALESCE(tx.material_code, '')))
LEFT JOIN ${D1_TABLES.materialMappings} mm
  ON mm.source_material_id = UPPER(TRIM(COALESCE(tx.material_code, '')))
WHERE COALESCE(UPPER(TRIM(tx.deletion_indicator)), '') <> 'L'
  AND (cv.data_version_id IS NULL OR tx.source_document_id = cv.data_version_id
    OR tx.source_document_id = tx.assessment_id || ':' || cv.data_version_id)
  AND COALESCE(
    CASE WHEN json_valid(am.payload_json) THEN NULLIF(TRIM(json_extract(am.payload_json, '$.assignedUnspscCode')), '') END,
    CASE WHEN json_valid(mm.payload_json) THEN NULLIF(TRIM(json_extract(mm.payload_json, '$.assignedUnspscCode')), '') END,
    CASE WHEN json_valid(tx.raw_json) THEN NULLIF(TRIM(json_extract(tx.raw_json, '$.unspscCode')), '') END,
    CASE WHEN json_valid(tx.raw_json) THEN NULLIF(TRIM(json_extract(tx.raw_json, '$.unspsc_code')), '') END
  ) IS NOT NULL
GROUP BY unspsc_code`;
