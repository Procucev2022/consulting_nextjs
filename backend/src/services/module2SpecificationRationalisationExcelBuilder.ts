/**
 * Module 2 — Lever 8: Specification Rationalisation Excel Builder (Phase 1)
 * Multi-Sheet Authoritative Spreadsheet Export
 * Compliant with Rule 4, 8, 9, max 300 lines, line length <= 120 chars, complexity <= 10
 */

import * as XLSX from 'xlsx';
import type {
  SpecificationRationalisationResult,
  SpecificationCandidateItem
} from '../types/module2SpecificationRationalisation';
import { SPECIFICATION_EXCEL_SHEETS } from '../constants/module2SpecificationRationalisation';

function buildExecutiveRows(res: SpecificationRationalisationResult): (string | number)[][] {
  const sum = res.summary;
  return [
    ['STRATEGIC SOURCING LEVER 8 — SPECIFICATION RATIONALISATION (PHASE 1)'],
    ['Assessment Identifier', sum.tenantId],
    ['Customer Name', res.customerName],
    ['Generated At', res.calculatedAt],
    ['Financial Benefit Status', sum.financialBenefitStatus],
    [],
    ['EXECUTIVE SUMMARY KPI METRICS'],
    ['Total Materials Assessed', sum.totalMaterialsAssessedCount],
    ['Total Rationalisation Candidates Identified', sum.totalCandidatesIdentifiedCount],
    ['Candidates Awaiting Technical Review', sum.awaitingTechnicalReviewCount],
    ['Technically Verified Candidates', sum.technicallyVerifiedCount],
    ['Rejected Candidates', sum.rejectedCount],
    ['Potential Matches (Initial Identification)', sum.potentialMatchCount],
    ['Candidates With Missing Technical Data', sum.candidatesWithMissingTechnicalDataCount],
    ['Total Expenditure Under Review (Cr)', sum.totalExpenditureUnderReviewCr],
    ['Total Expenditure Under Review (INR)', sum.totalExpenditureUnderReviewInr],
    ['Commercial Savings Quantified (Cr)', sum.commercialSavingsQuantifiedCr],
    ['Commercial Savings Quantified (INR)', sum.commercialSavingsQuantifiedInr],
    [],
    ['FINANCIAL GOVERNANCE SAFEGUARD'],
    ['Notice', 'Phase 1 is strictly for identification and technical review; zero financial savings are quantified.']
  ];
}

function buildCandidateRows(candidates: SpecificationCandidateItem[]): (string | number)[][] {
  const headers = [
    'Candidate ID', 'Spend Category', 'Identification Type', 'Review Status',
    'Primary Code', 'Primary Description', 'Comparison Code', 'Comparison Description',
    'Similarity Score', 'Differences Count', 'Missing Attributes Count',
    'Expenditure Under Review (Cr)', 'Expenditure Under Review (INR)', 'Quantity Under Review',
    'Next Required Action', 'Related Levers'
  ];
  const rows: (string | number)[][] = [headers];

  for (const c of candidates) {
    rows.push([
      c.candidateId, c.spendCategory, c.identificationType, c.reviewStatus,
      c.primaryItem.code || 'N/A', c.primaryItem.description,
      c.comparisonItem.code || 'N/A', c.comparisonItem.description,
      c.similarityScore, c.differencesIdentified.length, c.missingAttributesDisclosed.length,
      c.expenditureUnderReviewCr, c.expenditureUnderReviewInr, c.quantityUnderReview,
      c.nextRequiredAction, c.potentialRelatedLevers.join(', ')
    ]);
  }
  return rows;
}

function buildAttributeComparisonRows(candidates: SpecificationCandidateItem[]): (string | number)[][] {
  const headers = [
    'Candidate ID', 'Attribute Name', 'Primary Item Value',
    'Comparison Item Value', 'Match Status', 'Is Critical Spec'
  ];
  const rows: (string | number)[][] = [headers];

  for (const c of candidates) {
    for (const attr of c.technicalAttributes) {
      rows.push([
        c.candidateId, attr.attributeName, attr.sourceValue || 'N/A (Missing)',
        attr.candidateValue || 'N/A (Missing)', attr.matchStatus, attr.isCritical ? 'YES' : 'NO'
      ]);
    }
  }
  return rows;
}

function buildDataGapRows(candidates: SpecificationCandidateItem[]): (string | number)[][] {
  const headers = ['Candidate ID', 'Primary Item Description', 'Comparison Item Description', 'Data Gap Disclosed'];
  const rows: (string | number)[][] = [headers];

  for (const c of candidates) {
    if (c.missingAttributesDisclosed.length > 0) {
      for (const gap of c.missingAttributesDisclosed) {
        rows.push([c.candidateId, c.primaryItem.description, c.comparisonItem.description, gap]);
      }
    }
  }
  return rows;
}

function buildReviewHistoryRows(candidates: SpecificationCandidateItem[]): (string | number)[][] {
  const headers = [
    'Candidate ID', 'Review ID', 'Reviewer Name', 'Reviewer Role',
    'Review Date', 'Review Status', 'Technical Justification', 'Proposed Standard', 'Rejection Reason'
  ];
  const rows: (string | number)[][] = [headers];

  for (const c of candidates) {
    for (const r of c.reviewHistory) {
      rows.push([
        c.candidateId, r.reviewId, r.reviewerName, r.reviewerRole || 'N/A',
        r.reviewDate, r.status, r.technicalJustification, r.proposedStandard || 'N/A', r.rejectionReason || 'N/A'
      ]);
    }
  }
  return rows;
}

function buildMethodologyRows(res: SpecificationRationalisationResult): (string | number)[][] {
  const rows: (string | number)[][] = [
    ['METHODOLOGY DISCLOSURES & TECHNICAL SAFEGUARDS'],
    ['Financial Disclaimer', res.financialDisclaimer],
    []
  ];

  for (let i = 0; i < res.methodologyDisclosures.length; i++) {
    rows.push([`Rule ${i + 1}`, res.methodologyDisclosures[i]]);
  }
  return rows;
}

export class Module2SpecificationRationalisationExcelBuilder {
  public static buildWorkbook(res: SpecificationRationalisationResult): Buffer {
    const wb = XLSX.utils.book_new();

    const addSheet = (name: string, rows: (string | number)[][]): void => {
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
    };

    addSheet(SPECIFICATION_EXCEL_SHEETS.SHEET_1_EXECUTIVE, buildExecutiveRows(res));
    addSheet(SPECIFICATION_EXCEL_SHEETS.SHEET_2_CANDIDATES, buildCandidateRows(res.candidates));
    addSheet(SPECIFICATION_EXCEL_SHEETS.SHEET_3_ATTRIBUTES, buildAttributeComparisonRows(res.candidates));
    addSheet(SPECIFICATION_EXCEL_SHEETS.SHEET_4_DATA_GAPS, buildDataGapRows(res.candidates));
    addSheet(SPECIFICATION_EXCEL_SHEETS.SHEET_5_REVIEW_HISTORY, buildReviewHistoryRows(res.candidates));
    addSheet(SPECIFICATION_EXCEL_SHEETS.SHEET_6_METHODOLOGY, buildMethodologyRows(res));

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }
}
