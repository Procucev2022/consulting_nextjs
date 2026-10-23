/**
 * Customer Brief Presentation Constants (Prompt 503)
 * Certified verified presentation contracts and classifications for specific customer assessments.
 */

import type {
  ExecutiveBriefPresentationContract,
  ExecutiveBriefPresentationValueClassification
} from '../types/executiveBriefPresentation';

export const ABC_TEXTILE_VALUE_CLASSIFICATIONS: readonly ExecutiveBriefPresentationValueClassification[] = [
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
