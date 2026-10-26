/**
 * Module 2 — Lever 6: Category Specialisation Excel Workbook Builder
 * Builds complete 8-sheet authoritative spreadsheet per Prompt 451 requirements
 * Compliant with Rule 4, 8, 9, max 300 lines, complexity <= 10
 */

import * as XLSX from 'xlsx';
import type { CategorySpecialisationResult } from '../types/module2CategorySpecialisation';
import { LEVER6_EXCEL_SHEETS } from '../constants/module2CategorySpecialisation';

function buildExecutiveRows(res: CategorySpecialisationResult): (string | number)[][] {
  const sum = res.summary;
  return [
    ['STRATEGIC SOURCING LEVER 6 — CATEGORY SPECIALISATION AUDIT DOSSIER'],
    ['Assessment Identifier', sum.tenantId],
    ['Customer Name', res.customerName],
    ['Generated At', res.calculatedAt],
    ['Planning Disclaimer', res.generalDisclaimer],
    [],
    ['EXECUTIVE SUMMARY KEY PERFORMANCE INDICATORS'],
    ['Total Procurement Spend Assessed (Cr)', sum.totalProcurementSpendCr],
    ['Total Procurement Spend Assessed (INR)', sum.totalProcurementSpendInr],
    ['Categories Assessed Count', sum.categoriesAssessedCount],
    ['Priority A (Strategic) Categories Count', sum.priorityACount],
    ['Priority B (Optimisation) Categories Count', sum.priorityBCount],
    ['Priority C (Routine) Categories Count', sum.priorityCCount],
    ['Categories Requiring Specialised Intervention', sum.categoriesRequiringSpecialisedInterventionCount],
    [],
    ['OPPORTUNITY ESTIMATES (GROSS VS NET INDICATIVE)'],
    ['Gross Tentative Opportunity — Low (Cr)', sum.grossTentativeOpportunityLowCr],
    ['Gross Tentative Opportunity — Base (Cr)', sum.grossTentativeOpportunityBaseCr],
    ['Gross Tentative Opportunity — High (Cr)', sum.grossTentativeOpportunityHighCr],
    ['Net Indicative Opportunity — Low (Cr)', sum.netIndicativeOpportunityLowCr],
    ['Net Indicative Opportunity — Base (Cr)', sum.netIndicativeOpportunityBaseCr],
    ['Net Indicative Opportunity — High (Cr)', sum.netIndicativeOpportunityHighCr],
    ['Opportunities Requiring Overlap Review Count', sum.opportunitiesRequiringOverlapReviewCount],
    ['Overlap Review Amount (Cr)', sum.overlapReviewAmountCr],
    ['Identified Opportunities Without Quantified Benefit Count', sum.unquantifiedOpportunitiesCount],
    [],
    ['RECOMMENDED CATEGORY MANAGEMENT RESOURCING'],
    ['Dedicated Category Manager Count', sum.dedicatedManagerCount],
    ['Shared Category Manager Count', sum.sharedManagerCount],
    ['Centralised Category Management Count', sum.centralisedManagementCount],
    ['Standard or Automated Procurement Count', sum.automatedProcurementCount]
  ];
}

function buildCategoryRows(res: CategorySpecialisationResult): (string | number)[][] {
  const headers = [
    'Category Name', 'Priority Classification', 'Priority Rationale', 'Recommended Approach',
    'Annual Spend (Cr)', 'Spend Share (%)', 'Tx Count', 'Suppliers Count', 'Materials Count',
    'Plants Count', 'Top Supplier Share (%)', 'HHI Index', 'Price Var Coeff', 'Validation Status'
  ];
  const rows: (string | number)[][] = [headers];
  for (const c of res.categories) {
    rows.push([
      c.categoryName, c.priority, c.priorityRationale, c.recommendedApproach,
      c.annualSpendCr, `${c.spendSharePct}%`, c.transactionCount, c.distinctSuppliersCount,
      c.distinctMaterialsCount, c.distinctPlantsCount, `${c.topSupplierConcentrationPct}%`,
      c.herfindahlIndex, c.priceVariationCoefficient, c.validationStatus
    ]);
  }
  return rows;
}

function buildOpportunityRows(res: CategorySpecialisationResult): (string | number)[][] {
  const headers = [
    'Category Name', 'Head Code', 'Opportunity Head Title', 'Eligible Spend (Cr)',
    'Low Assumption (%)', 'Base Assumption (%)', 'High Assumption (%)',
    'Low Estimate (Cr)', 'Base Estimate (Cr)', 'High Estimate (Cr)',
    'Commercial Mechanism', 'Eligibility Rule', 'Opportunity Status',
    'Data Status', 'Related Lever', 'Operating Cost Only'
  ];
  const rows: (string | number)[][] = [headers];
  for (const c of res.categories) {
    for (const opp of c.opportunities) {
      rows.push([
        opp.categoryName, opp.headCode, opp.headTitle, opp.eligibleAnnualSpendCr,
        opp.lowAssumptionPct, opp.baseAssumptionPct, opp.highAssumptionPct,
        opp.lowEstimateCr, opp.baseEstimateCr, opp.highEstimateCr,
        opp.commercialMechanism, opp.eligibilityRule, opp.opportunityStatus,
        opp.dataAndEvidenceStatus, opp.relatedLever || 'NONE', opp.appliesToOperatingCost ? 'YES' : 'NO'
      ]);
    }
  }
  return rows;
}

