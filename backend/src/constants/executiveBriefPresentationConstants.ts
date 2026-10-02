/**
 * Executive Brief Presentation Constants & Single Source of Truth Contract (Backend)
 * Strictly adheres to Prompt 280 (CFO/CEO Sales-Ready Edition - aiCEV by Procucev).
 *
 * Certified Authoritative Frozen Values:
 * Total Customer Spend: ₹5,920.35 Cr (April 2024 - March 2026, 24 Months)
 * Gross Identified Opportunity: ₹173.12 Cr
 * Overlap Deductions: ₹62.80 Cr
 * Exclusions: ₹16.72 Cr
 * Net Defensible Value Pipeline: ₹93.60 Cr
 * Net Direct Savings Opportunity: ₹78.72 Cr
 * Strategic Market Value: ₹14.88 Cr
 * Process Productivity: 20.0% PO effort reduction (824 low-value POs; ₹0.00 direct saving)
 * Cost Avoidance / Risk: ₹420.00 Cr spend de-risked (4 dual-source programs; NOT MONETIZED)
 * Validated Savings: ₹47.90 Cr
 * Realized Savings: ₹68.00 Cr
 */

import type {
  ExecutiveBriefPresentationContract,
  ExecutiveBriefValueClassification,
  PresentationKpiCard,
  ValueClassificationType
} from '../types/executiveBriefPresentation';

export const PRESENTATION_TOTAL_SPEND_CR = 5920.35;
export const PRESENTATION_TOTAL_SPEND_INR = 59203500000;
export const PRESENTATION_ADDRESSABLE_BASELINE_CR = 4931.00;
export const PRESENTATION_ADDRESSABLE_BASELINE_INR = 49310000000;

export const PRESENTATION_ANALYSIS_PERIOD = 'April 2024 - March 2026';
export const PRESENTATION_ANALYSIS_PERIOD_MONTHS = 24;

export const PRESENTATION_GROSS_OPPORTUNITY_CR = 173.12;
export const PRESENTATION_GROSS_OPPORTUNITY_INR = 1731200000;

export const PRESENTATION_OVERLAP_DEDUCTIONS_CR = 62.80;
export const PRESENTATION_OVERLAP_DEDUCTIONS_INR = 628000000;

export const PRESENTATION_EXCLUSIONS_CR = 16.72;
export const PRESENTATION_EXCLUSIONS_INR = 167200000;

export const PRESENTATION_NET_DEFENSIBLE_PIPELINE_CR = 93.60;
export const PRESENTATION_NET_DEFENSIBLE_PIPELINE_INR = 936000000;

export const PRESENTATION_NET_DIRECT_SAVINGS_CR = 78.72;
export const PRESENTATION_NET_DIRECT_SAVINGS_INR = 787200000;

export const PRESENTATION_STRATEGIC_MARKET_VALUE_CR = 14.88;
export const PRESENTATION_STRATEGIC_MARKET_VALUE_INR = 148800000;

export const PRESENTATION_PROCESS_PRODUCTIVITY_PCT = 20.0;
export const PRESENTATION_LOW_VALUE_POS_COUNT = 824;
export const PRESENTATION_DIRECT_PROCESS_SAVING_CR = 0.00;

export const PRESENTATION_SPEND_DE_RISKED_CR = 420.00;
export const PRESENTATION_DUAL_SOURCE_PROGRAMS = 4;
export const PRESENTATION_COST_AVOIDANCE_MONETIZED = false;

export const PRESENTATION_VALIDATED_SAVINGS_CR = 47.90;
export const PRESENTATION_VALIDATED_SAVINGS_INR = 479000000;

export const PRESENTATION_REALIZED_SAVINGS_CR = 68.00;
export const PRESENTATION_REALIZED_SAVINGS_INR = 680000000;

export const PRESENTATION_BASELINE_TRANSACTIONS = 31671;
export const PRESENTATION_BASELINE_SUPPLIERS = 974;
export const PRESENTATION_BASELINE_MATERIAL_GROUPS = 256;
export const PRESENTATION_BASELINE_PLANTS = 26;
export const PRESENTATION_BASELINE_TOTAL_POS = 15884;

