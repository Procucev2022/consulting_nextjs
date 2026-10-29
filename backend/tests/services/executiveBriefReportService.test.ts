import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  assembleExecutiveBriefReport,
  buildSummaryCards,
  buildValidationChecklist
} from '../../src/services/executiveBriefReportService';
import {
  buildExecutiveBriefMetadata,
  reconcileExecutiveBrief,
  verifyFinancialConsistency
} from '../../src/services/executiveBriefMetadataService';
import { EXECUTIVE_BRIEF_STATUS_LABELS } from '../../src/constants/executiveBriefCertifiedFigureConstants';
import { DEFAULT_CLIENT_PROFILE } from '../../src/constants/executiveBriefConstants';
import { TEST_REPORT_DATE, certifiedReport } from '../executiveBriefTestHelpers';

vi.mock('../../src/services/executiveBriefMetadataService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/executiveBriefMetadataService')>();
  return { ...actual, reconcileExecutiveBrief: vi.fn(actual.reconcileExecutiveBrief) };
});

describe('assembleExecutiveBriefReport', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the report shape the executive brief page reads', () => {
    const report = certifiedReport();
    expect(Object.keys(report).sort()).toEqual([
      'artifacts',
      'clientProfile',
      'metadata',
      'sections',
      'summaryCards',
      'traceabilityLineage',
      'validationChecklist'
    ]);
    expect(report.clientProfile).toMatchObject({
      clientName: DEFAULT_CLIENT_PROFILE.clientName,
      group: DEFAULT_CLIENT_PROFILE.group,
      status: EXECUTIVE_BRIEF_STATUS_LABELS.certified,
      confidentiality: EXECUTIVE_BRIEF_STATUS_LABELS.confidentiality
    });
    expect(report.sections).toHaveLength(8);
    expect(report.traceabilityLineage).toHaveLength(4);
    expect(report.artifacts).toHaveLength(4);
    expect(report.validationChecklist.financialReconciliation).toBe(true);
  });

  it('formats the summary cards from certified metrics and counts', () => {
    const values = Object.fromEntries(certifiedReport().summaryCards.map((card) => [card.id, card.formattedValue]));
    expect(values['kpi-total-spend']).toBe('₹5920.35 Cr');
    expect(values['kpi-transactions']).toBe('31,671 Invoices');
    expect(values['kpi-suppliers']).toBe('974 Vendors');
    expect(values['kpi-categories']).toBe('256 Material Groups');
    expect(values['kpi-opp-count']).toBe('10 Initiatives');
  });

  it('marks the brief blocked when the reconciliation fails', () => {
    const metadata = buildExecutiveBriefMetadata(DEFAULT_CLIENT_PROFILE.clientName, TEST_REPORT_DATE);
    vi.mocked(reconcileExecutiveBrief).mockReturnValueOnce({
      consistency: verifyFinancialConsistency({ ...metadata, totalSpendInr: 0 }),
      waterfallValid: true,
      netCompositionValid: true,
      isReconciled: false
    });
    const report = assembleExecutiveBriefReport(DEFAULT_CLIENT_PROFILE.clientName, TEST_REPORT_DATE);
    expect(report.clientProfile.status).toBe(EXECUTIVE_BRIEF_STATUS_LABELS.blocked);
    expect(report.validationChecklist.financialReconciliation).toBe(false);
  });
});

describe('report building blocks', () => {
  it('builds one card per definition from the metadata', () => {
    const cards = buildSummaryCards(buildExecutiveBriefMetadata(DEFAULT_CLIENT_PROFILE.clientName, TEST_REPORT_DATE));
    expect(cards).toHaveLength(9);
    expect(cards[0]).toMatchObject({ id: 'kpi-total-spend', module: 'Module 1', valueInr: 59203477681.66 });
  });

  it('keeps the certified attestations and sets only the reconciliation flag from the caller', () => {
    const checklist = buildValidationChecklist(false);
    expect(checklist.financialReconciliation).toBe(false);
    expect(checklist.module1Validated).toBe(true);
    expect(checklist.reportGenerationValidation).toBe(true);
    expect(buildValidationChecklist(true).financialReconciliation).toBe(true);
  });
});
