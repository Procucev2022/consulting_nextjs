import { MANDATORY_MODULE_GATES, ASSESSMENT_STATUSES, DATA_STATUSES, AUDIT_ACTIONS } from '../constants/assessment';
import {
  ASSESSMENT_D1_ANALYSIS_GATES, ASSESSMENT_D1_MESSAGES, ASSESSMENT_D1_RUN_SNAPSHOT_TYPE
} from '../constants/assessmentD1';
import { D1_REPORTING, D1_TABLES } from '../constants/d1';
import { validateAssessmentDatasetSchema } from '../constants/assessmentValidation';
import type { AssessmentDatasetActionContext } from '../types/assessmentDataVersionD1';
import type {
  AssessmentAnalysisGateMetrics, AssessmentAnalysisInputsResult, AssessmentAnalysisKind, AssessmentAnalysisSourceRows
} from '../types/assessmentAnalysisD1';
import type { D1Record, WorkerD1Result } from '../types/d1';
import type { ReviewGateResult } from '../types/assessment';
import {
  ASSESSMENT_SNAPSHOT_TYPE, assessmentSnapshotWrite, readAssessmentSnapshot, runStatements
} from './assessmentDataVersionD1Helpers';
import { mapD1AnalysisRun, mapD1Assessment } from './assessmentD1Mappers';
import logger from '../utils/logger';

const numberValue = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const excludedRecord = (row: D1Record): boolean =>
  `${String(row.issue_flag || '')} ${String(row.action_status || '')}`.toLowerCase().includes('exclud');

const validRecord = (row: D1Record): boolean => Number(row.resolved) === 1 && !excludedRecord(row);

const recordSpendCr = (row: D1Record): number => {
  if (row.inr_crores !== null && row.inr_crores !== undefined) return numberValue(row.inr_crores);
  return numberValue(row.amount_inr) / D1_REPORTING.inrPerCrore;
};

const transactionSpendCr = (row: D1Record): number => {
  if (row.total_in_cr_raw !== null && row.total_in_cr_raw !== undefined) return numberValue(row.total_in_cr_raw);
  return numberValue(row.total_inr_raw) / D1_REPORTING.inrPerCrore;
};

const distinctValues = (rows: D1Record[], field: string, excluded: readonly string[] = []): Set<string> => new Set(
  rows.map((row) => String(row[field] || '').trim())
    .filter((value) => value.length > 0 && !excluded.includes(value.toLowerCase()))
);

const roundMetric = (value: number): number => Number(value.toFixed(D1_REPORTING.preciseDecimalPlaces));

const loadAssessmentRecord = async (
  context: AssessmentDatasetActionContext
): Promise<D1Record | null> => context.db.prepare(
  `SELECT * FROM ${D1_TABLES.assessments} WHERE assessment_id = ?`
).bind(context.assessmentId).first<D1Record>();

const loadAnalysisDataVersion = async (
  context: AssessmentDatasetActionContext,
  requestedDataVersionId?: string
): Promise<D1Record | null> => requestedDataVersionId
  ? context.db.prepare(`SELECT * FROM ${D1_TABLES.dataVersions} WHERE assessment_id = ? AND data_version_id = ?`)
    .bind(context.assessmentId, requestedDataVersionId).first<D1Record>()
  : context.db.prepare(`SELECT * FROM ${D1_TABLES.dataVersions} WHERE assessment_id = ? AND is_superseded = 0 ` +
    'ORDER BY version_number DESC LIMIT 1').bind(context.assessmentId).first<D1Record>();

const loadAnalysisSourceRows = async (
  context: AssessmentDatasetActionContext,
  dataVersionId: string
): Promise<AssessmentAnalysisSourceRows> => {
  const [transactions, validationRows] = await Promise.all([
    context.db.prepare(`SELECT * FROM ${D1_TABLES.transactions} WHERE assessment_id = ? AND source_document_id = ? ` +
      'ORDER BY source_row_number ASC').bind(context.assessmentId, dataVersionId).all<D1Record>(),
    context.db.prepare(`SELECT * FROM ${D1_TABLES.validation} WHERE record_id LIKE ? ORDER BY record_id`)
      .bind(`REC-${dataVersionId}-ROW-%`).all<D1Record>()
  ]);
  return { transactionRows: transactions.results || [], records: validationRows.results || [] };
};

