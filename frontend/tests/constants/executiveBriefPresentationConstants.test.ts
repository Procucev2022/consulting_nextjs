/**
 * Executive Brief Presentation Constants & Contract Unit Tests (Frontend)
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

describe('Frontend Executive Brief Presentation Contract & Classification Tests (Prompt 280 / Borosil)', () => {
  it('1. Authoritative financial constants match certified frozen values', () => {
    expect(PRESENTATION_TOTAL_SPEND_CR).toBe(556.535);
    expect(PRESENTATION_TOTAL_SPEND_INR).toBe(5565346000);
    expect(PRESENTATION_ADDRESSABLE_BASELINE_CR).toBe(168.658);
    expect(PRESENTATION_ANALYSIS_PERIOD).toContain('April 2026');
    expect(PRESENTATION_ANALYSIS_PERIOD).toContain('October 2026');
    expect(PRESENTATION_ANALYSIS_PERIOD_MONTHS).toBe(7);
    expect(PRESENTATION_GROSS_OPPORTUNITY_CR).toBe(117.512);
    expect(PRESENTATION_OVERLAP_DEDUCTIONS_CR).toBe(30.412);
    expect(PRESENTATION_EXCLUSIONS_CR).toBe(0.00);
    expect(PRESENTATION_NET_DEFENSIBLE_PIPELINE_CR).toBe(87.100);
    expect(PRESENTATION_NET_DIRECT_SAVINGS_CR).toBe(87.100);
    expect(PRESENTATION_STRATEGIC_MARKET_VALUE_CR).toBe(0.00);
    expect(PRESENTATION_PROCESS_PRODUCTIVITY_PCT).toBe(0.0);
    expect(PRESENTATION_LOW_VALUE_POS_COUNT).toBe(0);
    expect(PRESENTATION_DIRECT_PROCESS_SAVING_CR).toBe(0.00);
    expect(PRESENTATION_SPEND_DE_RISKED_CR).toBe(0.00);
    expect(PRESENTATION_DUAL_SOURCE_PROGRAMS).toBe(0);
    expect(PRESENTATION_COST_AVOIDANCE_MONETIZED).toBe(false);
    expect(PRESENTATION_VALIDATED_SAVINGS_CR).toBe(75.121);
    expect(PRESENTATION_REALIZED_SAVINGS_CR).toBe(0.00);
  });

  it('2. Certified baseline operational counts match forensic ledger', () => {
    expect(PRESENTATION_BASELINE_TRANSACTIONS).toBe(27777);
    expect(PRESENTATION_BASELINE_SUPPLIERS).toBe(1537);
    expect(PRESENTATION_BASELINE_MATERIAL_GROUPS).toBe(133);
    expect(PRESENTATION_BASELINE_PLANTS).toBe(3);
    expect(PRESENTATION_BASELINE_TOTAL_POS).toBe(27777);
  });

  it('3. Mathematical waterfall relationships hold with zero variance', () => {
    expect(validateWaterfallMath()).toBe(true);
    expect(validateNetComposition()).toBe(true);

    const calculatedNet =
      PRESENTATION_GROSS_OPPORTUNITY_CR -
      PRESENTATION_OVERLAP_DEDUCTIONS_CR -
      PRESENTATION_EXCLUSIONS_CR;
    expect(calculatedNet).toBeCloseTo(87.100, 3);

    const sum =
      PRESENTATION_NET_DIRECT_SAVINGS_CR +
      PRESENTATION_STRATEGIC_MARKET_VALUE_CR;
    expect(sum).toBeCloseTo(87.100, 3);
  });

  it('4. Classifications strictly isolate direct savings from non-additive categories', () => {
    expect(isAdditiveDirectSaving('DIRECT_SAVINGS')).toBe(true);
    expect(isAdditiveDirectSaving('STRATEGIC_VALUE')).toBe(false);
    expect(isAdditiveDirectSaving('PROCESS_PRODUCTIVITY')).toBe(false);
    expect(isAdditiveDirectSaving('COST_AVOIDANCE')).toBe(false);
    expect(isAdditiveDirectSaving('VALIDATED_SAVINGS')).toBe(false);
    expect(isAdditiveDirectSaving('REALIZED_SAVINGS')).toBe(false);

    const directSaving = PRESENTATION_VALUE_CLASSIFICATIONS.find((c) => c.type === 'DIRECT_SAVINGS');
    expect(directSaving?.isDirectSaving).toBe(true);
    expect(directSaving?.numericCr).toBe(87.100);

    const strategicVal = PRESENTATION_VALUE_CLASSIFICATIONS.find((c) => c.type === 'STRATEGIC_VALUE');
    expect(strategicVal?.isDirectSaving).toBe(false);
    expect(strategicVal?.numericCr).toBe(0.00);
  });

  it('5. Branding and Hero KPI definitions adhere to aiCEV by Procucev guidelines', () => {
    expect(PRESENTATION_BRANDING.primaryBrand).toBe('PROCUCEV');
    expect(PRESENTATION_BRANDING.productName).toBe('aiCEV');
    expect(PRESENTATION_BRANDING.lockup).toBe('aiCEV by Procucev');
    expect(PRESENTATION_BRANDING.logoSrc).toBe('/images/aicev-logo.png');

    expect(PRESENTATION_HERO_KPIS).toHaveLength(4);
    expect(PRESENTATION_HERO_KPIS[0].value).toBe('₹87.100 Cr');
    expect(PRESENTATION_HERO_KPIS[1].value).toBe('₹75.121 Cr');
    expect(PRESENTATION_HERO_KPIS[2].value).toBe('₹12.081 Cr');
    expect(PRESENTATION_HERO_KPIS[3].value).toBe('₹556.535 Cr');
  });

  it('6. Full presentation contract object is properly populated', () => {
    expect(EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.totalCustomerSpendCr).toBe(556.535);
    expect(EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.netDirectSavingsCr).toBe(87.100);
    expect(EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.strategicMarketValueCr).toBe(0.00);
    expect(EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.classifications).toHaveLength(6);
  });
});
