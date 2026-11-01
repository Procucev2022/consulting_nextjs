/**
 * Executive Brief Governance, Assumption Register, Validation Checklist & Traceability
 * Prompt 590: Authoritative Borosil Ltd (AIC-2026-0002 / CUST-2026-0002) Governance
 * Rule 8: Constants isolation; Rule 9: Strongly typed; max lines <= 300, complexity <= 10.
 */

import type {
  ExecutiveBriefAssumptionRegisterItem,
  ExecutiveBriefValidationChecklistItem,
  ExecutiveBriefTransactionEvidence
} from '../types';
import { PRESENTATION_VALUE_CLASSIFICATIONS } from './executiveBriefPresentationConstants';

export const EXECUTIVE_BRIEF_VALUE_CLASSIFICATIONS = PRESENTATION_VALUE_CLASSIFICATIONS;

export const EXECUTIVE_BRIEF_ASSUMPTION_REGISTER: readonly ExecutiveBriefAssumptionRegisterItem[] = [
  {
    assumptionId: 'ASM-BOR-01',
    opportunityId: 'OPP-BOR-L1',
    assumption: 'Direct Price Improvement & Combined Strategic Sourcing',
    value: 'Empirical Unit Price Dispersion (90 Qualified Packages)',
    basis: 'Observed inter-plant unit price variances across Bharuch, Jaipur, and Tarapur manufacturing facilities',
    source: 'Module 1 & 2 Canonical Transaction Diagnostics (AIC-2026-0002)',
    customerValidated: true,
    impact: '₹73.769 Cr (Net Modelled Sourcing Opportunity)',
    scenarioClassification: 'Validated Commercial Sourcing'
  },
  {
    assumptionId: 'ASM-BOR-02',
    opportunityId: 'OPP-BOR-L2',
    assumption: 'Vendor Base Consolidation Commercial Validation',
    value: 'Savings Not Yet Established (Under Commercial Validation)',
    basis: 'Relevant addressable spend of ₹12.081 Cr across 4 qualified categories subject to ongoing commercial validation',
    source: 'Module 2 Vendor Base Diagnostics',
    customerValidated: false,
    impact: '₹0.00 Cr (Excluded from customer-facing validated savings pending independent validation)',
    scenarioClassification: 'Under Commercial Validation'
  },
  {
    assumptionId: 'ASM-BOR-03',
    opportunityId: 'OPP-BOR-L3',
    assumption: 'Dynamic Reverse E-Auction Market Testing',
    value: 'Multi-Round Competitive Bidding (12 Qualified Packages)',
    basis: 'Supplier market liquidity in standardized packaging, consumables, and industrial goods',
    source: 'Module 2 E-Auction Capability Assessment',
    customerValidated: true,
    impact: '₹1.352 Cr (Net Modelled Sourcing Opportunity)',
    scenarioClassification: 'Validated Dynamic E-Auction'
  },
  {
    assumptionId: 'ASM-BOR-04',
    opportunityId: 'OPP-BOR-M3',
    assumption: 'PCBI Market Commodity Benchmarking Closure',
    value: '0% Operational Benchmark Coverage (₹0.00 Cr Savings)',
    basis: 'No published external commodity benchmark data available matching custom borosilicate specifications for assessment period',
    source: 'Module 3 PCBI Benchmark Research Register (Closed)',
    customerValidated: true,
    impact: '₹0.00 Cr (Research Formally Closed — No Operational Benchmark Data Available)',
    scenarioClassification: 'Research Closed Disclosure'
  },
  {
    assumptionId: 'ASM-BOR-05',
    opportunityId: 'OPP-BOR-M4',
    assumption: 'Savings Realization & Value Governance Standards',
    value: 'Proposed Year 1 Target: ₹12.90 Cr (Proposed Target, Not Approved or Realized)',
    basis: 'Phased execution across Wave 1 (₹8.50 Cr), Wave 2 (₹3.20 Cr), and Wave 3 (₹1.20 Cr)',
    source: 'Module 4 Savings Execution Governance',
    customerValidated: false,
    impact: 'Client-Approved Savings: ₹0.00 Cr | Realized Savings: ₹0.00 Cr',
    scenarioClassification: 'Operational Governance Baseline'
  }
];

