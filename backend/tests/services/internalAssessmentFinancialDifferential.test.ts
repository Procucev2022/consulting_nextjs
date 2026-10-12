import { describe, it, expect } from 'vitest';
import { VGT_INVARIANT_FIGURES } from '../../src/constants/assessment';
import { assessmentStore } from '../../src/services/assessmentStore';

describe('Prompt 335: Internal Assessment Financial Differential & Invariance Suite', () => {
  it('confirms seed assessment AIC-2026-0001 mirrors canonical VGT figures with zero variance', () => {
    const seed = assessmentStore.getById('AIC-2026-0001');
    expect(seed).toBeDefined();
    expect(seed?.totalSpendCr).toBe(VGT_INVARIANT_FIGURES.VALID_FX_NORMALIZED_SPEND_CR);
    expect(seed?.validatedSpendCr).toBe(VGT_INVARIANT_FIGURES.VALID_FX_NORMALIZED_SPEND_CR);
    expect(seed?.potentialSavingsCr).toBe(378.4);
  });

  it('verifies exact authoritative population bridge (20,505 = 20,241 valid + 252 excluded + 12 anomaly)', () => {
    expect(VGT_INVARIANT_FIGURES.SOURCE_ROWS).toBe(20505);
    expect(VGT_INVARIANT_FIGURES.VALID_ROWS).toBe(20241);
    expect(VGT_INVARIANT_FIGURES.EXCLUDED_ROWS).toBe(252);
    expect(VGT_INVARIANT_FIGURES.ANOMALY_ROWS).toBe(12);

    const bridgeSum =
      VGT_INVARIANT_FIGURES.VALID_ROWS +
      VGT_INVARIANT_FIGURES.EXCLUDED_ROWS +
      VGT_INVARIANT_FIGURES.ANOMALY_ROWS;
    expect(bridgeSum).toBe(VGT_INVARIANT_FIGURES.SOURCE_ROWS);
  });

  it('verifies exact authoritative spend metrics and FX methodology impact', () => {
    expect(VGT_INVARIANT_FIGURES.VALID_FX_NORMALIZED_SPEND_CR).toBe(4073.8307);
    expect(VGT_INVARIANT_FIGURES.BASELINE_PROFILE_SPEND_CR).toBe(3920.3277);
    expect(VGT_INVARIANT_FIGURES.FX_METHODOLOGY_IMPACT_CR).toBe(153.5029);

    const delta = Number(
      (
        VGT_INVARIANT_FIGURES.VALID_FX_NORMALIZED_SPEND_CR -
        VGT_INVARIANT_FIGURES.BASELINE_PROFILE_SPEND_CR
      ).toFixed(4)
    );
    expect(delta).toBe(153.503);
  });

  it('verifies exact structural dimensions (529 suppliers, 57 material groups, 19 plants, 10 billing months)', () => {
    expect(VGT_INVARIANT_FIGURES.SUPPLIER_COUNT).toBe(529);
    expect(VGT_INVARIANT_FIGURES.MATERIAL_GROUP_COUNT).toBe(57);
    expect(VGT_INVARIANT_FIGURES.OPERATING_PLANT_COUNT).toBe(19);
    expect(VGT_INVARIANT_FIGURES.BILLING_MONTHS_COUNT).toBe(10);
  });
});
