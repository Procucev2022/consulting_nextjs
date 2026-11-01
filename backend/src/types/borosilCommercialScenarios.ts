/**
 * Borosil Commercial Scenarios and Transformation Levers Types
 * Strictly isolated type definitions for Part 2, Part 3, Part 4, and Part 5.
 * Rule 9: Dedicated types file, no inline declarations.
 */

export interface CommercialScenarioCase {
  improvementPct: number;
  financialOutcomeInr: number;
  financialOutcomeCr: number;
  description: string;
}

export interface CommercialScenarioItem {
  scenarioId: string;
  leverNumber: 1 | 2 | 3;
  leverName: string;
  scenarioName: string;
  scenarioLabel: 'Scenario A' | 'Scenario B';
  category: string;
  eligibleSpendInr: number;
  eligibleSpendCr: number;
  currentSituation: string;
  proposedSourcingIntervention: string;
  calculationFormula: string;
  conservativeCase: CommercialScenarioCase;
  higherAchievementCase: CommercialScenarioCase;
  commercialDependencies: string[];
  implementationTimeline: string;
  validationRequirements: string[];
  sourceTransactionReferences: string[];
  supplierEvidence: string;
  assumptionStatus: string;
  validationStatus: string;
}

export interface CalculationMechanismStep {
  stepNumber: number;
  stepName: string;
  description: string;
  keyOutputs: string[];
}

export interface SourcingLeverCalculationMechanism {
  leverNumber: 1 | 2 | 3;
  leverName: string;
  modelledNetOpportunityInr: number;
  modelledNetOpportunityCr: number;
  governanceStatus: string;
  formula: string;
  visualFlow: string[];
  steps: CalculationMechanismStep[];
}

export type SupplierQualificationClassification =
  | 'EXISTING_APPROVED_HISTORICAL'
  | 'POTENTIAL_ALTERNATIVE_QUALIFICATION_REQUIRED'
  | 'STRATEGIC_MANUFACTURER_CANDIDATE_VERIFICATION_REQUIRED';

export interface AlternativeSupplierEvaluationItem {
  materialCategory: string;
  materialDescription: string;
  currentSupplier: string;
  potentialAlternative: string;
  entityClassification: 'MANUFACTURER' | 'PRIMARY_PRODUCER' | 'DISTRIBUTOR' | 'CONVERTER' | 'TRADER';
  qualificationStatus: SupplierQualificationClassification;
  qualificationStatusLabel: string;
  geographicProximity: string;
  capacityDeliveryCapability: string;
  qualityCertifications: string;
  indicativeCompetitiveness: string;
  commercialPaymentTerms: string;
  supplyContinuityRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  evaluationRecommendation: string;
}

export interface ProcurementTransformationLeverItem {
  leverIndex: number;
  leverName: string;
  whatProcucevAnalyzes: string;
  proposedIntervention: string;
  expectedBusinessBenefit: string;
  requiredData: string;
  financialClassification: 'FINANCIAL' | 'NON_FINANCIAL' | 'WORKING_CAPITAL_PROCESS';
}

export interface BorosilCommercialScenarioRegisterMetadata {
  assessmentId: string;
  customerName: string;
  generatedAt: string;
  canonicalBaselineSpendInr: number;
  canonicalBaselineSpendCr: number;
  evaluatedDiagnosticSpendInr: number;
  evaluatedDiagnosticSpendCr: number;
  qualifiedExecutionSpendInr: number;
  qualifiedExecutionSpendCr: number;
  modelledOpportunityExcludingLever2Inr: number;
  modelledOpportunityExcludingLever2Cr: number;
  disclaimer: string;
  totalScenariosCount: number;
}

export interface BorosilCommercialScenarioRegister {
  metadata: BorosilCommercialScenarioRegisterMetadata;
  scenarios: CommercialScenarioItem[];
  alternativeSuppliers: AlternativeSupplierEvaluationItem[];
  transformationLevers: ProcurementTransformationLeverItem[];
}
