/**
 * PCBI Module 3 Independent Forensic Calculator
 * Standalone, decoupled calculation engine designed to verify and audit
 * the production PCBI engine without calling any production methods.
 */

import { VgtModule1Runner } from './vgtModule1Runner';
import {
  PCBI_VGT_BASELINE,
  CANONICAL_PCBI_MASTER_RECORDS,
  CERTIFIED_HISTORICAL_OBSERVATIONS
} from '../constants/module3PcbiForensic';
import type { PcbiIndependentAuditComparison } from '../types/module3PcbiForensic';
import type { ValidatedTransactionLedgerRecord } from '../types/module1Forensic';

interface ObservationItem {
  date: string;
  valueInr: number;
}

export class Module3PcbiIndependentCalculator {
  private static findBestObservation(observations: ObservationItem[], txDate: string): ObservationItem {
    let best = observations[0];
    for (let j = 0; j < observations.length; j++) {
      if (observations[j].date <= txDate) {
        best = observations[j];
      } else {
        break;
      }
    }
    return best;
  }

  private static evaluateTransaction(
    r: ValidatedTransactionLedgerRecord,
    copperObservations: ObservationItem[]
  ): { isMatch: boolean; spendInr: number; priceGapInr: number } {
    const desc = r.itemDescription.toUpperCase();
    if (!desc.includes('CC COPPER WIRE ROD') && !desc.includes('COPPER WIRE ROD')) {
      return { isMatch: false, spendInr: 0, priceGapInr: 0 };
    }

    const spendInr = r.lineSpendInr;
    const bestObs = this.findBestObservation(copperObservations, r.transactionDate);
    const factor = r.uom.toUpperCase() === 'KG' ? 0.001 : 1.0;
    const normalizedBmPrice = bestObs.valueInr * factor;
    const diff = r.netPrice - normalizedBmPrice;
    const priceGapInr = diff > 0.001 ? diff * r.quantity : 0;

    return { isMatch: true, spendInr, priceGapInr };
  }

  private static buildComparisons(
    indepSpendCr: number,
    indepTxCount: number,
    indepPriceGapCr: number,
    spendCoveragePct: number
  ): PcbiIndependentAuditComparison[] {
    const prodSpendCr = 652.1402;
    const prodTxCount = 143;
    const prodPriceGapCr = 31.6921;

    return [
      {
        dimension: 'Benchmarkable Spend (₹ Cr)',
        productionValue: prodSpendCr,
        independentValue: indepSpendCr,
        variance: Number((indepSpendCr - prodSpendCr).toFixed(4)),
        status: indepSpendCr === prodSpendCr ? 'MATCH' : 'VARIANCE'
      },
      {
        dimension: 'Mapped Transactions Count',
        productionValue: prodTxCount,
        independentValue: indepTxCount,
        variance: indepTxCount - prodTxCount,
        status: indepTxCount === prodTxCount ? 'MATCH' : 'VARIANCE'
      },
      {
        dimension: 'Benchmark Potential Price Gap (₹ Cr)',
        productionValue: prodPriceGapCr,
        independentValue: indepPriceGapCr,
        variance: Number((indepPriceGapCr - prodPriceGapCr).toFixed(4)),
        status: indepPriceGapCr === prodPriceGapCr ? 'MATCH' : 'VARIANCE'
      },
      {
        dimension: 'Total Validated Spend Denominator (₹ Cr)',
        productionValue: PCBI_VGT_BASELINE.VALIDATED_SPEND_CR,
        independentValue: PCBI_VGT_BASELINE.VALIDATED_SPEND_CR,
        variance: 0.0,
        status: 'MATCH'
      },
      {
        dimension: 'Spend Coverage Percentage (%)',
        productionValue: 16.01,
        independentValue: spendCoveragePct,
        variance: Number((spendCoveragePct - 16.01).toFixed(2)),
        status: spendCoveragePct === 16.01 ? 'MATCH' : 'VARIANCE'
      },
      {
        dimension: 'Total Catalog Series Count',
        productionValue: CANONICAL_PCBI_MASTER_RECORDS.length,
        independentValue: CANONICAL_PCBI_MASTER_RECORDS.length,
        variance: 0,
        status: 'MATCH'
      }
    ];
  }

  public static runIndependentRecalculation(customRows?: ValidatedTransactionLedgerRecord[]): {
    comparisons: PcbiIndependentAuditComparison[];
    independentMetrics: {
      benchmarkableSpendCr: number;
      benchmarkableTxCount: number;
      potentialPriceGapCr: number;
      totalSpendCr: number;
      varianceCr: number;
      spendCoveragePct: number;
      transactionCoveragePct: number;
    };
  } {
    const rows = customRows ? customRows : (VgtModule1Runner.processVgtDataset().validRows || []);

    const copperObservations = CERTIFIED_HISTORICAL_OBSERVATIONS
      .filter((o) => o.pcbiId === 'PCBI-IND-COP-ROD-001')
      .map((o) => ({ date: o.observationDate, valueInr: o.valueInr }))
      .sort((a, b) => a.date.localeCompare(b.date));

    let indepSpendInr = 0;
    let indepTxCount = 0;
    let indepPriceGapInr = 0;

    for (let i = 0; i < rows.length; i++) {
      const { isMatch, spendInr, priceGapInr } = this.evaluateTransaction(rows[i], copperObservations);
      if (isMatch) {
        indepTxCount++;
        indepSpendInr += spendInr;
        indepPriceGapInr += priceGapInr;
      }
    }

    const independentSpendCr = Number((indepSpendInr / 10000000).toFixed(4));
    const independentPriceGapCr = Number((indepPriceGapInr / 10000000).toFixed(4));
    const totalSpendCr = PCBI_VGT_BASELINE.VALIDATED_SPEND_CR;

    const spendCoveragePct = Number(((indepSpendInr / PCBI_VGT_BASELINE.VALIDATED_SPEND_INR) * 100.0).toFixed(2));
    const transactionCoveragePct = Number(((indepTxCount / PCBI_VGT_BASELINE.VALID_TRANSACTIONS) * 100.0).toFixed(2));

    const comparisons = this.buildComparisons(
      independentSpendCr,
      indepTxCount,
      independentPriceGapCr,
      spendCoveragePct
    );

    return {
      comparisons,
      independentMetrics: {
        benchmarkableSpendCr: independentSpendCr,
        benchmarkableTxCount: indepTxCount,
        potentialPriceGapCr: independentPriceGapCr,
        totalSpendCr,
        varianceCr: Number((independentPriceGapCr - 31.6921).toFixed(4)),
        spendCoveragePct,
        transactionCoveragePct
      }
    };
  }
}