function buildCalculationDetailsRows(res: CategorySpecialisationResult): (string | number)[][] {
  const headers = [
    'Category Name', 'Head Code', 'Opportunity Head', 'Eligible Spend (INR)',
    'Is Eligible Established', 'Commercial Mechanism', 'Eligibility Rule',
    'Calculation Rationale', 'Validation Requirements', 'Disclaimer'
  ];
  const rows: (string | number)[][] = [headers];
  for (const c of res.categories) {
    for (const opp of c.opportunities) {
      rows.push([
        opp.categoryName, opp.headCode, opp.headTitle, opp.eligibleAnnualSpendInr,
        opp.isEligibleEstablished ? 'YES' : 'NO', opp.commercialMechanism, opp.eligibilityRule,
        opp.calculationRationale, opp.validationRequirements, opp.disclaimer
      ]);
    }
  }
  return rows;
}

function buildOverlapRows(res: CategorySpecialisationResult): (string | number)[][] {
  const headers = [
    'Category Name', 'Opportunity Head', 'Related Lever', 'Eligible Spend (Cr)',
    'Gross Potential Benefit (Cr)', 'Overlap Status', 'Deduplication Treatment',
    'Net Indicative Benefit (Cr)', 'Amount Excluded (Cr)', 'Exclusion Reason', 'Evidence Status'
  ];
  const rows: (string | number)[][] = [headers];
  for (const o of res.overlapItems) {
    rows.push([
      o.categoryName, o.headTitle, o.relatedLever || 'NONE', o.eligibleSpendCr,
      o.grossPotentialBenefitCr, o.overlapStatus, o.deduplicationTreatment,
      o.netIndicativeBenefitCr, o.amountExcludedCr, o.exclusionReason, o.evidenceAndApprovalStatus
    ]);
  }
  return rows;
}

function buildResourceRows(res: CategorySpecialisationResult): (string | number)[][] {
  const headers = [
    'Category Name', 'Priority', 'Annual Spend (Cr)', 'Plants Served', 'Tx Volume',
    'Recommended Approach', 'Approach Rationale', 'Data Limitations'
  ];
  const rows: (string | number)[][] = [headers];
  for (const c of res.categories) {
    rows.push([
      c.categoryName, c.priority, c.annualSpendCr, c.distinctPlantsCount, c.transactionCount,
      c.recommendedApproach, c.approachRationale, c.dataLimitations
    ]);
  }
  return rows;
}

function buildDataGapRows(res: CategorySpecialisationResult): (string | number)[][] {
  const headers = ['Category Name', 'Validation Status', 'Disclosed Evidence Limitations'];
  const rows: (string | number)[][] = [headers];
  for (const c of res.categories) {
    rows.push([c.categoryName, c.validationStatus, c.dataLimitations]);
  }
  return rows;
}

function buildMethodologyRows(res: CategorySpecialisationResult): (string | number)[][] {
  const rows: (string | number)[][] = [
    ['LEVER 6 PLANNING ASSUMPTIONS & METHODOLOGY DISCLOSURES'],
    [],
    ['CENTRAL OPPORTUNITY HEAD PLANNING ASSUMPTIONS (MIDPOINT BASE CASE)'],
    ['Code', 'Opportunity Head Title', 'Low (%)', 'Base (%)', 'High (%)', 'Related Lever', 'Operating Cost Pool']
  ];
  for (const a of res.opportunityHeadAssumptions) {
    rows.push([
      a.code, a.title, `${a.lowPct}%`, `${a.basePct}%`, `${a.highPct}%`,
      a.relatedLever || 'NONE', a.appliesToOperatingCost ? 'YES' : 'NO'
    ]);
  }
  rows.push([], ['METHODOLOGY RULES & SAFEGUARDS']);
  for (let i = 0; i < res.methodologyDisclosures.length; i++) {
    rows.push([`${i + 1}.`, res.methodologyDisclosures[i]]);
  }
  return rows;
}

export class Module2CategorySpecialisationExcelBuilder {
  public static buildWorkbook(res: CategorySpecialisationResult): Buffer {
    const wb = XLSX.utils.book_new();

    const addSheet = (name: string, data: (string | number)[][]): void => {
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, name);
    };

    addSheet(LEVER6_EXCEL_SHEETS.SHEET_1_EXECUTIVE, buildExecutiveRows(res));
    addSheet(LEVER6_EXCEL_SHEETS.SHEET_2_CATEGORIES, buildCategoryRows(res));
    addSheet(LEVER6_EXCEL_SHEETS.SHEET_3_OPPORTUNITIES, buildOpportunityRows(res));
    addSheet(LEVER6_EXCEL_SHEETS.SHEET_4_CALCULATIONS, buildCalculationDetailsRows(res));
    addSheet(LEVER6_EXCEL_SHEETS.SHEET_5_OVERLAPS, buildOverlapRows(res));
    addSheet(LEVER6_EXCEL_SHEETS.SHEET_6_RESOURCES, buildResourceRows(res));
    addSheet(LEVER6_EXCEL_SHEETS.SHEET_7_DATA_GAPS, buildDataGapRows(res));
    addSheet(LEVER6_EXCEL_SHEETS.SHEET_8_METHODOLOGY, buildMethodologyRows(res));

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }
}
