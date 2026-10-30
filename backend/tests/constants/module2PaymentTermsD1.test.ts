import { describe, expect, it } from 'vitest';
import {
  MODULE2_D1_PAYMENT_TERMS, MODULE2_D1_PAYMENT_TERMS_MESSAGES
} from '../../src/constants/module2PaymentTermsD1';

describe('MODULE2_D1_PAYMENT_TERMS', () => {
  it('exposes source field aliases, guarded term limits and the full export contract', () => {
    expect(MODULE2_D1_PAYMENT_TERMS.TERM_FIELD_ALIASES).toContain('paymentterms');
    expect(MODULE2_D1_PAYMENT_TERMS.MAX_CREDIT_DAYS).toBe(3650);
    expect(MODULE2_D1_PAYMENT_TERMS.EXPORT.SHEETS).toHaveLength(8);
    expect(MODULE2_D1_PAYMENT_TERMS.STATUS_DISPLAY_LABELS.DATA_UNAVAILABLE)
      .toContain('Payment Terms Not Found');
    expect(MODULE2_D1_PAYMENT_TERMS_MESSAGES.BENEFIT_DISCLOSURE).toContain('remain zero');
  });
});
