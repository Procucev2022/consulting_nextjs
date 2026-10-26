import path from 'path';
import { describe, it, expect, vi, afterAll } from 'vitest';
import { getTransactionAttributionLedger } from '../../src/controllers/module2Canonical.controller';
import { AssessmentStore } from '../../src/services/assessmentStore';

const mockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('Live Attribution-Ledger Endpoint Audit (AIC-2026-0002 & AIC-2026-0003)', () => {
  it('calls getTransactionAttributionLedger controller on ABC Textile and PQR Cement', async () => {
    const testDir = path.resolve(__dirname, '../../../data/test');
    const store = AssessmentStore.getInstance();
    store.setCustomDataDir(testDir);
    store.reloadFromDisk();

    // 1. ABC Textile
    const reqAbc: any = { query: { assessmentId: 'AIC-2026-0002' } };
    const resAbc = mockResponse();
    await getTransactionAttributionLedger(reqAbc, resAbc);

    expect(resAbc.json).toHaveBeenCalled();
    const bodyAbc = resAbc.json.mock.calls[0][0];
    expect(bodyAbc.success).toBe(true);

    const dataAbc = bodyAbc.data;
    const wAbc = dataAbc.reconciliation.opportunityWaterfall;
    const lrAbc = dataAbc.reconciliation.leverReconciliation;

    expect(wAbc.grossCandidateOpportunityInr).toBeCloseTo(4879145.59, 2);
    expect(wAbc.multiLeverOverlapDeductionsInr).toBe(0);
    expect(wAbc.volumeDisparityExclusionsInr).toBeCloseTo(2771101.16, 2);
    expect(wAbc.otherQualificationExclusionsInr).toBeCloseTo(77886419.43, 2);
    expect(wAbc.netQualifiedCandidateOpportunityInr).toBeCloseTo(4879145.59, 2);
    expect(wAbc.commerciallyValidatedSavingsInr).toBe(0);
    expect(wAbc.isArithmeticallyBalanced).toBe(true);
    expect(wAbc.isCertified).toBe(false);

    // Vendor Consolidation must be unquantified (0)
    expect(lrAbc.VENDOR_CONSOLIDATION.quantifiedOpportunityInr).toBe(0);
    expect(lrAbc.VENDOR_CONSOLIDATION.netAttributedOpportunityInr).toBe(0);
    expect(lrAbc.VENDOR_CONSOLIDATION.quantifiedTransactionCount).toBe(0);
    expect(lrAbc.VENDOR_CONSOLIDATION.unquantifiedReasonsBreakdown.MISSING_SUPPLIER_CAPACITY).toBe(1735);

    // Direct Price Improvement separately attributed
    expect(lrAbc.DIRECT_PRICE_IMPROVEMENT.netAttributedOpportunityInr).toBeCloseTo(4879145.59, 2);
    expect(lrAbc.DIRECT_PRICE_IMPROVEMENT.quantifiedTransactionCount).toBe(366);

    // 2. PQR Cement
    const reqPqr: any = { query: { assessmentId: 'AIC-2026-0003' } };
    const resPqr = mockResponse();
    await getTransactionAttributionLedger(reqPqr, resPqr);

    expect(resPqr.json).toHaveBeenCalled();
    const bodyPqr = resPqr.json.mock.calls[0][0];
    expect(bodyPqr.success).toBe(true);

    const dataPqr = bodyPqr.data;
    const wPqr = dataPqr.reconciliation.opportunityWaterfall;
    const lrPqr = dataPqr.reconciliation.leverReconciliation;

    expect(wPqr.grossCandidateOpportunityInr).toBeCloseTo(4770672.39, 2);
    expect(wPqr.multiLeverOverlapDeductionsInr).toBe(0);
    expect(wPqr.volumeDisparityExclusionsInr).toBeCloseTo(11037762.66, 2);
    expect(wPqr.otherQualificationExclusionsInr).toBeCloseTo(179446809.79, 2);
    expect(wPqr.netQualifiedCandidateOpportunityInr).toBeCloseTo(4770672.39, 2);
    expect(wPqr.commerciallyValidatedSavingsInr).toBe(0);
    expect(wPqr.isArithmeticallyBalanced).toBe(true);
    expect(wPqr.isCertified).toBe(false);

    // Vendor Consolidation must be unquantified (0)
    expect(lrPqr.VENDOR_CONSOLIDATION.quantifiedOpportunityInr).toBe(0);
    expect(lrPqr.VENDOR_CONSOLIDATION.netAttributedOpportunityInr).toBe(0);
    expect(lrPqr.VENDOR_CONSOLIDATION.quantifiedTransactionCount).toBe(0);
    expect(lrPqr.VENDOR_CONSOLIDATION.unquantifiedReasonsBreakdown.MISSING_SUPPLIER_CAPACITY).toBe(3580);

    // Direct Price Improvement separately attributed
    expect(lrPqr.DIRECT_PRICE_IMPROVEMENT.netAttributedOpportunityInr).toBeCloseTo(4770672.39, 2);
    expect(lrPqr.DIRECT_PRICE_IMPROVEMENT.quantifiedTransactionCount).toBe(539);
  }, 120000);

  afterAll(() => {
    const store = AssessmentStore.getInstance();
    store.setCustomDataDir(undefined);
    store.reloadFromDisk();
  });
});
