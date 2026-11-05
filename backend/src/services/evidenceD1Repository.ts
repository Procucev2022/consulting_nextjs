/**
 * Read model for evidence exports. Each function runs one parameterised D1 query through the
 * audited queryD1Rows helper and maps snake_case columns to the camelCase evidence records.
 */

import { EVIDENCE_TRANSACTION_SHEET_ROW_LIMIT } from '../constants/evidenceRoutes';
import { EVIDENCE_LEDGER_GROUP_COLUMNS, EVIDENCE_SQL, buildLedgerGroupSql } from '../constants/evidenceSql';
import type { CloudflareD1Database } from '../types/cloudflare';
import type {
  EvidenceGroupRecord,
  EvidenceJobAccessRecord,
  EvidenceLedgerDetail,
  EvidenceLedgerGroupColumn,
  EvidenceLedgerRecord,
  EvidenceLedgerTotals,
  EvidenceRunRecord,
  EvidenceUserRecord,
  EvidenceVersionRecord
} from '../types/evidenceWorkbook';
import { queryD1Rows } from './workerD1Query';

export const toNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const toNumber = (value: unknown): number => toNullableNumber(value) ?? 0;

export const toNullableText = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  return typeof value === 'string' ? value : String(value);
};

export const toText = (value: unknown): string => toNullableText(value) ?? '';

const toFlag = (value: unknown): boolean => toNumber(value) === 1;

export const loadTenantId = async (
  db: CloudflareD1Database,
  tenantId: string,
  requestId: string
): Promise<string | null> => {
  const rows = await queryD1Rows(db, EVIDENCE_SQL.tenant, [tenantId], requestId);
  return rows.length > 0 ? toNullableText(rows[0].tenant_id) : null;
};

export const loadUserRecord = async (
  db: CloudflareD1Database,
  userId: string,
  requestId: string
): Promise<EvidenceUserRecord | null> => {
  const rows = await queryD1Rows(db, EVIDENCE_SQL.userById, [userId], requestId);
  if (rows.length === 0) return null;
  const [row] = rows;
  return {
    userId: toText(row.id),
    tenantId: toNullableText(row.tenant_id),
    name: toText(row.name),
    email: toText(row.email).trim().toLowerCase(),
    role: toText(row.role),
    status: toText(row.status)
  };
};

export const loadJobAccessRecord = async (
  db: CloudflareD1Database,
  jobId: string,
  tenantId: string,
  requestId: string
): Promise<EvidenceJobAccessRecord | null> => {
  const rows = await queryD1Rows(db, EVIDENCE_SQL.jobAccess, [jobId, tenantId], requestId);
  if (rows.length === 0) return null;
  const [row] = rows;
  return {
    assessmentId: toText(row.assessment_id),
    tenantId: toText(row.tenant_id),
    customerName: toText(row.customer_name),
    status: toText(row.status),
    totalSpendCr: toNullableNumber(row.total_spend_cr),
    validatedSpendCr: toNullableNumber(row.validated_spend_cr),
    grossOpportunityCr: toNullableNumber(row.gross_opportunity_cr),
    overlapDeductionsCr: toNullableNumber(row.overlap_deductions_cr),
    netDefensibleOpportunityCr: toNullableNumber(row.net_defensible_opportunity_cr),
    potentialSavingsCr: toNullableNumber(row.potential_savings_cr),
    savingsPct: toNullableNumber(row.savings_pct),
    customerContactEmail: toNullableText(row.customer_contact_email)
  };
};

export const loadAnalysisRunRecords = async (
  db: CloudflareD1Database,
  jobId: string,
  requestId: string
): Promise<EvidenceRunRecord[]> => {
  const rows = await queryD1Rows(db, EVIDENCE_SQL.runs, [jobId], requestId);
  return rows.map((row) => ({
    analysisRunId: toText(row.analysis_run_id),
    dataVersionId: toText(row.data_version_id),
    status: toText(row.status),
    totalSpendCr: toNullableNumber(row.total_spend_cr),
    validatedSpendCr: toNullableNumber(row.validated_spend_cr),
    grossOpportunityCr: toNullableNumber(row.gross_opportunity_cr),
    overlapDeductionsCr: toNullableNumber(row.overlap_deductions_cr),
    netDefensibleOpportunityCr: toNullableNumber(row.net_defensible_opportunity_cr),
    potentialSavingsCr: toNullableNumber(row.potential_savings_cr),
    savingsPct: toNullableNumber(row.savings_pct),
    allGatesPassed: toFlag(row.all_gates_passed),
    isApproved: toFlag(row.is_approved),
    isSuperseded: toFlag(row.is_superseded),
    createdAt: toText(row.created_at)
  }));
};