export const PRESENTATION_BRANDING = {
  primaryBrand: 'PROCUCEV',
  productName: 'aiCEV',
  lockup: 'aiCEV by Procucev',
  reportTitle: 'Procurement Value Opportunity Assessment',
  reportSubtitle: 'Data-led procurement transformation and value discovery',
  confidentiality: 'Management Confidential - For Authorised Recipients Only',
  tagline: 'From Procurement Data to Decision to Value'
} as const;

export const PRESENTATION_VALUE_CLASSIFICATIONS: readonly ExecutiveBriefValueClassification[] = [
  {
    type: 'DIRECT_SAVINGS',
    label: 'Direct Savings Opportunity',
    valueFormatted: '₹78.72 Cr',
    numericCr: 78.72,
    isDirectSaving: true,
    monetizationStatus: 'MONETIZED_DIRECT',
    description: 'Defensible direct cost reduction across rate harmonization, volume pooling, and strategic tenders.'
  },
  {
    type: 'STRATEGIC_VALUE',
    label: 'Strategic Market Value',
    valueFormatted: '₹14.88 Cr',
    numericCr: 14.88,
    isDirectSaving: false,
    monetizationStatus: 'STRATEGIC_MARKET',
    description: 'Contract reset timing and market commodity movement upside; tracked separately from direct savings.'
  },
  {
    type: 'PROCESS_PRODUCTIVITY',
    label: 'Process Productivity',
    valueFormatted: '20% PO Effort Reduction',
    numericCr: null,
    isDirectSaving: false,
    monetizationStatus: 'PENDING_VALIDATION',
    description: 'Consolidation of 824 low-value POs; ₹0.00 direct saving until customer manpower baseline is validated.'
  },
  {
    type: 'COST_AVOIDANCE',
    label: 'Spend De-risked (Cost Avoidance)',
    valueFormatted: '₹420.00 Cr',
    numericCr: null,
    isDirectSaving: false,
    monetizationStatus: 'NOT_MONETIZED',
    description: '4 dual-source qualified programs mitigating single-source exposure; not monetized as direct savings.'
  },
  {
    type: 'VALIDATED_SAVINGS',
    label: 'Validated Savings',
    valueFormatted: '₹47.90 Cr',
    numericCr: 47.90,
    isDirectSaving: false,
    monetizationStatus: 'MONETIZED_DIRECT',
    description: 'Approved Wave 1 commercial initiatives with supplier pre-qualification and specification checks.'
  },
  {
    type: 'REALIZED_SAVINGS',
    label: 'Classified Realized Savings',
    valueFormatted: '₹68.00 Cr',
    numericCr: 68.00,
    isDirectSaving: false,
    monetizationStatus: 'MONETIZED_DIRECT',
    description: 'Separate realized-savings classification; not additive to Wave-1 opportunity.'
  }
] as const;

export const PRESENTATION_HERO_KPIS: readonly PresentationKpiCard[] = [
  {
    id: 'kpi-direct-savings',
    title: 'Direct Savings Opportunity',
    value: '₹78.72 Cr',
    subtitle: 'Defensible Direct Cost Reduction',
    classification: 'DIRECT_SAVINGS',
    accentColor: '#10B981',
    isHeroCard: true
  },
  {
    id: 'kpi-net-pipeline',
    title: 'Net Defensible Value Pipeline',
    value: '₹93.60 Cr',
    subtitle: 'Direct + Strategic Market Levers',
    classification: 'STRATEGIC_VALUE',
    accentColor: '#2563EB',
    isHeroCard: true
  },
  {
    id: 'kpi-strategic-value',
    title: 'Strategic Market Value',
    value: '₹14.88 Cr',
    subtitle: 'Commodity Timing & Index Contracting',
    classification: 'STRATEGIC_VALUE',
    accentColor: '#38BDF8'
  },
  {
    id: 'kpi-total-spend',
    title: 'Spend Evaluated',
    value: '₹5,920.35 Cr',
    subtitle: '31,671 Invoiced Records (24 Mo)',
    classification: 'DIRECT_SAVINGS',
    accentColor: '#64748B'
  }
] as const;

