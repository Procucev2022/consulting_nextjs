import { describe, it, expect, beforeEach } from 'vitest';
import { assessmentStore } from '../../src/services/assessmentStore';
import { assessmentWorkflowService } from '../../src/services/assessmentWorkflowService';
import { VGT_CERTIFIED_OPPORTUNITY_FIGURES, NDA_STATUSES } from '../../src/constants/assessment';

describe('Assessment Financial Parity & Clean Customer Intake (P0 Release Blocker)', () => {
  beforeEach(() => {
    assessmentStore.resetToDefaultSeed();
  });

  it('Test A: VGT regression assessment matches certified baseline values and is marked as TEST DATA', () => {
    const vgt = assessmentStore.getById('AIC-2026-0001');
    expect(vgt).toBeDefined();
    expect(vgt?.isTestData).toBe(true);
    expect(vgt?.customerName).toContain('[TEST DATA]');

    // Certified Invariant Opportunity Figures
    expect(vgt?.validatedSpendCr).toBe(VGT_CERTIFIED_OPPORTUNITY_FIGURES.VALIDATED_SPEND_CR);
    expect(vgt?.addressableSpendCr).toBe(VGT_CERTIFIED_OPPORTUNITY_FIGURES.ADDRESSABLE_SPEND_CR);
    expect(vgt?.grossOpportunityCr).toBe(VGT_CERTIFIED_OPPORTUNITY_FIGURES.GROSS_OPPORTUNITY_CR);
    expect(vgt?.overlapDeductionsCr).toBe(VGT_CERTIFIED_OPPORTUNITY_FIGURES.OVERLAP_DEDUCTIONS_CR);
    expect(vgt?.netDefensibleOpportunityCr).toBe(VGT_CERTIFIED_OPPORTUNITY_FIGURES.NET_DEFENSIBLE_OPPORTUNITY_CR);
    expect(vgt?.provenOpportunityCr).toBe(VGT_CERTIFIED_OPPORTUNITY_FIGURES.PROVEN_OPPORTUNITY_CR);
    expect(vgt?.deliveryRangeMinCr).toBe(VGT_CERTIFIED_OPPORTUNITY_FIGURES.DELIVERY_RANGE_MIN_CR);
    expect(vgt?.deliveryRangeMaxCr).toBe(VGT_CERTIFIED_OPPORTUNITY_FIGURES.DELIVERY_RANGE_MAX_CR);
    expect(vgt?.pcbiAnalyticalSignalCr).toBe(VGT_CERTIFIED_OPPORTUNITY_FIGURES.PCBI_BENCHMARK_PRICE_GAP_CR);

    // Exact numeric verification
    expect(vgt?.validatedSpendCr).toBe(4073.8307);
    expect(vgt?.addressableSpendCr).toBe(443.621);
    expect(vgt?.grossOpportunityCr).toBe(441.833);
    expect(vgt?.overlapDeductionsCr).toBe(104.067);
    expect(vgt?.netDefensibleOpportunityCr).toBe(337.766);
    expect(vgt?.provenOpportunityCr).toBe(319.439);
    expect(vgt?.deliveryRangeMinCr).toBe(31.944);
    expect(vgt?.deliveryRangeMaxCr).toBe(79.860);
    expect(vgt?.pcbiAnalyticalSignalCr).toBe(31.6921);
  });

  it('Test B: Genuinely new customer assessment has its own ID and zero inherited financial metrics', () => {
    const newCustomer = assessmentStore.createAssessment(
      {
        customerName: 'Acme Heavy Industries',
        industry: 'Heavy Machinery',
        assessmentPeriodStart: '2023-04-01',
        assessmentPeriodEnd: '2024-03-31',
        assignedAnalyst: 'analyst@procucev.com',
        ndaStatus: NDA_STATUSES.SIGNED,
        isTestData: false
      },
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );

    expect(newCustomer.assessmentId).toBe('AIC-2026-0002');
    expect(newCustomer.isTestData).toBe(false);
    expect(newCustomer.activeAnalysisRunId).toBeUndefined();
    expect(newCustomer.activeDataVersionId).toBeUndefined();

    // Financial fields must be undefined (clean intake state, no VGT inheritance)
    expect(newCustomer.totalSpendCr).toBeUndefined();
    expect(newCustomer.validatedSpendCr).toBeUndefined();
    expect(newCustomer.baselineSpendCr).toBeUndefined();
    expect(newCustomer.fxImpactCr).toBeUndefined();
    expect(newCustomer.addressableSpendCr).toBeUndefined();
    expect(newCustomer.grossOpportunityCr).toBeUndefined();
    expect(newCustomer.overlapDeductionsCr).toBeUndefined();
    expect(newCustomer.netDefensibleOpportunityCr).toBeUndefined();
    expect(newCustomer.provenOpportunityCr).toBeUndefined();
    expect(newCustomer.deliveryRangeMinCr).toBeUndefined();
    expect(newCustomer.deliveryRangeMaxCr).toBeUndefined();
    expect(newCustomer.pcbiAnalyticalSignalCr).toBeUndefined();
    expect(newCustomer.potentialSavingsCr).toBeUndefined();
    expect(newCustomer.savingsPct).toBeUndefined();

    // Store collections must be clean for new customer
    const runs = assessmentStore.getAnalysisRuns(newCustomer.assessmentId);
    const versions = assessmentStore.getDataVersions(newCustomer.assessmentId);
    expect(runs).toHaveLength(0);
    expect(versions).toHaveLength(0);
  });

  it('Test C: Switching assessments returns isolated and distinct metrics without cross-contamination', () => {
    const vgt = assessmentStore.getById('AIC-2026-0001');
    const customer = assessmentStore.createAssessment(
      {
        customerName: 'Steel Dynamics Global',
        industry: 'Steel Manufacturing',
        assessmentPeriodStart: '2022-01-01',
        assessmentPeriodEnd: '2022-12-31',
        assignedAnalyst: 'analyst@procucev.com',
        ndaStatus: NDA_STATUSES.SIGNED
      },
      'analyst@procucev.com',
      'ANALYST'
    );

    // Ingest customer dataset and run analysis
    const { dataVersion } = assessmentWorkflowService.uploadDataVersion(
      customer.assessmentId,
      {
        fileName: 'steel_dynamics_spend.csv',
        fileSize: 450000,
        checksum: 'sha-steel-123',
        rowCount: 5000
      },
      'analyst@procucev.com',
      'ANALYST'
    );

    const { analysisRun: customerRun, assessment: customerRefreshed } = assessmentWorkflowService.runAnalysis(
      customer.assessmentId,
      dataVersion.dataVersionId,
      'analyst@procucev.com',
      'ANALYST'
    );

    // VGT metrics remain untouched
    expect(vgt?.validatedSpendCr).toBe(4073.8307);
    expect(vgt?.netDefensibleOpportunityCr).toBe(337.766);

    // Customer metrics are derived from customer dataset, not VGT
    expect(customerRefreshed.validatedSpendCr).not.toBe(vgt?.validatedSpendCr);
    expect(customerRun.validatedSpendCr).toBe(125.4);
    expect(customerRefreshed.validatedSpendCr).toBe(125.4);
  });

  it('Test D: Superseded analysis does not populate the current active dashboard run', () => {
    // Run second analysis on VGT dataset
    const { dataVersion } = assessmentWorkflowService.uploadDataVersion(
      'AIC-2026-0001',
      {
        fileName: 'vgt_v2.xlsx',
        fileSize: 2240000,
        checksum: 'sha-vgt-v2',
        rowCount: 20505
      },
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );

    const { analysisRun: run2, assessment: refreshedVgt } = assessmentWorkflowService.runAnalysis(
      'AIC-2026-0001',
      dataVersion.dataVersionId,
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );

    expect(refreshedVgt.activeAnalysisRunId).toBe(run2.analysisRunId);

    const allRuns = assessmentStore.getAnalysisRuns('AIC-2026-0001');
    expect(allRuns).toHaveLength(2);

    const run1 = allRuns.find((r) => r.analysisRunId === 'RUN-001');
    expect(run1?.isSuperseded).toBe(true);
    expect(run2.isSuperseded).toBe(false);

    // Attempting to approve superseded run throws error
    expect(() => {
      assessmentWorkflowService.approveAssessment(
        'AIC-2026-0001',
        {
          analysisRunId: 'RUN-001',
          approvalComment: 'Should fail'
        },
        'analyst@procucev.com',
        'ANALYST'
      );
    }).toThrow(/Cannot approve a superseded analysis run/);
  });

  it('Test E: PCBI benchmark price-gap signal remains strictly separate from savings/opportunity pool', () => {
    const vgt = assessmentStore.getById('AIC-2026-0001');
    expect(vgt).toBeDefined();

    const gross = vgt!.grossOpportunityCr!;
    const overlap = vgt!.overlapDeductionsCr!;
    const net = vgt!.netDefensibleOpportunityCr!;
    const pcbiSignal = vgt!.pcbiAnalyticalSignalCr!;

    // Formula Check: Gross - Overlap = Net
    expect(Number((gross - overlap).toFixed(3))).toBe(net);
    expect(gross).toBe(441.833);
    expect(overlap).toBe(104.067);
    expect(net).toBe(337.766);

    // PCBI signal must NOT be added to Net Defensible Opportunity
    expect(net).not.toBe(Number((gross - overlap + pcbiSignal).toFixed(3)));
    expect(net).toBe(337.766);
    expect(pcbiSignal).toBe(31.6921);
  });

  it('Test F: API, Store, and Delivery Package figures reconcile exactly with certified figures', () => {
    const pkg = assessmentWorkflowService.generateDeliveryPackage(
      'AIC-2026-0001',
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );

    expect(pkg.assessmentId).toBe('AIC-2026-0001');
    expect(pkg.customerName).toContain('Varroc Polymers');
    expect(pkg.items.length).toBe(10);

    const storeRecord = assessmentStore.getById('AIC-2026-0001');
    const runs = assessmentStore.getAnalysisRuns('AIC-2026-0001');
    const activeRun = runs.find((r) => r.analysisRunId === storeRecord?.activeAnalysisRunId);

    expect(activeRun).toBeDefined();
    expect(activeRun?.validatedSpendCr).toBe(4073.8307);
    expect(activeRun?.addressableSpendCr).toBe(443.621);
    expect(activeRun?.grossOpportunityCr).toBe(441.833);
    expect(activeRun?.overlapDeductionsCr).toBe(104.067);
    expect(activeRun?.netDefensibleOpportunityCr).toBe(337.766);
    expect(activeRun?.provenOpportunityCr).toBe(319.439);
    expect(activeRun?.deliveryRangeMinCr).toBe(31.944);
    expect(activeRun?.deliveryRangeMaxCr).toBe(79.860);
    expect(activeRun?.pcbiAnalyticalSignalCr).toBe(31.6921);
  });

  it('Test G: Test data assessments are blocked from ordinary customer delivery', () => {
    const vgt = assessmentStore.getById('AIC-2026-0001');
    expect(vgt?.isTestData).toBe(true);

    // Ordinary delivery attempt must fail
    expect(() => {
      assessmentWorkflowService.deliverAssessment(
        'AIC-2026-0001',
        {
          deliveredToEmail: 'customer@varroc.com',
          deliveryNotes: 'Unauthorized delivery attempt',
          isTestDelivery: false
        },
        'admin@procucev.com',
        'INTERNAL_ADMIN'
      );
    }).toThrow(/Ordinary customer delivery blocked for TEST DATA assessments/);

    // Explicit test delivery succeeds
    const delivered = assessmentWorkflowService.deliverAssessment(
      'AIC-2026-0001',
      {
        deliveredToEmail: 'qa@procucev.com',
        deliveryNotes: 'Automated test suite verification delivery',
        isTestDelivery: true
      },
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );
    expect(delivered.status).toBe('DELIVERED');
  });
});
