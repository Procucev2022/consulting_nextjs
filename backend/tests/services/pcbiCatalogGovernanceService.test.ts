import { describe, it, expect } from 'vitest';
import { pcbiCatalogGovernanceService } from '../../src/services/pcbiCatalogGovernanceService';

describe('PCBICatalogGovernanceService (Phases 6, 7, 8 & 9)', () => {
  it('should execute admin confirmation gate with zero writes before approval and recorded audit', () => {
    // REJECT test
    const rejectRecord = pcbiCatalogGovernanceService.executeAdminConfirmationGate({
      adminUser: 'Admin User',
      action: 'REJECT',
      sourceChecksum: 'chk-reject-123',
      methodologyId: 'METH-NONE',
      version: 'V1.4',
      changeReason: 'Rejected due to validation ambiguity'
    });

    expect(rejectRecord.status).toBe('REJECTED');
    expect(rejectRecord.productionWritesCount).toBe(0);
    expect(rejectRecord.adminUser).toBe('Admin User');

    // APPROVE test
    const approveRecord = pcbiCatalogGovernanceService.executeAdminConfirmationGate({
      adminUser: 'Sriman Admin',
      action: 'APPROVE',
      sourceChecksum: 'chk-approve-456',
      methodologyId: 'METH-APPROVED-100',
      version: 'V1.4',
      changeReason: 'Certified dataset approval'
    });

    expect(approveRecord.status).toBe('APPROVED');
    expect(approveRecord.productionWritesCount).toBe(1);
    expect(approveRecord.approvalId).toBeTruthy();
  });

  it('should test 7 catalog lifecycle operations and verify immutability', () => {
    const ops = pcbiCatalogGovernanceService.testCatalogOperations();
    expect(ops).toHaveLength(7);

    const types = ops.map((o) => o.operationType);
    expect(types).toContain('ADD_COMMODITY');
    expect(types).toContain('ADD_SERIES');
    expect(types).toContain('ADD_SOURCE');
    expect(types).toContain('ADD_HISTORY');
    expect(types).toContain('UPDATE_SERIES');
    expect(types).toContain('VERSION_HISTORY');
    expect(types).toContain('DEPRECATE_SERIES');

    for (const op of ops) {
      expect(op.immutableCheckPassed).toBe(true);
      expect(op.message).toBeTruthy();
    }
  });

  it('should simulate customer data re-run post approval and verify gap clears with 0 code deployments', () => {
    const rerun = pcbiCatalogGovernanceService.executeRerunCustomerDataSimulation();

    expect(rerun.commodity).toContain('Ferro Molybdenum');
    expect(rerun.before.definitionStatus).toBe('MISSING');
    expect(rerun.before.gapAlertActive).toBe(true);

    expect(rerun.after.definitionStatus).toBe('DEFINED');
    expect(rerun.after.dataStatus).toBe('COMPLETE');
    expect(rerun.after.readinessStatus).toBe('PRODUCTION_READY');
    expect(rerun.after.gapAlertActive).toBe(false);

    expect(rerun.codeDeploymentRequired).toBe(false);
  });

  it('should detect mismatches across all 7 dimensions and block benchmarking', () => {
    const tests = pcbiCatalogGovernanceService.runMismatchDetectionTests();
    expect(tests).toHaveLength(7);

    const dims = tests.map((t) => t.dimension);
    expect(dims).toEqual(['grade', 'specification', 'unit', 'currency', 'geography', 'date_coverage', 'frequency']);

    for (const t of tests) {
      expect(t.passed).toBe(true);
      expect(t.benchmarkBlocked).toBe(true);
      expect(t.adminActionRequired).toBeTruthy();
      expect(t.detectedStatus).toBeTruthy();
    }
  });

  it('should provide production writes audit verifying zero writes before approval', () => {
    const writes = pcbiCatalogGovernanceService.getProductionWritesAudit();
    expect(writes.beforeApproval).toBe(0);
    expect(writes.afterApproval).toBe(1);
  });
});
