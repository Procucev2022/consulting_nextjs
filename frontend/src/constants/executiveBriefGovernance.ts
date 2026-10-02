/**
 * Executive Brief Governance, Assumption Register, Validation Checklist & Traceability
 * Adheres strictly to Section 18, Section 19, Section 20, and Section 24 of Prompt 275.
 */

import type {
  ExecutiveBriefAssumptionRegisterItem,
  ExecutiveBriefValidationChecklistItem,
  ExecutiveBriefTransactionEvidence
} from '../types';

export const EXECUTIVE_BRIEF_ASSUMPTION_REGISTER: readonly ExecutiveBriefAssumptionRegisterItem[] = [
  {
    assumptionId: 'ASM-001',
    opportunityId: 'OPP-001',
    assumption: 'MRO Vendor Consolidation Volume Leverage',
    value: 'Low: 3.0%, Base: 4.0%, High: 5.0%',
    basis: 'Observed 28% price variance on identical SKUs across 912 regional tail suppliers',
    source: 'Module 1 & 2 Transaction Dispersion Analytics',
    customerValidated: false,
    impact: '₹4.63 – ₹7.71 Cr (Base: ₹6.17 Cr)',
    scenarioClassification: 'Illustrative Volume Leverage Scenario'
  },
  {
    assumptionId: 'ASM-002',
    opportunityId: 'OPP-002',
    assumption: 'PO Processing Effort Reduction',
    value: '20.0% PO Volume Reduction (824 POs)',
    basis: 'ERP PO distribution showing 42% micro-orders under ₹2.5 Lakhs eligible for blanket releases',
    source: 'SAP ERP PO Frequency Audit',
    customerValidated: false,
    impact: 'Direct Spend: ₹0.00 Cr (Financial value NOT MONETIZED pending manpower cost)',
    scenarioClassification: 'Process Productivity (Non-Monetized Direct)'
  },
  {
    assumptionId: 'ASM-003',
    opportunityId: 'OPP-003',
    assumption: 'Direct Packaging Benchmark Index Parity',
    value: 'Low: 4.5%, Base: 6.28%, High: 8.0%',
    basis: 'Domestic published corrugated and HDPE resin commodity indices for Q3 trailing 12M',
    source: 'Independent Market Commodity Benchmark Index',
    customerValidated: true,
    impact: '₹57.80 – ₹102.76 Cr (Base: ₹80.67 Cr)',
    scenarioClassification: 'Verified Benchmark Price Gap'
  },
  {
    assumptionId: 'ASM-004',
    opportunityId: 'OPP-004',
    assumption: 'Logistics Corridor Bundling & Rate Compression',
    value: 'Low: 6.0%, Base: 8.5%, High: 11.0%',
    basis: 'Should-cost fuel & toll model across 112 lanes with 31% rate divergence between carriers',
    source: 'Module 2 Strategic Sourcing Lane Model',
    customerValidated: false,
    impact: '₹50.40 – ₹92.40 Cr (Base: ₹71.40 Cr)',
    scenarioClassification: 'Illustrative Strategic Sourcing Scenario'
  },
  {
    assumptionId: 'ASM-005',
    opportunityId: 'OPP-005',
    assumption: 'API Single-Source Supply Continuity Insurance',
    value: '4 Dual-Source Programs Qualified',
    basis: 'Plant continuity audit identifying 4 sole-source suppliers with zero safety stock SLAs',
    source: 'Module 2 Strategic Vendor Risk Matrix',
    customerValidated: false,
    impact: 'Direct Spend: ₹0.00 Cr (Cost Avoidance & Operational Resilience)',
    scenarioClassification: 'Supply Resilience (Non-Monetized Direct)'
  },
  {
    assumptionId: 'ASM-006',
    opportunityId: 'OPP-006',
    assumption: 'Polymer Cyclical Bottom Forward Term Reset',
    value: 'Low: 3.0%, Base: 4.8%, High: 6.5%',
    basis: 'Historical 2-year resin cycle entry window on ICIS / Platts feedstock curves',
    source: 'Module 3 Commodity Market Intelligence',
    customerValidated: false,
    impact: '₹9.30 – ₹20.15 Cr (Base: ₹14.88 Cr)',
    scenarioClassification: 'Strategic Market Timing Opportunity'
  },
  {
    assumptionId: 'ASM-007',
    opportunityId: 'OPP-007',
    assumption: 'Audited Invoice Compliance vs Contracted Rate Cards',
    value: '100% Realized Invoiced Run-rate',
    basis: 'ERP three-way matching against executed vendor master service agreements',
    source: 'General Ledger Finance Committee Audit',
    customerValidated: true,
    impact: '₹68.00 Cr Cash Realized (₹143.00 Cr In-Flight)',
    scenarioClassification: 'Validated & Audited Savings'
  }
];

