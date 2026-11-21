import { describe, it, expect } from 'vitest';
import {
  SAVINGS_DEDUPLICATION_VERSION,
  CRORE_DIVISOR,
  DEDUPLICATION_STATUS_LABELS,
  EVIDENCE_VALIDATION_STATUS_LABELS,
  APPROVAL_STATUS_LABELS,
  CALCULATION_BASIS,
  LEVER_SAFEGUARD_RULES,
  CONSOLIDATED_SAVINGS_NOTICES,
  DEDUPLICATION_DISCLOSURES,
  LEVER_DEFINITIONS,
  ZERO_SAVINGS_METRICS,
  ZERO_CONSOLIDATED_TOTALS
} from '../../src/constants/module2SavingsDeduplication';

describe('Module 2 Savings Deduplication Constants', () => {
  it('exports expected version and numeric constants', () => {
    expect(SAVINGS_DEDUPLICATION_VERSION).toBe('MODULE_2_SAVINGS_DEDUPLICATION_V1.0');
    expect(CRORE_DIVISOR).toBe(10000000);
    expect(ZERO_SAVINGS_METRICS.grossSavingsInr).toBe(0);
    expect(ZERO_CONSOLIDATED_TOTALS.realizedSavingsInr).toBe(0);
  });

  it('exports valid label mappings and notices', () => {
    expect(DEDUPLICATION_STATUS_LABELS.INDEPENDENT).toBeDefined();
    expect(DEDUPLICATION_STATUS_LABELS.DEDUPLICATED_OVERLAP).toBeDefined();
    expect(EVIDENCE_VALIDATION_STATUS_LABELS.VALIDATED_COMMERCIAL).toBeDefined();
    expect(APPROVAL_STATUS_LABELS.APPROVED).toBeDefined();
    expect(CALCULATION_BASIS.PEER_PRICE_DISPERSION).toBeDefined();
    expect(LEVER_SAFEGUARD_RULES.LEVER_01).toBeDefined();
    expect(CONSOLIDATED_SAVINGS_NOTICES.CERTIFICATION_NOTICE).toBeDefined();
    expect(Array.isArray(DEDUPLICATION_DISCLOSURES)).toBe(true);
    expect(DEDUPLICATION_DISCLOSURES.length).toBeGreaterThan(0);
  });

  it('defines all 10 levers with correct purchase-price flags', () => {
    expect(LEVER_DEFINITIONS).toHaveLength(10);
    const lever5 = LEVER_DEFINITIONS.find((l) => l.id === 5);
    expect(lever5).toBeDefined();
    expect(lever5?.isPp).toBe(false);

    const lever1 = LEVER_DEFINITIONS.find((l) => l.id === 1);
    expect(lever1).toBeDefined();
    expect(lever1?.isPp).toBe(true);
  });
});
