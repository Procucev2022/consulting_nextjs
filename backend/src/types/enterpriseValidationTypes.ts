/**
 * Enterprise Production Hardening Types (Modules 1 -> 4)
 * Version: FINAL_PRE_PRODUCTION_SYSTEM_HARDENING_V1.0 (Prompt 251)
 */

export interface EnterpriseReleaseGate {
  finalEnterpriseStatus: 'PRODUCTION_READY' | 'PRODUCTION_READY_WITH_NON_BLOCKING_ITEMS' | 'BLOCKED';
  module1Status: 'PASS' | 'FAIL';
  module2Status: 'PASS' | 'FAIL';
  module3Status: 'PASS' | 'FAIL';
  module4Status: 'PASS' | 'FAIL';
  calculationIntegrity: 'PASS' | 'FAIL';
  dataReconciliation: 'PASS' | 'FAIL';
  transactionTraceability: 'PASS' | 'FAIL';
  opportunityTraceability: 'PASS' | 'FAIL';
  doubleCountingControl: 'PASS' | 'FAIL';
  moduleContinuity: 'PASS' | 'FAIL';
  uiUxStatus: 'PASS' | 'FAIL';
  securityGovernanceStatus: 'PASS' | 'FAIL';
}

export interface EnterpriseEndToEndTestCase {
  testId: string;
  testName: string;
  category: string;
  targetModule: 'MODULE_1' | 'MODULE_2' | 'MODULE_3' | 'MODULE_4' | 'CROSS_MODULE';
  description: string;
  expectedBehavior: string;
  actualBehavior: string;
  status: 'PASS' | 'FAIL';
}

export interface EnterpriseCalculationProofRecord {
  kpiName: string;
  moduleAuthority: string;
  level: 'EXECUTIVE_KPI' | 'CATEGORY' | 'ITEM' | 'SUPPLIER' | 'TRANSACTION';
  formula: string;
  rawSpendInr: number;
  excludedSpendInr: number;
  netSpendInr: number;
  varianceInr: number;
  sourceLineage: string;
  reconciliationStatus: 'PASS' | 'FAIL';
}

export interface EnterpriseTraceabilityRecord {
  transactionId: string;
  sourceFile: string;
  sourceSheet: string;
  sourceRow: number;
  uploadBatch: string;
  ingestionTimestamp: string;
  supplierName: string;
  categoryName: string;
  itemName: string;
  quantity: number;
  originalUom: string;
  standardizedUom: string;
  originalUnitPrice: number;
  originalCurrency: string;
  convertedSpendInr: number;
  validationStatus: 'VALID' | 'EXCLUDED';
  exclusionReasonCode?: string;
}

export interface EnterpriseOpportunityLedgerRecord {
  opportunityId: string;
  leverId: 'PRICE_ARBITRAGE' | 'E_AUCTION' | 'VENDOR_CONSOLIDATION' | 'VOLUME_BUNDLING' | 'STRUCTURAL';
  transactionId: string;
  categoryId: string;
  itemId: string;
  supplierId: string;
  calculationMethod: string;
  eligibleSpendInr: number;
  opportunityValueInr: number;
  overlapGroup: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  approvalStatus: 'APPROVED' | 'PENDING' | 'REJECTED';
}

export interface EnterpriseIntegrationAuditManifest {
  manifestVersion: string;
  timestamp: string;
  authoritativeDataset: {
    fileName: string;
    sha256Hash: string;
    totalRecords: number;
    validRecords: number;
    excludedRecords: number;
    totalSpendInr: number;
    totalSpendCr: number;
    reconciliationVarianceInr: number;
  };
  releaseGate: EnterpriseReleaseGate;
  totalEndToEndTests: number;
  passedTests: number;
  failedTests: number;
}
