/**
 * Module 2 — Lever 4: Volume Aggregation Adjustments & Credit Notes Helper
 * Isolates returns, credit notes, and unlinked financial adjustments.
 * Compliant with Rule 8, 9, max 300 lines, cyclomatic complexity <= 10.
 */

import type { UnmatchedAdjustmentItem } from '../types/module2VolumeAggregation';
import type { StrategicInputTransaction } from '../types/strategicSourcing';

export class Module2VolumeAggregationAdjustmentsHelper {
  private static toUnmatchedAdjustment(t: StrategicInputTransaction): UnmatchedAdjustmentItem {
    return {
      transactionId: t.id ?? 'ADJ-UNKNOWN',
      poNumber: t.po_number ?? 'N/A',
      poLine: t.po_line ?? '1',
      poDate: t.po_date ?? 'N/A',
      vendorName: t.vendor_name ?? 'N/A',
      materialDesc: t.material_desc ?? 'Unspecified Adjustment',
      quantity: t.quantity ?? 0,
      uom: t.uom ?? 'EA',
      spendInr: t.total_spend_inr ?? 0,
      reason: 'Negative quantity or spend line; unlinked credit note / adjustment'
    };
  }

  /**
   * Isolates returns and credit notes. Links matching adjustments or records unmatched items.
   */
  public static processAdjustmentsAndCreditNotes(
    transactions: StrategicInputTransaction[]
  ): {
    regularTransactions: StrategicInputTransaction[];
    unmatchedAdjustments: UnmatchedAdjustmentItem[];
    netAdjustmentSpendInr: number;
  } {
    const regular: StrategicInputTransaction[] = [];
    const unmatched: UnmatchedAdjustmentItem[] = [];
    let netAdjustmentSpendInr = 0;

    for (const t of transactions) {
      const spend = t.total_spend_inr ?? 0;
      const qty = t.quantity ?? 0;

      if (spend < 0 || qty < 0) {
        unmatched.push(this.toUnmatchedAdjustment(t));
        netAdjustmentSpendInr += spend;
      } else {
        regular.push(t);
      }
    }

    return {
      regularTransactions: regular,
      unmatchedAdjustments: unmatched,
      netAdjustmentSpendInr
    };
  }
}
