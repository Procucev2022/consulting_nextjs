/**
 * PCBI Module 3 Forensic Engine Helper
 * Provides transaction classification, benchmark mapping, and source provenance generation.
 */

import {
  NON_BENCHMARKABLE_PATTERNS,
  ENGINEERED_NON_COMMODITY_PATTERNS,
  CANONICAL_PCBI_MASTER_RECORDS
} from '../constants/module3PcbiForensic';
import type {
  PcbiObservationRecord,
  PcbiCustomerTransactionBenchmarkRecord,
  PcbiSourceProvenanceRecord
} from '../types/module3PcbiForensic';
import type { ValidatedTransactionLedgerRecord } from '../types/module1Forensic';

export type SpendBucket = 'BENCHMARKABLE' | 'PARTIAL' | 'ENGINEERED' | 'SERVICE' | 'UNMAPPED';

export interface EvaluatedRowResult {
  record: PcbiCustomerTransactionBenchmarkRecord;
  bucket: SpendBucket;
  spendInr: number;
  potentialGapInr: number;
  isAboveBm: boolean;
  isBelowBm: boolean;
  isAtBm: boolean;
  isOutlier: boolean;
  gapPct: number;
  belowSpendInr: number;
}

export class Module3PcbiEngineHelper {
  public static getSourceProvenanceRecords(): PcbiSourceProvenanceRecord[] {
    return CANONICAL_PCBI_MASTER_RECORDS.map((m, idx) => ({
      sourceId: `SRC-PROV-${String(idx + 1).padStart(3, '0')}`,
      pcbiId: m.pcbiId,
      commodity: m.commodity,
      sourceName: m.source,
      sourceType:
        m.sourceAccessTier === 'LICENSED'
          ? 'COMMERCIAL_EXCHANGE'
          : m.sourceAccessTier === 'VERIFIED_FREE'
            ? 'GOVERNMENT_STATISTICAL'
            : 'INDUSTRY_ASSESSMENT',
      publisher: m.source.split('(')[0].trim(),
      frequency: m.sourceFrequency,
      unit: m.benchmarkUnit,
      currency: m.currency,
      url: `https://market-intelligence.procucev.com/pcbi/${m.pcbiId.toLowerCase()}`,
      accessTier: m.sourceAccessTier,
      licenseRequired: m.sourceAccessTier === 'LICENSED',
      manualAuthRequired: m.sourceAccessTier === 'MANUAL_AUTHENTICATED',
      documentRef: m.evidenceReference,
      frequencyCompatible: m.sourceFrequency === 'MONTHLY' || m.sourceFrequency === 'DAILY',
      unitCompatible: m.benchmarkUnit === 'INR/MT',
      currencyCompatible: m.currency === 'INR',
      status: m.coverageStatus
    }));
  }

  public static determineBucket(desc: string): SpendBucket {
    if (NON_BENCHMARKABLE_PATTERNS.some((p) => desc.includes(p))) {
      return 'SERVICE';
    }
    if (desc.includes('CC COPPER WIRE ROD') || desc.includes('COPPER WIRE ROD')) {
      return 'BENCHMARKABLE';
    }
    if (
      desc.includes('STEEL') ||
      desc.includes('HRC') ||
      desc.includes('TMT') ||
      desc.includes('KRAFT') ||
      desc.includes('CAUSTIC') ||
      desc.includes('FERRO MOLY')
    ) {
      return 'PARTIAL';
    }
    if (ENGINEERED_NON_COMMODITY_PATTERNS.some((p) => desc.includes(p))) {
      return 'ENGINEERED';
    }
    return 'UNMAPPED';
  }

  private static evaluateBenchmarkedRecord(
    r: ValidatedTransactionLedgerRecord,
    copperObservations: PcbiObservationRecord[]
  ): {
    record: PcbiCustomerTransactionBenchmarkRecord;
    potentialGapInr: number;
    isAboveBm: boolean;
    isBelowBm: boolean;
    isAtBm: boolean;
    isOutlier: boolean;
    gapPct: number;
    belowSpendInr: number;
  } {
    let chosenObservation = copperObservations[0];
    for (const obs of copperObservations) {
      if (obs.observationDate <= r.transactionDate) {
        chosenObservation = obs;
      } else {
        break;
      }
    }

    const uom = r.uom.toUpperCase();
    const conversionFactor = uom === 'KG' ? 0.001 : 1.0;
    const normalizedBmPriceInr = chosenObservation.valueInr * conversionFactor;
    const priceDiff = r.netPrice - normalizedBmPriceInr;
    const priceDiffPct = (priceDiff / normalizedBmPriceInr) * 100.0;

    let direction: 'ABOVE_BENCHMARK' | 'AT_BENCHMARK' | 'BELOW_BENCHMARK' = 'AT_BENCHMARK';
    let potentialGap = 0;
    let isAboveBm = false;
    let isBelowBm = false;
    let isAtBm = false;
    let belowSpendInr = 0;

    if (priceDiff > 0.001) {
      direction = 'ABOVE_BENCHMARK';
      potentialGap = priceDiff * r.quantity;
      isAboveBm = true;
    } else if (priceDiff < -0.001) {
      direction = 'BELOW_BENCHMARK';
      isBelowBm = true;
      belowSpendInr = r.lineSpendInr;
    } else {
      direction = 'AT_BENCHMARK';
      isAtBm = true;
    }

    const isOutlier = priceDiffPct > 25.0;

    const record: PcbiCustomerTransactionBenchmarkRecord = {
      recordId: r.recordId,
      sourceRow: r.sourceRow,
      poNumber: r.poNumber,
      transactionDate: r.transactionDate,
      supplierCode: r.vendorCode,
      supplierName: r.vendorName,
      itemCode: r.itemCode,
      itemDescription: r.itemDescription,
      materialGroup: r.materialGroup,
      quantity: r.quantity,
      orderUnit: r.uom,
      transactionUnitPrice: r.netPrice,
      currency: r.currency,
      transactionSpendInr: r.lineSpendInr,
      mappingStatus: 'MAPPED',
      pcbiId: chosenObservation.pcbiId,
      benchmarkDateUsed: chosenObservation.observationDate,
      rawBenchmarkPrice: chosenObservation.valueInr,
      benchmarkCurrency: chosenObservation.originalCurrency,
      normalizedBenchmarkPriceInr: Number(normalizedBmPriceInr.toFixed(4)),
      conversionFactor,
      unitPriceDifferenceInr: Number(priceDiff.toFixed(4)),
      priceDifferencePct: Number(priceDiffPct.toFixed(2)),
      potentialPriceGapInr: Number(potentialGap.toFixed(2)),
      direction,
      qualityGrade: 'A',
      sourceTier: 'LICENSED',
      isOutlier,
      outlierReason: isOutlier
        ? `Price gap ${priceDiffPct.toFixed(1)}% exceeds standard 25% audit tolerance threshold`
        : undefined
    };

    return {
      record,
      potentialGapInr: potentialGap,
      isAboveBm,
      isBelowBm,
      isAtBm,
      isOutlier,
      gapPct: priceDiffPct,
      belowSpendInr
    };
  }

