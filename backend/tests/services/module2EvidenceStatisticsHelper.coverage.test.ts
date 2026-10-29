/**
 * Coverage tests for Module2EvidenceStatisticsHelper.
 * Drives percentile edge cases, the lowest-credible-price gates (volume share, median price floor,
 * supplier frequency and the P25 fallback), pairwise supplier proofs, and the evidence statistic
 * population, including zero-quantity and zero-price lines.
 */

import { describe, expect, it } from 'vitest';
import type {
  EvidenceStatisticPopulation,
  ExclusionReasonCode,
  SupplierPairPriceComparisonProof,
  TransactionEvidenceRecord
} from '../../src/types/module2EvidenceChain';
import { Module2EvidenceStatisticsHelper } from '../../src/services/module2EvidenceStatisticsHelper';

function evidenceLine(
  transactionId: string,
  supplierId: string,
  unitPrice: number,
  quantity: number,
  overrides: Partial<TransactionEvidenceRecord> = {}
): TransactionEvidenceRecord {
  return {
    transactionId,
    poNumber: `PO-${transactionId}`,
    poDate: '2026-01-10',
    supplierId,
    supplierName: `Supplier ${supplierId}`,
    category: 'Structural Steel',
    subCategory: 'Plates',
    itemId: 'MAT-PLT-10',
    itemDescription: 'Carbon Steel Plate 10mm',
    specification: 'IS 2062 E250',
    grade: 'E250',
    uom: 'MT',
    quantity,
    unitPrice,
    currency: 'INR',
    totalValue: unitPrice * quantity,
    deliveryLocation: 'Plant Jamshedpur',
    contractStatus: 'SPOT_PURCHASE',
    contractReference: '',
    paymentTerms: 'NET_30',
    sourceDocument: 'ERP_PURCHASE_ORDER',
    sourceRow: 1,
    dataQualityStatus: 'VERIFIED',
    comparabilityStatus: 'COMPARABLE',
    isEligible: true,
    ...overrides
  };
}

function excludedLine(transactionId: string, exclusionReason?: ExclusionReasonCode): TransactionEvidenceRecord {
  return evidenceLine(transactionId, 'SUPP-EXCL', 60000, 5, {
    isEligible: false,
    comparabilityStatus: 'EXCLUDED',
    exclusionReason
  });
}

function statisticNamed(
  stats: EvidenceStatisticPopulation[],
  name: EvidenceStatisticPopulation['statisticName']
): EvidenceStatisticPopulation {
  const match = stats.find(stat => stat.statisticName === name);
  if (!match) {
    throw new Error(`Missing evidence statistic ${name}`);
  }
  return match;
}

function pairwiseProof(records: TransactionEvidenceRecord[]): SupplierPairPriceComparisonProof {
  const proofs = Module2EvidenceStatisticsHelper.buildPairwiseProofs(records);
  expect(proofs).toHaveLength(1);
  return proofs[0];
}

describe('Module2EvidenceStatisticsHelper.calculatePercentile', () => {
  it('returns zero when there are no values', () => {
    expect(Module2EvidenceStatisticsHelper.calculatePercentile([], 50)).toBe(0);
  });

  it('returns the only value for any percentile', () => {
    expect(Module2EvidenceStatisticsHelper.calculatePercentile([42000], 25)).toBe(42000);
    expect(Module2EvidenceStatisticsHelper.calculatePercentile([42000], 90)).toBe(42000);
  });

  it('interpolates linearly between adjacent sorted prices', () => {
    // index 0.75 gives 10 * 0.25 + 20 * 0.75
    expect(Module2EvidenceStatisticsHelper.calculatePercentile([10, 20, 30, 40], 25)).toBe(17.5);
    // index 1.5 gives 20 * 0.5 + 30 * 0.5
    expect(Module2EvidenceStatisticsHelper.calculatePercentile([10, 20, 30, 40], 50)).toBe(25);
  });

  it('returns the last value at the 100th percentile', () => {
    expect(Module2EvidenceStatisticsHelper.calculatePercentile([10, 20, 30], 100)).toBe(30);
  });

  it('clamps to the last value when the requested percentile exceeds 100', () => {
    expect(Module2EvidenceStatisticsHelper.calculatePercentile([10, 20, 30], 150)).toBe(30);
  });
});

