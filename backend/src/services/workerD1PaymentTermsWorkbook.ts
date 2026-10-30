import * as XLSX from 'xlsx';
import { MODULE2_D1_PAYMENT_TERMS } from '../constants/module2PaymentTermsD1';
import type { PaymentTermsResult } from '../types/module2PaymentTerms';

const summaryRows = (result: PaymentTermsResult): Array<{ metric: string; value: unknown }> =>
  Object.entries(result.coverageSummary).map(([metric, value]) => ({ metric, value }));

const workbookSheets = (result: PaymentTermsResult): XLSX.WorkSheet[] => {
  const records = result.coverageRecords;
  const verified = records.filter((record) => record.coverageStatus === 'COMPLETE');
  const gaps = records.filter((record) => record.requiresValidation);
  const reconciliation = [
    { metric: 'totalSpendAnalysedInr', value: result.coverageSummary.totalSpendAnalysedInr },
    { metric: 'verifiedSpendInr', value: result.coverageSummary.verifiedSpendInr },
    { metric: 'missingSpendInr', value: result.coverageSummary.missingSpendInr },
    { metric: 'reconciliationDeltaInr', value: result.coverageSummary.reconciliationDeltaInr }
  ];
  const disclosures = result.methodologyDisclosures.map((disclosure) => ({ disclosure }));
  return [
    XLSX.utils.json_to_sheet(summaryRows(result), { header: ['metric', 'value'] }),
    XLSX.utils.json_to_sheet(result.opportunities, {
      header: ['opportunityId', 'supplierCode', 'supplierName', 'annualSpendInr', 'currentPaymentTerms',
        'targetPaymentTerms', 'indicativeAnnualFinancingBenefitInr', 'approvalStatus']
    }),
    XLSX.utils.json_to_sheet(result.supplierProfiles, {
      header: ['supplierCode', 'supplierName', 'spendCategory', 'totalSpendInr', 'transactionCount',
        'observedPaymentTerms', 'primaryPaymentTerms', 'weightedAvgCreditDays', 'dataAvailability',
        'requiresValidation']
    }),
    XLSX.utils.json_to_sheet(records, {
      header: ['recordId', 'vendorCode', 'vendorName', 'poNumber', 'poDate', 'spendInr', 'rawPaymentTerms',
        'parsedCreditDays', 'hasDiscountTerms', 'discountPercent', 'discountDays', 'coverageStatus',
        'gapReason', 'gapDetails', 'requiresValidation']
    }),
    XLSX.utils.json_to_sheet(gaps, {
      header: ['recordId', 'vendorCode', 'vendorName', 'poNumber', 'spendInr', 'rawPaymentTerms',
        'coverageStatus', 'gapReason', 'gapDetails']
    }),
    XLSX.utils.json_to_sheet(verified, {
      header: ['recordId', 'vendorCode', 'vendorName', 'poNumber', 'poDate', 'spendInr', 'rawPaymentTerms',
        'parsedCreditDays', 'hasDiscountTerms', 'discountPercent', 'discountDays']
    }),
    XLSX.utils.json_to_sheet(disclosures, { header: ['disclosure'] }),
    XLSX.utils.json_to_sheet(reconciliation, { header: ['metric', 'value'] })
  ];
};

export const buildPaymentTermsWorkbook = (result: PaymentTermsResult): Uint8Array => {
  const workbook = XLSX.utils.book_new();
  workbookSheets(result).forEach((sheet, index) => {
    XLSX.utils.book_append_sheet(workbook, sheet, MODULE2_D1_PAYMENT_TERMS.EXPORT.SHEETS[index]);
  });
  return new Uint8Array(XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer);
};
