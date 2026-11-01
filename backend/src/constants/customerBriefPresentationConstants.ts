/**
 * Customer Brief Presentation Constants (Prompt 503)
 * Certified verified presentation contracts and classifications for specific customer assessments.
 */

import type {
  ExecutiveBriefPresentationContract,
  ExecutiveBriefValueClassification
} from '../types/executiveBriefPresentation';

export const ABC_TEXTILE_VALUE_CLASSIFICATIONS: readonly ExecutiveBriefValueClassification[] = [
  {
    type: 'DIRECT_SAVINGS',
    label: 'Direct Savings Opportunity',
    valueFormatted: '₹85.641 Cr',
    numericCr: 85.641,
    isDirectSaving: true,
    monetizationStatus: 'MONETIZED_DIRECT',
    description: 'Net defensible opportunity across rate harmonization, volume pooling, and dynamic tenders.'
  },
  {
    type: 'STRATEGIC_VALUE',
    label: 'Strategic Market Value',
    valueFormatted: '₹0.00 Cr',
    numericCr: 0.0,
    isDirectSaving: false,
    monetizationStatus: 'STRATEGIC_MARKET',
    description: 'Market index contracting not activated for current assessment scope.'
  },
  {
    type: 'PROCESS_PRODUCTIVITY',
    label: 'Process Productivity',
    valueFormatted: '15.0% PO Effort Reduction',
    numericCr: null,
    isDirectSaving: false,
    monetizationStatus: 'NOT_MONETIZED',
    description: '540 low-value POs consolidated via catalog purchasing; strictly non-monetized to protect CFO trust.'
  },
  {
    type: 'COST_AVOIDANCE',
    label: 'Cost Avoidance / Risk',
    valueFormatted: '₹45.00 Cr De-Risked',
    numericCr: null,
    isDirectSaving: false,
    monetizationStatus: 'NOT_MONETIZED',
    description: 'Dual-source qualified programs mitigating single-source supplier exposure; not monetized as direct savings.'
  },
  {
    type: 'VALIDATED_SAVINGS',
    label: 'Proven Opportunity',
    valueFormatted: '₹82.380 Cr',
    numericCr: 82.38,
    isDirectSaving: false,
    monetizationStatus: 'MONETIZED_DIRECT',
    description: 'Proven opportunity under empirical evidence-based validation criteria.'
  },
  {
    type: 'REALIZED_SAVINGS',
    label: 'Realized Savings',
    valueFormatted: '₹0.00 Cr',
    numericCr: 0.0,
    isDirectSaving: false,
    monetizationStatus: 'MONETIZED_DIRECT',
    description: 'Realized savings zero until contract deployment and supplier billing execution evidence exists.'
  }
];

export const ABC_TEXTILE_PRESENTATION_CONTRACT: ExecutiveBriefPresentationContract = {
  totalCustomerSpendCr: 613.8805,
  totalCustomerSpendInr: 6138805000,
  addressableSpendCr: 315.021,
  addressableSpendInr: 3150210000,
  analysisPeriod: '02 Jan 2023 - 30 Dec 2023 (12 Months)',
  analysisPeriodMonths: 12,
  grossOpportunityCr: 110.764,
  grossOpportunityInr: 1107640000,
  overlapDeductionsCr: 25.123,
  overlapDeductionsInr: 251230000,
  exclusionsCr: 0.0,
  exclusionsInr: 0,
  netDefensiblePipelineCr: 85.641,
  netDefensiblePipelineInr: 856410000,
  netDirectSavingsCr: 85.641,
  netDirectSavingsInr: 856410000,
  strategicMarketValueCr: 0.0,
  strategicMarketValueInr: 0,
  processProductivityPct: 15.0,
  lowValuePOsCount: 540,
  directProcessSavingCr: 0.0,
  spendDeRiskedCr: 45.0,
  dualSourceProgramsCount: 2,
  validatedSavingsCr: 82.38,
  validatedSavingsInr: 823800000,
  realizedSavingsCr: 0.0,
  realizedSavingsInr: 0,
  baselineTransactions: 23570,
  baselineSuppliers: 420,
  baselineMaterialGroups: 84,
  baselinePlants: 6,
  baselineTotalPOs: 11420,
  classifications: ABC_TEXTILE_VALUE_CLASSIFICATIONS
};