describe('Module2EvidenceStatisticsHelper.determineLowestCrediblePrice', () => {
  it('reports no credible price when there are no eligible records', () => {
    const result = Module2EvidenceStatisticsHelper.determineLowestCrediblePrice([], 60000);

    expect(result.lowestObservedPrice).toBe(0);
    expect(result.lowestCrediblePrice).toBe(0);
    expect(result.supportingTxnIds).toEqual([]);
    expect(result.rationale).toContain('No eligible comparable transactions');
  });

  it('selects the lowest-priced line that clears the volume, price floor and supplier gates', () => {
    const records = [
      evidenceLine('TX-A1', 'SUPP-A', 58000, 100),
      evidenceLine('TX-A2', 'SUPP-A', 59000, 100),
      evidenceLine('TX-B1', 'SUPP-B', 60000, 100),
      evidenceLine('TX-B2', 'SUPP-B', 61000, 100)
    ];
    const result = Module2EvidenceStatisticsHelper.determineLowestCrediblePrice(records, 59500);

    expect(result.lowestObservedPrice).toBe(58000);
    expect(result.lowestCrediblePrice).toBe(58000);
    expect(result.supportingTxnIds).toEqual(['TX-A1']);
    expect(result.rationale).toContain('25.0% volume share');
  });

  it('skips a low price backed by too little volume and uses the next qualifying line', () => {
    const records = [
      evidenceLine('TX-TINY', 'SUPP-A', 50000, 1),
      evidenceLine('TX-A2', 'SUPP-A', 60000, 100),
      evidenceLine('TX-B1', 'SUPP-B', 61000, 100),
      evidenceLine('TX-B2', 'SUPP-B', 62000, 100)
    ];
    const result = Module2EvidenceStatisticsHelper.determineLowestCrediblePrice(records, 61000);

    expect(result.lowestObservedPrice).toBe(50000);
    expect(result.lowestCrediblePrice).toBe(60000);
    expect(result.supportingTxnIds).toEqual(['TX-A2']);
  });

  it('skips prices under the median discount floor as dump prices', () => {
    const records = [
      evidenceLine('TX-D1', 'SUPP-D', 30000, 100),
      evidenceLine('TX-D2', 'SUPP-D', 31000, 100),
      evidenceLine('TX-E1', 'SUPP-E', 60000, 100),
      evidenceLine('TX-E2', 'SUPP-E', 61000, 100)
    ];
    const result = Module2EvidenceStatisticsHelper.determineLowestCrediblePrice(records, 60500);

    expect(result.lowestObservedPrice).toBe(30000);
    expect(result.lowestCrediblePrice).toBe(60000);
    expect(result.supportingTxnIds).toEqual(['TX-E1']);
  });

  it('skips a line whose supplier has fewer than the minimum number of transactions', () => {
    const records = [
      evidenceLine('TX-SOLO', 'SUPP-SOLO', 40000, 300),
      evidenceLine('TX-X1', 'SUPP-X', 60000, 50),
      evidenceLine('TX-X2', 'SUPP-X', 61000, 50)
    ];
    const result = Module2EvidenceStatisticsHelper.determineLowestCrediblePrice(records, 60000);

    expect(result.lowestCrediblePrice).toBe(60000);
    expect(result.supportingTxnIds).toEqual(['TX-X1']);
  });

  it('falls back to the P25 quartile when no single line passes every gate', () => {
    const records = [
      evidenceLine('TX-P1', 'SUPP-P1', 40000, 100),
      evidenceLine('TX-P2', 'SUPP-P2', 50000, 100),
      evidenceLine('TX-P3', 'SUPP-P3', 60000, 100),
      evidenceLine('TX-P4', 'SUPP-P4', 70000, 100)
    ];
    const result = Module2EvidenceStatisticsHelper.determineLowestCrediblePrice(records, 55000);

    expect(result.lowestObservedPrice).toBe(40000);
    expect(result.lowestCrediblePrice).toBe(47500);
    expect(result.supportingTxnIds).toEqual(['TX-P2']);
    expect(result.rationale).toContain('P25');
  });

  it('uses the P25 fallback when every eligible line carries zero quantity', () => {
    const records = [
      evidenceLine('TX-Z1', 'SUPP-Z1', 50000, 0),
      evidenceLine('TX-Z2', 'SUPP-Z2', 60000, 0),
      evidenceLine('TX-Z3', 'SUPP-Z3', 70000, 0)
    ];
    const result = Module2EvidenceStatisticsHelper.determineLowestCrediblePrice(records, 60000);

    expect(result.lowestCrediblePrice).toBe(55000);
    expect(result.supportingTxnIds).toEqual(['TX-Z2']);
  });

  it('disables the median price floor when the median is zero', () => {
    const records = [
      evidenceLine('TX-L1', 'SUPP-L', 100, 100),
      evidenceLine('TX-L2', 'SUPP-L', 1000, 100),
      evidenceLine('TX-H1', 'SUPP-H', 1000, 100),
      evidenceLine('TX-H2', 'SUPP-H', 1100, 100)
    ];
    const result = Module2EvidenceStatisticsHelper.determineLowestCrediblePrice(records, 0);

    expect(result.lowestCrediblePrice).toBe(100);
    expect(result.supportingTxnIds).toEqual(['TX-L1']);
  });
});

