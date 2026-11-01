/**
 * Module 4 Savings Evidence Workbook Sheets C
 * Encapsulates Sheets 27 and 28 of MODULE_4_FINAL_SAVINGS_EVIDENCE.xlsx.
 * Lineage and set reconciliation sheet generation.
 */

import * as XLSX from 'xlsx';
import type { Module4CompleteTransactionLineageRow } from '../types/module4SavingsForensic';
import type { Module4LineageSetReconciliationSummary } from '../types/module4LineageReconciliation';

export class Module4SavingsWorkbookSheetsC {
  public static appendSheet27(
    wb: XLSX.WorkBook,
    lineageRows: Module4CompleteTransactionLineageRow[]
  ): void {
    const s27 = [
      [
        'Opportunity ID', 'Lever', 'Sub-Lever', 'Transaction ID', 'Supplier',
        'Material Group', 'Plant', 'Transaction Date', 'Transaction Amount',
        'Eligible Amount', 'Denominator Type', 'Gross Contribution',
        'Overlap Contribution', 'Exclusion Amount', 'Net Contribution',
        'Proven Contribution', 'Evidence Type', 'Evidence Reference',
        'Lineage Status', 'Assignment Type', 'Multi-Lever Flag'
      ],
      ...lineageRows.map((r) => [
        r.opportunityId, r.lever, r.subLever, r.transactionId, r.supplier,
        r.materialGroup, r.plant, r.transactionDate, r.transactionAmount,
        r.eligibleAmount, r.denominatorType, r.grossContribution,
        r.overlapContribution, r.exclusionAmount, r.netContribution,
        r.provenContribution, r.evidenceType, r.evidenceReference,
        r.lineageStatus, r.assignmentType, r.multiLeverFlag ? 'TRUE' : 'FALSE'
      ])
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(s27), '27_COMPLETE_TRANSACTION_LINEAGE');
  }

  public static appendSheet28(
    wb: XLSX.WorkBook,
    summary: Module4LineageSetReconciliationSummary
  ): void {
    const s28 = [
      [
        'Opportunity ID', 'Assignment Count', 'Unique Transaction Count',
        'Duplicate Transaction Count', 'Line Spend (Cr)', 'Eligible Spend (Cr)',
        'Gross Opp (Cr)', 'Overlap (Cr)', 'Net Opp (Cr)', 'Proven Opp (Cr)'
      ],
      ...summary.rows.map((r) => [
        r.opportunityId, r.assignmentCount, r.uniqueTransactionCount,
        r.duplicateTransactionCount, r.lineSpendCr, r.eligibleSpendCr,
        r.grossContributionCr, r.overlapContributionCr, r.netContributionCr,
        r.provenContributionCr
      ]),
      ['TOTAL ASSIGNMENTS', summary.totalAssignments],
      ['UNIQUE TRANSACTION UNION', summary.uniqueTransactionUnion],
      ['DUPLICATE ASSIGNMENTS', summary.duplicateAssignments],
      ['MODULE 1 VALIDATED TRANSACTIONS', summary.module1ValidatedTransactions],
      ['UNION VARIANCE', summary.unionVariance],
      ['TOTAL LINE SPEND (CR)', summary.totalLineSpendCr],
      ['TOTAL GROSS OPPORTUNITY (CR)', summary.totalGrossOpportunityCr],
      ['TOTAL OVERLAP CONTRIBUTION (CR)', summary.totalOverlapContributionCr],
      ['TOTAL NET OPPORTUNITY (CR)', summary.totalNetContributionCr],
      ['TOTAL PROVEN CONTRIBUTION (CR)', summary.totalProvenContributionCr],
      ['1:1 PARTITION STATUS', summary.is1To1PartitionConfirmed ? 'CONFIRMED 1:1 PARTITION' : 'MULTI-LEVER'],
      ['RECONCILIATION NOTES', summary.reconciliationNotes]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(s28), '28_LINEAGE_SET_RECONCILIATION');
  }
}
