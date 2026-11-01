/**
 * Borosil Executive Brief UI Presentation Constants (Prompt 589)
 * Authoritative UI constants for Borosil Ltd (AIC-2026-0002 / CUST-2026-0002).
 * Rule 8: Constants isolation; Rule 9: Strongly typed; max lines <= 300, complexity <= 10.
 */

import type {
  ExecutiveBriefArtifactItem,
  ExecutiveBriefClientProfile,
  ExecutiveBriefMetadata,
  ExecutiveBriefSummaryCardItem,
  ExecutiveBriefTraceabilityItem,
  ExecutiveBriefValidationChecklist
} from '../types/executiveBriefExportTypes';

export const BOROSIL_BRIEF_METADATA: ExecutiveBriefMetadata = {
  client: 'Borosil Ltd',
  reportDate: '2026-10-30',
  analysisPeriod: '1 April 2026 to 22 October 2026 (FY2026-27 YTD, 205 days)',
  modulesIncluded: ['Module 1', 'Module 2', 'Module 3', 'Module 4'],
  transactionCount: 27777,
  totalSpendInr: 5565346000,
  addressableSpendInr: 1686580000,
  grossOpportunityInr: 1175116632,
  netDefensibleOpportunityInr: 870997134,
  approvedSavingsInr: 751213739,
  realizedSavingsInr: 0,
  opportunityCount: 105,
  confidenceSummary: {
    high: 737693024,
    medium: 13520715,
    low: 0,
    insufficient: 0
  },
  sourceReferences: [
    {
      topic: 'Baseline Purchase Orders',
      source: 'Borosil ERP Canonical PO Extraction (27,777 rows)',
      sourceDate: '2026-10-22'
    },
    {
      topic: 'Strategic Sourcing Diagnostic',
      source: 'Module 2 Strategic Sourcing Engine (AIC-2026-0002)',
      sourceDate: '2026-10-30'
    }
  ],
  reportVersion: '1.0.0-AUDITED'
};

export const BOROSIL_CLIENT_PROFILE: ExecutiveBriefClientProfile = {
  clientName: 'Borosil Ltd',
  analysisPeriod: '1 April 2026 to 22 October 2026 (FY2026-27 YTD, 205 days)',
  group: 'Specialty Glassware & Laboratory Solutions',
  reportVersion: '1.0.0-FINAL-CERTIFIED',
  confidentiality: 'CONFIDENTIAL - BOROSIL LTD USE ONLY',
  status: 'AUDITED / READY'
};

export const BOROSIL_VALIDATION_CHECKLIST: ExecutiveBriefValidationChecklist = {
  module1Validated: true,
  module2Validated: true,
  module3Validated: true,
  module4Validated: true,
  financialReconciliation: true,
  transactionTraceability: true,
  doubleCountingControls: true,
  dataLineage: true,
  securityControls: true,
  reportGenerationValidation: true
};

export const BOROSIL_SUMMARY_CARDS: ExecutiveBriefSummaryCardItem[] = [
  {
    id: 'kpi-total-spend',
    label: 'Total Evaluated Spend',
    valueInr: 5565346000,
    formattedValue: '₹556.535 Cr',
    module: 'Module 1',
    evidenceRef: '27,777 canonical PO rows across 3 plants'
  },
  {
    id: 'kpi-addressable-spend',
    label: 'Addressable Sourcing Spend',
    valueInr: 1686580000,
    formattedValue: '₹168.658 Cr',
    module: 'Module 1',
    evidenceRef: '133 evaluated categories (₹161.016 Cr in 105 execution packages)'
  },
  {
    id: 'kpi-gross-opp',
    label: 'Gross Sourcing Opportunity',
    valueInr: 1175116632,
    formattedValue: '₹117.512 Cr',
    module: 'Module 2',
    evidenceRef: 'Identified opportunity across 3 sourcing levers'
  },
  {
    id: 'kpi-net-opp',
    label: 'Net Modelled Opportunity',
    valueInr: 870997134,
    formattedValue: '₹87.100 Cr',
    module: 'Module 2',
    evidenceRef: 'Overlap deduplicated (₹30.412 Cr deducted)'
  },
  {
    id: 'kpi-approved-savings',
    label: 'Modelled Opportunity Excluding Lever 2',
    valueInr: 751213739,
    formattedValue: '₹75.121 Cr',
    module: 'Module 2 & 4',
    evidenceRef: 'L1 ₹73.769 Cr + L3 ₹1.352 Cr (Excl. L2 ₹11.978 Cr in governance reserve)'
  },
  {
    id: 'kpi-client-approved',
    label: 'Client-Approved Savings',
    valueInr: 0,
    formattedValue: '₹0.00 Cr',
    module: 'Module 4',
    evidenceRef: 'Pending formal client commercial sign-off post-review'
  },
  {
    id: 'kpi-vendor-consolidation',
    label: 'Vendor Consolidation Spend',
    valueInr: 120810000,
    formattedValue: '₹12.081 Cr',
    module: 'Module 2',
    evidenceRef: 'Under Commercial Validation — Savings Not Yet Established'
  },
  {
    id: 'kpi-proposed-target',
    label: 'Proposed Year 1 Target',
    valueInr: 129000000,
    formattedValue: '₹12.90 Cr',
    module: 'Module 4',
    evidenceRef: 'Proposed operational target across Waves 1–3 (Not approved or realized)'
  },
  {
    id: 'kpi-realized-savings',
    label: 'Realized Savings',
    valueInr: 0,
    formattedValue: '₹0.00 Cr',
    module: 'Module 4',
    evidenceRef: 'Requires joint Procurement & Finance invoice audit post-contract'
  },
  {
    id: 'kpi-transactions',
    label: 'Evaluated Transactions',
    valueInr: 27777,
    formattedValue: '27,777 Invoices',
    module: 'Module 1',
    evidenceRef: 'Canonical normalized ERP lines (1 Apr 2026 – 22 Oct 2026)'
  }
];

