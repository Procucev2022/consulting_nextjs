/**
 * Executive Brief Presentation Constants & Single Source of Truth Contract (Frontend)
 * Strictly adheres to Prompt 280 (CFO/CEO Sales-Ready Edition - aiCEV by Procucev).
 */

import type {
  ExecutiveBriefPresentationContract,
  ExecutiveBriefPresentationValueClassification,
  PresentationKpiCard,
  ValueClassificationType
} from '../types/executiveBriefPresentation';

export const PRESENTATION_TOTAL_SPEND_CR = 556.535;
export const PRESENTATION_TOTAL_SPEND_INR = 5565346000;
export const PRESENTATION_ADDRESSABLE_BASELINE_CR = 168.658;
export const PRESENTATION_ADDRESSABLE_BASELINE_INR = 1686580000;

export const PRESENTATION_ANALYSIS_PERIOD = '1 April 2026 to 22 October 2026 (FY2026-27 YTD, 205 days)';
export const PRESENTATION_ANALYSIS_PERIOD_MONTHS = 7;

export const PRESENTATION_GROSS_OPPORTUNITY_CR = 117.512;
export const PRESENTATION_GROSS_OPPORTUNITY_INR = 1175116632;

export const PRESENTATION_OVERLAP_DEDUCTIONS_CR = 30.412;
export const PRESENTATION_OVERLAP_DEDUCTIONS_INR = 304119498;

export const PRESENTATION_EXCLUSIONS_CR = 0.00;
export const PRESENTATION_EXCLUSIONS_INR = 0;

export const PRESENTATION_NET_DEFENSIBLE_PIPELINE_CR = 87.100;
export const PRESENTATION_NET_DEFENSIBLE_PIPELINE_INR = 870997134;

export const PRESENTATION_NET_DIRECT_SAVINGS_CR = 87.100;
export const PRESENTATION_NET_DIRECT_SAVINGS_INR = 870997134;

export const PRESENTATION_STRATEGIC_MARKET_VALUE_CR = 0.00;
export const PRESENTATION_STRATEGIC_MARKET_VALUE_INR = 0;

export const PRESENTATION_PROCESS_PRODUCTIVITY_PCT = 0.0;
export const PRESENTATION_LOW_VALUE_POS_COUNT = 0;
export const PRESENTATION_DIRECT_PROCESS_SAVING_CR = 0.00;

export const PRESENTATION_SPEND_DE_RISKED_CR = 0.00;
export const PRESENTATION_DUAL_SOURCE_PROGRAMS = 0;
export const PRESENTATION_COST_AVOIDANCE_MONETIZED = false;

export const PRESENTATION_VALIDATED_SAVINGS_CR = 75.121;
export const PRESENTATION_VALIDATED_SAVINGS_INR = 751213739;

export const PRESENTATION_REALIZED_SAVINGS_CR = 0.00;
export const PRESENTATION_REALIZED_SAVINGS_INR = 0;

export const PRESENTATION_BASELINE_TRANSACTIONS = 27777;
export const PRESENTATION_BASELINE_SUPPLIERS = 1537;
export const PRESENTATION_BASELINE_MATERIAL_GROUPS = 133;
export const PRESENTATION_BASELINE_PLANTS = 3;
export const PRESENTATION_BASELINE_TOTAL_POS = 27777;

export const PRESENTATION_BRANDING = {
  primaryBrand: 'PROCUCEV',
  productName: 'aiCEV',
  lockup: 'aiCEV by Procucev',
  logoSrc: '/images/aicev-logo.png',
  procucevLogoSrc: '/images/procucev-logo.jpg',
  reportTitle: 'Procurement Value Opportunity Assessment',
  reportSubtitle: 'Data-led procurement transformation and value discovery',
  confidentiality: 'Management Confidential - For Authorised Recipients Only',
  tagline: 'From Procurement Data to Decision to Value'
} as const;

export const PRESENTATION_VALUE_CLASSIFICATIONS: readonly ExecutiveBriefPresentationValueClassification[] = [
  {
    type: 'DIRECT_SAVINGS',
    label: 'Direct Net Sourcing Opportunity',
    valueFormatted: '₹87.100 Cr',
    numericCr: 87.100,
    isDirectSaving: true,
    monetizationStatus: 'MONETIZED_DIRECT',
    description: 'Deduplicated net opportunity across Strategic Sourcing (₹73.769 Cr), Vendor Consolidation (₹11.978 Cr), and E-Auction (₹1.352 Cr).'
  },
  {
    type: 'STRATEGIC_VALUE',
    label: 'Strategic Market Value',
    valueFormatted: '₹0.00 Cr',
    numericCr: 0.0,
    isDirectSaving: false,
    monetizationStatus: 'STRATEGIC_MARKET',
    description: 'Module 3 benchmark contribution formally closed at ₹0.00 Cr (0% coverage).'
  },
  {
    type: 'PROCESS_PRODUCTIVITY',
    label: 'Process Productivity',
    valueFormatted: 'Operational Baseline',
    numericCr: null,
    isDirectSaving: false,
    monetizationStatus: 'NOT_MONETIZED',
    description: 'PO frequency reduction non-monetized to protect CFO trust.'
  },
  {
    type: 'COST_AVOIDANCE',
    label: 'Cost Avoidance / Risk',
    valueFormatted: 'Supply Security Governance',
    numericCr: null,
    isDirectSaving: false,
    monetizationStatus: 'NOT_MONETIZED',
    description: 'Supplier diversification and alternate raw material qualification; non-monetized.'
  },
  {
    type: 'VALIDATED_SAVINGS',
    label: 'Modelled Opportunity Excluding Lever 2',
    valueFormatted: '₹75.121 Cr',
    numericCr: 75.121,
    isDirectSaving: false,
    monetizationStatus: 'MONETIZED_DIRECT',
    description: 'Empirically evidenced sourcing opportunity across Levers 1 & 3. Excludes Lever 2 held in governance reserve.'
  },
  {
    type: 'REALIZED_SAVINGS',
    label: 'Realized Savings',
    valueFormatted: '₹0.00 Cr',
    numericCr: 0.0,
    isDirectSaving: false,
    monetizationStatus: 'MONETIZED_DIRECT',
    description: 'Realized savings zero until contract deployment and audited invoice reconciliation.'
  }
] as const;

