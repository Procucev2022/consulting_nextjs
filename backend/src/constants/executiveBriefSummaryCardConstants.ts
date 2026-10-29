/**
 * Executive Brief summary cards. Each card reads one metric from the certified metadata or the presentation baseline.
 * A card with a unit renders as a count (for example "974 Vendors"). A card without a unit renders as crore.
 */
import type { ExecutiveBriefSummaryCardDefinition } from '../types/executiveBriefServices';

export const EXECUTIVE_BRIEF_SUMMARY_CARD_DEFINITIONS: readonly ExecutiveBriefSummaryCardDefinition[] = [
  {
    id: 'kpi-total-spend',
    label: 'Total Evaluated Spend',
    metric: 'totalSpend',
    module: 'Module 1',
    evidenceRef: 'TX-00001..TX-31671'
  },
  {
    id: 'kpi-addressable-spend',
    label: 'Addressable Spend',
    metric: 'addressableSpend',
    module: 'Module 1',
    evidenceRef: 'Module 1 Baseline Handoff'
  },
  {
    id: 'kpi-identified-opp',
    label: 'Identified Opportunity',
    metric: 'grossOpportunity',
    module: 'Module 2',
    evidenceRef: 'Dynamic Opportunity Catalog'
  },
  {
    id: 'kpi-approved-savings',
    label: 'Approved Savings',
    metric: 'approvedSavings',
    module: 'Module 4',
    evidenceRef: 'Executive Procurement Charter'
  },
  {
    id: 'kpi-realized-savings',
    label: 'Realized Savings',
    metric: 'realizedSavings',
    module: 'Module 4',
    evidenceRef: 'P&L Invoiced Cash Flow'
  },
  {
    id: 'kpi-opp-count',
    label: 'Opportunity Initiatives',
    metric: 'opportunityCount',
    unit: 'Initiatives',
    module: 'Module 2',
    evidenceRef: 'Deduplicated Savings Waterfall'
  },
  {
    id: 'kpi-transactions',
    label: 'Evaluated Transactions',
    metric: 'transactionCount',
    unit: 'Invoices',
    module: 'Module 1',
    evidenceRef: 'Raw Ingestion Ledger'
  },
  {
    id: 'kpi-suppliers',
    label: 'Active Suppliers',
    metric: 'baselineSuppliers',
    unit: 'Vendors',
    module: 'Module 1',
    evidenceRef: 'Master Vendor Register (Forensic Count - 31,671 Transactions)'
  },
  {
    id: 'kpi-categories',
    label: 'Material Groups',
    metric: 'baselineMaterialGroups',
    unit: 'Material Groups',
    module: 'Module 2',
    evidenceRef: 'SAP Material Group Classification (rawCustomerLedgerCache)'
  }
];