export const loadDataVersionRecords = async (
  db: CloudflareD1Database,
  jobId: string,
  requestId: string
): Promise<EvidenceVersionRecord[]> => {
  const rows = await queryD1Rows(db, EVIDENCE_SQL.versions, [jobId], requestId);
  return rows.map((row) => ({
    dataVersionId: toText(row.data_version_id),
    versionNumber: toNumber(row.version_number),
    fileName: toText(row.file_name),
    fileSize: toNullableNumber(row.file_size),
    checksum: toNullableText(row.checksum),
    uploadedBy: toNullableText(row.uploaded_by),
    uploadedAt: toNullableText(row.uploaded_at),
    recordCount: toNullableNumber(row.record_count),
    isSuperseded: toFlag(row.is_superseded)
  }));
};

export const loadLedgerTotals = async (
  db: CloudflareD1Database,
  tenantId: string,
  jobId: string,
  requestId: string
): Promise<EvidenceLedgerTotals> => {
  const [row] = await queryD1Rows(db, EVIDENCE_SQL.ledgerTotals, [tenantId, jobId], requestId);
  return { rowCount: toNumber(row.row_count), totalCr: toNumber(row.total_cr) };
};

const loadLedgerGroups = async (
  db: CloudflareD1Database,
  tenantId: string,
  jobId: string,
  column: EvidenceLedgerGroupColumn,
  requestId: string
): Promise<EvidenceGroupRecord[]> => {
  const rows = await queryD1Rows(db, buildLedgerGroupSql(column), [tenantId, jobId], requestId);
  return rows.map((row) => ({
    groupKey: toText(row.group_key),
    rowCount: toNumber(row.row_count),
    totalCr: toNumber(row.total_cr)
  }));
};

const loadLedgerSample = async (
  db: CloudflareD1Database,
  tenantId: string,
  jobId: string,
  requestId: string
): Promise<EvidenceLedgerRecord[]> => {
  const rows = await queryD1Rows(
    db,
    EVIDENCE_SQL.ledgerSample,
    [tenantId, jobId, EVIDENCE_TRANSACTION_SHEET_ROW_LIMIT],
    requestId
  );
  return rows.map((row) => ({
    transactionId: toText(row.transaction_id),
    sourceRowNumber: toNullableNumber(row.source_row_number),
    poNumber: toNullableText(row.po_number),
    poLine: toNullableText(row.po_line),
    documentDateRaw: toNullableText(row.document_date_raw),
    supplierName: toNullableText(row.supplier_name),
    materialCode: toNullableText(row.material_code),
    shortText: toNullableText(row.short_text),
    materialGroup: toNullableText(row.material_group),
    plant: toNullableText(row.plant),
    orderQuantity: toNullableNumber(row.order_quantity),
    orderUnit: toNullableText(row.order_unit),
    netPrice: toNullableNumber(row.net_price),
    currency: toNullableText(row.currency),
    totalInrRaw: toNullableNumber(row.total_inr_raw),
    totalInCrRaw: toNullableNumber(row.total_in_cr_raw)
  }));
};

export const loadLedgerDetail = async (
  db: CloudflareD1Database,
  tenantId: string,
  jobId: string,
  requestId: string
): Promise<EvidenceLedgerDetail> => {
  const [suppliers, plants, materialGroups, sample] = await Promise.all([
    loadLedgerGroups(db, tenantId, jobId, EVIDENCE_LEDGER_GROUP_COLUMNS.SUPPLIER, requestId),
    loadLedgerGroups(db, tenantId, jobId, EVIDENCE_LEDGER_GROUP_COLUMNS.PLANT, requestId),
    loadLedgerGroups(db, tenantId, jobId, EVIDENCE_LEDGER_GROUP_COLUMNS.MATERIAL_GROUP, requestId),
    loadLedgerSample(db, tenantId, jobId, requestId)
  ]);
  return {
    suppliers,
    plants,
    materialGroups,
    sample,
    sampleLimit: EVIDENCE_TRANSACTION_SHEET_ROW_LIMIT
  };
};
