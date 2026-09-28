import { describe, it, expect } from 'vitest';
import { pcbiControlledValidationService } from '../../src/services/pcbiControlledValidationService';

describe('PCBIControlledValidationService', () => {
  it('should execute dataset pre-flight and confirm full certified dataset', () => {
    const preflight = pcbiControlledValidationService.getDatasetPreflight();
    expect(preflight.fullDatasetConfirmed).toBe(true);
    expect(preflight.totalCustomerSpend).toBe(86317055);
    expect(preflight.totalTransactions).toBe(15);
    expect(preflight.totalModule2Families).toBe(12);
    expect(preflight.pcbiDefined).toBe(10);
    expect(preflight.pcbiMissing).toBe(1);
    expect(preflight.completeHistory).toBe(1);
    expect(preflight.partialHistory).toBe(9);
    expect(preflight.noHistory).toBe(2);
    expect(preflight.notBenchmarkable).toBe(1);
  });

  it('should return exactly one representative series for each of the 12 categories', () => {
    const series = pcbiControlledValidationService.getControlled12Series();
    expect(series).toHaveLength(12);

    const categories = series.map((s) => s.category);
    expect(new Set(categories).size).toBe(12);

    for (const item of series) {
      expect(item.pcbiId).toBeTruthy();
      expect(item.commodity).toBeTruthy();
      expect(item.module2Commodity).toBeTruthy();
      expect(item.unspsc).toBeTruthy();
      expect(item.customerSpend).toBeGreaterThan(0);
      expect(item.source).toBeTruthy();
      expect(item.sourceStatus).toBeTruthy();
      expect(item.sourceFrequency).toBeTruthy();
      expect(item.requiredFrequency).toBeTruthy();
      expect(item.historicalPeriod).toBeTruthy();
      expect(item.availableHistory).toBeTruthy();
      expect(item.unit).toBeTruthy();
      expect(item.currency).toBeTruthy();
      expect(item.geography).toBeTruthy();
      expect(item.methodologyId).toBeTruthy();
      expect(item.methodologyApprovalStatus).toBeTruthy();
      if (!item.isEligible) {
        expect(item.blockReason).toBeTruthy();
      }
    }
  });

  it('should return raw source observations without rounding during calculation', () => {
    const observations = pcbiControlledValidationService.getRawSourceObservations();
    expect(observations.length).toBeGreaterThan(0);

    for (const obs of observations) {
      expect(obs.sourceDate).toBeTruthy();
      expect(obs.effectiveDate).toBeTruthy();
      expect(obs.rawValue).toBeGreaterThan(0);
      expect(obs.rawUnit).toBeTruthy();
      expect(obs.rawCurrency).toBeTruthy();
      expect(obs.checksum).toBeTruthy();
      expect(obs.ingestionBatchId).toBeTruthy();
    }
  });

  it('should validate standardization transformations and block unapproved methodologies', () => {
    const transformations = pcbiControlledValidationService.getStandardizationTransformations();
    expect(transformations.length).toBeGreaterThan(0);

    const blocked = transformations.find((t) => !t.isValid);
    expect(blocked).toBeDefined();
    expect(blocked?.approvalStatus).toBe('METHODOLOGY_APPROVAL_REQUIRED');
    expect(blocked?.blockReason).toBeTruthy();
  });

  it('should calculate PCBI index for eligible series with unrounded math and verify base period = 100', () => {
    const calculations = pcbiControlledValidationService.calculateEligiblePCBI();
    expect(calculations.length).toBeGreaterThan(0);

    for (const calc of calculations) {
      expect(calc.pcbiId).toBeTruthy();
      expect(calc.basePeriodValue).toBeGreaterThan(0);
      expect(calc.currentPeriodValue).toBeGreaterThan(0);
      expect(calc.pcbiOutput).toBeGreaterThan(0);
      expect(calc.basePeriodVerified).toBe(true);
    }
  });

  it('should validate base periods mathematically', () => {
    const baseValidations = pcbiControlledValidationService.validateBasePeriods();
    expect(baseValidations.length).toBeGreaterThan(0);

    for (const b of baseValidations) {
      expect(b.indexBase).toBe(100);
      expect(b.basePeriodVerified).toBe(true);
      expect(b.calculationFormula).toContain('100');
    }
  });

  it('should execute 10 negative tests (A through J) with zero PCBI generated and status = BLOCKED', () => {
    const negTests = pcbiControlledValidationService.executeNegativeTests();
    expect(negTests).toHaveLength(10);

    const codes = negTests.map((t) => t.code);
    expect(codes).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']);

    for (const t of negTests) {
      expect(t.passed).toBe(true);
      expect(t.pcbiGenerated).toBe(false);
      expect(t.status).toBeTruthy();
      expect(t.adminActionRequired).toBeTruthy();
    }
  });

  it('should generate analytical preview with prominent disclaimer and zero savings', () => {
    const preview = pcbiControlledValidationService.generateAnalyticalPreview();
    expect(preview.length).toBeGreaterThan(0);

    for (const p of preview) {
      expect(p.customerPurchasePrice).toBeGreaterThan(0);
      expect(p.customerCurrency).toBe('INR');
      expect(p.customerUnit).toBeDefined();
      expect(p.pcbiBaseValue).toBeGreaterThan(0);
      expect(p.pcbiCurrentValue).toBeGreaterThan(0);
      expect(p.pcbiCurrency).toBeDefined();
      expect(p.pcbiUnit).toBeDefined();
      expect(p.pcbiIndex).toBeGreaterThan(0);
      expect(p.disclaimer).toBe('ANALYTICAL PREVIEW — NOT SAVINGS');
    }
  });

  it('should validate all 10 provenance links for verified observations', () => {
    const prov = pcbiControlledValidationService.validateProvenanceLinks();
    expect(prov.allLinksPresent).toBe(true);
    expect(prov.verifiedObservationsCount).toBe(12);
  });

  it('should generate controlled validation report summary with gate decision CALCULATION_VALIDATED_WITH_GAPS', () => {
    const summary = pcbiControlledValidationService.generateValidationSummary();
    expect(summary.fullDatasetConfirmed).toBe(true);
    expect(summary.seriesTested).toBe(12);
    expect(summary.eligibleSeries).toBeGreaterThan(0);
    expect(summary.blockedSeries).toBeGreaterThan(0);
    expect(summary.module1Modified).toBe(false);
    expect(summary.module2Modified).toBe(false);
    expect(summary.pcbiMasterModified).toBe(false);
    expect(summary.module4Connected).toBe(false);
    expect(summary.savingsCalculated).toBe(0);
    expect(summary.finalGate).toBe('CALCULATION_VALIDATED_WITH_GAPS');
  });
});
