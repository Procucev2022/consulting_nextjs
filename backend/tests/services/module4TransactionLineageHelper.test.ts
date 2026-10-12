import { describe, it, expect } from 'vitest';
import { Module4TransactionLineageHelper } from '../../src/services/module4TransactionLineageHelper';
import { Module4TransactionLineageTestMatrixB } from '../../src/services/module4TransactionLineageTestMatrixB';
import type { Module4CanonicalOpportunityItem } from '../../src/types/module4SavingsForensic';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';

describe('Module4TransactionLineageHelper & TestMatrixB Edge Case Tests', () => {
  const mockOpportunity: Module4CanonicalOpportunityItem = {
    opportunityId: 'OPP-001',
    sourceTransactionIds: ['TX-001'],
    supplierIds: ['SUPPLIER-1'],
    materialGroup: 'Direct Materials',
    itemShortText: 'Core Direct Materials',
    plant: 'Plant 1',
    lever: 'Volume Bundling',
    subLever: 'Volume Bundling Tier Optimization',
    eligibleSpend: 1000000,
    eligibleSpendCr: 0.100,
    denominator: 0.100,
    denominatorType: 'VOLUME_BUNDLING_ELIGIBLE_SPEND',
    formula: 'Spend × Rate',
    calculationFormula: 'Spend × Rate',
    grossOpportunity: 50000,
    grossOpportunityCr: 0.005,
    overlapAmount: 10000,
    overlapAmountCr: 0.001,
    excludedAmount: 0,
    excludedAmountCr: 0,
    netOpportunity: 40000,
    netOpportunityCr: 0.004,
    provenOpportunity: 38000,
    provenOpportunityCr: 0.0038,
    deliveryLow: 3800,
    deliveryLowCr: 0.0004,
    deliveryHigh: 9500,
    deliveryHighCr: 0.0009,
    ratePercentage: 5.0,
    evidenceType: 'TRANSACTION_PRICE_AND_VOLUME_EVIDENCE',
    evidenceReference: 'EV-M4-OPP-001-LINEAGE',
    confidence: 'HIGH',
    status: 'PROVEN',
    classification: 'DIRECT_SAVINGS',
    overlapGroupId: 'OG-001',
    sourceTransactionCount: 1
  };

  it('builds lineage rows with default fallbacks when transaction fields are missing', () => {
    const rawTxs: StrategicInputTransaction[] = [
      {
        id: '',
        vendor_name: '',
        spend_category: '',
        plant: '',
        po_date: '',
        total_spend_inr: 0
      } as unknown as StrategicInputTransaction
    ];

    const rows = Module4TransactionLineageHelper.buildCompleteTransactionLineage(rawTxs, [mockOpportunity]);
    expect(rows).toHaveLength(1);
    expect(rows[0].supplier).toBe('Primary Category Supplier');
    expect(rows[0].plant).toBe('Main Plant 1');
    expect(rows[0].materialGroup).toBe('Direct Materials');
    expect(rows[0].transactionDate).toBe('2021-06-15');
    expect(rows[0].transactionId).toBe('TX-OPP-001-00001');
    expect(rows[0].netContribution).toBe(40000);
  });

  it('calculates coverage metrics correctly with empty and populated sets', () => {
    const emptyMetrics = Module4TransactionLineageHelper.calculateLineageCoverageMetrics([], []);
    expect(emptyMetrics.totalOpportunities).toBe(0);
    expect(emptyMetrics.opportunityCoveragePct).toBe(100);

    const rows = Module4TransactionLineageHelper.buildCompleteTransactionLineage([], [mockOpportunity]);
    const metrics = Module4TransactionLineageHelper.calculateLineageCoverageMetrics([mockOpportunity], rows);
    expect(metrics.totalOpportunities).toBe(1);
  });

  it('handles duplicate and missing evidence references in metrics', () => {
    const invalidRow = {
      opportunityId: 'OPP-001',
      lever: 'Volume Bundling',
      subLever: 'Volume Bundling Tier',
      transactionId: 'TX-DUP',
      supplier: 'SUP',
      materialGroup: 'CAT',
      plant: 'PLANT',
      transactionDate: '2021-06-15',
      transactionAmount: 100,
      eligibleAmount: 100,
      denominatorType: 'VOLUME_BUNDLING_ELIGIBLE_SPEND',
      grossContribution: 10,
      overlapContribution: 2,
      exclusionAmount: 0,
      netContribution: 8,
      provenContribution: 7,
      evidenceType: '',
      evidenceReference: '',
      lineageStatus: 'COMPLETE_AUDITED' as const
    };

    const metrics = Module4TransactionLineageHelper.calculateLineageCoverageMetrics([mockOpportunity], [
      invalidRow,
      { ...invalidRow }
    ]);
    expect(metrics.duplicateTransactionsCount).toBe(1);
    expect(metrics.missingEvidenceReferencesCount).toBe(2);
  });

  it('evaluates TestMatrixB with matching and non-matching checksums', () => {
    const recalc = {
      isZeroVariance: true,
      calculatedGrossOpportunityCr: 441.833,
      calculatedOverlapCr: 104.067,
      calculatedNetOpportunityCr: 337.766,
      calculatedProvenOpportunityCr: 319.439,
      grossOpportunityVarianceCr: 0,
      overlapVarianceCr: 0,
      netOpportunityVarianceCr: 0,
      provenOpportunityVarianceCr: 0,
      verificationTimestamp: new Date().toISOString()
    };

    const gatesPassed = Module4TransactionLineageTestMatrixB.buildGovernanceAndParityGates(
      '59625f2f91c303ef492b679511077a0882dab2d9760bce8b3f7edaca82d81def',
      0,
      recalc,
      20241
    );
    expect(gatesPassed.every((g) => g.status === 'PASSED')).toBe(true);

    const gatesFailed = Module4TransactionLineageTestMatrixB.buildGovernanceAndParityGates(
      'MISMATCH_CHECKSUM',
      5,
      { ...recalc, isZeroVariance: false },
      100
    );
    const checksumGate = gatesFailed.find((g) => g.testId === 'M4-TL-019');
    expect(checksumGate?.status).toBe('FAILED');
    const refGate = gatesFailed.find((g) => g.testId === 'M4-TL-020');
    expect(refGate?.status).toBe('FAILED');
    const recalcGate = gatesFailed.find((g) => g.testId === 'M4-TL-021');
    expect(recalcGate?.status).toBe('FAILED');
    const wbGate = gatesFailed.find((g) => g.testId === 'M4-TL-023');
    expect(wbGate?.status).toBe('FAILED');
  });
});
