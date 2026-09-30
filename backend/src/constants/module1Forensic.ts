/**
 * Module 1 Forensic Constants & Data Contract Specifications
 */

import type { DataDictionaryField } from '../types/module1Forensic';

export const MODULE_1_FINANCIAL_BASE_CURRENCY = 'INR';

export const CRORE_CONVERSION_DIVISOR = 10000000; // 1 Cr = 10,000,000 INR

export const FLOAT_COMPARISON_TOLERANCE_INR = 0.01; // Max 1 paisa rounding variance across billions

export const MODULE_1_CONFIGURED_PERIOD_LABEL = '36 Months (FY24 - FY26: 1 Apr 2023 - 31 Mar 2026)';
export const MODULE_1_ACTUAL_COVERAGE_LABEL = '24 Billing Months (1 Apr 2024 - 31 Mar 2026: FY24-25 & FY25-26)';

export const PARETO_TARGET_PERCENTAGE = 0.80; // 80% theoretical threshold

export const MODULE_1_DATA_CONTRACT_FIELDS: DataDictionaryField[] = [
  {
    sourceField: 'Item',
    targetField: 'poLine',
    datatype: 'number',
    nullable: false,
    transformationRule: 'Parse to integer / numeric PO line item position',
    validationRule: 'Must be positive integer >= 1',
    calculationDependency: [],
    displayRule: 'Displayed in raw transaction table and line item drilldowns'
  },
  {
    sourceField: 'Purchasing Document',
    targetField: 'poNumber',
    datatype: 'string',
    nullable: false,
    transformationRule: 'Trim whitespace, stringify ERP purchasing document identifier',
    validationRule: 'Must be non-empty string',
    calculationDependency: [],
    displayRule: 'Displayed as PO Reference in transaction records and PO consolidation matrices'
  },
  {
    sourceField: 'Document Date',
    targetField: 'transactionDate',
    datatype: 'date',
    nullable: false,
    transformationRule: 'Excel serial date converted to UTC ISO YYYY-MM-DD',
    validationRule: 'Must resolve to valid calendar date between 1990 and 2030',
    calculationDependency: ['billingMonth', 'fiscalYear'],
    displayRule: 'Formatted as YYYY-MM-DD in UI data grids'
  },
  {
    sourceField: 'Supplier Code',
    targetField: 'vendorCode',
    datatype: 'string',
    nullable: false,
    transformationRule: 'Trim whitespace and stringify SAP vendor code',
    validationRule: 'Must be non-empty identifier',
    calculationDependency: [],
    displayRule: 'Displayed in supplier tables and supplier master'
  },
  {
    sourceField: 'Supplier Name',
    targetField: 'vendorName',
    datatype: 'string',
    nullable: false,
    transformationRule: 'Trim whitespace, upper-case normalization preserving legal entity suffix',
    validationRule: 'Must be non-empty string with length >= 2',
    calculationDependency: ['normalizedVendor'],
    displayRule: 'Primary supplier name displayed across all spend analytics'
  },
  {
    sourceField: 'Material',
    targetField: 'materialCode',
    datatype: 'string',
    nullable: false,
    transformationRule: 'Trim whitespace, preserve numeric or alphanumeric SKU code without dropping leading zeros',
    validationRule: 'Must be valid SKU identifier',
    calculationDependency: ['itemCode'],
    displayRule: 'Item / Material Code column in transaction grids'
  },
  {
    sourceField: 'Short Text',
    targetField: 'shortText',
    datatype: 'string',
    nullable: false,
    transformationRule: 'Trim whitespace, preserve full procurement description',
    validationRule: 'Non-empty procurement text description',
    calculationDependency: ['normalizedItem'],
    displayRule: 'Item Description in data tables and categorization engines'
  },
  {
    sourceField: 'Material Group',
    targetField: 'materialGroup',
    datatype: 'string',
    nullable: false,
    transformationRule: 'Trim and uppercase material group code',
    validationRule: 'Non-empty group code',
    calculationDependency: ['spendCategory'],
    displayRule: 'Material Group column and pivot dimension'
  },
  {
    sourceField: 'Plant',
    targetField: 'plant',
    datatype: 'string',
    nullable: false,
    transformationRule: 'Trim plant identifier string',
    validationRule: 'Valid operating facility identifier',
    calculationDependency: [],
    displayRule: 'Plant / Facility column and plant spend summary'
  },
  {
    sourceField: 'Order Quantity',
    targetField: 'orderQuantity',
    datatype: 'number',
    nullable: false,
    transformationRule: 'Parse to 64-bit IEEE float, unrounded',
    validationRule: 'Must be non-negative numeric quantity',
    calculationDependency: ['lineSpendInr', 'lineSpendCr'],
    displayRule: 'Quantity with up to 3 decimal places'
  },
  {
    sourceField: 'Order Unit',
    targetField: 'uom',
    datatype: 'string',
    nullable: false,
    transformationRule: 'Trim standard procurement UOM (e.g. TO, KG, NOS, MTR, LTR)',
    validationRule: 'Standard ISO or ERP unit of measure string',
    calculationDependency: [],
    displayRule: 'UOM column in table'
  },
  {
    sourceField: 'Net Price',
    targetField: 'netPrice',
    datatype: 'number',
    nullable: false,
    transformationRule: 'Parse to unrounded 64-bit float representing unit net price in transaction currency',
    validationRule: 'Must be non-negative numeric price',
    calculationDependency: ['lineSpendInr', 'lineSpendCr'],
    displayRule: 'Unit price formatted in source currency'
  },
  {
    sourceField: 'Currency',
    targetField: 'currency',
    datatype: 'string',
    nullable: false,
    transformationRule: 'Trim and uppercase 3-letter ISO-4217 currency code',
    validationRule: 'Must be approved currency (INR, USD, EUR, GBP, AED, JPY, SGD)',
    calculationDependency: ['approvedFxRate', 'lineSpendInr'],
    displayRule: 'Currency badge'
  },
  {
    sourceField: 'Total INR',
    targetField: 'totalInrRaw',
    datatype: 'number',
    nullable: false,
    transformationRule: 'Raw ERP computed spend in INR (Quantity * Net Price for INR transactions)',
    validationRule: 'Must reconcile with calculated spend within arithmetic precision',
    calculationDependency: [],
    displayRule: 'Underlying unrounded integer/float spend in INR'
  },
  {
    sourceField: 'Total In Crs',
    targetField: 'totalInCrsRaw',
    datatype: 'number',
    nullable: false,
    transformationRule: 'Raw ERP computed spend in Crores (Total INR / 10,000,000)',
    validationRule: 'Reconciles exactly with Total INR / 10^7',
    calculationDependency: [],
    displayRule: 'UI display value rounded to 2 decimals (e.g. ₹5.62 Cr)'
  }
];

