/**
 * Module 1 Final Production Hardening Types (Prompt 249)
 * Version: MODULE_1_PRODUCTION_HARDENING_V1.0
 */

export interface Prompt249NegativeTestScenario {
  scenarioCode: string;
  scenarioName: string;
  description: string;
  expectedBehavior: string;
  actualBehavior: string;
  quarantineStatus: string;
  status: 'PASS' | 'FAIL';
}

export interface Prompt249DataQualityAudit {
  generatedAt: string;
  overallScorePct: number;
  grade: 'EXEMPLARY' | 'CERTIFIED' | 'NEEDS_REVISION';
  dimensions: {
    completeness: number;
    uniqueness: number;
    validity: number;
    consistency: number;
    traceability: number;
    currencyIntegrity: number;
    uomIntegrity: number;
    dateIntegrity: number;
    financialReconciliation: number;
  };
  evidence: {
    totalRecordsAudited: number;
    zeroSpendRecordsQuarantined: number;
    exactDuplicatesDetected: number;
    legitimateRepeatPurchases: number;
    unexplainedVarianceInr: number;
    currencyConversionDrift: number;
    uomIncompatibleConversions: number;
    invalidDatesEncountered: number;
    module2HandoffTraceabilityPct: number;
  };
}

export interface Prompt249CertificationPayload {
  certificationStatus: 'MODULE_1_PRODUCTION_CERTIFIED';
  datasetVersion: string;
  parentVersion: string;
  changeReason: string;
  changeType: string;
  createdBy: string;
  createdAt: string;
  dataHash: string;
  sourceFile: string;
  fileSizeBytes: number;
  totalRecords: number;
  totalSpendInr: number;
  totalSpendCr: number;
  reconciliationVarianceInr: number;
  acceptanceCriteriaChecklist: Record<string, boolean>;
  module2HandoffContract: {
    datasetId: string;
    version: string;
    recordCount: number;
    spendInr: number;
    handoffToken: string;
  };
}
