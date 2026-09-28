/**
 * PCBI Reference Dataset Validation Engine & Report Generators
 */

import {
  createValidationContext,
  validateMasterRow,
  validateWeeklyRow
} from './pcbiRowValidators';
import {
  validateConstituentsRow,
  checkConstituentTotals,
  validateSourcesRow,
  validateUnspscRow
} from './pcbiDatasetValidators';
import type {
  PCBIValidationIssue,
  PCBIValidationSummary,
  PCBIColumnMapping
} from '../types/pcbiAdmin';

interface DatasetCounts {
  masterCount: number;
  weeklyCount: number;
  constCount: number;
  sourceCount: number;
  unspscCount: number;
}

function validateCoreDatasets(
  datasets: Record<string, Record<string, unknown>[]>,
  mappings: Record<string, PCBIColumnMapping[]>,
  ctx: ReturnType<typeof createValidationContext>
): { masterCount: number; weeklyCount: number } {
  const masterRows = datasets.PCBI_MASTER ?? [];
  const masterMap = new Map((mappings.PCBI_MASTER ?? []).map((m) => [m.excelColumn, m.mappedField]));
  masterRows.forEach((r, idx) => validateMasterRow(r, idx, masterMap, ctx));

  const weeklyRows = datasets.WEEKLY_INDEX ?? [];
  const weeklyMap = new Map((mappings.WEEKLY_INDEX ?? []).map((m) => [m.excelColumn, m.mappedField]));
  weeklyRows.forEach((r, idx) => validateWeeklyRow(r, idx, weeklyMap, ctx));

  return { masterCount: masterRows.length, weeklyCount: weeklyRows.length };
}

function validateReferenceDatasets(
  datasets: Record<string, Record<string, unknown>[]>,
  mappings: Record<string, PCBIColumnMapping[]>,
  ctx: ReturnType<typeof createValidationContext>
): { constCount: number; sourceCount: number; unspscCount: number } {
  const constRows = datasets.CONSTITUENTS ?? [];
  const constMap = new Map((mappings.CONSTITUENTS ?? []).map((m) => [m.excelColumn, m.mappedField]));
  constRows.forEach((r, idx) => validateConstituentsRow(r, idx, constMap, ctx));

  const sourceRows = datasets.SOURCES ?? [];
  const sourceMap = new Map((mappings.SOURCES ?? []).map((m) => [m.excelColumn, m.mappedField]));
  sourceRows.forEach((r, idx) => validateSourcesRow(r, idx, sourceMap, ctx));

  const unspscRows = datasets.UNSPSC_MAPPING ?? [];
  const unspscMap = new Map((mappings.UNSPSC_MAPPING ?? []).map((m) => [m.excelColumn, m.mappedField]));
  unspscRows.forEach((r, idx) => validateUnspscRow(r, idx, unspscMap, ctx));

  return {
    constCount: constRows.length,
    sourceCount: sourceRows.length,
    unspscCount: unspscRows.length
  };
}

function executeDatasetValidations(
  datasets: Record<string, Record<string, unknown>[]>,
  mappings: Record<string, PCBIColumnMapping[]>,
  ctx: ReturnType<typeof createValidationContext>
): DatasetCounts {
  const { masterCount, weeklyCount } = validateCoreDatasets(datasets, mappings, ctx);
  const { constCount, sourceCount, unspscCount } = validateReferenceDatasets(datasets, mappings, ctx);

  return {
    masterCount,
    weeklyCount,
    constCount,
    sourceCount,
    unspscCount
  };
}

