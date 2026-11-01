-- Synthetic, non-financially-certified examples for the Module 2 Lever 7 workflow.
-- Records are explicitly marked DEMO_ONLY and never count as validated savings.
INSERT OR IGNORE INTO Module2LogisticsPackagingCandidate (
  candidate_id, assessment_id, lane, material_category, shipping_mode, incoterms,
  shipment_count, current_freight_inr, benchmark_freight_inr, packaging_spec,
  container_fill_pct, evidence_status, is_demo, updated_at
) VALUES
  ('DEMO-LOG-001', 'AIC-2026-0001', 'Pune Plant → Mumbai DC', 'Industrial chemicals', 'Road tanker', 'FCA', 24, 4800000, 4320000, 'UN-rated returnable bulk containers', 82, 'DEMO_ONLY', 1, '2026-10-31T00:00:00.000Z'),
  ('DEMO-LOG-002', 'AIC-2026-0001', 'Ahmedabad Plant → Pune Plant', 'Packaging materials', 'Full truckload', 'CPT', 18, 3240000, 3078000, 'Palletized corrugated cartons', 68, 'DEMO_ONLY', 1, '2026-10-31T00:00:00.000Z'),
  ('DEMO-LOG-003', 'AIC-2026-0001', 'Mumbai Port → Nagpur Plant', 'Metal components', 'Intermodal rail', 'DAP', 12, 3960000, 3564000, 'Export crate, 1200 × 1000 mm pallet', 91, 'DEMO_ONLY', 1, '2026-10-31T00:00:00.000Z');

-- Scope the existing illustrative opportunity register to its seeded demo tenant.
-- Explicit IDs keep any later real opportunities unassigned until an owner scopes them.
INSERT OR IGNORE INTO SavingsOpportunityTenantScope (opp_id, tenant_id)
SELECT opp_id, 'TNT-GLOBAL-8902' FROM SavingsOpportunity
WHERE opp_id IN ('OPP-001', 'OPP-002', 'OPP-003', 'OPP-004', 'OPP-005', 'OPP-006', 'OPP-007', 'OPP-008', 'OPP-009', 'OPP-010');

INSERT INTO TenantDataProvenance (tenant_id, classification, source_label, updated_at)
VALUES ('TNT-GLOBAL-8902', 'DEMO_ONLY', 'D1_SEEDED_MOCK_DATA', CURRENT_TIMESTAMP)
ON CONFLICT (tenant_id) DO UPDATE SET
  classification = excluded.classification,
  source_label = excluded.source_label,
  updated_at = excluded.updated_at;
