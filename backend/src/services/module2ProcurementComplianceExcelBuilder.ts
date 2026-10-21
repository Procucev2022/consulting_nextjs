/**
 * Module 2 — Lever 9: Procurement Compliance & Control Excel Builder
 * Multi-Sheet Authoritative Spreadsheet Export
 * Compliant with Rule 4, 8, 9, max 300 lines, line length <= 120 chars, complexity <= 10
 */

import * as XLSX from 'xlsx';
import type {
  ProcurementComplianceResult,
  ProcurementComplianceExceptionItem,
  ComplianceControlCheckSummary,
  ComplianceReviewRecord
} from '../types/module2ProcurementCompliance';
import { COMPLIANCE_EXCEL_SHEETS } from '../constants/module2ProcurementCompliance';

function buildExecutiveRows(res: ProcurementComplianceResult): (string | number)[][] {
  const s = res.summary;
  return [
    ['STRATEGIC SOURCING LEVER 9 — PROCUREMENT COMPLIANCE & CONTROL'],
    ['Assessment Identifier', s.tenantId],
    ['Customer Name', res.customerName],
    ['Generated At', res.calculatedAt],
    ['Contract Compliance Verification Status', s.contractComplianceStatus],
    [],
    ['EXECUTIVE SUMMARY KPI METRICS'],
    ['Total Transactions Reviewed', s.totalTransactionsReviewedCount],
    ['Total Compliance Exceptions Identified', s.totalExceptionsIdentifiedCount],
    ['Exceptions Awaiting Review', s.awaitingReviewCount],
    ['Verified Exceptions', s.verifiedExceptionsCount],
    ['Exceptions Dismissed After Review', s.dismissedCount],
    ['Potential Exceptions (Initial Identification)', s.potentialExceptionsCount],
    ['Data Insufficient Records', s.dataInsufficientCount],
    ['Total Expenditure Under Review (Cr)', s.totalExpenditureUnderReviewCr],
    ['Total Expenditure Under Review (INR)', s.totalExpenditureUnderReviewInr],
    ['Unique Expenditure Under Review (Cr)', s.uniqueExpenditureUnderReviewCr],
    ['Unique Expenditure Under Review (INR)', s.uniqueExpenditureUnderReviewInr],
    ['Price-Variance Investigation Signals (Cr)', s.priceVarianceInvestigationCr],
    ['Price-Variance Investigation Signals (INR)', s.priceVarianceInvestigationInr],
    ['Potential PO Schedule Duplicates — Awaiting AP Verification (Cr)', s.samePoScheduleDuplicateCr],
    ['Potential PO Schedule Duplicates — Awaiting AP Verification (INR)', s.samePoScheduleDuplicateInr],
    ['Potential Cross-PO Duplicates — Awaiting AP Verification (Cr)', s.crossPoDuplicateCr],
    ['Potential Cross-PO Duplicates — Awaiting AP Verification (INR)', s.crossPoDuplicateInr],
    ['Total Potential Duplicates Awaiting AP Verification (Cr)', s.totalAwaitingApVerificationCr],
    ['Total Potential Duplicates Awaiting AP Verification (INR)', s.totalAwaitingApVerificationInr],
    ['Other Governance Exceptions Count', s.otherGovernanceExceptionsCount],
    ['Quantified Potential Exposure Supported by Defensible Evidence (Cr)', s.quantifiedDefensibleExposureCr],
    ['Quantified Potential Exposure Supported by Defensible Evidence (INR)', s.quantifiedDefensibleExposureInr],
    ['Verified Financial Impact (Cr)', s.verifiedFinancialImpactCr],
    ['Verified Financial Impact (INR)', s.verifiedFinancialImpactInr],
    ['Cross-Check Overlap Amount Kept Outside Consolidated Figures (Cr)', s.crossCheckOverlapAmountCr],
    ['Cross-Check Overlap Amount Kept Outside Consolidated Figures (INR)', s.crossCheckOverlapAmountInr],
    ['Total Disclosed Data Gaps', s.totalDisclosedDataGapsCount],
    [],
    ['FINANCIAL GOVERNANCE SAFEGUARD NOTICE'],
    ['Notice', s.financialDisclaimer]
  ];
}

