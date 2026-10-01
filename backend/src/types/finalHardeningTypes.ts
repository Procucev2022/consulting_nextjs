/**
 * Final Production Hardening & E2E Validation Types (Prompt 255)
 */

export interface ModuleBoundaryTest {
  testId: string;
  moduleSource: string;
  moduleTarget: string;
  rule: string;
  attackOrCheck: string;
  expectedResult: 'BLOCKED' | 'PASS';
  actualResult: 'BLOCKED' | 'PASS';
  status: 'PASS' | 'FAIL';
}

export interface SecurityNegativeTest {
  testId: string;
  testName: string;
  attackVector: string;
  expectedResult: 'BLOCKED';
  actualResult: 'BLOCKED';
  status: 'PASS' | 'FAIL';
}

export interface AdversarialScenario {
  scenarioId: string;
  scenarioName: string;
  category: string;
  inputVector: string;
  expectedBehavior: 'BLOCK' | 'FLAG_FOR_GOVERNANCE';
  actualBehavior: 'BLOCK' | 'FLAG_FOR_GOVERNANCE';
  status: 'PASS' | 'FAIL';
}

export interface E2EJourneyMetrics {
  totalTransactions: number;
  validRecords: number;
  quarantinedRecords: number;
  totalSpendInr: number;
  totalSpendCr: number;
  categoryCount: number;
  supplierCount: number;
  grossOpportunityCr: number;
  overlapDeductionsCr: number;
  exclusionsCr: number;
  netOpportunityCr: number;
  approvedModule4Cr: number;
  reconciliationVarianceInr: number;
}

export interface FinalProductionReadinessManifest {
  manifestVersion: string;
  timestamp: string;
  finalDecision: 'PRODUCTION_READY_MODULE_1_TO_4';
  module1Status: 'PASS';
  module2Status: 'PASS';
  module3Status: 'PASS';
  module4Status: 'PASS';
  dataReconciliation: 'PASS';
  transactionTraceability: '100%';
  opportunityTraceability: '100%';
  doubleCountingControl: 'PASS';
  unauthorizedCrossModuleAccess: 0;
  customerDataLeakage: 0;
  calculationVariance: '₹0.00';
  moduleBoundaryTestsPassed: number;
  securityNegativeTestsPassed: number;
  adversarialScenariosPassed: number;
  risks: {
    blockers: string[];
    highRisks: string[];
    mediumRisks: string[];
    lowRisks: string[];
    deferredItems: string[];
  };
}
