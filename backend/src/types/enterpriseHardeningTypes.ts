/**
 * Enterprise Production Hardening Types (Modules 1 -> 4)
 * Version: FINAL_PRE_PRODUCTION_SYSTEM_HARDENING_V1.0
 */

export interface EnterpriseAdversarialScenarioResult {
  scenarioNumber: number;
  scenarioName: string;
  description: string;
  targetModule: 'MODULE_1' | 'MODULE_2' | 'MODULE_3' | 'MODULE_4' | 'CROSS_MODULE';
  expectedBehavior: string;
  actualBehavior: string;
  quarantineOrAuditStatus: string;
  status: 'PASS' | 'FAIL';
}

export interface PipelineWaterfallStage {
  stageNumber: number;
  stageName: string;
  module: string;
  recordCount: number;
  spendInr: number;
  spendCr: number;
  varianceInr: number;
  status: 'PASS' | 'FAIL';
}

export interface NumericalInvariantCheck {
  invariantId: string;
  invariantDescription: string;
  leftHandFormula: string;
  leftHandValue: number;
  rightHandFormula: string;
  rightHandValue: number;
  variance: number;
  tolerance: number;
  status: 'PASS' | 'FAIL';
}

export interface EnterpriseCertificationStatus {
  module1Status: 'PASS' | 'FAIL';
  module2Status: 'PASS' | 'FAIL';
  module3Status: 'PASS' | 'FAIL';
  module4Status: 'PASS' | 'FAIL';
  endToEndContinuity: 'PASS' | 'FAIL';
  calculationIntegrity: 'PASS' | 'FAIL';
  dataReconciliation: 'PASS' | 'FAIL';
  doubleCountingControl: 'PASS' | 'FAIL';
  uiUxValidation: 'PASS' | 'FAIL';
  productionBuild: 'PASS' | 'FAIL';
  finalSystemStatus: 'PRODUCTION_READY' | 'BLOCKED';
}

export interface EnterpriseAuditManifest {
  version: string;
  timestamp: string;
  datasetScope: {
    sourceFileName: string;
    fileSizeBytes: number;
    sha256Hash: string;
    totalRecords: number;
    totalSpendInr: number;
    totalSpendCr: number;
  };
  certification: EnterpriseCertificationStatus;
  waterfall: PipelineWaterfallStage[];
  invariants: NumericalInvariantCheck[];
  totalAdversarialScenarios: number;
  passedAdversarialScenarios: number;
  failedAdversarialScenarios: number;
}