export const APPROVED_HISTORICAL_FX_RATES: Record<string, { rate: number; date: string; source: string }> = {
  INR: { rate: 1.0, date: '2024-04-01', source: 'BASE_DOMESTIC_CURRENCY' },
  USD: { rate: 83.8, date: '2024-04-01', source: 'HISTORICAL_CENTRAL_BANK_FIXING' },
  EUR: { rate: 90.5, date: '2024-04-01', source: 'HISTORICAL_CENTRAL_BANK_FIXING' },
  GBP: { rate: 105.8, date: '2024-04-01', source: 'HISTORICAL_CENTRAL_BANK_FIXING' },
  AED: { rate: 22.82, date: '2024-04-01', source: 'HISTORICAL_CENTRAL_BANK_FIXING' },
  JPY: { rate: 0.558, date: '2024-04-01', source: 'HISTORICAL_CENTRAL_BANK_FIXING' },
  SGD: { rate: 62.15, date: '2024-04-01', source: 'HISTORICAL_CENTRAL_BANK_FIXING' }
};

export const MATHEMATICAL_INVARIANTS_SPEC = [
  {
    invariantNumber: 1,
    invariantName: 'Transaction Spend Additivity',
    formalDefinition: 'SUM(all transaction line spend INR) == TOTAL_SPEND_INR'
  },
  {
    invariantNumber: 2,
    invariantName: 'Supplier Spend Partition',
    formalDefinition: 'SUM(all supplier spend INR) == TOTAL_SPEND_INR'
  },
  {
    invariantNumber: 3,
    invariantName: 'Item Spend Partition',
    formalDefinition: 'SUM(all item spend INR) == TOTAL_SPEND_INR'
  },
  {
    invariantNumber: 4,
    invariantName: 'Material Group Spend Partition',
    formalDefinition: 'SUM(all material-group spend INR) == TOTAL_SPEND_INR'
  },
  {
    invariantNumber: 5,
    invariantName: 'Plant Spend Partition',
    formalDefinition: 'SUM(all plant spend INR) == TOTAL_SPEND_INR'
  },
  {
    invariantNumber: 6,
    invariantName: 'Monthly Spend Partition',
    formalDefinition: 'SUM(all monthly spend INR) == TOTAL_SPEND_INR'
  },
  {
    invariantNumber: 7,
    invariantName: 'No Upstream Rounded Calculations',
    formalDefinition: 'All aggregations and downstream metrics must consume unrounded 64-bit float calculation values, never 2-decimal UI presentation strings.'
  },
  {
    invariantNumber: 8,
    invariantName: 'Raw Source Immutability',
    formalDefinition: 'RAW_TRANSACTION_LEDGER records must never be mutated or overwritten by ingestion, normalization, or enrichment.'
  },
  {
    invariantNumber: 9,
    invariantName: 'Deterministic Inclusion Status',
    formalDefinition: 'Every single ingested transaction has exactly one deterministic inclusion status: VALID, EXCLUDED, ANOMALY, or REQUIRES_REVIEW.'
  },
  {
    invariantNumber: 10,
    invariantName: 'Deterministic Exclusion Cause',
    formalDefinition: 'Every excluded transaction possesses an explicit non-empty exclusion reason recorded in the audit register.'
  },
  {
    invariantNumber: 11,
    invariantName: 'Financial Lineage Provenance',
    formalDefinition: 'Every aggregated financial KPI must be 100% resolvable to underlying transaction IDs, original row numbers, and source customer files.'
  },
  {
    invariantNumber: 12,
    invariantName: 'Zero Double Counting Invariant',
    formalDefinition: 'No transaction record may be counted more than once in any partition or aggregation dimension.'
  }
];