describe('Module2EvidenceStatisticsHelper.buildPairwiseProofs', () => {
  it('returns no proofs when fewer than two suppliers have eligible priced lines', () => {
    const records = [
      evidenceLine('TX-ONLY', 'SUPP-ONLY', 60000, 100),
      evidenceLine('TX-OUT', 'SUPP-OTHER', 61000, 100, { isEligible: false, comparabilityStatus: 'EXCLUDED' }),
      evidenceLine('TX-ZERO', 'SUPP-ZERO', 0, 100)
    ];

    expect(Module2EvidenceStatisticsHelper.buildPairwiseProofs(records)).toEqual([]);
  });

  it('places the supplier with the higher weighted average first when it is listed first', () => {
    const proof = pairwiseProof([
      evidenceLine('TX-H1', 'SUPP-HIGH', 62000, 100),
      evidenceLine('TX-H2', 'SUPP-HIGH', 64000, 300),
      evidenceLine('TX-L1', 'SUPP-LOW', 58000, 200)
    ]);

    expect(proof.supplierA).toMatchObject({
      supplierId: 'SUPP-HIGH',
      supplierName: 'Supplier SUPP-HIGH',
      quantity: 400,
      uom: 'MT',
      unitPrice: 63500,
      date: '2026-01-10',
      totalSpendInr: 25400000,
      transactionIds: ['TX-H1', 'TX-H2']
    });
    expect(proof.supplierB).toMatchObject({
      supplierId: 'SUPP-LOW',
      quantity: 200,
      unitPrice: 58000,
      totalSpendInr: 11600000,
      transactionIds: ['TX-L1']
    });
    expect(proof.priceDifference).toBe(5500);
    expect(proof.priceDifferencePct).toBeCloseTo(9.48, 2);
    expect(proof.comparabilityChecklist).toMatchObject({ uomMatch: true, currencyMatch: true });
  });

  it('places the higher weighted average first even when that supplier is listed second', () => {
    const proof = pairwiseProof([
      evidenceLine('TX-C1', 'SUPP-CHEAP', 50000, 100),
      evidenceLine('TX-P1', 'SUPP-PREMIUM', 56000, 100),
      evidenceLine('TX-P2', 'SUPP-PREMIUM', 57000, 100)
    ]);

    expect(proof.supplierA).toMatchObject({
      supplierId: 'SUPP-PREMIUM',
      unitPrice: 56500,
      quantity: 200,
      transactionIds: ['TX-P1', 'TX-P2']
    });
    expect(proof.supplierB).toMatchObject({ supplierId: 'SUPP-CHEAP', unitPrice: 50000, quantity: 100 });
    expect(proof.priceDifference).toBe(6500);
    expect(proof.priceDifferencePct).toBeCloseTo(13, 6);
  });

  it('flags unit and currency mismatches on the comparability checklist', () => {
    const proof = pairwiseProof([
      evidenceLine('TX-MT', 'SUPP-MT', 60000, 100),
      evidenceLine('TX-KG', 'SUPP-KG', 60, 1000, { uom: 'KG', currency: 'USD' })
    ]);

    expect(proof.comparabilityChecklist.uomMatch).toBe(false);
    expect(proof.comparabilityChecklist.currencyMatch).toBe(false);
  });

  it('reports a zero weighted price and zero difference when the first supplier has no quantity', () => {
    const proof = pairwiseProof([
      evidenceLine('TX-NOQTY', 'SUPP-NOQTY', 60000, 0),
      evidenceLine('TX-PRICED', 'SUPP-PRICED', 58000, 100)
    ]);

    expect(proof.supplierA).toMatchObject({ supplierId: 'SUPP-PRICED', unitPrice: 58000 });
    expect(proof.supplierB).toMatchObject({ supplierId: 'SUPP-NOQTY', quantity: 0, unitPrice: 0, totalSpendInr: 0 });
    expect(proof.priceDifference).toBe(58000);
    expect(proof.priceDifferencePct).toBe(0);
  });

  it('reports a zero percentage difference when the second supplier has no quantity', () => {
    const proof = pairwiseProof([
      evidenceLine('TX-PRICED', 'SUPP-PRICED', 58000, 100),
      evidenceLine('TX-NOQTY', 'SUPP-NOQTY', 60000, 0)
    ]);

    expect(proof.supplierA).toMatchObject({ supplierId: 'SUPP-PRICED', unitPrice: 58000 });
    expect(proof.supplierB).toMatchObject({ supplierId: 'SUPP-NOQTY', unitPrice: 0 });
    expect(proof.priceDifferencePct).toBe(0);
  });
});

