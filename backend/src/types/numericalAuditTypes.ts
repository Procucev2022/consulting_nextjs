/**
 * Numerical Audit & Canonical Reconciliation Types (Prompt 256)
 */

export interface AuditedNumericalInvariant {
  invariantId: string;
  description: string;
  lhsRawInr: number;
  rhsRawInr: number;
  varianceRawInr: number;
  lhsDisplay: string;
  rhsDisplay: string;
  displayUnit: 'INR' | 'LAKH' | 'CRORE';
  calculationStatus: 'PASS' | 'FAIL';
}

export interface WaterfallStageLineage {
  stageId: string;
  stageName: string;
  module: string;
  rawInr: number;
  displayValue: string;
  sourceTransactionCount: number;
  sourceTransactionSample: string[];
  formula: string;
  previousStageReference?: string;
  overlapAllocationInr?: number;
  exclusionAllocationInr?: number;
}

export interface Module4PackageLineage {
  handoffId: string;
  opportunityId: string;
  category: string;
  item: string;
  supplier: string;
  transactionIds: string[];
  currentSpendInr: number;
  eligibleSpendInr: number;
  potentialBenefitInr: number;
  approvedBenefitInr: number;
  confidence: string;
  source: string;
  formula: string;
}
