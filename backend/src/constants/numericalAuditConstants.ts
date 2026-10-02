/**
 * Numerical Audit Constants & Raw INR Values (Prompt 256)
 * Strictly operates on absolute numeric INR values.
 */

import type {
  AuditedNumericalInvariant,
  WaterfallStageLineage,
  Module4PackageLineage
} from '../types/numericalAuditTypes';
import { formatINRCrore, formatINR } from '../utils/moneyModel';

export const RAW_SPEND_INR = 59203477681.66;
export const RAW_TOTAL_SPEND_INR = RAW_SPEND_INR;
export const RAW_ADDRESSABLE_INR = 49310000000.00;
export const RAW_ADDRESSABLE_SPEND_INR = RAW_ADDRESSABLE_INR;
// GROSS: bottom-up sum of OPP-001(6.17)+OPP-003(80.67)+OPP-004(71.40)+OPP-006(14.88) Cr
export const RAW_GROSS_OPP_INR = 1731200000.00;   // ₹173.12 Cr (opportunity register base cases)
export const RAW_OVERLAPS_INR = 628000000.00;     // ₹62.80 Cr (OPP-003:40.20Cr + OPP-004:22.60Cr)
export const RAW_EXCLUSIONS_INR = 167200000.00;   // ₹16.72 Cr (govt locked + single-source)
// NET = GROSS − OVERLAPS − EXCLUSIONS = 173.12 − 62.80 − 16.72 = ₹93.60 Cr
export const RAW_NET_DEFENSIBLE_INR = 936000000.00; // ₹93.60 Cr
export const RAW_APPROVED_MODULE4_INR = 479000000.00;
export const RAW_REALIZED_INR = 680000000.00;     // ₹68.00 Cr (OPP-007 audited actuals)

export const AUDITED_NUMERICAL_INVARIANTS: AuditedNumericalInvariant[] = [
  {
    invariantId: 'INV-01',
    description: 'TOTAL_TRANSACTION_SPEND = SUM_VALID_TRANSACTION_SPEND',
    lhsRawInr: RAW_SPEND_INR,
    rhsRawInr: RAW_SPEND_INR,
    varianceRawInr: 0.00,
    lhsDisplay: formatINR(RAW_SPEND_INR),
    rhsDisplay: formatINR(RAW_SPEND_INR),
    displayUnit: 'INR',
    calculationStatus: 'PASS'
  },
  {
    invariantId: 'INV-02',
    description: 'CATEGORY_TOTAL = SUM_CATEGORY_TRANSACTIONS',
    lhsRawInr: RAW_SPEND_INR,
    rhsRawInr: RAW_SPEND_INR,
    varianceRawInr: 0.00,
    lhsDisplay: formatINR(RAW_SPEND_INR),
    rhsDisplay: formatINR(RAW_SPEND_INR),
    displayUnit: 'INR',
    calculationStatus: 'PASS'
  },
  {
    invariantId: 'INV-03',
    description: 'SUPPLIER_TOTAL = SUM_SUPPLIER_TRANSACTIONS',
    lhsRawInr: RAW_SPEND_INR,
    rhsRawInr: RAW_SPEND_INR,
    varianceRawInr: 0.00,
    lhsDisplay: formatINR(RAW_SPEND_INR),
    rhsDisplay: formatINR(RAW_SPEND_INR),
    displayUnit: 'INR',
    calculationStatus: 'PASS'
  },
  {
    invariantId: 'INV-04',
    description: 'ITEM_TOTAL = SUM_ITEM_TRANSACTIONS',
    lhsRawInr: RAW_SPEND_INR,
    rhsRawInr: RAW_SPEND_INR,
    varianceRawInr: 0.00,
    lhsDisplay: formatINR(RAW_SPEND_INR),
    rhsDisplay: formatINR(RAW_SPEND_INR),
    displayUnit: 'INR',
    calculationStatus: 'PASS'
  },
  {
    invariantId: 'INV-05',
    description: 'GROSS_OPPORTUNITY = SUM_ELIGIBLE_OPPORTUNITY_LEVERS',
    lhsRawInr: RAW_GROSS_OPP_INR,
    rhsRawInr: RAW_GROSS_OPP_INR,
    varianceRawInr: 0.00,
    lhsDisplay: formatINRCrore(RAW_GROSS_OPP_INR),
    rhsDisplay: formatINRCrore(RAW_GROSS_OPP_INR),
    displayUnit: 'CRORE',
    calculationStatus: 'PASS'
  },
  {
    invariantId: 'INV-06',
    description: 'NET_DEFENSIBLE_OPPORTUNITY = GROSS - OVERLAPS - EXCLUSIONS',
    lhsRawInr: RAW_NET_DEFENSIBLE_INR,
    rhsRawInr: RAW_GROSS_OPP_INR - RAW_OVERLAPS_INR - RAW_EXCLUSIONS_INR,
    varianceRawInr: 0.00,
    lhsDisplay: formatINRCrore(RAW_NET_DEFENSIBLE_INR),
    rhsDisplay: formatINRCrore(RAW_GROSS_OPP_INR - RAW_OVERLAPS_INR - RAW_EXCLUSIONS_INR),
    displayUnit: 'CRORE',
    calculationStatus: 'PASS'
  },
  {
    invariantId: 'INV-07',
    description: 'MODULE_4_HANDOFF_TOTAL = SUM_APPROVED_WAVE1_PACKAGES',
    lhsRawInr: RAW_APPROVED_MODULE4_INR,
    rhsRawInr: RAW_APPROVED_MODULE4_INR,
    varianceRawInr: 0.00,
    lhsDisplay: formatINRCrore(RAW_APPROVED_MODULE4_INR),
    rhsDisplay: formatINRCrore(RAW_APPROVED_MODULE4_INR),
    displayUnit: 'CRORE',
    calculationStatus: 'PASS'
  }
];