describe('Module2EvidenceStatisticsHelper.buildEvidenceStatistics', () => {
  it('returns a zeroed statistic population with a default unit when nothing is recorded', () => {
    const stats = Module2EvidenceStatisticsHelper.buildEvidenceStatistics([], '');

    expect(stats.map(stat => stat.statisticName)).toEqual([
      'MIN',
      'LOWEST_CREDIBLE',
      'P25',
      'MEDIAN',
      'WAP',
      'P75',
      'MAX',
      'IQR'
    ]);
    for (const stat of stats) {
      expect(stat.value).toBe(0);
      expect(stat.uom).toBe('Units');
      expect(stat.transactionCount).toBe(0);
      expect(stat.contributingTransactionIds).toEqual([]);
      expect(stat.exclusionReasonsBreakdown).toEqual({});
    }
  });

  it('reports the full statistic population with exclusion breakdown and traceable contributors', () => {
    const stats = Module2EvidenceStatisticsHelper.buildEvidenceStatistics(
      [
        evidenceLine('TX-1', 'SUPP-A', 70000, 100),
        evidenceLine('TX-2', 'SUPP-B', 50000, 200),
        evidenceLine('TX-3', 'SUPP-C', 60000, 100),
        excludedLine('TX-X1', 'EXCLUDED_LOW_VOLUME'),
        excludedLine('TX-X2'),
        excludedLine('TX-X3', 'EXCLUDED_LOW_VOLUME')
      ],
      'MT'
    );

    expect(statisticNamed(stats, 'MIN').value).toBe(50000);
    expect(statisticNamed(stats, 'MIN').contributingTransactionIds).toEqual(['TX-2']);
    expect(statisticNamed(stats, 'MAX').value).toBe(70000);
    expect(statisticNamed(stats, 'MAX').contributingTransactionIds).toEqual(['TX-1']);
    expect(statisticNamed(stats, 'P25').value).toBe(55000);
    expect(statisticNamed(stats, 'P25').contributingTransactionIds).toEqual(['TX-1', 'TX-2', 'TX-3']);
    expect(statisticNamed(stats, 'MEDIAN').value).toBe(60000);
    expect(statisticNamed(stats, 'WAP').value).toBe(57500);
    expect(statisticNamed(stats, 'P75').value).toBe(65000);
    expect(statisticNamed(stats, 'IQR').value).toBe(10000);
    expect(statisticNamed(stats, 'LOWEST_CREDIBLE').value).toBe(55000);
    expect(statisticNamed(stats, 'LOWEST_CREDIBLE').contributingTransactionIds).toEqual(['TX-3']);
    expect(statisticNamed(stats, 'MIN')).toMatchObject({
      uom: 'MT',
      transactionCount: 6,
      supplierCount: 3,
      totalQuantity: 400,
      totalSpendInr: 23000000,
      eligibleTransactionCount: 3,
      excludedTransactionCount: 3,
      exclusionReasonsBreakdown: { EXCLUDED_LOW_VOLUME: 2, EXCLUDED_INVALID_TRANSACTION: 1 }
    });
  });

  it('reports a zero weighted average when eligible lines carry no quantity', () => {
    const stats = Module2EvidenceStatisticsHelper.buildEvidenceStatistics(
      [
        evidenceLine('TX-Z1', 'SUPP-Z1', 50000, 0),
        evidenceLine('TX-Z2', 'SUPP-Z2', 60000, 0),
        evidenceLine('TX-Z3', 'SUPP-Z3', 70000, 0)
      ],
      'MT'
    );

    expect(statisticNamed(stats, 'WAP').value).toBe(0);
    expect(statisticNamed(stats, 'LOWEST_CREDIBLE').value).toBe(55000);
    expect(statisticNamed(stats, 'LOWEST_CREDIBLE').contributingTransactionIds).toEqual(['TX-Z2']);
  });

  it('leaves zero-priced eligible lines out of the price statistics', () => {
    const stats = Module2EvidenceStatisticsHelper.buildEvidenceStatistics(
      [
        evidenceLine('TX-E1', 'SUPP-A', 50000, 100),
        evidenceLine('TX-E2', 'SUPP-B', 70000, 100),
        evidenceLine('TX-ZERO', 'SUPP-C', 0, 100)
      ],
      'MT'
    );

    expect(statisticNamed(stats, 'MIN').value).toBe(50000);
    expect(statisticNamed(stats, 'MAX').value).toBe(70000);
    expect(statisticNamed(stats, 'MIN')).toMatchObject({ supplierCount: 2, eligibleTransactionCount: 2 });
  });
});