function compileValidationSummary(
  ctx: ReturnType<typeof createValidationContext>,
  counts: DatasetCounts,
  constituentTotals: ReturnType<typeof checkConstituentTotals>
): PCBIValidationSummary {
  const blockingErrorCount = ctx.issues.filter((i) => i.severity === 'BLOCKING_ERROR').length;
  const warningCount = ctx.issues.filter((i) => i.severity === 'WARNING').length;
  const informationCount = ctx.issues.filter((i) => i.severity === 'INFORMATION').length;

  const totalRecords =
    counts.masterCount + counts.weeklyCount + counts.constCount + counts.sourceCount + counts.unspscCount;
  const errorRecords = blockingErrorCount;
  const warningRecords = warningCount;
  const validRecords = Math.max(0, totalRecords - errorRecords);

  const avgBenchmarkability =
    ctx.benchmarkabilityCount > 0 ? Math.round(ctx.totalBenchmarkabilitySum / ctx.benchmarkabilityCount) : 0;

  return {
    totalRecords,
    validRecords,
    warningRecords,
    errorRecords,
    blockingErrorCount,
    warningCount,
    informationCount,
    masterRecordsCount: counts.masterCount,
    weeklyRecordsCount: counts.weeklyCount,
    constituentRecordsCount: counts.constCount,
    sourceRecordsCount: counts.sourceCount,
    unspscRecordsCount: counts.unspscCount,
    uniquePcbiIdsCount: ctx.uniquePcbiIds.size,
    duplicateTechnicalIdsCount: ctx.duplicateTechnicalIdsCount,
    missingQualityCount: ctx.missingQualityCount,
    missingBenchmarkabilityCount: ctx.missingBenchmarkabilityCount,
    missingSourceCount: ctx.missingSourceCount,
    missingUnspscCount: ctx.missingUnspscCount,
    invalidIndexValuesCount: ctx.invalidIndexCount,
    duplicateWeeklyRecordsCount: ctx.duplicateWeeklyRecordsCount,
    constituentWeightIssuesCount: ctx.constituentWeightIssuesCount,
    sourcePendingCount: ctx.sourcePendingCount,
    aQualityCount: ctx.qualityCounts.A,
    bQualityCount: ctx.qualityCounts.B,
    cQualityCount: ctx.qualityCounts.C,
    unassignedQualityCount: ctx.missingQualityCount,
    avgBenchmarkability,
    dateStart: ctx.dateMin || '2020-04-01',
    dateEnd: ctx.dateMax || '2026-07-31',
    issues: ctx.issues,
    constituentTotals
  };
}

export function validatePCBIUpload(
  datasets: Record<string, Record<string, unknown>[]>,
  mappings: Record<string, PCBIColumnMapping[]>
): PCBIValidationSummary {
  const ctx = createValidationContext();
  const counts = executeDatasetValidations(datasets, mappings, ctx);
  const constituentTotals = checkConstituentTotals(ctx.constituentWeightsByPcbi, ctx);
  return compileValidationSummary(ctx, counts, constituentTotals);
}

export function generateValidationReport(summary: PCBIValidationSummary, fileName: string): string {
  return JSON.stringify(
    {
      reportTitle: 'PCBI Master Data Validation Report',
      fileName,
      generatedAt: new Date().toISOString(),
      metrics: {
        totalRecords: summary.totalRecords,
        validRecords: summary.validRecords,
        blockingErrors: summary.blockingErrorCount,
        warnings: summary.warningCount,
        information: summary.informationCount,
        aQualityCount: summary.aQualityCount,
        bQualityCount: summary.bQualityCount,
        cQualityCount: summary.cQualityCount,
        unassignedQualityCount: summary.unassignedQualityCount,
        avgBenchmarkability: `${summary.avgBenchmarkability}%`,
        dateRange: `${summary.dateStart} to ${summary.dateEnd}`
      },
      auditBreakdown: {
        uniquePcbiIds: summary.uniquePcbiIdsCount,
        duplicateTechnicalIds: summary.duplicateTechnicalIdsCount,
        missingQuality: summary.missingQualityCount,
        missingBenchmarkability: summary.missingBenchmarkabilityCount,
        missingSource: summary.missingSourceCount,
        missingUnspsc: summary.missingUnspscCount,
        invalidIndexValues: summary.invalidIndexValuesCount,
        duplicateWeeklyRecords: summary.duplicateWeeklyRecordsCount,
        constituentWeightIssues: summary.constituentWeightIssuesCount,
        sourcePendingRecords: summary.sourcePendingCount
      },
      issues: summary.issues,
      constituentTotals: summary.constituentTotals
    },
    null,
    2
  );
}

export function generateErrorRecordsCsv(issues: PCBIValidationIssue[]): string {
  const headers = ['Issue ID', 'Sheet Name', 'Row Number', 'Column', 'Severity', 'Rule', 'Message', 'Resolution'];
  const rows = issues.map((i) =>
    [
      `"${i.id}"`,
      `"${i.sheetName}"`,
      i.rowNumber,
      `"${i.column.replace(/"/g, '""')}"`,
      `"${i.severity}"`,
      `"${i.rule}"`,
      `"${i.message.replace(/"/g, '""')}"`,
      `"${i.resolution.replace(/"/g, '""')}"`
    ].join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}
