import { describe, expect, it } from 'vitest';
import {
  calculateDefaultStrategicSavingsMetrics,
  calculateOverallSavingsPct
} from '../../src/constants/savingsInitiatives';

describe('strategic savings initiative metrics', () => {
  it('calculates savings percentage and returns zero when spend is unavailable', () => {
    expect(calculateOverallSavingsPct(2.5, 25)).toBe(10);
    expect(calculateOverallSavingsPct(2.5, 0)).toBe(0);
  });

  it('keeps the unconfigured default portfolio at zero savings', () => {
    expect(calculateDefaultStrategicSavingsMetrics()).toMatchObject({
      grandTotalSpendInrCr: 0,
      grandTotalSavingsInrCr: 0,
      overallSavingsPct: 0
    });
  });
});