function buildExceptionRows(exceptions: ProcurementComplianceExceptionItem[]): (string | number)[][] {
  const headers = [
    'Exception ID', 'Check Type', 'Check Title', 'Review Status',
    'Spend Category', 'Supplier Name', 'Material Code', 'Material Description',
    'Supporting Transactions', 'Expenditure Under Review (Cr)', 'Expenditure Under Review (INR)',
    'Financial Exposure (Cr)', 'Financial Exposure (INR)', 'Exposure Status',
    'Next Required Action', 'Related Levers'
  ];
  const rows: (string | number)[][] = [headers];

  for (const ex of exceptions) {
    rows.push([
      ex.exceptionId, ex.checkType, ex.checkTitle, ex.reviewStatus,
      ex.spendCategory, ex.vendorName, ex.materialCode || 'N/A', ex.materialDesc,
      ex.supportingTransactionsCount, ex.expenditureUnderReviewCr, ex.expenditureUnderReviewInr,
      ex.potentialFinancialExposureCr, ex.potentialFinancialExposureInr, ex.financialExposureStatusLabel,
      ex.nextActionRequired, ex.potentialRelatedLevers.join(', ')
    ]);
  }
  return rows;
}

function buildCheckRows(checks: ComplianceControlCheckSummary[]): (string | number)[][] {
  const headers = [
    'Control Check Type', 'Check Title', 'Eligible Transactions', 'Exceptions Identified',
    'Expenditure Under Review (Cr)', 'Expenditure Under Review (INR)',
    'Potential Exposure (Cr)', 'Potential Exposure (INR)', 'Data Coverage %', 'Primary Data Gap'
  ];
  const rows: (string | number)[][] = [headers];

  for (const c of checks) {
    rows.push([
      c.checkType, c.checkTitle, c.eligibleTransactionsCount, c.exceptionsIdentifiedCount,
      c.expenditureUnderReviewCr, c.expenditureUnderReviewInr,
      c.potentialFinancialExposureCr, c.potentialFinancialExposureInr,
      `${c.dataCoveragePct}%`, c.primaryDataGapNotice || 'N/A'
    ]);
  }
  return rows;
}

function buildDataGapRows(exceptions: ProcurementComplianceExceptionItem[]): (string | number)[][] {
  const headers = ['Exception ID', 'Check Title', 'Spend Category', 'Supplier Name', 'Disclosed Data Gap'];
  const rows: (string | number)[][] = [headers];

  for (const ex of exceptions) {
    for (const gap of ex.dataGapsDisclosed) {
      rows.push([ex.exceptionId, ex.checkTitle, ex.spendCategory, ex.vendorName, gap]);
    }
  }
  return rows;
}

function formatReviewReferences(
  r: ComplianceReviewRecord,
  ex: ProcurementComplianceExceptionItem
): string {
  if (r.supportingReferences && r.supportingReferences.length > 0) {
    return r.supportingReferences.join('; ');
  }
  const pos = ex.supportingTransactions.slice(0, 3).map((t) => t.poNumber).filter(Boolean);
  return pos.join('; ') || 'N/A';
}

function formatReviewRow(
  ex: ProcurementComplianceExceptionItem,
  r: ComplianceReviewRecord
): (string | number)[] {
  return [
    ex.exceptionId,
    r.reviewId,
    r.previousStatus || 'AWAITING_REVIEW',
    r.status,
    r.decision || (r.status === 'NOT_AN_EXCEPTION' ? 'DISMISS_EXCEPTION' : 'VERIFY_EXCEPTION'),
    r.reviewerName,
    r.reviewerRole || 'N/A',
    r.timestamp || r.reviewDate,
    r.reviewDate,
    r.technicalJustification,
    r.correctiveActionPlan || 'N/A',
    r.dismissalReason || 'N/A',
    formatReviewReferences(r, ex)
  ];
}

