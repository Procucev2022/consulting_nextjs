import * as XLSX from 'xlsx';
import { MODULE2_D1_COMPLIANCE } from '../constants/module2ProcurementComplianceD1';
import type { ProcurementComplianceResult } from '../types/module2ProcurementCompliance';

export const buildProcurementComplianceWorkbook = (result: ProcurementComplianceResult): Uint8Array => {
  const summaryRows = Object.entries(result.summary).map(([metric, value]) => ({ metric, value }));
  const exceptions = result.exceptions.map((item) => ({
    exceptionId: item.exceptionId,
    checkType: item.checkType,
    checkTitle: item.checkTitle,
    status: item.reviewStatus,
    supplier: item.vendorName,
    materialCode: item.materialCode || '',
    materialDescription: item.materialDesc,
    purchaseOrder: item.supportingTransactions.map((row) => row.poNumber).join(', '),
    transactions: item.supportingTransactionsCount,
    expenditureUnderReviewInr: item.expenditureUnderReviewInr,
    potentialExposureInr: item.potentialFinancialExposureInr,
    exposureClassification: item.financialExposureStatus,
    evidence: item.evidenceDetails.join(' '),
    dataGaps: item.dataGapsDisclosed.join(' '),
    nextAction: item.nextActionRequired
  }));
  const controlChecks = result.controlChecks.map((item) => ({
    checkType: item.checkType,
    checkTitle: item.checkTitle,
    eligibleTransactions: item.eligibleTransactionsCount,
    exceptions: item.exceptionsIdentifiedCount,
    expenditureUnderReviewInr: item.expenditureUnderReviewInr,
    potentialExposureInr: item.potentialFinancialExposureInr,
    dataCoveragePct: item.dataCoveragePct,
    dataGap: item.primaryDataGapNotice || ''
  }));
  const methodology = [
    { statement: 'Assessment', detail: result.assessmentId },
    { statement: 'Customer', detail: result.customerName },
    { statement: 'Financial disclaimer', detail: result.financialDisclaimer },
    ...result.methodologySafeguards.map((detail) => ({ statement: 'Methodology safeguard', detail })),
    { statement: 'Contract controls', detail: result.contractComplianceNotice }
  ];
  const sheets = [
    XLSX.utils.json_to_sheet(summaryRows, { header: ['metric', 'value'] }),
    XLSX.utils.json_to_sheet(exceptions, { header: [
      'exceptionId', 'checkType', 'checkTitle', 'status', 'supplier', 'materialCode', 'materialDescription',
      'purchaseOrder', 'transactions', 'expenditureUnderReviewInr', 'potentialExposureInr',
      'exposureClassification', 'evidence', 'dataGaps', 'nextAction'
    ] }),
    XLSX.utils.json_to_sheet(controlChecks, { header: [
      'checkType', 'checkTitle', 'eligibleTransactions', 'exceptions', 'expenditureUnderReviewInr',
      'potentialExposureInr', 'dataCoveragePct', 'dataGap'
    ] }),
    XLSX.utils.json_to_sheet(methodology, { header: ['statement', 'detail'] })
  ];
  const workbook = XLSX.utils.book_new();
  sheets.forEach((sheet, index) => XLSX.utils.book_append_sheet(
    workbook, sheet, MODULE2_D1_COMPLIANCE.EXPORT.SHEETS[index]
  ));
  return new Uint8Array(XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer);
};
