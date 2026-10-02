/**
 * Executive Brief Presentation Constants & Contract Unit Tests (Backend)
 * Strictly verifies Prompt 280 (CFO/CEO Sales-Ready Edition — aiCEV by Procucev).
 */

import { describe, it, expect } from 'vitest';
import {
  PRESENTATION_TOTAL_SPEND_CR,
  PRESENTATION_TOTAL_SPEND_INR,
  PRESENTATION_ADDRESSABLE_BASELINE_CR,
  PRESENTATION_ANALYSIS_PERIOD,
  PRESENTATION_ANALYSIS_PERIOD_MONTHS,
  PRESENTATION_GROSS_OPPORTUNITY_CR,
  PRESENTATION_OVERLAP_DEDUCTIONS_CR,
  PRESENTATION_EXCLUSIONS_CR,
  PRESENTATION_NET_DEFENSIBLE_PIPELINE_CR,
  PRESENTATION_NET_DIRECT_SAVINGS_CR,
  PRESENTATION_STRATEGIC_MARKET_VALUE_CR,
  PRESENTATION_PROCESS_PRODUCTIVITY_PCT,
  PRESENTATION_LOW_VALUE_POS_COUNT,
  PRESENTATION_DIRECT_PROCESS_SAVING_CR,
  PRESENTATION_SPEND_DE_RISKED_CR,
  PRESENTATION_DUAL_SOURCE_PROGRAMS,
  PRESENTATION_COST_AVOIDANCE_MONETIZED,
  PRESENTATION_VALIDATED_SAVINGS_CR,
  PRESENTATION_REALIZED_SAVINGS_CR,
  PRESENTATION_BASELINE_TRANSACTIONS,
  PRESENTATION_BASELINE_SUPPLIERS,
  PRESENTATION_BASELINE_MATERIAL_GROUPS,
  PRESENTATION_BASELINE_PLANTS,
  PRESENTATION_BASELINE_TOTAL_POS,
  PRESENTATION_BRANDING,
  PRESENTATION_VALUE_CLASSIFICATIONS,
  PRESENTATION_HERO_KPIS,
  EXECUTIVE_BRIEF_PRESENTATION_CONTRACT,
  isAdditiveDirectSaving,
  validateWaterfallMath,
  validateNetComposition
} from '../../src/constants/executiveBriefPresentationConstants';