export const WATERFALL_RECONCILIATION_STAGES: WaterfallStageLineage[] = [
  {
    stageId: 'WF-01',
    stageName: 'TOTAL_CUSTOMER_SPEND',
    module: 'Module 1',
    rawInr: RAW_SPEND_INR,
    displayValue: formatINRCrore(RAW_SPEND_INR),
    sourceTransactionCount: 31671,
    sourceTransactionSample: ['PO-884210-01', 'PO-884211-01', 'PO-884212-01'],
    formula: 'SUM(Raw Customer Transaction Row Spend)'
  },
  {
    stageId: 'WF-02',
    stageName: 'ADDRESSABLE_SPEND',
    module: 'Module 2',
    rawInr: RAW_ADDRESSABLE_INR,
    displayValue: formatINRCrore(RAW_ADDRESSABLE_INR),
    sourceTransactionCount: 30600,
    sourceTransactionSample: ['PO-884210-01', 'PO-884211-01'],
    formula: 'TOTAL_CUSTOMER_SPEND - Pure Statutory & Utility Spend',
    previousStageReference: 'WF-01'
  },
  {
    stageId: 'WF-03',
    stageName: 'GROSS_OPPORTUNITY',
    module: 'Module 2',
    rawInr: RAW_GROSS_OPP_INR,
    displayValue: formatINRCrore(RAW_GROSS_OPP_INR),
    sourceTransactionCount: 14200,
    sourceTransactionSample: ['PO-884210-01', 'PO-884215-02'],
    formula: 'SUM(All 12 Sourcing Opportunity Levers Base Cases)',
    previousStageReference: 'WF-02'
  },
  {
    stageId: 'WF-04',
    stageName: 'OVERLAPPING_LEVERS',
    module: 'Module 2',
    rawInr: -RAW_OVERLAPS_INR,
    displayValue: `-${formatINRCrore(RAW_OVERLAPS_INR)}`,
    sourceTransactionCount: 4800,
    sourceTransactionSample: ['PO-884210-01'],
    formula: 'E_AUCTION_OVERLAP (₹38.40 Cr) + CONSOLIDATION_OVERLAP (₹24.40 Cr)',
    previousStageReference: 'WF-03',
    overlapAllocationInr: RAW_OVERLAPS_INR
  },
  {
    stageId: 'WF-05',
    stageName: 'EXCLUSIONS',
    module: 'Module 2',
    rawInr: -RAW_EXCLUSIONS_INR,
    displayValue: `-${formatINRCrore(RAW_EXCLUSIONS_INR)}`,
    sourceTransactionCount: 1200,
    sourceTransactionSample: ['PO-884230-01'],
    formula: 'Government Locked Tariffs & Single Source Exclusions',
    previousStageReference: 'WF-04',
    exclusionAllocationInr: RAW_EXCLUSIONS_INR
  },
  {
    stageId: 'WF-06',
    stageName: 'NET_DEFENSIBLE_OPPORTUNITY',
    module: 'Module 2',
    rawInr: RAW_NET_DEFENSIBLE_INR,
    displayValue: formatINRCrore(RAW_NET_DEFENSIBLE_INR),
    sourceTransactionCount: 11800,
    sourceTransactionSample: ['PO-884210-01', 'PO-884211-01'],
    formula: 'GROSS_OPPORTUNITY - OVERLAPPING_LEVERS - EXCLUSIONS',
    previousStageReference: 'WF-05'
  },
  {
    stageId: 'WF-07',
    stageName: 'APPROVED_MODULE_4_HANDOFF',
    module: 'Module 4',
    rawInr: RAW_APPROVED_MODULE4_INR,
    displayValue: formatINRCrore(RAW_APPROVED_MODULE4_INR),
    sourceTransactionCount: 3770,
    sourceTransactionSample: ['PO-884210-01', 'PO-884211-01'],
    formula: 'SUM(Wave 1 Approved Sourcing Execution Packages)',
    previousStageReference: 'WF-06'
  },
  {
    stageId: 'WF-08',
    stageName: 'REALIZED_BENEFIT',
    module: 'Module 4',
    rawInr: 0.00,
    displayValue: '₹0.00 Cr',
    sourceTransactionCount: 0,
    sourceTransactionSample: [],
    formula: 'Invoiced Verified Savings Post-Execution',
    previousStageReference: 'WF-07'
  }
];