export const EXECUTIVE_BRIEF_VALIDATION_CHECKLIST: readonly ExecutiveBriefValidationChecklistItem[] = [
  { itemId: 'VAL-01', item: 'Supplier Quotation', category: 'Commercial', status: 'IN_REVIEW', description: 'Formal commercial quotes received against standardized specifications' },
  { itemId: 'VAL-02', item: 'Current Contract Terms', category: 'Legal', status: 'VALIDATED', description: 'Review of existing termination clauses, minimum commitments, and notice periods' },
  { itemId: 'VAL-03', item: 'Specification Confirmation', category: 'Technical', status: 'VALIDATED', description: 'Engineering sign-off that consolidated SKUs meet technical tolerances' },
  { itemId: 'VAL-04', item: 'UOM Confirmation', category: 'Data', status: 'VALIDATED', description: 'Standardization of unit-of-measure across plants and ERP purchasing orgs' },
  { itemId: 'VAL-05', item: 'Freight Normalization', category: 'Logistics', status: 'IN_REVIEW', description: 'Adjusting prices for origin-destination delivery terms (Ex-Works vs DDP)' },
  { itemId: 'VAL-06', item: 'Payment Terms Alignment', category: 'Finance', status: 'PENDING', description: 'Ensuring 60–90 day working capital terms maintained in negotiated deals' },
  { itemId: 'VAL-07', item: 'Quality Requirements', category: 'Quality', status: 'VALIDATED', description: 'QA vendor audit certificates and QA batch pass performance metrics' },
  { itemId: 'VAL-08', item: 'Minimum Order Quantity (MOQ)', category: 'Supply Chain', status: 'IN_REVIEW', description: 'Validating plant warehouse storage capacity against bulk delivery MOQs' },
  { itemId: 'VAL-09', item: 'Lead Time Reliability', category: 'Supply Chain', status: 'IN_REVIEW', description: 'Transit time SLAs and penalty clauses for delayed shipment execution' },
  { itemId: 'VAL-10', item: 'Supplier Plant Capacity', category: 'Operational', status: 'VALIDATED', description: 'Verifying supplier total production bandwidth can absorb pooled volume' },
  { itemId: 'VAL-11', item: 'Incumbent Commercial Terms', category: 'Commercial', status: 'VALIDATED', description: 'Auditing incumbent volume rebate triggers and credit memo history' },
  { itemId: 'VAL-12', item: 'Customer Manpower / Processing Cost', category: 'Operational', status: 'PENDING', description: 'Internal time-motion study to monetize transaction reduction hours' },
  { itemId: 'VAL-13', item: 'Benchmark Applicability', category: 'Market Data', status: 'VALIDATED', description: 'Confirming grade, geographical region, and index publication match' },
  { itemId: 'VAL-14', item: 'Market Data Validity', category: 'Market Data', status: 'VALIDATED', description: 'Ensuring trailing index curves reflect current supply-demand fundamentals' }
];

