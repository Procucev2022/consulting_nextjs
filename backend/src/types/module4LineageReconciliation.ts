/**
 * Module 4 Lineage Set Reconciliation Types
 * Types supporting Sheet 28 and the 12 lineage contradiction closeout tests M4-LC-001 to M4-LC-012.
 */

export interface Module4LineageSetReconciliationRow {
  opportunityId: string;
  assignmentCount: number;
  uniqueTransactionCount: number;
  duplicateTransactionCount: number;
  lineSpendInr: number;
  lineSpendCr: number;
  eligibleSpendInr: number;
  eligibleSpendCr: number;
  grossContributionInr: number;
  grossContributionCr: number;
  overlapContributionInr: number;
  overlapContributionCr: number;
  netContributionInr: number;
  netContributionCr: number;
  provenContributionInr: number;
  provenContributionCr: number;
}

export interface Module4LineageSetReconciliationSummary {
  rows: Module4LineageSetReconciliationRow[];
  totalAssignments: number;
  uniqueTransactionUnion: number;
  duplicateAssignments: number;
  module1ValidatedTransactions: number;
  unionVariance: number;
  totalLineSpendCr: number;
  totalEligibleSpendCr: number;
  totalGrossOpportunityCr: number;
  totalOverlapContributionCr: number;
  totalNetContributionCr: number;
  totalProvenContributionCr: number;
  is1To1PartitionConfirmed: boolean;
  multiLeverDuplicateCount: number;
  reconciliationNotes: string;
}

export interface Module4LineageContradictionTestItem {
  testId: string;
  name: string;
  category: string;
  expectedBehavior: string;
  actualBehavior: string;
  status: 'PASSED' | 'FAILED';
  evidence: string;
}