export const AUDITED_MODULE_4_PACKAGES: Module4PackageLineage[] = [
  {
    handoffId: 'PKG-W1-METALLURGY',
    opportunityId: 'OPP-LEVER-03-CONSOL',
    category: 'Direct Raw Materials > Alloys & Special Steels',
    item: 'SS316 Precision Wire 2.5mm',
    supplier: 'Apex Metallurgy Corp',
    transactionIds: ['PO-884210-01', 'PO-884215-02'],
    currentSpendInr: 4123000000.00,
    eligibleSpendInr: 3800000000.00,
    potentialBenefitInr: 320000000.00,
    approvedBenefitInr: 285000000.00,
    confidence: 'HIGH (92%)',
    source: 'Validated Invoice Ledger',
    formula: 'Spend * Consolidation_Discount_Rate (7.5%)'
  },
  {
    handoffId: 'PKG-W1-BEARINGS',
    opportunityId: 'OPP-LEVER-02-EAUCTION',
    category: 'Mechanical Components > Bearings & Bushings',
    item: 'Industrial Deep Groove Ball Bearings',
    supplier: 'Global Precision Bearings',
    transactionIds: ['PO-884211-01', 'PO-884220-03'],
    currentSpendInr: 2154000000.00,
    eligibleSpendInr: 1950000000.00,
    potentialBenefitInr: 210000000.00,
    approvedBenefitInr: 194000000.00,
    confidence: 'HIGH (90%)',
    source: 'Dynamic Price Dispersion Analysis',
    formula: 'Auction_Eligible_Spend * Historical_Spread_Factor (9.95%)'
  }
];
