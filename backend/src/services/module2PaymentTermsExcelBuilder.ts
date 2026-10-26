/**
 * Module 2 — Lever 5: Payment Terms Optimisation Excel Workbook Builder
 * Builds complete 8-sheet authoritative spreadsheet per Rule 8, 9, max 300 lines, complexity <= 10
 */

import * as XLSX from 'xlsx';
import type { PaymentTermsResult } from '../types/module2PaymentTerms';
import {
  PAYMENT_TERMS_EXCEL_SHEETS,
  PAYMENT_TERMS_DISCLOSURE_STRINGS
} from '../constants/module2PaymentTerms';

function buildExecutiveRows(res: PaymentTermsResult): (string | number)[][] {
  const sum = res.coverageSummary;
  const isUnavailable = sum.overallDataAvailabilityStatus === 'DATA_UNAVAILABLE';
  const rows: (string | number)[][] = [
    ['STRATEGIC SOURCING LEVER 5 — PAYMENT TERMS OPTIMISATION AUDIT DOSSIER'],
    ['Assessment Identifier', sum.assessmentId],
    ['Generated At', new Date().toISOString()],
    ['Centrally Governed Default Rate', `${sum.procucevModellingRatePctPer30Days}% per 30 Days`],
    []
  ];

  if (isUnavailable) {
    rows.push(
      ['EXPLICIT BUSINESS DISCLOSURE', PAYMENT_TERMS_DISCLOSURE_STRINGS.BENEFIT_CANNOT_BE_ASCERTAINED_TITLE],
      ['Disclosure Detail', PAYMENT_TERMS_DISCLOSURE_STRINGS.BENEFIT_CANNOT_BE_ASCERTAINED_MESSAGE],
      []
    );
  }

  rows.push(
    ['EXECUTIVE SUMMARY KEY PERFORMANCE INDICATORS'],
    ['Total Spend Analysed (Cr)', sum.totalSpendAnalysedCr],
    ['Total Spend Analysed (INR)', sum.totalSpendAnalysedInr],
    ['Verified Payment Terms Spend (Cr)', sum.verifiedSpendCr],
    ['Verified Spend Share (%)', `${sum.verifiedSpendPct}%`],
    ['Missing Payment Terms Spend (Cr)', sum.missingSpendCr],
    ['Missing Spend Share (%)', `${sum.missingSpendPct}%`],
    ['Overall Data Availability Status', sum.overallStatusDisplayText],
    [],
    ['ACTUAL PAYMENT TERMS BENEFITS (SEPARATE METRICS — NEVER SUMMED INTO PROCUREMENT SAVINGS)'],
    ['Actual Working Capital Benefit', isUnavailable ? PAYMENT_TERMS_DISCLOSURE_STRINGS.ACTUAL_WC_BENEFIT_UNAVAILABLE : `₹${sum.totalWorkingCapitalReleasedCr} Cr`],
    ['Actual Annual Financing Benefit', isUnavailable ? PAYMENT_TERMS_DISCLOSURE_STRINGS.ACTUAL_FINANCING_BENEFIT_UNAVAILABLE : `₹${sum.totalFinancingBenefitCr} Cr`],
    ['Actual Additional Credit Days', isUnavailable ? PAYMENT_TERMS_DISCLOSURE_STRINGS.ACTUAL_CREDIT_DAYS_UNAVAILABLE : '30 Days'],
    ['Commercially Validated Benefit', 0],
    [],
    ['ILLUSTRATIVE PLANNING SCENARIO (SEPARATELY LABELLED ILLUSTRATION — NOT AN ACTUAL BENEFIT)'],
    ['Planning Scenario Disclaimer', PAYMENT_TERMS_DISCLOSURE_STRINGS.PLANNING_SCENARIO_DISCLAIMER],
    ['Indicative Working Capital Released (Cr)', sum.totalWorkingCapitalReleasedCr],
    ['Indicative Annual Financing Benefit (Cr)', sum.totalFinancingBenefitCr],
    ['Early Payment Cash Discount Potential (Cr)', sum.totalEarlyPaymentDiscountsCr],
    ['Financial Reconciliation Delta (INR)', sum.reconciliationDeltaInr],
    [],
    ['DATA COVERAGE AUDIT SUMMARY'],
    ['Total Purchase Transactions', sum.totalRecordsCount],
    ['Complete Records (Verified Terms)', sum.completeRecordsCount],
    ['Partial Records (Review Required)', sum.partialRecordsCount],
    ['Missing Records (Terms Not Found)', sum.missingRecordsCount],
    ['Records Requiring Commercial Validation', sum.recordsRequiringValidationCount]
  );
  return rows;
}