export const DATA_QUALITY_RULES_SPEC = [
  { ruleId: 'DQR-01', ruleName: 'Missing Vendor Identification', field: 'vendorName', severity: 'HIGH' as const },
  { ruleId: 'DQR-02', ruleName: 'Missing Material / Item Code', field: 'materialCode', severity: 'HIGH' as const },
  { ruleId: 'DQR-03', ruleName: 'Missing Order Quantity', field: 'orderQuantity', severity: 'CRITICAL' as const },
  { ruleId: 'DQR-04', ruleName: 'Missing Unit Net Price', field: 'netPrice', severity: 'CRITICAL' as const },
  { ruleId: 'DQR-05', ruleName: 'Missing ISO Currency Code', field: 'currency', severity: 'HIGH' as const },
  { ruleId: 'DQR-06', ruleName: 'Missing Historical FX Rate', field: 'approvedFxRate', severity: 'HIGH' as const },
  { ruleId: 'DQR-07', ruleName: 'Invalid / Malformed Date', field: 'transactionDate', severity: 'MEDIUM' as const },
  { ruleId: 'DQR-08', ruleName: 'Exact Duplicate Transaction', field: 'recordId', severity: 'HIGH' as const },
  { ruleId: 'DQR-09', ruleName: 'Negative Order Quantity', field: 'orderQuantity', severity: 'HIGH' as const },
  { ruleId: 'DQR-10', ruleName: 'Negative Unit Price', field: 'netPrice', severity: 'HIGH' as const },
  { ruleId: 'DQR-11', ruleName: 'Zero Order Quantity', field: 'orderQuantity', severity: 'MEDIUM' as const },
  { ruleId: 'DQR-12', ruleName: 'Zero Unit Price (Sample/FOC)', field: 'netPrice', severity: 'LOW' as const },
  { ruleId: 'DQR-13', ruleName: 'Invalid Unit of Measure', field: 'uom', severity: 'LOW' as const },
  { ruleId: 'DQR-14', ruleName: 'Invalid Material Code Format', field: 'materialCode', severity: 'LOW' as const },
  { ruleId: 'DQR-15', ruleName: 'Unmapped Category / Material Group', field: 'materialGroup', severity: 'MEDIUM' as const },
  { ruleId: 'DQR-16', ruleName: 'Unmapped Operating Plant / Facility', field: 'plant', severity: 'MEDIUM' as const }
];

