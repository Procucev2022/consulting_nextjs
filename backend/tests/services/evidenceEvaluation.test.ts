/**
 * Unit tests for parity evaluation and the inventory availability rules, using in-memory snapshots.
 */

import { describe, expect, it } from 'vitest';
import { EVIDENCE_MESSAGES } from '../../src/constants/evidenceMessages';
import { EVIDENCE_MISSING_VALUE_LABEL, EVIDENCE_PARITY_CHECKS, EVIDENCE_TOLERANCE } from '../../src/constants/evidenceParity';
import { EVIDENCE_WORKBOOK_TYPES, EVIDENCE_SAVINGS_TYPES, EVIDENCE_SAVINGS_METADATA, EVIDENCE_STATIC_UNAVAILABLE_REASONS } from '../../src/constants/evidenceWorkbook';
import {
  buildEvidenceInventory,
  buildSavingsInventory,
  evaluateWorkbookAvailability,
  savingsUnavailableReason
} from '../../src/services/evidenceInventoryService';
import { buildParityChecks, buildParitySummary, evaluateParityCheck } from '../../src/services/evidenceParityService';
import { makeAssessment, makeRun, makeSnapshot, makeVersion, SNAPSHOT_GENERATED_AT } from '../helpers/evidenceSnapshotFactory';

const TOTAL_DEFINITION = EVIDENCE_PARITY_CHECKS[0];
const NET_DEFINITION = EVIDENCE_PARITY_CHECKS[2];

describe('evaluateParityCheck', () => {
  it('passes when the three values agree within tolerance', () => {
    const result = evaluateParityCheck(TOTAL_DEFINITION, { uiValue: 7.5, evidenceValue: 7.50001, sourceValue: 7.5 });
    expect(result).toMatchObject({ kpi: TOTAL_DEFINITION.kpi, status: 'PASS', variance: 0.00001, unit: 'INR Cr' });
    expect(result.notes).toBe(EVIDENCE_MESSAGES.withinTolerance(EVIDENCE_TOLERANCE.FINANCIAL_CR));
  });

  it('fails with the largest pairwise variance when a value is outside tolerance', () => {
    const result = evaluateParityCheck(TOTAL_DEFINITION, { uiValue: 7.5, evidenceValue: 7, sourceValue: 6 });
    expect(result.status).toBe('FAIL');
    expect(result.variance).toBe(1);
    expect(result.notes).toBe(EVIDENCE_MESSAGES.outsideTolerance(1, TOTAL_DEFINITION.tolerance));
  });

  it.each([
    ['uiValue', { uiValue: null, evidenceValue: 1, sourceValue: 1 }, 'UI value'],
    ['evidenceValue', { uiValue: 1, evidenceValue: null, sourceValue: 1 }, 'evidence value'],
    ['sourceValue', { uiValue: 1, evidenceValue: 1, sourceValue: null }, 'source value']
  ])('fails and names the missing %s input', (_label, inputs, expectedLabel) => {
    const result = evaluateParityCheck(TOTAL_DEFINITION, inputs);
    expect(result).toMatchObject({ status: 'FAIL', variance: 0, uiValue: inputs.uiValue ?? EVIDENCE_MISSING_VALUE_LABEL });
    expect(result.notes).toBe(EVIDENCE_MESSAGES.missingInputs(expectedLabel));
  });

  it('lists every missing input in one note', () => {
    const result = evaluateParityCheck(NET_DEFINITION, { uiValue: null, evidenceValue: null, sourceValue: 2 });
    expect(result.notes).toBe(EVIDENCE_MESSAGES.missingInputs('UI value, evidence value'));
    expect(result.evidenceValue).toBe(EVIDENCE_MISSING_VALUE_LABEL);
  });
});

