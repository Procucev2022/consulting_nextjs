import * as XLSX from 'xlsx';
import { MODULE2_D1_SPECIFICATION_RATIONALISATION as CONFIG } from '../constants/module2SpecificationRationalisationD1';
import type { SpecificationRationalisationResult } from '../types/module2SpecificationRationalisation';

export const buildSpecificationRationalisationWorkbook = (
  result: SpecificationRationalisationResult
): Uint8Array => {
  const workbook = XLSX.utils.book_new();
  const summary = Object.entries(result.summary).map(([metric, value]) => ({ metric, value }));
  const candidates = result.candidates.map((candidate) => ({
    candidateId: candidate.candidateId,
    category: candidate.spendCategory,
    identificationType: candidate.identificationType,
    identificationRationale: candidate.identificationRationale,
    primaryCode: candidate.primaryItem.code,
    primaryDescription: candidate.primaryItem.description,
    comparisonCode: candidate.comparisonItem.code,
    comparisonDescription: candidate.comparisonItem.description,
    unit: candidate.primaryItem.uom,
    historicalExpenditureUnderReviewInr: candidate.expenditureUnderReviewInr,
    reviewStatus: candidate.reviewStatus,
    technicalReviewRequired: candidate.hasMissingTechnicalData,
    financialBenefitStatus: candidate.financialBenefitStatus
  }));
  const methodology = result.methodologyDisclosures.map((disclosure) => ({ disclosure }));
  [
    XLSX.utils.json_to_sheet(summary, { header: ['metric', 'value'] }),
    XLSX.utils.json_to_sheet(candidates),
    XLSX.utils.json_to_sheet(methodology, { header: ['disclosure'] })
  ].forEach((sheet, index) => XLSX.utils.book_append_sheet(workbook, sheet, CONFIG.EXPORT.SHEETS[index]));
  return new Uint8Array(XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer);
};