function buildReviewHistoryRows(exceptions: ProcurementComplianceExceptionItem[]): (string | number)[][] {
  const headers = [
    'Exception ID', 'Review ID', 'Previous Status', 'New Review Status', 'Review Decision',
    'Reviewer Name', 'Reviewer Role', 'Timestamp (UTC)', 'Review Date',
    'Technical Justification', 'Action Plan', 'Dismissal Reason', 'Supporting References'
  ];
  const rows: (string | number)[][] = [headers];

  for (const ex of exceptions) {
    for (const r of ex.reviewHistory) {
      rows.push(formatReviewRow(ex, r));
    }
  }
  return rows;
}

function buildMethodologyRows(res: ProcurementComplianceResult): (string | number)[][] {
  const rows: (string | number)[][] = [
    ['METHODOLOGY SAFEGUARDS & GOVERNANCE RULES'],
    ['Contract Compliance Notice', res.contractComplianceNotice],
    ['Financial Exposure Disclaimer', res.financialDisclaimer],
    [
      'Configurable Thresholds Notice',
      'The 5% price dispersion, 40% supplier concentration, and 5-transaction order fragmentation ' +
        'thresholds are configurable analytical rules, not universal statutory standards.'
    ],
    [
      'Duplicate Classification Safeguard',
      'Same-PO lines are classified as POTENTIAL_PO_SCHEDULE_DUPLICATE — AP VERIFICATION REQUIRED. ' +
        'Cross-PO lines are classified as POTENTIAL_DUPLICATE_TRANSACTION — AP VERIFICATION REQUIRED. ' +
        'Without invoice or payment-clearing evidence, duplicate payment or confirmed loss cannot be claimed.'
    ],
    [
      'Price Variance Safeguard',
      'Historical minimum price is not treated as an achievable commercial baseline. ' +
        'Where market conditions, volume, timing and terms cannot be established, results are classified as ' +
        'PRICE_VARIANCE_INVESTIGATION_SIGNAL and do not represent realized savings or confirmed losses.'
    ],
    [
      'Commodity & Fuel Indexation Limitation',
      'Petroleum fuels (e.g. HSD) and regulated commodities follow external price benchmarks. ' +
        'Assumed adjustments are not applied; unverified price spreads require category indexation validation.'
    ],
    [
      'Double Counting Prevention',
      'Exposures from overlapping checks are not summed. Overlapping transaction exposure is ' +
        'quantified separately and excluded from any consolidated defensible figures.'
    ],
    []
  ];

  for (let i = 0; i < res.methodologySafeguards.length; i++) {
    rows.push([`Safeguard ${i + 1}`, res.methodologySafeguards[i]]);
  }
  return rows;
}

export class Module2ProcurementComplianceExcelBuilder {
  public static buildWorkbook(res: ProcurementComplianceResult): Buffer {
    const wb = XLSX.utils.book_new();

    const addSheet = (name: string, rows: (string | number)[][]): void => {
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
    };

    addSheet(COMPLIANCE_EXCEL_SHEETS.SHEET_1_EXECUTIVE, buildExecutiveRows(res));
    addSheet(COMPLIANCE_EXCEL_SHEETS.SHEET_2_EXCEPTIONS, buildExceptionRows(res.exceptions));
    addSheet(COMPLIANCE_EXCEL_SHEETS.SHEET_3_CHECKS, buildCheckRows(res.controlChecks));
    addSheet(COMPLIANCE_EXCEL_SHEETS.SHEET_4_DATA_GAPS, buildDataGapRows(res.exceptions));
    addSheet(COMPLIANCE_EXCEL_SHEETS.SHEET_5_REVIEW_HISTORY, buildReviewHistoryRows(res.exceptions));
    addSheet(COMPLIANCE_EXCEL_SHEETS.SHEET_6_METHODOLOGY, buildMethodologyRows(res));

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }
}
