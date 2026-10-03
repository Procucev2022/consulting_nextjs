/**
 * Module 2 — Category Recurrence & Materiality Engine
 * Version: MODULE_2_SOURCING_LOGIC_V1.0
 */

import type { StrategicInputTransaction } from '../types/strategicSourcing';
import {
  MATERIALITY_THRESHOLDS,
  RECURRING_SPEND_RULES
} from '../constants/module2StrategicSourcing';

export interface CategoryRecurrenceResult {
  activeMonthsCount: number;
  avgMonthlySpendInr: number;
  avgTxValueInr: number;
  isRecurring: boolean;
  recurringRationale: string;
  categoryMateriality: 'HIGH' | 'MEDIUM' | 'LOW';
}

export class Module2RecurrenceEngine {
  public static calculateRecurrence(
    transactions: StrategicInputTransaction[],
    totalSpendInr: number
  ): CategoryRecurrenceResult {
    const totalTxCount = transactions.length;
    const activeMonths = new Set<string>();
    for (const t of transactions) {
      if (t.po_date) activeMonths.add(t.po_date.substring(0, 7));
    }
    const activeMonthsCount = Math.max(1, activeMonths.size);
    const avgMonthlySpendInr = Math.round(totalSpendInr / activeMonthsCount);
    const avgTxValueInr = totalTxCount > 0 ? Math.round(totalSpendInr / totalTxCount) : 0;

    const isRecurring = activeMonthsCount >= RECURRING_SPEND_RULES.MIN_ACTIVE_MONTHS &&
      totalTxCount >= RECURRING_SPEND_RULES.MIN_TRANSACTIONS;
    const recurringRationale = isRecurring
      ? `Recurring spend confirmed: ${activeMonthsCount} active months with ${totalTxCount} purchase orders.`
      : `Non-recurring or ad-hoc purchasing pattern (${activeMonthsCount} active months, ${totalTxCount} orders).`;

    const categoryMateriality = totalSpendInr >= MATERIALITY_THRESHOLDS.HIGH_INR
      ? 'HIGH'
      : totalSpendInr >= MATERIALITY_THRESHOLDS.MEDIUM_INR
      ? 'MEDIUM'
      : 'LOW';

    return {
      activeMonthsCount,
      avgMonthlySpendInr,
      avgTxValueInr,
      isRecurring,
      recurringRationale,
      categoryMateriality
    };
  }
}
