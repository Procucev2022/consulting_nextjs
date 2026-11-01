import { describe, it, expect } from 'vitest';
import { PROCUCEV_CALCULATION_MECHANISMS } from '../../src/constants/borosilCalculationMechanisms';
import { BOROSIL_COMMERCIAL_SCENARIOS } from '../../src/constants/borosilCommercialScenarios';
import {
  BOROSIL_ALTERNATIVE_SUPPLIERS,
  BOROSIL_TRANSFORMATION_LEVERS
} from '../../src/constants/borosilAlternativeSuppliers';
import {
  BOROSIL_SLIDE_GROUPS
} from '../../src/constants/borosilExecutiveBriefSlideGroups';
import {
  BOROSIL_BRIEF_METADATA,
  BOROSIL_SUMMARY_CARDS,
  BOROSIL_CLIENT_PROFILE,
  BOROSIL_VALIDATION_CHECKLIST
} from '../../src/constants/borosilExecutiveBriefUiConstants';

describe('Borosil Commercial Scenarios and Presentation Constants (Frontend)', () => {
  it('validates Part 2 calculation mechanisms structure and figures', () => {
    expect(PROCUCEV_CALCULATION_MECHANISMS).toHaveLength(3);
    const [l1, l2, l3] = PROCUCEV_CALCULATION_MECHANISMS;

    expect(l1.leverNumber).toBe(1);
    expect(l1.modelledNetOpportunityCr).toBe(73.769);
    expect(l1.steps).toHaveLength(6);
    expect(l1.visualFlow).toHaveLength(7);

    expect(l2.leverNumber).toBe(2);
    expect(l2.modelledNetOpportunityCr).toBe(11.978);
    expect(l2.steps).toHaveLength(6);
    expect(l2.visualFlow).toHaveLength(7);

    expect(l3.leverNumber).toBe(3);
    expect(l3.modelledNetOpportunityCr).toBe(1.352);
    expect(l3.steps).toHaveLength(6);
    expect(l3.visualFlow).toHaveLength(8);
  });

  it('validates Part 3 commercial scenarios structure and figures', () => {
    expect(BOROSIL_COMMERCIAL_SCENARIOS).toHaveLength(6);

    const l1Scenarios = BOROSIL_COMMERCIAL_SCENARIOS.filter((s) => s.leverNumber === 1);
    const l2Scenarios = BOROSIL_COMMERCIAL_SCENARIOS.filter((s) => s.leverNumber === 2);
    const l3Scenarios = BOROSIL_COMMERCIAL_SCENARIOS.filter((s) => s.leverNumber === 3);

    expect(l1Scenarios).toHaveLength(2);
    expect(l2Scenarios).toHaveLength(2);
    expect(l3Scenarios).toHaveLength(2);

    BOROSIL_COMMERCIAL_SCENARIOS.forEach((scenario) => {
      expect(scenario.scenarioId).toBeDefined();
      expect(scenario.sourceTransactionReferences.length).toBeGreaterThan(0);
      expect(scenario.commercialDependencies.length).toBeGreaterThan(0);
      expect(scenario.validationRequirements.length).toBeGreaterThan(0);
      expect(scenario.supplierEvidence).toBeDefined();

      if (scenario.validationStatus === 'UNQUANTIFIED') {
        expect(scenario.eligibleSpendInr).toBe(0);
        expect(scenario.eligibleSpendCr).toBe(0);
        expect(scenario.conservativeCase.financialOutcomeCr).toBe(0);
        expect(scenario.higherAchievementCase.financialOutcomeCr).toBe(0);
      } else {
        expect(scenario.eligibleSpendInr).toBeGreaterThan(0);
        expect(scenario.eligibleSpendCr).toBeGreaterThan(0);
        expect(scenario.conservativeCase.improvementPct).toBeGreaterThan(0);
        expect(scenario.conservativeCase.financialOutcomeInr).toBeGreaterThan(0);
        expect(scenario.conservativeCase.financialOutcomeCr).toBeGreaterThan(0);
        expect(scenario.higherAchievementCase.improvementPct).toBeGreaterThan(scenario.conservativeCase.improvementPct);
        expect(scenario.higherAchievementCase.financialOutcomeCr).toBeGreaterThan(scenario.conservativeCase.financialOutcomeCr);
      }
    });
  });

  it('validates Part 4 alternative suppliers and Part 5 transformation levers', () => {
    expect(BOROSIL_ALTERNATIVE_SUPPLIERS.length).toBeGreaterThanOrEqual(8);
    BOROSIL_ALTERNATIVE_SUPPLIERS.forEach((supplier) => {
      expect(supplier.materialCategory).toBeDefined();
      expect(supplier.currentSupplier).toBeDefined();
      expect(supplier.potentialAlternative).toBeDefined();
      expect(['EXISTING_APPROVED_HISTORICAL', 'POTENTIAL_ALTERNATIVE_QUALIFICATION_REQUIRED', 'STRATEGIC_MANUFACTURER_CANDIDATE_VERIFICATION_REQUIRED'])
        .toContain(supplier.qualificationStatus);
      expect(supplier.qualityCertifications).toBeDefined();
      expect(supplier.indicativeCompetitiveness).toBeDefined();
      expect(supplier.evaluationRecommendation).toBeDefined();
    });

    expect(BOROSIL_TRANSFORMATION_LEVERS).toHaveLength(10);
    BOROSIL_TRANSFORMATION_LEVERS.forEach((lever) => {
      expect(lever.leverIndex).toBeGreaterThanOrEqual(1);
      expect(lever.leverName).toBeDefined();
      expect(lever.whatProcucevAnalyzes).toBeDefined();
      expect(lever.proposedIntervention).toBeDefined();
      expect(lever.expectedBusinessBenefit).toBeDefined();
      expect(lever.requiredData).toBeDefined();
      expect(['FINANCIAL', 'NON_FINANCIAL', 'WORKING_CAPITAL_PROCESS']).toContain(lever.financialClassification);
    });
  });

  it('validates UI constants and slide groups', () => {
    expect(BOROSIL_BRIEF_METADATA.client).toBe('Borosil Ltd');
    expect(BOROSIL_CLIENT_PROFILE.clientName).toBe('Borosil Ltd');
    expect(BOROSIL_VALIDATION_CHECKLIST.financialReconciliation).toBe(true);
    expect(BOROSIL_SUMMARY_CARDS.length).toBeGreaterThan(0);
    expect(BOROSIL_SLIDE_GROUPS).toHaveLength(8);
  });
});