describe('Executive Brief Presentation Contract & Classification Tests (Prompt 280)', () => {
  it('1. Authoritative financial constants match certified frozen values', () => {
    expect(PRESENTATION_TOTAL_SPEND_CR).toBe(5920.35);
    expect(PRESENTATION_TOTAL_SPEND_INR).toBe(59203500000);
    expect(PRESENTATION_ADDRESSABLE_BASELINE_CR).toBe(4931.00);
    expect(PRESENTATION_ANALYSIS_PERIOD).toContain('April 2024');
    expect(PRESENTATION_ANALYSIS_PERIOD).toContain('March 2026');
    expect(PRESENTATION_ANALYSIS_PERIOD_MONTHS).toBe(24);
    expect(PRESENTATION_GROSS_OPPORTUNITY_CR).toBe(173.12);
    expect(PRESENTATION_OVERLAP_DEDUCTIONS_CR).toBe(62.80);
    expect(PRESENTATION_EXCLUSIONS_CR).toBe(16.72);
    expect(PRESENTATION_NET_DEFENSIBLE_PIPELINE_CR).toBe(93.60);
    expect(PRESENTATION_NET_DIRECT_SAVINGS_CR).toBe(78.72);
    expect(PRESENTATION_STRATEGIC_MARKET_VALUE_CR).toBe(14.88);
    expect(PRESENTATION_PROCESS_PRODUCTIVITY_PCT).toBe(20.0);
    expect(PRESENTATION_LOW_VALUE_POS_COUNT).toBe(824);
    expect(PRESENTATION_DIRECT_PROCESS_SAVING_CR).toBe(0.00);
    expect(PRESENTATION_SPEND_DE_RISKED_CR).toBe(420.00);
    expect(PRESENTATION_DUAL_SOURCE_PROGRAMS).toBe(4);
    expect(PRESENTATION_COST_AVOIDANCE_MONETIZED).toBe(false);
    expect(PRESENTATION_VALIDATED_SAVINGS_CR).toBe(47.90);
    expect(PRESENTATION_REALIZED_SAVINGS_CR).toBe(68.00);
  });

  it('2. Certified baseline operational counts match forensic ledger', () => {
    expect(PRESENTATION_BASELINE_TRANSACTIONS).toBe(31671);
    expect(PRESENTATION_BASELINE_SUPPLIERS).toBe(974);
    expect(PRESENTATION_BASELINE_MATERIAL_GROUPS).toBe(256);
    expect(PRESENTATION_BASELINE_PLANTS).toBe(26);
    expect(PRESENTATION_BASELINE_TOTAL_POS).toBe(15884);
  });

  it('3. Mathematical waterfall relationships hold with zero variance', () => {
    expect(validateWaterfallMath()).toBe(true);
    expect(validateNetComposition()).toBe(true);

    const calculatedNet =
      PRESENTATION_GROSS_OPPORTUNITY_CR -
      PRESENTATION_OVERLAP_DEDUCTIONS_CR -
      PRESENTATION_EXCLUSIONS_CR;
    expect(calculatedNet).toBeCloseTo(93.60, 2);

    const sum =
      PRESENTATION_NET_DIRECT_SAVINGS_CR +
      PRESENTATION_STRATEGIC_MARKET_VALUE_CR;
    expect(sum).toBeCloseTo(93.60, 2);
  });

  it('4. Classifications strictly isolate direct savings from non-additive categories', () => {
    expect(isAdditiveDirectSaving('DIRECT_SAVINGS')).toBe(true);
    expect(isAdditiveDirectSaving('STRATEGIC_VALUE')).toBe(false);
    expect(isAdditiveDirectSaving('PROCESS_PRODUCTIVITY')).toBe(false);
    expect(isAdditiveDirectSaving('COST_AVOIDANCE')).toBe(false);
    expect(isAdditiveDirectSaving('VALIDATED_SAVINGS')).toBe(false);
    expect(isAdditiveDirectSaving('REALIZED_SAVINGS')).toBe(false);

    // Verify each classification object
    const directSaving = PRESENTATION_VALUE_CLASSIFICATIONS.find((c) => c.type === 'DIRECT_SAVINGS');
    expect(directSaving?.isDirectSaving).toBe(true);
    expect(directSaving?.numericCr).toBe(78.72);

    const strategicVal = PRESENTATION_VALUE_CLASSIFICATIONS.find((c) => c.type === 'STRATEGIC_VALUE');
    expect(strategicVal?.isDirectSaving).toBe(false);
    expect(strategicVal?.numericCr).toBe(14.88);

    const processProd = PRESENTATION_VALUE_CLASSIFICATIONS.find((c) => c.type === 'PROCESS_PRODUCTIVITY');
    expect(processProd?.isDirectSaving).toBe(false);
    expect(processProd?.numericCr).toBeNull();

    const costAvoidance = PRESENTATION_VALUE_CLASSIFICATIONS.find((c) => c.type === 'COST_AVOIDANCE');
    expect(costAvoidance?.isDirectSaving).toBe(false);
    expect(costAvoidance?.numericCr).toBeNull();
  });

  it('5. Branding and Hero KPI definitions adhere to aiCEV by Procucev guidelines', () => {
    expect(PRESENTATION_BRANDING.primaryBrand).toBe('PROCUCEV');
    expect(PRESENTATION_BRANDING.productName).toBe('aiCEV');
    expect(PRESENTATION_BRANDING.lockup).toBe('aiCEV by Procucev');

    expect(PRESENTATION_HERO_KPIS).toHaveLength(4);
    expect(PRESENTATION_HERO_KPIS[0].value).toBe('₹78.72 Cr');
    expect(PRESENTATION_HERO_KPIS[1].value).toBe('₹93.60 Cr');
    expect(PRESENTATION_HERO_KPIS[2].value).toBe('₹14.88 Cr');
    expect(PRESENTATION_HERO_KPIS[3].value).toBe('₹5,920.35 Cr');
  });

  it('6. Full presentation contract object is properly populated', () => {
    expect(EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.totalCustomerSpendCr).toBe(5920.35);
    expect(EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.netDirectSavingsCr).toBe(78.72);
    expect(EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.strategicMarketValueCr).toBe(14.88);
    expect(EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.classifications).toHaveLength(6);
  });
});
