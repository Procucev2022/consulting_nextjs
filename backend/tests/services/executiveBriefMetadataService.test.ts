import { describe, expect, it } from 'vitest';
import {
  buildExecutiveBriefMetadata,
  readSummaryMetric,
  reconcileExecutiveBrief,
  resolveCertifiedClientName,
  toReportDate,
  verifyFinancialConsistency
} from '../../src/services/executiveBriefMetadataService';
import { DEFAULT_CLIENT_PROFILE, EXECUTIVE_BRIEF_VERSION } from '../../src/constants/executiveBriefConstants';
import { VARIANCE_DETECTED_MESSAGE } from '../../src/constants/executiveBriefCertifiedFigureConstants';
import { EXECUTIVE_BRIEF_PRESENTATION_CONTRACT } from '../../src/constants/executiveBriefPresentationConstants';
import type { ExecutiveBriefSummaryMetric } from '../../src/types/executiveBriefServices';
import { TEST_REPORT_DATE } from '../executiveBriefTestHelpers';

const certifiedMetadata = () => buildExecutiveBriefMetadata(DEFAULT_CLIENT_PROFILE.clientName, TEST_REPORT_DATE);

describe('certified client resolution', () => {
  it('accepts the certified client regardless of case and surrounding spaces', () => {
    expect(resolveCertifiedClientName('  ultratech cement limited ')).toBe(DEFAULT_CLIENT_PROFILE.clientName);
  });

  it('rejects any other client name', () => {
    expect(resolveCertifiedClientName('ABC Textile Ltd')).toBeNull();
  });
});

describe('report date', () => {
  it('uses the UTC calendar date of the instant', () => {
    expect(toReportDate(new Date('2026-10-24T23:30:00Z'))).toBe('2026-10-24');
  });
});

describe('certified metadata', () => {
  it('carries the certified figures, baseline, sources, and version', () => {
    const metadata = certifiedMetadata();
    expect(metadata.client).toBe(DEFAULT_CLIENT_PROFILE.clientName);
    expect(metadata.reportDate).toBe(TEST_REPORT_DATE);
    expect(metadata.transactionCount).toBe(EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.baselineTransactions);
    expect(metadata.modulesIncluded).toEqual(['Module 1', 'Module 2', 'Module 3', 'Module 4']);
    expect(metadata.opportunityCount).toBe(10);
    expect(metadata.confidenceSummary.high).toBe(7);
    expect(metadata.sourceReferences).toHaveLength(DEFAULT_CLIENT_PROFILE.publicFacts.length);
    expect(metadata.reportVersion).toBe(EXECUTIVE_BRIEF_VERSION);
  });
});

describe('financial consistency', () => {
  it('reports zero variance for the certified metadata', () => {
    const check = verifyFinancialConsistency(certifiedMetadata());
    expect(check.isConsistent).toBe(true);
    expect(check.status).toBe('PASS');
    expect(check.errorMessage).toBeUndefined();
    expect(check.totalSpendVarianceInr).toBe(0);
  });

  it('reports a failure and the variance when a figure drifts from the certified value', () => {
    const drifted = { ...certifiedMetadata(), realizedSavingsInr: 680000001 };
    const check = verifyFinancialConsistency(drifted);
    expect(check.isConsistent).toBe(false);
    expect(check.status).toBe('FAIL');
    expect(check.errorMessage).toBe(VARIANCE_DETECTED_MESSAGE);
    expect(check.realizedSavingsVarianceInr).toBe(1);
  });

  it('marks the brief reconciled only when consistency and both waterfall checks pass', () => {
    expect(reconcileExecutiveBrief(certifiedMetadata()).isReconciled).toBe(true);
    const reconciliation = reconcileExecutiveBrief({ ...certifiedMetadata(), approvedSavingsInr: 1 });
    expect(reconciliation.consistency.isConsistent).toBe(false);
    expect(reconciliation.isReconciled).toBe(false);
    expect(reconciliation.waterfallValid).toBe(true);
    expect(reconciliation.netCompositionValid).toBe(true);
  });
});

describe('summary metric lookup', () => {
  it('reads every summary metric from the metadata or the presentation baseline', () => {
    const metadata = certifiedMetadata();
    const expected: Record<ExecutiveBriefSummaryMetric, number> = {
      totalSpend: metadata.totalSpendInr,
      addressableSpend: metadata.addressableSpendInr,
      grossOpportunity: metadata.grossOpportunityInr,
      approvedSavings: metadata.approvedSavingsInr,
      realizedSavings: metadata.realizedSavingsInr,
      opportunityCount: 10,
      transactionCount: 31671,
      baselineSuppliers: 974,
      baselineMaterialGroups: 256
    };
    (Object.keys(expected) as ExecutiveBriefSummaryMetric[]).forEach((metric) => {
      expect(readSummaryMetric(metric, metadata)).toBe(expected[metric]);
    });
  });
});
