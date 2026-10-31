-- Synthetic development-only examples for the PCBI researcher assignment queue.
-- Every assignee is visibly marked as demo data and INSERT OR IGNORE preserves later user edits.
INSERT OR IGNORE INTO PCBICommodityResearchAssignment (
  pcbi_id, assigned_to, assigned_by, assigned_at, updated_at
) VALUES
  ('PCBI-BRG-COMP-001', 'DEMO ONLY - Researcher Alpha', 'DEMO SEED', '2026-10-31T00:00:00.000Z', '2026-10-31T00:00:00.000Z'),
  ('PCBI-CHEM-CAUSTIC-001', 'DEMO ONLY - Researcher Beta', 'DEMO SEED', '2026-10-31T00:00:00.000Z', '2026-10-31T00:00:00.000Z'),
  ('PCBI-CHEM-SODA-001', 'DEMO ONLY - Researcher Gamma', 'DEMO SEED', '2026-10-31T00:00:00.000Z', '2026-10-31T00:00:00.000Z');

INSERT OR IGNORE INTO PCBICommodityResearchWorkflow (
  pcbi_id, status, due_date, notes, updated_by, updated_at
) VALUES
  ('PCBI-BRG-COMP-001', 'RESEARCHING', '2026-11-07', 'DEMO ONLY: confirm independent source coverage and unit normalization.', 'DEMO SEED', '2026-10-31T00:00:00.000Z'),
  ('PCBI-CHEM-CAUSTIC-001', 'BLOCKED', '2026-11-05', 'DEMO ONLY: awaiting a source methodology statement.', 'DEMO SEED', '2026-10-31T00:00:00.000Z'),
  ('PCBI-CHEM-SODA-001', 'READY_FOR_REVIEW', '2026-11-03', 'DEMO ONLY: source package is staged for reviewer triage.', 'DEMO SEED', '2026-10-31T00:00:00.000Z');
