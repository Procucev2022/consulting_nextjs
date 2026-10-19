/**
 * Module 2 — Lever 4: Volume Aggregation Demand Recurrence Classifier
 * Evidence-based classification per Prompt 444 Section 1.
 * Compliant with Rule 8, 9, max 300 lines, cyclomatic complexity <= 10.
 */

import { VOLUME_AGGREGATION_DEMAND_CLASSIFICATIONS } from '../constants/module2VolumeAggregation';
import type { DemandRecurrenceResult } from '../types/module2VolumeAggregation';
import type { StrategicInputTransaction } from '../types/strategicSourcing';

const PROJECT_REGEX =
  /\b(prj|project|proj\b|capex|erection|commissioning|turnaround|expansion\s*project|installation\s*contract|discrete\s*project)\b/i;

const PROJECT_PO_REGEX = /\b(PRJ|PROJECT|CAPEX|COMM|EXPANSION)\b/i;

const SEASONAL_REGEX =
  /\b(seasonal|cyclical|harvest|monsoon|crop|campaign|annual\s*(shutdown|overhaul|maintenance)|boiler\s*(inspection|overhaul)|periodic\s*cycle)\b/i;

const RECURRING_PO_REGEX = /\b(BPO|RC|RATE-?CONTRACT|BLANKET|ANNUAL-?CONTRACT|ARC)\b/i;

const RECURRING_DESC_REGEX =
  /\b(rate\s*contract|annual\s*rate\s*contract|blanket\s*order|regular\s*supply|scheduled\s*intake|recurring\s*supply|standing\s*agreement)\b/i;

export class Module2VolumeAggregationDemandHelper {
  private static extractDates(transactions: StrategicInputTransaction[]): string[] {
    return Array.from(
      new Set(
        transactions
          .map((t) => (t.po_date && t.po_date.length >= 10 ? t.po_date.substring(0, 10) : t.po_date || ''))
          .filter((d) => d.length > 0)
      )
    ).sort();
  }

  private static isProjectTransaction(t: StrategicInputTransaction): boolean {
    const text = `${t.po_number || ''} ${t.material_desc || ''} ${t.department || ''} ${t.business_unit || ''} ${t.spend_category || ''}`;
    return PROJECT_PO_REGEX.test(t.po_number || '') || PROJECT_REGEX.test(text);
  }

  private static checkProjectDemand(
    transactions: StrategicInputTransaction[],
    dates: string[]
  ): DemandRecurrenceResult | null {
    for (const t of transactions) {
      if (this.isProjectTransaction(t)) {
        const id = t.po_number || t.material_desc || 'Project record';
        return {
          classification: VOLUME_AGGREGATION_DEMAND_CLASSIFICATIONS.ONE_TIME_PROJECT,
          evidence: `Supported by reliable project identifier or description in purchase records (${id}).`,
          sourceTransactionDates: dates
        };
      }
    }
    return null;
  }

  private static isSeasonalTransaction(t: StrategicInputTransaction): boolean {
    const text = `${t.material_desc || ''} ${t.spend_category || ''} ${t.department || ''}`;
    return SEASONAL_REGEX.test(text);
  }

  private static checkSeasonalDemand(
    transactions: StrategicInputTransaction[],
    dates: string[]
  ): DemandRecurrenceResult | null {
    for (const t of transactions) {
      if (this.isSeasonalTransaction(t)) {
        return {
          classification: VOLUME_AGGREGATION_DEMAND_CLASSIFICATIONS.PERIODIC_SEASONAL,
          evidence: 'Supported by identifiable seasonal or operational-cycle evidence in transaction records.',
          sourceTransactionDates: dates
        };
      }
    }
    return null;
  }

  private static isRecurringTransaction(t: StrategicInputTransaction): boolean {
    if (t.po_number && RECURRING_PO_REGEX.test(t.po_number)) return true;
    const text = `${t.material_desc || ''} ${t.spend_category || ''}`;
    return RECURRING_DESC_REGEX.test(text);
  }

  private static checkRecurringDemand(
    transactions: StrategicInputTransaction[],
    dates: string[]
  ): DemandRecurrenceResult | null {
    for (const t of transactions) {
      if (this.isRecurringTransaction(t)) {
        return {
          classification: VOLUME_AGGREGATION_DEMAND_CLASSIFICATIONS.RECURRING,
          evidence:
            'Supported by transaction history showing documented rate contract, blanket PO, or recurring supply schedule.',
          sourceTransactionDates: dates
        };
      }
    }
    return null;
  }

  /**
   * Classifies demand recurrence based strictly on verifiable evidence.
   * Arbitrary calendar-month thresholds and count minimums are forbidden.
   */
  public static classify(transactions: StrategicInputTransaction[]): DemandRecurrenceResult {
    if (!transactions || transactions.length === 0) {
      return {
        classification: VOLUME_AGGREGATION_DEMAND_CLASSIFICATIONS.INSUFFICIENT_HISTORY,
        evidence: 'No transaction history available to establish purchasing pattern.',
        sourceTransactionDates: []
      };
    }

    const dates = this.extractDates(transactions);

    const projectResult = this.checkProjectDemand(transactions, dates);
    if (projectResult) return projectResult;

    const seasonalResult = this.checkSeasonalDemand(transactions, dates);
    if (seasonalResult) return seasonalResult;

    const recurringResult = this.checkRecurringDemand(transactions, dates);
    if (recurringResult) return recurringResult;

    return {
      classification: VOLUME_AGGREGATION_DEMAND_CLASSIFICATIONS.INSUFFICIENT_HISTORY,
      evidence:
        'Available evidence is insufficient to establish purchasing pattern (no project, seasonal, or contract evidence).',
      sourceTransactionDates: dates
    };
  }
}