export const EXECUTIVE_BRIEF_PRESENTATION_CONTRACT: ExecutiveBriefPresentationContract = {
  totalCustomerSpendCr: PRESENTATION_TOTAL_SPEND_CR,
  totalCustomerSpendInr: PRESENTATION_TOTAL_SPEND_INR,
  addressableSpendCr: PRESENTATION_ADDRESSABLE_BASELINE_CR,
  addressableSpendInr: PRESENTATION_ADDRESSABLE_BASELINE_INR,
  analysisPeriod: PRESENTATION_ANALYSIS_PERIOD,
  analysisPeriodMonths: PRESENTATION_ANALYSIS_PERIOD_MONTHS,
  grossOpportunityCr: PRESENTATION_GROSS_OPPORTUNITY_CR,
  grossOpportunityInr: PRESENTATION_GROSS_OPPORTUNITY_INR,
  overlapDeductionsCr: PRESENTATION_OVERLAP_DEDUCTIONS_CR,
  overlapDeductionsInr: PRESENTATION_OVERLAP_DEDUCTIONS_INR,
  exclusionsCr: PRESENTATION_EXCLUSIONS_CR,
  exclusionsInr: PRESENTATION_EXCLUSIONS_INR,
  netDefensiblePipelineCr: PRESENTATION_NET_DEFENSIBLE_PIPELINE_CR,
  netDefensiblePipelineInr: PRESENTATION_NET_DEFENSIBLE_PIPELINE_INR,
  netDirectSavingsCr: PRESENTATION_NET_DIRECT_SAVINGS_CR,
  netDirectSavingsInr: PRESENTATION_NET_DIRECT_SAVINGS_INR,
  strategicMarketValueCr: PRESENTATION_STRATEGIC_MARKET_VALUE_CR,
  strategicMarketValueInr: PRESENTATION_STRATEGIC_MARKET_VALUE_INR,
  processProductivityPct: PRESENTATION_PROCESS_PRODUCTIVITY_PCT,
  lowValuePOsCount: PRESENTATION_LOW_VALUE_POS_COUNT,
  directProcessSavingCr: PRESENTATION_DIRECT_PROCESS_SAVING_CR,
  spendDeRiskedCr: PRESENTATION_SPEND_DE_RISKED_CR,
  dualSourceProgramsCount: PRESENTATION_DUAL_SOURCE_PROGRAMS,
  validatedSavingsCr: PRESENTATION_VALIDATED_SAVINGS_CR,
  validatedSavingsInr: PRESENTATION_VALIDATED_SAVINGS_INR,
  realizedSavingsCr: PRESENTATION_REALIZED_SAVINGS_CR,
  realizedSavingsInr: PRESENTATION_REALIZED_SAVINGS_INR,
  baselineTransactions: PRESENTATION_BASELINE_TRANSACTIONS,
  baselineSuppliers: PRESENTATION_BASELINE_SUPPLIERS,
  baselineMaterialGroups: PRESENTATION_BASELINE_MATERIAL_GROUPS,
  baselinePlants: PRESENTATION_BASELINE_PLANTS,
  baselineTotalPOs: PRESENTATION_BASELINE_TOTAL_POS,
  classifications: PRESENTATION_VALUE_CLASSIFICATIONS
};

export const EXECUTIVE_BRIEF_PRESENTATION_CONSTANTS = EXECUTIVE_BRIEF_PRESENTATION_CONTRACT;

/**
 * Validation guard: returns true only if classification represents direct monetized savings.
 * Prevents accidental summation of strategic value, process productivity, or risk avoidance into direct savings.
 */
export function isAdditiveDirectSaving(type: ValueClassificationType): boolean {
  return type === 'DIRECT_SAVINGS';
}

/**
 * Validates that mathematical relationship between Gross, Overlaps, Exclusions, and Net matches exactly.
 */
export function validateWaterfallMath(): boolean {
  const calculatedNet =
    PRESENTATION_GROSS_OPPORTUNITY_CR -
    PRESENTATION_OVERLAP_DEDUCTIONS_CR -
    PRESENTATION_EXCLUSIONS_CR;
  return Math.abs(calculatedNet - PRESENTATION_NET_DEFENSIBLE_PIPELINE_CR) < 0.001;
}

/**
 * Validates that Net Defensible Pipeline equals Direct Savings + Strategic Market Value.
 */
export function validateNetComposition(): boolean {
  const sum =
    PRESENTATION_NET_DIRECT_SAVINGS_CR +
    PRESENTATION_STRATEGIC_MARKET_VALUE_CR;
  return Math.abs(sum - PRESENTATION_NET_DEFENSIBLE_PIPELINE_CR) < 0.001;
}

export * from './executiveBriefLayoutConstants';