export const PRESENTATION_HERO_KPIS: readonly PresentationKpiCard[] = [
  {
    id: 'kpi-net-pipeline',
    title: 'Net Modelled Opportunity',
    value: '₹87.100 Cr',
    subtitle: 'Deduplicated Sourcing Levers',
    classification: 'DIRECT_SAVINGS',
    accentColor: '#10B981',
    isHeroCard: true
  },
  {
    id: 'kpi-validated-savings',
    title: 'Modelled Opportunity Excluding Lever 2',
    value: '₹75.121 Cr',
    subtitle: 'Opportunity Identified for Commercial Validation',
    classification: 'VALIDATED_SAVINGS',
    accentColor: '#2563EB',
    isHeroCard: true
  },
  {
    id: 'kpi-vendor-consolidation',
    title: 'Vendor Consolidation Spend',
    value: '₹12.081 Cr',
    subtitle: 'Under Commercial Validation',
    classification: 'STRATEGIC_VALUE',
    accentColor: '#F59E0B'
  },
  {
    id: 'kpi-total-spend',
    title: 'Evaluated Spend Baseline',
    value: '₹556.535 Cr',
    subtitle: '27,777 Invoiced Records (3 Plants)',
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

export const DEMO_ARCHETYPE_PRESENTATION_CONTRACT: ExecutiveBriefPresentationContract = {
  ...EXECUTIVE_BRIEF_PRESENTATION_CONTRACT
};

export {
  ABC_TEXTILE_VALUE_CLASSIFICATIONS,
  ABC_TEXTILE_PRESENTATION_CONTRACT,
  BOROSIL_VALUE_CLASSIFICATIONS,
  BOROSIL_PRESENTATION_CONTRACT
} from './customerBriefPresentationConstants';

import {
  ABC_TEXTILE_PRESENTATION_CONTRACT,
  BOROSIL_PRESENTATION_CONTRACT
} from './customerBriefPresentationConstants';

export function isBorosilAssessment(clientNameOrAssessmentId?: string): boolean {
  if (!clientNameOrAssessmentId) return false;
  const clean = clientNameOrAssessmentId.trim().toLowerCase();
  return (
    clean.includes('borosil') ||
    clean === 'aic-2026-0002' ||
    clean === 'cust-2026-0002' ||
    (clean.includes('0002') && !clean.includes('abc') && !clean.includes('textile'))
  );
}

export function isCustomerAssessment(clientNameOrAssessmentId?: string): boolean {
  if (!clientNameOrAssessmentId) return false;
  const clean = clientNameOrAssessmentId.trim().toLowerCase();
  return (
    isBorosilAssessment(clean) ||
    clean.includes('abc') ||
    clean.includes('textile') ||
    clean.startsWith('aic-')
  );
}

export function getExecutiveBriefPresentationContract(
  clientNameOrAssessmentId?: string
): ExecutiveBriefPresentationContract {
  if (isBorosilAssessment(clientNameOrAssessmentId)) {
    return BOROSIL_PRESENTATION_CONTRACT;
  }
  if (
    clientNameOrAssessmentId &&
    (clientNameOrAssessmentId.toLowerCase().includes('abc') ||
      clientNameOrAssessmentId.toLowerCase().includes('textile'))
  ) {
    return ABC_TEXTILE_PRESENTATION_CONTRACT;
  }
  if (
    clientNameOrAssessmentId &&
    (clientNameOrAssessmentId.toLowerCase().includes('ultratech') ||
      clientNameOrAssessmentId.toLowerCase().includes('demo'))
  ) {
    return DEMO_ARCHETYPE_PRESENTATION_CONTRACT;
  }
  throw new Error(
    `Cannot resolve executive presentation contract for unverified assessment/client: '${clientNameOrAssessmentId || 'UNKNOWN'}'. Customer data isolation strictly enforced.`
  );
}

export const EXECUTIVE_BRIEF_PRESENTATION_CONSTANTS = EXECUTIVE_BRIEF_PRESENTATION_CONTRACT;

export function isAdditiveDirectSaving(type: ValueClassificationType): boolean {
  return type === 'DIRECT_SAVINGS';
}

export function validateWaterfallMath(
  contract: ExecutiveBriefPresentationContract = EXECUTIVE_BRIEF_PRESENTATION_CONTRACT
): boolean {
  const calculatedNet =
    contract.grossOpportunityCr -
    contract.overlapDeductionsCr -
    contract.exclusionsCr;
  return Math.abs(calculatedNet - contract.netDefensiblePipelineCr) < 0.001;
}

export function validateNetComposition(
  contract: ExecutiveBriefPresentationContract = EXECUTIVE_BRIEF_PRESENTATION_CONTRACT
): boolean {
  const sum =
    contract.netDirectSavingsCr +
    contract.strategicMarketValueCr;
  return Math.abs(sum - contract.netDefensiblePipelineCr) < 0.001;
}


