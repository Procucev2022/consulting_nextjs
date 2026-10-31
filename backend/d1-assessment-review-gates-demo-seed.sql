-- Demo review records are intentionally pending until a reviewer supplies real evidence.
WITH gate_keys(gate_key) AS (
  VALUES
    ('M1_INPUT_ROW_RECONCILIATION'),
    ('M1_CURRENCY_NORMALIZATION'),
    ('M1_TAXONOMY_VALIDATION'),
    ('M1_SUPPLIER_DEDUPLICATION'),
    ('M1_PLANT_MAPPING'),
    ('M1_ANOMALY_EXCLUSION_SIGNOFF'),
    ('M1_BASELINE_SPEND_SIGNOFF'),
    ('M2_ADDRESSABLE_SPEND'),
    ('M2_GROSS_OPPORTUNITY_POOL'),
    ('M2_OVERLAP_DEDUCTION'),
    ('M2_NET_DEFENSIBLE_OPPORTUNITY'),
    ('M2_PROVEN_OPPORTUNITY'),
    ('M2_DELIVERY_RANGE'),
    ('M3_BENCHMARK_COVERAGE'),
    ('M3_BENCHMARKABLE_SPEND'),
    ('M3_PRICE_GAP_ANALYTICAL_SIGNAL'),
    ('M3_ANALYTICAL_ISOLATION'),
    ('M3_COMMODITY_INDEX_MAPPING'),
    ('M3_INDEXATION_METHODOLOGY_SIGNOFF'),
    ('M3_BENCHMARK_DATA_QUALITY_REVIEW'),
    ('M4_GROSS_OPPORTUNITY'),
    ('M4_OVERLAP'),
    ('M4_NET_OPPORTUNITY'),
    ('M4_PROVEN_OPPORTUNITY'),
    ('M4_DELIVERY_RANGE'),
    ('M4_EVIDENCE_COMPLETENESS')
), demo_assessments(assessment_id) AS (
  SELECT assessment_id FROM AssessmentRecord
  WHERE assessment_id IN ('AIC-2026-0001', 'AIC-2026-0002', 'AIC-2026-0003')
)
INSERT OR IGNORE INTO AssessmentReviewGate (
  assessment_id, gate_key, status, evidence_reference, review_note, reviewed_by, reviewed_at
)
SELECT demo_assessments.assessment_id, gate_keys.gate_key, 'PENDING', NULL, NULL, NULL, NULL
FROM demo_assessments CROSS JOIN gate_keys;