  public static evaluateRow(
    r: ValidatedTransactionLedgerRecord,
    copperObservations: PcbiObservationRecord[]
  ): EvaluatedRowResult {
    const desc = r.itemDescription.toUpperCase();
    const bucket = this.determineBucket(desc);
    const spendInr = r.lineSpendInr;

    if (bucket === 'BENCHMARKABLE') {
      const bench = this.evaluateBenchmarkedRecord(r, copperObservations);
      return {
        record: {
          ...bench.record,
          marketVarianceValue: bench.potentialGapInr
        },
        bucket,
        spendInr,
        potentialGapInr: bench.potentialGapInr,
        isAboveBm: bench.isAboveBm,
        isBelowBm: bench.isBelowBm,
        isAtBm: bench.isAtBm,
        isOutlier: bench.isOutlier,
        gapPct: bench.gapPct,
        belowSpendInr: bench.belowSpendInr
      };
    }

    const mappingStatus =
      bucket === 'SERVICE'
        ? 'SERVICE'
        : bucket === 'PARTIAL'
          ? 'PARTIAL'
          : bucket === 'ENGINEERED'
            ? 'NOT_BENCHMARKABLE'
            : 'UNMAPPED_BENCHMARK_SIGNAL';

    const unmappedSignal = mappingStatus === 'UNMAPPED_BENCHMARK_SIGNAL' ? 'UNMAPPED_BENCHMARK_SIGNAL' : undefined;
    const unmappedReason =
      mappingStatus === 'UNMAPPED_BENCHMARK_SIGNAL'
        ? `Material '${r.itemCode || r.itemDescription}' has no registered benchmark series (UNMAPPED_BENCHMARK_SIGNAL)`
        : undefined;

    const record: PcbiCustomerTransactionBenchmarkRecord = {
      recordId: r.recordId,
      sourceRow: r.sourceRow,
      poNumber: r.poNumber,
      transactionDate: r.transactionDate,
      supplierCode: r.vendorCode,
      supplierName: r.vendorName,
      itemCode: r.itemCode,
      itemDescription: r.itemDescription,
      materialGroup: r.materialGroup,
      quantity: r.quantity,
      orderUnit: r.uom,
      transactionUnitPrice: r.netPrice,
      currency: r.currency,
      transactionSpendInr: spendInr,
      mappingStatus,
      unmappedSignal,
      unmappedReason,
      marketVarianceValue: 0,
      conversionFactor: 1.0,
      direction: 'UNBENCHMARKED',
      isOutlier: false
    };

    return {
      record,
      bucket,
      spendInr,
      potentialGapInr: 0,
      isAboveBm: false,
      isBelowBm: false,
      isAtBm: false,
      isOutlier: false,
      gapPct: 0,
      belowSpendInr: 0
    };
  }

  public static updateAccumulator(
    spends: { benchmarkable: number; partial: number; engineered: number; service: number; unmapped: number },
    gaps: {
      aboveBmCount: number;
      belowBmCount: number;
      atBmCount: number;
      totalGapInr: number;
      maxGapPct: number;
      outlierCount: number;
      belowBmSpendInr: number;
    },
    res: EvaluatedRowResult
  ): void {
    if (res.bucket === 'BENCHMARKABLE') spends.benchmarkable += res.spendInr;
    else if (res.bucket === 'PARTIAL') spends.partial += res.spendInr;
    else if (res.bucket === 'ENGINEERED') spends.engineered += res.spendInr;
    else if (res.bucket === 'SERVICE') spends.service += res.spendInr;
    else spends.unmapped += res.spendInr;

    if (res.isAboveBm) {
      gaps.aboveBmCount++;
      gaps.totalGapInr += res.potentialGapInr;
      if (res.gapPct > gaps.maxGapPct) gaps.maxGapPct = res.gapPct;
    } else if (res.isBelowBm) {
      gaps.belowBmCount++;
      gaps.belowBmSpendInr += res.belowSpendInr;
    } else if (res.isAtBm) {
      gaps.atBmCount++;
    }
    if (res.isOutlier) gaps.outlierCount++;
  }
}