export const BOROSIL_VALUE_CLASSIFICATIONS: readonly ExecutiveBriefValueClassification[] = [
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
    description: 'Market commodity index contracting not activated; Module 3 benchmark contribution closed at ₹0.00 Cr.'
  },
  {
    type: 'PROCESS_PRODUCTIVITY',
    label: 'Process Productivity',
    valueFormatted: 'PO Frequency Reduction',
    numericCr: null,
    isDirectSaving: false,
    monetizationStatus: 'NOT_MONETIZED',
    description: 'Purchase order consolidation and frequency reduction; strictly non-monetized.'
  },
  {
    type: 'COST_AVOIDANCE',
    label: 'Cost Avoidance / Risk',
    valueFormatted: 'Dual-Source Qualification',
    numericCr: null,
    isDirectSaving: false,
    monetizationStatus: 'NOT_MONETIZED',
    description: 'Sole-source risk mitigation on Soda Ash and Precision Tooling; non-monetized.'
  },
  {
    type: 'VALIDATED_SAVINGS',
    label: 'Modelled Opportunity Excluding Lever 2',
    valueFormatted: '₹75.121 Cr',
    numericCr: 75.121,
    isDirectSaving: false,
    monetizationStatus: 'MONETIZED_DIRECT',
    description: 'Empirically evidenced sourcing opportunity across verified Levers 1 & 3. Excludes ₹11.978 Cr Vendor Consolidation held in governance reserve pending commercial validation.'
  },
  {
    type: 'REALIZED_SAVINGS',
    label: 'Realized Savings',
    valueFormatted: '₹0.00 Cr',
    numericCr: 0.0,
    isDirectSaving: false,
    monetizationStatus: 'MONETIZED_DIRECT',
    description: 'Realized savings zero until contract deployment, supplier negotiations, and audited billing execution.'
  }
];

export const BOROSIL_PRESENTATION_CONTRACT: ExecutiveBriefPresentationContract = {
  totalCustomerSpendCr: 556.535,
  totalCustomerSpendInr: 5565346000,
  addressableSpendCr: 168.658,
  addressableSpendInr: 1686580000,
  analysisPeriod: '1 April 2026 to 22 October 2026 (FY2026-27 YTD, 205 days)',
  analysisPeriodMonths: 7,
  grossOpportunityCr: 117.512,
  grossOpportunityInr: 1175116632,
  overlapDeductionsCr: 30.412,
  overlapDeductionsInr: 304119498,
  exclusionsCr: 0.0,
  exclusionsInr: 0,
  netDefensiblePipelineCr: 87.100,
  netDefensiblePipelineInr: 870997134,
  netDirectSavingsCr: 87.100,
  netDirectSavingsInr: 870997134,
  strategicMarketValueCr: 0.0,
  strategicMarketValueInr: 0,
  processProductivityPct: 0.0,
  lowValuePOsCount: 0,
  directProcessSavingCr: 0.0,
  spendDeRiskedCr: 0.0,
  dualSourceProgramsCount: 0,
  validatedSavingsCr: 75.121,
  validatedSavingsInr: 751213739,
  realizedSavingsCr: 0.0,
  realizedSavingsInr: 0,
  baselineTransactions: 27777,
  baselineSuppliers: 1537,
  baselineMaterialGroups: 133,
  baselinePlants: 3,
  baselineTotalPOs: 27777,
  classifications: BOROSIL_VALUE_CLASSIFICATIONS
};

export interface PresentationFormattedValues {
  evaluatedSpendFormatted: string;
  grossOpportunityFormatted: string;
  overlapDeductionsFormatted: string;
  netDirectSavingsFormatted: string;
  netPipelineFormatted: string;
  provenOpportunityFormatted: string;
  realizedSavingsFormatted: string;
}

export function formatPresentationValues(
  contract: ExecutiveBriefPresentationContract,
  isCust: boolean
): PresentationFormattedValues {
  return {
    evaluatedSpendFormatted: isCust ? `₹${contract.totalCustomerSpendCr.toFixed(4)} Cr` : '₹5,920.35 Cr',
    grossOpportunityFormatted: isCust ? `₹${contract.grossOpportunityCr.toFixed(3)} Cr` : '₹173.12 Cr',
    overlapDeductionsFormatted: isCust ? `₹${contract.overlapDeductionsCr.toFixed(3)} Cr` : '₹62.80 Cr',
    netDirectSavingsFormatted: isCust ? `₹${contract.netDirectSavingsCr.toFixed(3)} Cr` : '₹78.72 Cr',
    netPipelineFormatted: isCust ? `₹${contract.netDefensiblePipelineCr.toFixed(3)} Cr` : '₹93.60 Cr',
    provenOpportunityFormatted: isCust ? `₹${contract.validatedSavingsCr.toFixed(3)} Cr` : '₹47.90 Cr',
    realizedSavingsFormatted: isCust ? `₹${contract.realizedSavingsCr.toFixed(2)} Cr` : '₹68.00 Cr'
  };
}