export { BOROSIL_SLIDE_GROUPS } from './borosilExecutiveBriefSlideGroups';


export const BOROSIL_TRACEABILITY_LINEAGE: ExecutiveBriefTraceabilityItem[] = [
  {
    findingId: 'FND-BORO-001',
    module: 'Module 2 — Lever 1',
    category: 'Chemicals & Raw Materials',
    item: 'Dense Soda Ash',
    supplier: 'GHCL Limited',
    erpRecord: 'PO-2026-BH-10492',
    calculation: 'Cross-plant unit rate spread ₹28.50/kg vs ₹24.20/kg ex-works',
    opportunity: '₹73.769 Cr (Modelled Sourcing Opportunity)',
    savings: 'Modelled Opportunity Identified for Commercial Validation'
  },
  {
    findingId: 'FND-BORO-002',
    module: 'Module 2 — Lever 2',
    category: 'Plant Spares & MRO Consumables',
    item: 'Electrical & Instrumentation Spares',
    supplier: 'Fragmented Regional Distributors',
    erpRecord: 'PO-2026-JP-04182',
    calculation: 'Tail consolidation across 1,537 Active SAP Supplier Accounts (Under Validation)',
    opportunity: '₹11.978 Cr (Modelled Opportunity in Governance Reserve)',
    savings: 'Savings Not Yet Established (Held in Governance Reserve)'
  },
  {
    findingId: 'FND-BORO-003',
    module: 'Module 2 — Lever 3',
    category: 'Corrugated Packaging & Cartons',
    item: 'Outer Master Cartons 5-Ply',
    supplier: 'Regional Packaging Converters',
    erpRecord: 'PO-2026-BH-08831',
    calculation: 'Dynamic multi-round reverse auction competitive margin',
    opportunity: '₹1.352 Cr (Modelled Dynamic Bidding Opportunity)',
    savings: 'Modelled Opportunity Identified for Commercial Validation'
  }
];

export const BOROSIL_ARTIFACTS: ExecutiveBriefArtifactItem[] = [
  {
    name: 'Executive Opportunity Brief (PDF)',
    filename: 'aiCEV_Borosil_Ltd_Executive_Opportunity_Brief.pdf',
    description: 'Certified 15-page 16:9 executive presentation brief for Borosil Ltd leadership.',
    endpoint: '/api/reports/executive-brief/download/pdf?assessmentId=AIC-2026-0002'
  },
  {
    name: 'Executive Opportunity Brief (PPTX)',
    filename: 'aiCEV_Borosil_Ltd_Executive_Opportunity_Brief.pptx',
    description: 'Editable 16:9 PowerPoint presentation deck formatted to corporate standards.',
    endpoint: '/api/reports/executive-brief/download/pptx?assessmentId=AIC-2026-0002'
  },
  {
    name: 'Authoritative Management Report (JSON)',
    filename: 'aiCEV_Executive_Management_Report_AIC-2026-0002.json',
    description: 'Complete 15-section forensic data payload and bridge ledger.',
    endpoint: '/api/reports/executive-brief/report?assessmentId=AIC-2026-0002'
  }
];