describe('buildParityChecks and buildParitySummary', () => {
  it('computes all four KPIs from the snapshot for a reconciled job', () => {
    const checks = buildParityChecks(makeSnapshot(), null);
    expect(checks.map((check) => check.kpi)).toEqual(['Total Spend', 'Validated Spend', 'Net Defensible Opportunity', 'Savings Percentage']);
    expect(checks.every((check) => check.status === 'PASS')).toBe(true);
    expect(checks[3].evidenceValue).toBeCloseTo(26.6667, 3);
  });

  it('uses the ledger for spend checks only when rows exist', () => {
    const checks = buildParityChecks(makeSnapshot({ ledger: { rowCount: 0, totalCr: 0 } }), null);
    expect(checks[0].evidenceValue).toBe(EVIDENCE_MISSING_VALUE_LABEL);
    expect(checks[0].status).toBe('FAIL');
  });

  it('treats a ledger with zero spend as no basis for the savings percentage', () => {
    const checks = buildParityChecks(makeSnapshot({ ledger: { rowCount: 2, totalCr: 0 } }), null);
    expect(checks[3].evidenceValue).toBe(EVIDENCE_MISSING_VALUE_LABEL);
  });

  it('leaves the bridge evidence empty when gross or overlap is not recorded', () => {
    const snapshot = makeSnapshot({ assessment: makeAssessment({ overlapDeductionsCr: null }) });
    expect(buildParityChecks(snapshot, null)[2].evidenceValue).toBe(EVIDENCE_MISSING_VALUE_LABEL);
  });

  it('reads source values as missing when there is no approved run', () => {
    const checks = buildParityChecks(makeSnapshot({ activeRun: null }), null);
    expect(checks.every((check) => check.sourceValue === EVIDENCE_MISSING_VALUE_LABEL)).toBe(true);
  });

  it('reads source values as missing when the run leaves a field empty', () => {
    const snapshot = makeSnapshot({ activeRun: makeRun({ totalSpendCr: null, savingsPct: null }) });
    const checks = buildParityChecks(snapshot, null);
    expect(checks[0].sourceValue).toBe(EVIDENCE_MISSING_VALUE_LABEL);
    expect(checks[3].sourceValue).toBe(EVIDENCE_MISSING_VALUE_LABEL);
  });

  it('filters checks by workbook type', () => {
    expect(buildParityChecks(makeSnapshot(), 'MODULE_1_EVIDENCE').map((check) => check.kpi)).toEqual(['Total Spend', 'Validated Spend']);
    expect(buildParityChecks(makeSnapshot(), 'SAVINGS_ENGINE_EVIDENCE')).toHaveLength(2);
    expect(buildParityChecks(makeSnapshot(), 'DATA_VERSION_DIFF')).toHaveLength(0);
  });

  it('summarises pass and fail counts, discrepancies, and the data version', () => {
    const summary = buildParitySummary(makeSnapshot(), null, '2026-10-02T00:00:00.000Z');
    expect(summary).toMatchObject({ overallStatus: 'PASS', totalChecks: 4, passedChecks: 4, failedChecks: 0, dataVersionId: 'DV-2' });
    expect(summary.discrepancies).toEqual([]);
  });

  it('reports FAIL with discrepancy detail when the run disagrees with the UI', () => {
    const snapshot = makeSnapshot({ activeRun: makeRun({ totalSpendCr: 6, validatedSpendCr: 6 }) });
    const summary = buildParitySummary(snapshot, 'MODULE_1_EVIDENCE', SNAPSHOT_GENERATED_AT);
    expect(summary.overallStatus).toBe('FAIL');
    expect(summary.failedChecks).toBe(2);
    expect(summary.discrepancies[0]).toMatchObject({ kpi: 'Total Spend', expectedValue: 6, actualValue: 7.5, variance: 1.5 });
    expect(summary.discrepancies[0].reason).toBe(EVIDENCE_MESSAGES.discrepancyReason('7.5', '7.5', '6'));
  });

  it('reports FAIL for an empty check set so a missing check never reads as verified', () => {
    const summary = buildParitySummary(makeSnapshot(), 'DATA_VERSION_DIFF', SNAPSHOT_GENERATED_AT);
    expect(summary).toMatchObject({ totalChecks: 0, passedChecks: 0, overallStatus: 'FAIL' });
  });

  it('falls back to the run data version, then to a not-recorded label', () => {
    const runOnly = buildParitySummary(makeSnapshot({ activeVersion: null }), null, SNAPSHOT_GENERATED_AT);
    expect(runOnly.dataVersionId).toBe('DV-2');
    const neither = buildParitySummary(makeSnapshot({ activeVersion: null, activeRun: null }), null, SNAPSHOT_GENERATED_AT);
    expect(neither.dataVersionId).toBe(EVIDENCE_MISSING_VALUE_LABEL);
  });
});