export const EXECUTIVE_BRIEF_VALIDATION_CHECKLIST: readonly ExecutiveBriefValidationChecklistItem[] = [
  { itemId: 'VAL-01', item: 'Module 1 ERP Spend Normalization', category: 'Data Hygiene', status: 'VALIDATED', description: '27,777 canonical PO rows reconciled with ₹0.00 variance' },
  { itemId: 'VAL-02', item: 'Multi-Lever Overlap Deduplication', category: 'Mathematics', status: 'VALIDATED', description: '₹30.412 Cr overlap deductions applied across 105 qualified packages' },
  { itemId: 'VAL-03', item: 'Vendor Consolidation Safeguard', category: 'Commercial', status: 'VALIDATED', description: '₹12.081 Cr spend shown separately; savings excluded until validated' },
  { itemId: 'VAL-04', item: 'Module 3 Benchmark Closure Audit', category: 'Market Data', status: 'VALIDATED', description: '0% benchmark coverage and ₹0 savings formally recorded' },
  { itemId: 'VAL-05', item: 'Approved vs Realized Demarcation', category: 'Governance', status: 'VALIDATED', description: 'Client-approved savings ₹0.00 Cr and realized savings ₹0.00 Cr confirmed' },
  { itemId: 'VAL-06', item: 'AES-256 Customer Isolation', category: 'Security', status: 'VALIDATED', description: 'Zero cross-tenant data leakage or foreign customer references' }
];

export const EXECUTIVE_BRIEF_TRANSACTION_EVIDENCE: Record<string, ExecutiveBriefTransactionEvidence> = {
  'OPP-BOR-L1': {
    transactionId: 'AIC-2026-0002-ROW-000006',
    poNumber: 'PO-BOR-2026-0006',
    poDate: '2026-04-12',
    supplier: '703717 GHCL LIMITED',
    itemDescription: 'Dense Soda Ash (Core Raw Material for Borosilicate Glass)',
    quantity: '500 MT',
    uom: 'MT',
    unitPrice: '₹28,450',
    spend: '₹1,42,25,000',
    category: '11100 - Heavy Inorganic Chemicals',
    benchmarkPrice: '₹26,100 (Inter-Plant Low)',
    calculation: 'Cross-plant price harmonization yielding validated commercial opportunity',
    source: 'Borosil ERP Canonical PO Line Ledger (AIC-2026-0002)'
  },
  'OPP-BOR-L2': {
    transactionId: 'AIC-2026-0002-ROW-000018',
    poNumber: 'PO-BOR-2026-0018',
    poDate: '2026-05-04',
    supplier: '600713 COMEFAR ASIA MINING INDU',
    itemDescription: 'Industrial Consumables & Tail Supplies',
    quantity: '1 Lot',
    uom: 'LOT',
    unitPrice: '₹3,40,000',
    spend: '₹3,40,000',
    category: '11200 - Plant Maintenance & Spares',
    benchmarkPrice: 'Under Commercial Validation',
    calculation: 'Relevant addressable spend ₹12.081 Cr; savings not yet established',
    source: 'Borosil Tail Supplier Diagnostic (AIC-2026-0002)'
  },
  'OPP-BOR-L3': {
    transactionId: 'AIC-2026-0002-ROW-000027',
    poNumber: 'PO-BOR-2026-0027',
    poDate: '2026-06-22',
    supplier: '600858 Guangdong Yuxing Fire-re',
    itemDescription: 'Standard Corrugated Packaging & Outer Cartons',
    quantity: '50,000 Units',
    uom: 'UNIT',
    unitPrice: '₹45.00',
    spend: '₹22,50,000',
    category: '11300 - Standardized Packaging Materials',
    benchmarkPrice: 'Reverse Dynamic Auction Liquidity',
    calculation: 'Multi-round e-auction dynamic bidding advantage of ₹1.352 Cr',
    source: 'Borosil E-Auction Candidate Pool (AIC-2026-0002)'
  },
  'OPP-BOR-M3': {
    transactionId: 'PCBI-BOR-CLOSED',
    poNumber: 'N/A',
    poDate: '2026-10-30',
    supplier: 'PCBI Research Closed',
    itemDescription: 'Market Commodity Benchmark Observations',
    quantity: '0 Observations',
    uom: 'OBS',
    unitPrice: '₹0.00',
    spend: '₹0.00',
    category: 'External Market Benchmarking',
    benchmarkPrice: '0% Coverage',
    calculation: 'Module 3 research closed — ₹0.00 benchmark-derived savings',
    source: 'PCBI Formal Closure Notice (AIC-2026-0002)'
  },
  'OPP-BOR-M4': {
    transactionId: 'M4-BOR-GOVERNANCE',
    poNumber: 'N/A',
    poDate: '2026-10-30',
    supplier: 'CFO / Value Governance Office',
    itemDescription: 'Program Sourcing Target & Value Realization Governance',
    quantity: '3 Execution Waves',
    uom: 'WAVE',
    unitPrice: '₹12.90 Cr Target',
    spend: '₹168.658 Cr Addressable',
    category: 'Program Value Governance',
    benchmarkPrice: '₹0.00 Cr Approved | ₹0.00 Cr Realized',
    calculation: 'Proposed Year 1 Target ₹12.90 Cr (Proposed Target, Not Approved or Realized)',
    source: 'Module 4 Value Execution Framework (AIC-2026-0002)'
  }
};
