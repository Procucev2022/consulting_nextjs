import type { ActionPlanItem, SavingsOpportunityStatus, SavingsSourceEngine } from '../types/savings';

export const SAVINGS_D1_INR_PER_CRORE = 10000000;

export const SAVINGS_D1_OPPORTUNITY_STATUS: Readonly<Record<string, SavingsOpportunityStatus>> = {
  IDENTIFIED: 'IDENTIFIED',
  'UNDER VALIDATION': 'UNDER_VALIDATION',
  UNDER_VALIDATION: 'UNDER_VALIDATION',
  VALIDATED: 'VALIDATED',
  APPROVED: 'APPROVED',
  IMPLEMENTING: 'IMPLEMENTING',
  REALIZED: 'REALIZED',
  REJECTED: 'REJECTED',
  DEFERRED: 'DEFERRED'
};

export const SAVINGS_D1_ACTION_STATUS: Readonly<Record<string, ActionPlanItem['status']>> = {
  PLANNED: 'Open',
  OPEN: 'Open',
  'IN PROGRESS': 'In Progress',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  DEFERRED: 'Deferred'
};

export const SAVINGS_D1_ACTION_STATUS_STORAGE: Readonly<Record<ActionPlanItem['status'], string>> = {
  Open: 'PLANNED',
  'In Progress': 'IN_PROGRESS',
  Completed: 'COMPLETED',
  Deferred: 'DEFERRED'
};

export const SAVINGS_D1_OWNER_VALUES = [
  'Procurement', 'SCM', 'Plant', 'Finance', 'Technical', 'Management', 'Other'
] as const;

export const SAVINGS_D1_ENGINE_BY_LEVER: Readonly<Record<string, SavingsSourceEngine>> = {
  'DIRECT PRICE RENEGOTIATION': 'PRICE_DISPERSION',
  'SUPPLIER CONSOLIDATION': 'VENDOR_CONSOLIDATION',
  'VOLUME POOLING': 'VOLUME_AGGREGATION',
  'PCBI INDEXATION': 'PCBI_PRICE',
  'E-AUCTIONS': 'E_AUCTION',
  'SPECIFICATION HARMONIZATION': 'SPECIFICATION_RATIONALIZATION',
  'CONTRACT COMPLIANCE': 'RATE_CONTRACT',
  'DEMAND RATIONALIZATION': 'DEMAND_CONSOLIDATION',
  'PAYMENT TERMS': 'PAYMENT_TERMS',
  'PO CONSOLIDATION': 'PO_CONSOLIDATION',
  'ALTERNATE SOURCING': 'ALTERNATE_MATERIAL'
};

export const SAVINGS_D1_MESSAGES = {
  actionPlanNotFound: (actionId: string): string => `Action plan ${actionId} was not found in D1. Refresh the savings workspace and select a saved action plan.`,
  actionPlanNoChanges: 'Provide at least one action-plan field to update.',
  opportunityNotFound: (opportunityId: string): string => `Savings opportunity ${opportunityId} was not found in D1. Refresh the workspace and select a saved opportunity.`
} as const;
