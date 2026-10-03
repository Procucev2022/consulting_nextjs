/**
 * Prompt 289 §12 & §13: Financial Certification & Modules 1–4 Zero-Variance Regression Suite
 */

import { describe, it, expect } from 'vitest';
import {
  PRESENTATION_GROSS_OPPORTUNITY_CR,
  PRESENTATION_OVERLAP_DEDUCTIONS_CR,
  PRESENTATION_EXCLUSIONS_CR,
  PRESENTATION_NET_DEFENSIBLE_PIPELINE_CR,
  PRESENTATION_NET_DIRECT_SAVINGS_CR,
  PRESENTATION_STRATEGIC_MARKET_VALUE_CR,
  PRESENTATION_VALIDATED_SAVINGS_CR,
  PRESENTATION_REALIZED_SAVINGS_CR,
  PRESENTATION_SPEND_DE_RISKED_CR,
  PRESENTATION_BASELINE_SUPPLIERS,
  PRESENTATION_BASELINE_MATERIAL_GROUPS,
  PRESENTATION_BASELINE_PLANTS,
  PRESENTATION_BASELINE_TRANSACTIONS,
  PRESENTATION_LOW_VALUE_POS_COUNT
} from '../../src/constants/executiveBriefPresentationConstants';

describe('Prompt 289 §13: Certified Financial & Operational Metrics Regression', () => {
  it('strictly preserves gross identified opportunity at ₹173.12 Cr', () => {
    expect(PRESENTATION_GROSS_OPPORTUNITY_CR).toBe(173.12);
  });

  it('strictly preserves overlap deductions at ₹62.80 Cr', () => {
    expect(PRESENTATION_OVERLAP_DEDUCTIONS_CR).toBe(62.80);
  });

  it('strictly preserves exclusions at ₹16.72 Cr', () => {
    expect(PRESENTATION_EXCLUSIONS_CR).toBe(16.72);
  });

  it('strictly preserves net defensible value pipeline at ₹93.60 Cr', () => {
    expect(PRESENTATION_NET_DEFENSIBLE_PIPELINE_CR).toBe(93.60);
  });

  it('strictly preserves net direct savings opportunity at ₹78.72 Cr', () => {
    expect(PRESENTATION_NET_DIRECT_SAVINGS_CR).toBe(78.72);
  });

  it('strictly preserves strategic market value at ₹14.88 Cr', () => {
    expect(PRESENTATION_STRATEGIC_MARKET_VALUE_CR).toBe(14.88);
  });

  it('strictly preserves validated savings at ₹47.90 Cr', () => {
    expect(PRESENTATION_VALIDATED_SAVINGS_CR).toBe(47.90);
  });

  it('strictly preserves realized savings at ₹68.00 Cr', () => {
    expect(PRESENTATION_REALIZED_SAVINGS_CR).toBe(68.00);
  });

  it('strictly preserves spend de-risked at ₹420 Cr', () => {
    expect(PRESENTATION_SPEND_DE_RISKED_CR).toBe(420.00);
  });

  it('strictly preserves supplier count at 974 suppliers', () => {
    expect(PRESENTATION_BASELINE_SUPPLIERS).toBe(974);
  });

  it('strictly preserves material group count at 256 material groups', () => {
    expect(PRESENTATION_BASELINE_MATERIAL_GROUPS).toBe(256);
  });

  it('strictly preserves plant count at 26 plants', () => {
    expect(PRESENTATION_BASELINE_PLANTS).toBe(26);
  });

  it('strictly preserves transaction count at 31,671 transactions', () => {
    expect(PRESENTATION_BASELINE_TRANSACTIONS).toBe(31671);
  });

  it('strictly preserves low-value PO count at 824 POs', () => {
    expect(PRESENTATION_LOW_VALUE_POS_COUNT).toBe(824);
  });

  it('verifies exact mathematical relationship of opportunity bridge', () => {
    const netDefensible = Number((PRESENTATION_GROSS_OPPORTUNITY_CR - PRESENTATION_OVERLAP_DEDUCTIONS_CR - PRESENTATION_EXCLUSIONS_CR).toFixed(2));
    expect(netDefensible).toBe(PRESENTATION_NET_DEFENSIBLE_PIPELINE_CR);

    const netDirect = Number((PRESENTATION_NET_DEFENSIBLE_PIPELINE_CR - PRESENTATION_STRATEGIC_MARKET_VALUE_CR).toFixed(2));
    expect(netDirect).toBe(PRESENTATION_NET_DIRECT_SAVINGS_CR);
  });
});
