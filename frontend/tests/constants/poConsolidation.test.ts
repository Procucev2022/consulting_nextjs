import { describe, it, expect } from 'vitest';
import {
  PO_CONSOLIDATION_THRESHOLDS,
  PO_CADENCE_KEYS,
  PO_CONSOLIDATION_CATEGORY_TABS,
  PO_CONSOLIDATION_SORT_OPTIONS,
  getCadenceBadgeClass
} from '../../src/constants/poConsolidation';
import type { PoConsolidationCadence } from '../../src/types/poConsolidation';

describe('poConsolidation Constants & Helpers', () => {
  it('should verify threshold values and keys', () => {
    expect(PO_CONSOLIDATION_THRESHOLDS.MIN_MONTHLY_PO_COUNT).toBe(2);
    expect(PO_CONSOLIDATION_THRESHOLDS.ADMIN_COST_PER_PO_INR).toBe(3500);
    expect(PO_CADENCE_KEYS.MONTHLY).toBe('MONTHLY');
    expect(PO_CADENCE_KEYS.QUARTERLY).toBe('QUARTERLY');
    expect(PO_CADENCE_KEYS.HALF_YEARLY).toBe('HALF_YEARLY');
    expect(PO_CADENCE_KEYS.ANNUAL).toBe('ANNUAL');
    expect(PO_CONSOLIDATION_CATEGORY_TABS.length).toBe(5);
    expect(PO_CONSOLIDATION_SORT_OPTIONS.length).toBe(3);
  });

  it('should return appropriate badge class for each cadence', () => {
    expect(getCadenceBadgeClass('ANNUAL')).toContain('emerald');
    expect(getCadenceBadgeClass('HALF_YEARLY')).toContain('cyan');
    expect(getCadenceBadgeClass('QUARTERLY')).toContain('blue');
    expect(getCadenceBadgeClass('MONTHLY')).toContain('amber');
    expect(getCadenceBadgeClass('UNKNOWN' as PoConsolidationCadence)).toContain('slate');
  });
});