function buildCoverageRows(res: PaymentTermsResult): (string | number)[][] {
  const sum = res.coverageSummary;
  const rows: (string | number)[][] = [
    ['Data Gap Category', 'Description', 'Affected Record Count']
  ];
  for (const [gap, count] of Object.entries(sum.gapReasonCounts)) {
    rows.push([gap, gap.replace(/_/g, ' '), count]);
  }
  return rows;
}

function buildOpportunitiesRows(res: PaymentTermsResult): (string | number)[][] {
  const headers = [
    'Opportunity ID', 'Supplier Code', 'Supplier Name', 'Category', 'Annual Spend (Cr)',
    'Current Terms', 'Current Days', 'Target Terms', 'Target Days', 'Additional Days',
    'Financing Rate', 'Financing Benefit (Cr)', 'Working Capital Released (Cr)',
    'Status', 'Approval Status'
  ];
  const rows: (string | number)[][] = [headers];
  for (const o of res.opportunities) {
    rows.push([
      o.opportunityId, o.supplierCode, o.supplierName, o.spendCategory, o.annualSpendCr,
      o.currentPaymentTerms, o.currentCreditDays, o.targetPaymentTerms, o.targetCreditDays,
      o.additionalCreditDays, `${(o.financingRatePer30Days * 100).toFixed(2)}% / 30d`,
      o.indicativeAnnualFinancingBenefitCr, o.indicativeWorkingCapitalReleasedCr,
      o.statusLabel, o.approvalStatus
    ]);
  }
  return rows;
}

function buildSupplierRows(res: PaymentTermsResult): (string | number)[][] {
  const headers = [
    'Supplier Code', 'Supplier Name', 'Category', 'Total Spend (Cr)', 'Tx Count',
    'Primary Payment Terms', 'Wavg Credit Days', 'Data Availability',
    'Working Capital Released (Cr)', 'Financing Benefit (Cr)', 'Early Discount Opp (Cr)'
  ];
  const rows: (string | number)[][] = [headers];
  for (const s of res.supplierProfiles) {
    rows.push([
      s.supplierCode, s.supplierName, s.spendCategory, s.totalSpendCr, s.transactionCount,
      s.primaryPaymentTerms, s.weightedAvgCreditDays, s.dataAvailability,
      s.indicativeWorkingCapitalReleasedCr, s.indicativeFinancingBenefitCr,
      s.earlyPaymentDiscountOpportunityCr
    ]);
  }
  return rows;
}

function buildWorkingCapitalRows(res: PaymentTermsResult): (string | number)[][] {
  const noteRow = [
    'GOVERNANCE NOTICE: Sensitivity models (+30d / +60d) are illustrative, unapproved scenarios. ' +
    'They do not constitute identified opportunities and do not feed into opportunity totals.'
  ];
  const headers = [
    'Supplier Code', 'Supplier Name', 'Annual Spend (Cr)', 'Current Days',
    'Illustrative +30d WC Released (Cr)', 'Illustrative +60d WC Released (Cr)',
    'Illustrative +30d Financing Benefit (Cr)', 'Illustrative +60d Financing Benefit (Cr)'
  ];
  const rows: (string | number)[][] = [noteRow, [], headers];
  for (const s of res.supplierProfiles.slice(0, 100)) {
    const spend = s.totalSpendCr;
    const wc30 = Number(((spend / 365) * 30).toFixed(4));
    const wc60 = Number(((spend / 365) * 60).toFixed(4));
    const fin30 = Number((spend * 0.015 * 1).toFixed(4));
    const fin60 = Number((spend * 0.015 * 2).toFixed(4));
    rows.push([s.supplierCode, s.supplierName, spend, s.weightedAvgCreditDays, wc30, wc60, fin30, fin60]);
  }
  return rows;
}