describe('evidence inventory availability', () => {
  it('lists every workbook type with the contract fields and the customer role label', () => {
    const items = buildEvidenceInventory(makeSnapshot());
    expect(items.map((item) => item.type)).toEqual([...EVIDENCE_WORKBOOK_TYPES]);
    expect(items.every((item) => item.requiredRole === 'CUSTOMER_ANALYST')).toBe(true);
    const moduleOne = items[0];
    expect(moduleOne).toMatchObject({ isAvailable: true, sheetCount: 7, filename: '01_Module_1_Evidence.xlsx' });
  });

  it.each([
    ['MODULE_1_EVIDENCE', { ledger: { rowCount: 0, totalCr: 0 } }, EVIDENCE_MESSAGES.ledgerEmpty('AIC-TEST')],
    ['SAVINGS_ENGINE_EVIDENCE', { activeRun: null }, EVIDENCE_MESSAGES.noApprovedRun('AIC-TEST')],
    ['FINANCIAL_VALIDATION', { ledger: { rowCount: 0, totalCr: 0 } }, EVIDENCE_MESSAGES.ledgerEmpty('AIC-TEST')],
    ['FINANCIAL_VALIDATION', { activeRun: null }, EVIDENCE_MESSAGES.noApprovedRun('AIC-TEST')],
    ['MANAGEMENT_QUICK_SUMMARY_EVIDENCE', { activeRun: null }, EVIDENCE_MESSAGES.noApprovedRun('AIC-TEST')],
    ['DATA_VERSION_DIFF', { activeVersion: null }, EVIDENCE_MESSAGES.noDataVersion('AIC-TEST')],
    ['ANALYSIS_RUN_CONTROL', { runs: [] }, EVIDENCE_MESSAGES.noAnalysisRuns('AIC-TEST')]
  ] as const)('reports %s unavailable with the specific reason', (type, overrides, reason) => {
    const availability = evaluateWorkbookAvailability(type, makeSnapshot(overrides));
    expect(availability).toEqual({ isAvailable: false, reason });
  });

  it('marks workbook types D1 cannot produce as unavailable regardless of data', () => {
    for (const type of ['MODULE_2_EVIDENCE', 'PCBI_EVIDENCE', 'REPORT_EVIDENCE'] as const) {
      expect(evaluateWorkbookAvailability(type, makeSnapshot())).toEqual({
        isAvailable: false,
        reason: EVIDENCE_STATIC_UNAVAILABLE_REASONS[type]
      });
    }
  });

  it('sets description to the reason and sheetCount to zero for unavailable items', () => {
    const items = buildEvidenceInventory(makeSnapshot({ versions: [], activeVersion: null }));
    const diff = items.find((item) => item.type === 'DATA_VERSION_DIFF');
    expect(diff).toMatchObject({ isAvailable: false, sheetCount: 0, description: EVIDENCE_MESSAGES.noDataVersion('AIC-TEST') });
  });

  it('lists savings types as unavailable with the initiative reason and classification note', () => {
    const items = buildSavingsInventory();
    expect(items.map((item) => item.savingsType)).toEqual([...EVIDENCE_SAVINGS_TYPES]);
    const vendor = items[0];
    expect(vendor).toMatchObject({ initiativeId: 'OPP-001', isAvailable: false, netAmountCr: 0, requiredRole: 'CONSULTANT' });
    expect(vendor.description).toBe(savingsUnavailableReason('VENDOR_CONSOLIDATION'));
    expect(vendor.classificationNote).toBe(EVIDENCE_SAVINGS_METADATA.VENDOR_CONSOLIDATION.description);
    expect(buildSavingsInventory('REALIZED_SAVINGS')).toHaveLength(1);
  });
});

describe('evidence constants consistency', () => {
  it('keeps the parity check definitions pointing at real workbook types', () => {
    for (const check of EVIDENCE_PARITY_CHECKS) {
      for (const workbookType of check.workbookTypes) {
        expect(EVIDENCE_WORKBOOK_TYPES).toContain(workbookType);
      }
    }
    expect(makeVersion().isSuperseded).toBe(false);
  });
});