const loadAnalysisInputs = async (
  context: AssessmentDatasetActionContext
): Promise<AssessmentAnalysisInputsResult> => {
  const parsed = validateAssessmentDatasetSchema.safeParse(context.body ?? {});
  if (!parsed.success) return {
    ok: false,
    result: {
      status: 400,
      data: { success: false, message: ASSESSMENT_D1_MESSAGES.actionValidation, errors: parsed.error.issues }
    }
  };
  const assessment = await loadAssessmentRecord(context);
  if (!assessment) return {
    ok: false,
    result: {
      status: 404,
      data: { success: false, message: ASSESSMENT_D1_MESSAGES.missingRecord(context.assessmentId) }
    }
  };
  const dataVersion = await loadAnalysisDataVersion(context, parsed.data.dataVersionId);
  if (!dataVersion) return {
    ok: false,
    result: {
      status: 404,
      data: { success: false, message: ASSESSMENT_D1_MESSAGES.dataVersionMissingForAnalysis(context.assessmentId) }
    }
  };
  if (Number(dataVersion.is_superseded) === 1) return {
    ok: false,
    result: { status: 409, data: { success: false, message: ASSESSMENT_D1_MESSAGES.dataVersionSuperseded } }
  };
  const dataVersionId = String(dataVersion.data_version_id);
  const sourceRows = await loadAnalysisSourceRows(context, dataVersionId);
  if (sourceRows.transactionRows.length === 0 || sourceRows.records.length === 0) return {
    ok: false,
    result: { status: 409, data: { success: false, message: ASSESSMENT_D1_MESSAGES.analysisDataMissing } }
  };
  return { ok: true, assessment, dataVersion, dataVersionId, ...sourceRows };
};

const countConvertedRecords = (records: D1Record[]): number => records.filter((row) => {
  const currencyIsInr = String(row.raw_currency || '').toUpperCase() === 'INR';
  const amountWasConverted = row.amount_inr !== null && row.amount_inr !== undefined;
  const fxRateWasApplied = numberValue(row.fx_rate_applied) > 0;
  return currencyIsInr || amountWasConverted || fxRateWasApplied;
}).length;

const resolveAssessmentStatus = (kind: AssessmentAnalysisKind, module1Passed: boolean): string => {
  if (!module1Passed) return ASSESSMENT_STATUSES.BLOCKED;
  return kind === 'module1' ? ASSESSMENT_STATUSES.MODULE_1_READY : ASSESSMENT_STATUSES.ANALYSIS_IN_PROGRESS;
};

const buildAnalysisResponse = (
  kind: AssessmentAnalysisKind,
  mappedAssessment: unknown,
  mappedRun: unknown
): WorkerD1Result => kind === 'module1'
  ? { data: { success: true, assessment: mappedAssessment, analysisRun: mappedRun } }
  : { data: mappedRun };

const buildAnalysisGates = (metrics: AssessmentAnalysisGateMetrics, evaluatedAt: string): ReviewGateResult[] => {
  const passedByGate: Record<string, boolean> = {
    [MANDATORY_MODULE_GATES.M1_DATA_COMPLETENESS]: metrics.sourceRows > 0 &&
      metrics.sourceRows === metrics.expectedRows,
    [MANDATORY_MODULE_GATES.M1_TRANSACTION_VALIDITY]: metrics.anomalies === 0,
    [MANDATORY_MODULE_GATES.M1_FX_COVERAGE]: metrics.fxCoveragePct === 100,
    [MANDATORY_MODULE_GATES.M1_SUPPLIER_POPULATION]: metrics.suppliers > 0,
    [MANDATORY_MODULE_GATES.M1_MATERIAL_GROUPS]: metrics.materialGroups > 0,
    [MANDATORY_MODULE_GATES.M1_PLANTS]: metrics.plants > 0,
    [MANDATORY_MODULE_GATES.M1_PERIOD_COVERAGE]: metrics.datedRows === metrics.sourceRows && metrics.sourceRows > 0
  };
  const moduleOneGates = new Set<string>([
    MANDATORY_MODULE_GATES.M1_DATA_COMPLETENESS, MANDATORY_MODULE_GATES.M1_TRANSACTION_VALIDITY,
    MANDATORY_MODULE_GATES.M1_FX_COVERAGE, MANDATORY_MODULE_GATES.M1_SUPPLIER_POPULATION,
    MANDATORY_MODULE_GATES.M1_MATERIAL_GROUPS, MANDATORY_MODULE_GATES.M1_PLANTS,
    MANDATORY_MODULE_GATES.M1_PERIOD_COVERAGE
  ]);
  return ASSESSMENT_D1_ANALYSIS_GATES.map((gate) => {
    const passed = passedByGate[gate] === true;
    return {
      gate,
      passed,
      evaluatedAt,
      message: moduleOneGates.has(gate)
        ? (passed ? ASSESSMENT_D1_MESSAGES.module1GatePassed : ASSESSMENT_D1_MESSAGES.module1GateFailed)
        : ASSESSMENT_D1_MESSAGES.moduleNotComputed
    };
  });
};