function buildTransactionRows(res: PaymentTermsResult): (string | number)[][] {
  const headers = [
    'Record ID', 'PO Number', 'PO Date', 'Vendor Code', 'Vendor Name',
    'Spend (INR)', 'Raw Payment Terms', 'Parsed Credit Days', 'Coverage Status',
    'Gap Reason', 'Requires Validation'
  ];
  const rows: (string | number)[][] = [headers];
  const slice = res.coverageRecords.slice(0, 5000);
  for (const r of slice) {
    rows.push([
      r.recordId, r.poNumber, r.poDate, r.vendorCode, r.vendorName,
      r.spendInr, r.rawPaymentTerms || 'MISSING', r.parsedCreditDays || 0,
      r.coverageStatus, r.gapReason || 'NONE', r.requiresValidation ? 'YES' : 'NO'
    ]);
  }
  return rows;
}

function buildEarlyDiscountRows(res: PaymentTermsResult): (string | number)[][] {
  const headers = [
    'Supplier Code', 'Supplier Name', 'Category', 'Eligible Spend (Cr)',
    'Discount Terms', 'Annual Cash Discount (Cr)', 'Status'
  ];
  const rows: (string | number)[][] = [headers];
  const withDisc = res.supplierProfiles.filter((s) => s.earlyPaymentDiscountOpportunityCr > 0);
  for (const d of withDisc) {
    rows.push([
      d.supplierCode, d.supplierName, d.spendCategory, d.totalSpendCr,
      d.primaryPaymentTerms, d.earlyPaymentDiscountOpportunityCr, 'REVIEW_REQUIRED'
    ]);
  }
  return rows;
}

function buildGovernanceRows(res: PaymentTermsResult): (string | number)[][] {
  return [
    ['LEVER 5 METHODOLOGY & GOVERNANCE DISCLOSURES'],
    [],
    ...res.methodologyDisclosures.map((d, i) => [`${i + 1}.`, d])
  ];
}

export class Module2PaymentTermsExcelBuilder {
  public static buildWorkbook(res: PaymentTermsResult): Buffer {
    const wb = XLSX.utils.book_new();

    const addSheet = (name: string, data: (string | number)[][]): void => {
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, name);
    };

    addSheet(PAYMENT_TERMS_EXCEL_SHEETS.SHEET_1_EXECUTIVE, buildExecutiveRows(res));
    addSheet(PAYMENT_TERMS_EXCEL_SHEETS.SHEET_2_DATA_COVERAGE, buildCoverageRows(res));
    addSheet(PAYMENT_TERMS_EXCEL_SHEETS.SHEET_3_OPPORTUNITIES, buildOpportunitiesRows(res));
    addSheet(PAYMENT_TERMS_EXCEL_SHEETS.SHEET_4_SUPPLIER_ANALYSIS, buildSupplierRows(res));
    addSheet(PAYMENT_TERMS_EXCEL_SHEETS.SHEET_5_EARLY_PAYMENT, buildEarlyDiscountRows(res));
    addSheet(PAYMENT_TERMS_EXCEL_SHEETS.SHEET_6_WORKING_CAPITAL, buildWorkingCapitalRows(res));
    addSheet(PAYMENT_TERMS_EXCEL_SHEETS.SHEET_7_TRANSACTIONS, buildTransactionRows(res));
    addSheet(PAYMENT_TERMS_EXCEL_SHEETS.SHEET_8_GOVERNANCE, buildGovernanceRows(res));

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }
}
