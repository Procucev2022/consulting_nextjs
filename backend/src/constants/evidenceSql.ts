/**
 * SQL for the evidence read model. Every statement is parameterised; the only interpolated
 * identifier comes from the allowlist below.
 */

import type { EvidenceLedgerGroupColumn } from '../types/evidenceWorkbook';
import { EVIDENCE_GROUP_ROW_LIMIT } from './evidenceRoutes';

export const EVIDENCE_LEDGER_GROUP_COLUMNS = {
  SUPPLIER: 'supplier_name',
  PLANT: 'plant',
  MATERIAL_GROUP: 'material_group'
} as const;

export const EVIDENCE_SQL = {
  tenant: 'SELECT tenant_id FROM TenantMaster WHERE tenant_id = ? LIMIT 1',
  userById: 'SELECT id, name, email, role, status, tenant_id FROM User WHERE id = ? LIMIT 1',
  jobAccess:
    'SELECT a.assessment_id, a.tenant_id, a.customer_name, a.status, a.total_spend_cr, a.validated_spend_cr, ' +
    'a.gross_opportunity_cr, a.overlap_deductions_cr, a.net_defensible_opportunity_cr, ' +
    'a.potential_savings_cr, a.savings_pct, c.contact_email AS customer_contact_email ' +
    'FROM AssessmentRecord a LEFT JOIN CustomerRecord c ON c.customer_id = a.customer_id ' +
    'WHERE a.assessment_id = ? AND a.tenant_id = ? LIMIT 1',
  runs:
    'SELECT analysis_run_id, data_version_id, status, total_spend_cr, validated_spend_cr, ' +
    'gross_opportunity_cr, overlap_deductions_cr, net_defensible_opportunity_cr, potential_savings_cr, ' +
    'savings_pct, all_gates_passed, is_approved, is_superseded, created_at ' +
    'FROM AssessmentAnalysisRun WHERE assessment_id = ? ORDER BY created_at DESC, analysis_run_id DESC',
  versions:
    'SELECT data_version_id, version_number, file_name, file_size, checksum, uploaded_by, uploaded_at, ' +
    'record_count, is_superseded FROM AssessmentDataVersion WHERE assessment_id = ? ' +
    'ORDER BY version_number DESC, data_version_id DESC',
  ledgerTotals:
    'SELECT COUNT(*) AS row_count, COALESCE(SUM(total_in_cr_raw), 0) AS total_cr ' +
    'FROM ProcurementTransaction WHERE tenant_id = ? AND assessment_id = ?',
  ledgerSample:
    'SELECT transaction_id, source_row_number, po_number, po_line, document_date_raw, supplier_name, ' +
    'material_code, short_text, material_group, plant, order_quantity, order_unit, net_price, currency, ' +
    'total_inr_raw, total_in_cr_raw FROM ProcurementTransaction WHERE tenant_id = ? AND assessment_id = ? ' +
    'ORDER BY source_row_number ASC, transaction_id ASC LIMIT ?'
} as const;

export const buildLedgerGroupSql = (column: EvidenceLedgerGroupColumn): string =>
  `SELECT COALESCE(NULLIF(TRIM(${column}), ''), '(blank)') AS group_key, COUNT(*) AS row_count, ` +
  'COALESCE(SUM(total_in_cr_raw), 0) AS total_cr FROM ProcurementTransaction ' +
  `WHERE tenant_id = ? AND assessment_id = ? GROUP BY group_key ORDER BY total_cr DESC, group_key ASC LIMIT ${EVIDENCE_GROUP_ROW_LIMIT}`;