export const EXECUTIVE_BRIEF_TRANSACTION_EVIDENCE: Record<string, ExecutiveBriefTransactionEvidence> = {
  'OPP-001': {
    transactionId: 'TX-MRO-88219',
    poNumber: 'PO-2025-088219',
    poDate: '2025-08-14',
    supplier: 'Industrial Fasteners & Hardware Corp',
    itemDescription: 'High Tensile Hex Bolt M16 x 65mm Grade 8.8',
    quantity: '25,000 Pcs',
    uom: 'PCS',
    unitPrice: '₹42.50',
    spend: '₹10,62,500',
    category: 'Industrial Supplies & MRO',
    benchmarkPrice: '₹34.80 (28% Dispersion)',
    calculation: 'Consolidated Volume RFQ target price: ₹35.20 (17.2% reduction)',
    source: 'Customer ERP Line Item Ledger (Verified)'
  },
  'OPP-002': {
    transactionId: 'PO-2025-09142',
    poNumber: 'PO-2025-09142',
    poDate: '2025-09-02',
    supplier: 'Apex Workshop Supplies Ltd',
    itemDescription: 'Ad-hoc Plant Lubrication & Sealants Small Order',
    quantity: '1 Lot',
    uom: 'LOT',
    unitPrice: '₹14,200',
    spend: '₹14,200',
    category: 'MRO & Consumables',
    benchmarkPrice: 'N/A (Micro-order < ₹25,000)',
    calculation: 'Eligible for blanket order scheduled release; direct spend: ₹0',
    source: 'Customer ERP PO Processing Log (Verified)'
  },
  'OPP-003': {
    transactionId: 'TX-PKG-33104',
    poNumber: 'PO-2025-033104',
    poDate: '2025-07-19',
    supplier: 'National Packaging & Containers Ltd',
    itemDescription: '5-Ply Corrugated Shipping Carton 450x300x250mm',
    quantity: '500,000 Boxes',
    uom: 'BOX',
    unitPrice: '₹28.40',
    spend: '₹1,42,00,000',
    category: 'Direct Materials & Packaging',
    benchmarkPrice: '₹26.62 (ICIS / Domestic Kraft Paper Index)',
    calculation: '(₹28.40 - ₹26.62) × 500,000 Boxes = ₹8,90,000 (6.28% variance)',
    source: 'Quarterly Published Paper & Board Index Benchmark'
  },
  'OPP-004': {
    transactionId: 'TX-LOG-44912',
    poNumber: 'PO-2025-044912',
    poDate: '2025-08-28',
    supplier: 'Premier Inter-State Logistics Ltd',
    itemDescription: 'Dedicated FTL 32ft MX Vehicle Mumbai to Delhi Corridor',
    quantity: '48 Trips',
    uom: 'TRIP',
    unitPrice: '₹92,000',
    spend: '₹44,16,000',
    category: 'Logistics & Freight',
    benchmarkPrice: '₹84,200 (Should-Cost Diesel & Toll Index)',
    calculation: 'Corridor pooling & round-trip rate target: ₹84,180 (8.5% compression)',
    source: 'National Highway Corridor Rate Intelligence Database'
  },
  'OPP-005': {
    transactionId: 'TX-CHM-11029',
    poNumber: 'PO-2025-011029',
    poDate: '2025-06-11',
    supplier: 'Sole-Source Synthetic Chemical Corp',
    itemDescription: 'Active Pharmaceutical Intermediate API-902',
    quantity: '12,000 KG',
    uom: 'KG',
    unitPrice: '₹3,500',
    spend: '₹4,20,00,000',
    category: 'Critical APIs & Specialized Chemicals',
    benchmarkPrice: 'N/A (Sole-Source Patented Synthesis)',
    calculation: 'Dual-source program qualified; direct spend saving: ₹0.00 Cr',
    source: 'Plant Bill of Materials (BOM) Single-Source Audit'
  },
  'OPP-006': {
    transactionId: 'TX-ENG-66712',
    poNumber: 'PO-2025-066712',
    poDate: '2025-09-15',
    supplier: 'Reliance Petrochemicals Division',
    itemDescription: 'Polypropylene Injection Moulding Grade H110MA',
    quantity: '250 Metric Tonnes',
    uom: 'MT',
    unitPrice: '₹98,500',
    spend: '₹2,46,25,000',
    category: 'Packaging Polymers & Resins',
    benchmarkPrice: '₹93,770 (Historical 2-Year Low Spot Window)',
    calculation: 'Forward term contract entry captures 4.80% cycle variance',
    source: 'Platts Polymer Feedstock Forward Curves'
  },
  'OPP-007': {
    transactionId: 'INV-2025-00481',
    poNumber: 'PO-2025-004812',
    poDate: '2025-05-10',
    supplier: 'Dell Enterprise Solutions India Ltd',
    itemDescription: 'Enterprise Commercial Laptops & Cloud Workspace AMC',
    quantity: '450 Units',
    uom: 'UNIT',
    unitPrice: '₹72,000',
    spend: '₹3,24,00,000',
    category: 'Corporate Services & IT Hardware',
    benchmarkPrice: '₹84,000 (Prior Baseline Catalog Rate)',
    calculation: '(₹84,000 - ₹72,000) × 450 = ₹54,00,000 Cash Realized in GL',
    source: 'SAP Invoiced Payment Voucher & Audited Rate Card'
  }
};

export const EXECUTIVE_BRIEF_VALUE_CLASSIFICATIONS = [
  {
    code: 'DIRECT_SAVING',
    label: 'Direct Procurement Savings',
    color: 'emerald',
    description: 'Actual purchase-price, commercial, volume or directly monetizable procurement improvements.'
  },
  {
    code: 'PROCESS_PRODUCTIVITY',
    label: 'Process Productivity',
    color: 'indigo',
    description: 'Internal effort, time, and transaction workload reduction (not monetized without cost baseline).'
  },
  {
    code: 'COST_AVOIDANCE',
    label: 'Cost Avoidance / Risk Mitigation',
    color: 'amber',
    description: 'Future operational disruption, price inflation, or sole-source failure risks avoided.'
  },
  {
    code: 'STRATEGIC_VALUE',
    label: 'Strategic Market Value',
    color: 'cyan',
    description: 'Market timing, contract index pegging, or non-direct structural procurement advantages.'
  },
  {
    code: 'VALIDATED_SAVING',
    label: 'Validated Saving',
    color: 'sky',
    description: 'Opportunity independently confirmed using customer transactional and rate card evidence.'
  },
  {
    code: 'REALIZED_SAVING',
    label: 'Realized Saving',
    color: 'purple',
    description: 'Savings already implemented and evidenced through audited General Ledger payment records.'
  }
] as const;