export const runAssessmentAnalysisFromD1 = async (
  context: AssessmentDatasetActionContext,
  kind: AssessmentAnalysisKind
): Promise<WorkerD1Result> => {
  const loaded = await loadAnalysisInputs(context);
  if (!loaded.ok) return loaded.result;
  const { db, assessmentId, requestId } = context;
  const { assessment, dataVersion, dataVersionId, transactionRows, records } = loaded;

  const validRows = records.filter(validRecord);
  const excludedRows = records.filter(excludedRecord);
  const anomalies = Math.max(0, records.length - validRows.length - excludedRows.length);
  const convertedRows = countConvertedRecords(records);
  const fxCoveragePct = Number((convertedRows / records.length * 100).toFixed(D1_REPORTING.decimalPlaces));
  const suppliers = distinctValues(transactionRows, 'supplier_name', ['unmapped supplier']);
  const materialGroups = distinctValues(transactionRows, 'material_group');
  const plants = distinctValues(transactionRows, 'plant');
  const datedRows = transactionRows.filter((row) => /^\d{4}-\d{2}-\d{2}/u.test(String(row.document_date_raw || ''))).length;
  const sourceRows = transactionRows.length;
  const expectedRows = numberValue(dataVersion.record_count);
  const evaluatedAt = new Date().toISOString();
  const reviewGates = buildAnalysisGates({
    sourceRows, expectedRows, anomalies, fxCoveragePct,
    suppliers: suppliers.size, materialGroups: materialGroups.size, plants: plants.size, datedRows
  }, evaluatedAt);
  const module1Gates = reviewGates.filter((result) => String(result.gate).startsWith('M1_'));
  const module1Passed = module1Gates.every((result) => result.passed);
  const totalSpendCr = roundMetric(transactionRows.reduce((total, row) => total + transactionSpendCr(row), 0));
  const validatedSpendCr = roundMetric(validRows.reduce((total, row) => total + recordSpendCr(row), 0));
  const module1Metrics = {
    sourceRows: records.length,
    validRows: validRows.length,
    exclusions: excludedRows.length,
    anomalies,
    fxCoveragePct,
    validatedSpendCr,
    suppliers: suppliers.size,
    materialGroups: materialGroups.size,
    plants: plants.size,
    billingMonths: distinctValues(transactionRows.map((row) => ({
      billing_month: String(row.document_date_raw || '').slice(0, 7)
    })), 'billing_month').size
  };
  const analysisRunId = `RUN-${globalThis.crypto.randomUUID()}`;
  const assessmentStatus = resolveAssessmentStatus(kind, module1Passed);
  const dataStatus = module1Passed ? DATA_STATUSES.VALIDATED : DATA_STATUSES.REQUIRES_CLARIFICATION;
  const metricsJson = JSON.stringify({ analysisKind: kind, reviewGates, module1Metrics });
  const runSnapshot: D1Record = {
    analysisRunId, assessmentId, dataVersionId, status: 'COMPLETED', totalSpendCr, validatedSpendCr,
    baselineSpendCr: totalSpendCr, fxImpactCr: 0, addressableSpendCr: validatedSpendCr,
    grossOpportunityCr: 0, overlapDeductionsCr: 0, netDefensibleOpportunityCr: 0, provenOpportunityCr: 0,
    deliveryRangeMinCr: 0, deliveryRangeMaxCr: 0, pcbiAnalyticalSignalCr: 0, potentialSavingsCr: 0,
    savingsPct: 0, reviewGates, allGatesPassed: reviewGates.every((gate) => gate.passed),
    isApproved: false, isSuperseded: false, module1Metrics, createdAt: evaluatedAt
  };
  const assessmentSnapshot = await readAssessmentSnapshot(db, ASSESSMENT_SNAPSHOT_TYPE, assessmentId);
  const nextAssessmentSnapshot: D1Record = {
    ...assessmentSnapshot, assessmentId, status: assessmentStatus, dataStatus,
    activeAnalysisRunId: analysisRunId, currentDataVersionId: dataVersionId,
    totalSpendCr, validatedSpendCr, baselineSpendCr: totalSpendCr, addressableSpendCr: validatedSpendCr,
    grossOpportunityCr: 0, overlapDeductionsCr: 0, netDefensibleOpportunityCr: 0,
    provenOpportunityCr: 0, potentialSavingsCr: 0, savingsPct: 0, module1Metrics
  };
  await runStatements(db, [
    db.prepare(`UPDATE ${D1_TABLES.analysisRuns} SET is_superseded = 1 WHERE assessment_id = ?`).bind(assessmentId),
    db.prepare(`INSERT INTO ${D1_TABLES.analysisRuns} (
      analysis_run_id, assessment_id, data_version_id, status, total_spend_cr, validated_spend_cr, baseline_spend_cr,
      fx_impact_cr, addressable_spend_cr, gross_opportunity_cr, overlap_deductions_cr, net_defensible_opportunity_cr,
      proven_opportunity_cr, delivery_range_min_cr, delivery_range_max_cr, pcbi_analytical_signal_cr,
      potential_savings_cr, savings_pct, all_gates_passed, is_approved, is_superseded, metrics_json, created_at
    ) VALUES (?, ?, ?, 'COMPLETED', ?, ?, ?, 0, ?, 0, 0, 0, 0, 0, 0, 0, 0, 0, ?, 0, 0, ?, ?)`)
      .bind(analysisRunId, assessmentId, dataVersionId, totalSpendCr, validatedSpendCr, totalSpendCr,
        validatedSpendCr, Number(reviewGates.every((gate) => gate.passed)), metricsJson, evaluatedAt),
    db.prepare(`UPDATE ${D1_TABLES.assessments} SET status = ?, data_status = ?, total_spend_cr = ?, validated_spend_cr = ?,
      baseline_spend_cr = ?, gross_spend_cr = ?, fx_impact_cr = 0, addressable_spend_cr = ?, gross_opportunity_cr = 0,
      overlap_deductions_cr = 0, net_defensible_opportunity_cr = 0, proven_opportunity_cr = 0,
      delivery_range_min_cr = 0, delivery_range_max_cr = 0, pcbi_analytical_signal_cr = 0,
      potential_savings_cr = 0, savings_pct = 0, updated_at = CURRENT_TIMESTAMP WHERE assessment_id = ?`)
      .bind(assessmentStatus, dataStatus, totalSpendCr, validatedSpendCr, totalSpendCr, totalSpendCr,
        validatedSpendCr, assessmentId),
    assessmentSnapshotWrite(db, ASSESSMENT_SNAPSHOT_TYPE, assessmentId, nextAssessmentSnapshot, String(dataVersion.checksum || '')),
    assessmentSnapshotWrite(db, ASSESSMENT_D1_RUN_SNAPSHOT_TYPE, assessmentId, runSnapshot, String(dataVersion.checksum || ''), analysisRunId),
    db.prepare(`INSERT INTO ${D1_TABLES.auditLogs} (id, assessment_id, actor_email, actor_role, action, details_json)
      VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(`AUD-${globalThis.crypto.randomUUID()}`, assessmentId, String(assessment.assessment_owner || 'analyst@procucev.com'),
        'ANALYST', AUDIT_ACTIONS.ANALYSIS_COMPLETED, JSON.stringify({ analysisRunId, dataVersionId, kind, totalSpendCr, validatedSpendCr }))
  ]);

  const [savedAssessment, savedRun] = await Promise.all([
    db.prepare(`SELECT * FROM ${D1_TABLES.assessments} WHERE assessment_id = ?`).bind(assessmentId).first<D1Record>(),
    db.prepare(`SELECT * FROM ${D1_TABLES.analysisRuns} WHERE analysis_run_id = ?`)
      .bind(analysisRunId).first<D1Record>()
  ]);
  const mappedRun = savedRun ? mapD1AnalysisRun(savedRun, runSnapshot) : runSnapshot;
  const mappedAssessment = savedAssessment
    ? mapD1Assessment(savedAssessment, nextAssessmentSnapshot)
    : nextAssessmentSnapshot;
  logger.info('Assessment analysis completed from D1 transactions', {
    assessmentId, analysisRunId, dataVersionId, kind, sourceRows, validRows: validRows.length,
    allGatesPassed: reviewGates.every((gate) => gate.passed), requestId
  });
  return buildAnalysisResponse(kind, mappedAssessment, mappedRun);
};
