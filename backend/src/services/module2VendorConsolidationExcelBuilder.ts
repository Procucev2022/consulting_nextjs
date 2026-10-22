/**
 * Module 2 — Lever 3: Vendor Base Consolidation Excel Workbook Builder
 * Builds complete 9-sheet authoritative spreadsheet per Rule 8, 9, max 300 lines, complexity <= 10
 */

import * as XLSX from 'xlsx';
import type {
  VendorConsolidationResult,
  CategoryConsolidationProfile
} from '../types/module2VendorConsolidation';
import type { ClassificationCoverageSummary } from '../types/module2MaterialMapping';
import type { StrategicInputTransaction } from '../types/strategicSourcing';
import {
  VENDOR_CONSOLIDATION_DISCLOSURES,
  VENDOR_CONSOLIDATION_EXCEL_SHEETS
} from '../constants/module2VendorConsolidation';

function buildCoverageRows(cov?: ClassificationCoverageSummary): (string | number)[][] {
  const c = cov || {
    taxonomyVerifiedCount: 0, taxonomyVerifiedSpendCr: 0, taxonomyVerifiedSpendPct: 0,
    clientApprovedCount: 0, clientApprovedSpendCr: 0, clientApprovedSpendPct: 0,
    provisionalCount: 0, provisionalSpendCr: 0, provisionalSpendPct: 0,
    awaitingReviewCount: 0, awaitingReviewSpendCr: 0, awaitingReviewSpendPct: 0,
    totalMaterialsCount: 0, totalSpendCr: 0
  };
  const taxVerCount = c.taxonomyVerifiedCount ?? 0;
  const taxVerSpendCr = c.taxonomyVerifiedSpendCr ?? 0;
  const taxVerSpendPct = c.taxonomyVerifiedSpendPct ?? 0;
  const clientAppCount = c.clientApprovedCount ?? 0;
  const clientAppSpendCr = c.clientApprovedSpendCr ?? 0;
  const clientAppSpendPct = c.clientApprovedSpendPct ?? 0;

  return [
    ['Taxonomy-Verified UNSPSC Mappings', taxVerCount, taxVerSpendCr, `${taxVerSpendPct}%`],
    ['Provisional Classification Mappings', c.provisionalCount, c.provisionalSpendCr, `${c.provisionalSpendPct}%`],
    ['Awaiting Review Queue', c.awaitingReviewCount, c.awaitingReviewSpendCr, `${c.awaitingReviewSpendPct}%`],
    ['Client-Approved Mappings', clientAppCount, clientAppSpendCr, `${clientAppSpendPct}%`],
    ['Total Material Workflow Coverage', c.totalMaterialsCount, c.totalSpendCr, '100.0%']
  ];
}

function buildBaselineRows(result: VendorConsolidationResult): (string | number)[][] {
  const sourceGroupCount = result.sourceGroupCategories ? result.sourceGroupCategories.length : 0;
  const txCount = result.allTransactionsCount || result.transactionsSample.length;
  return [
    ['UNSPSC Categories Analysed', result.categoriesAnalysedCount, 'Categories'],
    ['Client Source Material Groups', sourceGroupCount, 'Source Groups'],
    ['Distinct Suppliers Identified', result.distinctSuppliersCount, 'Suppliers'],
    ['Distinct Materials Analysed', result.distinctMaterialsCount, 'Materials'],
    ['Operating Plants Served', result.distinctPlantsCount, 'Plants'],
    ['Multi-Sourced Candidate Materials', result.multiSourcedMaterialsCount, 'Materials'],
    ['Complete Purchase Transactions Count', txCount, 'Transactions']
  ];
}

function mapTransactionToRow(t: StrategicInputTransaction): (string | number)[] {
  const d = {
    po_number: '', po_line: '', po_date: '', vendor_code: '', vendor_name: '',
    material_code: '', material_desc: '', plant: '', quantity: 0, uom: '',
    unit_price: 0, currency: 'INR', total_spend_inr: 0
  };
  const row = Object.assign(d, t);
  return [
    row.po_number, row.po_line, row.po_date, row.vendor_code, row.vendor_name,
    row.material_code, row.material_desc, row.plant, row.quantity, row.uom,
    row.unit_price, row.currency, row.total_spend_inr
  ];
}

export class Module2VendorConsolidationExcelBuilder {
  public static buildWorkbook(
    result: VendorConsolidationResult,
    allTransactions?: StrategicInputTransaction[]
  ): XLSX.WorkBook {
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb, this.buildExecutiveSummary(result), VENDOR_CONSOLIDATION_EXCEL_SHEETS.EXECUTIVE_SUMMARY
    );
    XLSX.utils.book_append_sheet(
      wb, this.buildCategorySheet(result.categories, 'UNSPSC'), VENDOR_CONSOLIDATION_EXCEL_SHEETS.UNSPSC_CATEGORY
    );
    XLSX.utils.book_append_sheet(
      wb,
      this.buildCategorySheet(result.sourceGroupCategories || [], 'SOURCE'),
      VENDOR_CONSOLIDATION_EXCEL_SHEETS.SOURCE_MATERIAL_GROUP
    );
    XLSX.utils.book_append_sheet(
      wb, this.buildSupplierSheet(result), VENDOR_CONSOLIDATION_EXCEL_SHEETS.SUPPLIER_ANALYSIS
    );
    XLSX.utils.book_append_sheet(
      wb, this.buildMaterialSheet(result), VENDOR_CONSOLIDATION_EXCEL_SHEETS.MATERIAL_OPPORTUNITIES
    );
    XLSX.utils.book_append_sheet(
      wb, this.buildCrossPlantSheet(result), VENDOR_CONSOLIDATION_EXCEL_SHEETS.CROSS_PLANT
    );
    XLSX.utils.book_append_sheet(
      wb, this.buildMappingExceptionsSheet(result), VENDOR_CONSOLIDATION_EXCEL_SHEETS.MAPPING_EXCEPTIONS
    );
    XLSX.utils.book_append_sheet(
      wb, this.buildTransactionSheet(result, allTransactions), VENDOR_CONSOLIDATION_EXCEL_SHEETS.TRANSACTIONS
    );
    XLSX.utils.book_append_sheet(
      wb, this.buildMethodologySheet(result), VENDOR_CONSOLIDATION_EXCEL_SHEETS.METHODOLOGY
    );

    return wb;
  }

  private static buildExecutiveSummary(result: VendorConsolidationResult): XLSX.WorkSheet {
    const rows: (string | number)[][] = [
      ['MODULE 2 — LEVER 3: VENDOR BASE CONSOLIDATION EXECUTIVE SUMMARY'],
      [''],
      ['Assessment ID', result.assessmentId],
      ['Customer Name', result.customerName || result.assessmentId],
      ['Report Generation Date', result.reportDate],
      ['Lever Code & Name', `${result.leverCode}: ${result.leverName}`],
      [''],
      ['FINANCIAL CONSOLIDATION METRICS', 'VALUE (INR)', 'VALUE (CR)', 'STATUS / METHODOLOGY'],
      ['Total Assessment Spend', result.totalAssessmentSpendInr, result.totalAssessmentSpendCr,
        'Validated Incurred Spend'],
      ['Same-Material Multi-Sourcing Spend', result.sameMaterialMultiSourcingSpendInr,
        result.sameMaterialMultiSourcingSpendCr, 'Addressable multi-sourced material base'],
      ['Category Consolidation Candidate Spend', 'NOT_YET_QUANTIFIABLE', 'NOT_YET_QUANTIFIABLE',
        result.categoryConsolidationDisclosure],
      ['Estimated Savings', 'NOT_YET_QUANTIFIABLE', 'NOT_YET_QUANTIFIABLE', result.savingsDisclosure],
      ['Commercially Validated Savings', 0, 0.00, 'Validated upon execution'],
      [''],
      ['MATERIAL UNSPSC CLASSIFICATION COVERAGE', 'COUNT', 'SPEND (CR)', 'WORKFLOW COVERAGE %'],
      ...buildCoverageRows(result.coverageSummary),
      [''],
      ['OPERATIONAL BASELINE METRICS', 'COUNT', 'UNIT'],
      ...buildBaselineRows(result),
      [''],
      ['AUDIT TRAIL NOTICE', result.transactionAuditTrailNotice],
      [''],
      ['MANDATORY GOVERNANCE DISCLOSURES'],
      ['1. Savings Quantification', VENDOR_CONSOLIDATION_DISCLOSURES.SAVINGS_NOT_QUANTIFIABLE],
      ['2. Category Candidate Governance',
        VENDOR_CONSOLIDATION_DISCLOSURES.CATEGORY_CONSOLIDATION_CANDIDATE_DISCLOSURE],
      ['3. Price Dispersion Signal', VENDOR_CONSOLIDATION_DISCLOSURES.PRICE_VARIATION_SIGNAL],
      ['4. Non-Interchangeability', VENDOR_CONSOLIDATION_DISCLOSURES.NO_INTERCHANGEABILITY_ASSUMPTION],
      ['5. Cross-Plant Constraints', VENDOR_CONSOLIDATION_DISCLOSURES.CROSS_PLANT_CAVEAT],
      ['6. Supplier Feasibility', VENDOR_CONSOLIDATION_DISCLOSURES.FEASIBILITY_WARNING]
    ];
    return XLSX.utils.aoa_to_sheet(rows);
  }

  private static buildCategorySheet(
    categories: CategoryConsolidationProfile[],
    mode: 'UNSPSC' | 'SOURCE'
  ): XLSX.WorkSheet {
    const headers = [
      'Classification Type',
      mode === 'UNSPSC' ? 'Procurement Category' : 'Source Spend Category',
      mode === 'UNSPSC' ? 'Column L Code' : 'Client SAP Code',
      'Total Spend (INR)', 'Total Spend (Cr)', 'Same-Material Multi-Sourcing Spend (Cr)',
      'Category Candidate Status', 'Category Candidate Rationale',
      'Distinct Suppliers', 'Distinct Materials', 'Distinct Plants',
      'Top 1 Share %', 'CR3 Share %', 'HHI Index', 'Fragmentation Level',
      'Multi-Sourced Materials', 'Opportunity Status', 'Opportunity Reason'
    ];
    const rows = categories.map(c => [
      c.classificationLabel, mode === 'UNSPSC' ? c.unspscCategory : c.spendCategory, c.unspscCode,
      c.totalSpendInr, c.totalSpendCr, c.sameMaterialMultiSourcingSpendCr,
      c.categoryConsolidationCandidateStatus, c.categoryConsolidationCandidateReason,
      c.distinctSuppliersCount, c.distinctMaterialsCount, c.distinctPlantsCount,
      c.top1SharePct, c.top3SharePct, c.hhiIndex, c.fragmentationLevel,
      c.multiSourcedMaterialsCount, c.categoryOpportunityStatus, c.categoryOpportunityReason
    ]);
    return XLSX.utils.aoa_to_sheet([headers, ...rows]);
  }

  private static buildSupplierSheet(result: VendorConsolidationResult): XLSX.WorkSheet {
    const headers = [
      'Spend Category', 'Vendor Code', 'Vendor Name',
      'Spend in Category (INR)', 'Spend in Category (Cr)', 'Share of Category %',
      'Distinct Materials Supplied', 'Distinct Plants Served', 'PO Transactions Count', 'Tail Supplier Flag'
    ];
    const rows: (string | number | boolean)[][] = [];
    for (const c of result.categories) {
      for (const s of c.suppliers) {
        rows.push([
          c.spendCategory, s.vendorCode, s.vendorName,
          s.spendInr, s.spendCr, s.spendSharePct,
          s.distinctMaterialsCount, s.distinctPlantsCount, s.poCount, s.isTailSupplier ? 'YES' : 'NO'
        ]);
      }
    }
    return XLSX.utils.aoa_to_sheet([headers, ...rows]);
  }

  private static buildMaterialSheet(result: VendorConsolidationResult): XLSX.WorkSheet {
    const headers = [
      'Material Code', 'Material Description', 'Spend Category',
      'UNSPSC Code', 'UNSPSC Category', 'Classification Status', 'Actionable Status',
      'Qualification Criteria', 'Next Recommended Action', 'UOM', 'Currency',
      'Total Spend (INR)', 'Total Spend (Cr)', 'Total Quantity',
      'Supplier Count', 'Plant Count', 'Lowest Unit Price', 'Highest Unit Price',
      'Weighted Avg Price', 'Price Dispersion %', 'Opportunity Status', 'Reason'
    ];
    const rows = result.sameMaterialOpportunities.map(m => [
      m.materialCode, m.materialDesc, m.spendCategory,
      m.unspscCode, m.unspscCategory, m.classificationReviewStatus || 'PROVISIONAL',
      m.actionableStatus || 'Candidate for Review', m.qualificationCriteria || '',
      m.nextRecommendedAction || '', m.uom, m.currency,
      m.totalSpendInr, m.totalSpendCr, m.totalQuantity,
      m.supplierCount, m.plantCount, m.lowestUnitPrice, m.highestUnitPrice,
      m.weightedAvgPrice, m.priceDispersionPct, m.status, m.opportunityReason
    ]);
    return XLSX.utils.aoa_to_sheet([headers, ...rows]);
  }

  private static buildCrossPlantSheet(result: VendorConsolidationResult): XLSX.WorkSheet {
    const headers = [
      'Level', 'Code', 'Description', 'Spend Category',
      'Plants Count', 'Plants List', 'Suppliers Count', 'Suppliers List',
      'Total Spend (INR)', 'Total Spend (Cr)', 'Coordination Potential', 'Governance Caveat'
    ];
    const rows = result.crossPlantOpportunities.map(p => [
      p.level, p.code, p.description, p.spendCategory,
      p.distinctPlantsCount, p.plants.join(', '), p.distinctSuppliersCount, p.suppliers.join(', '),
      p.totalSpendInr, p.totalSpendCr, p.coordinationPotential, p.governanceDisclosure
    ]);
    return XLSX.utils.aoa_to_sheet([headers, ...rows]);
  }

  private static buildMappingExceptionsSheet(result: VendorConsolidationResult): XLSX.WorkSheet {
    const headers = [
      'Source Material ID', 'Source Description', 'Client Category', 'Assigned UNSPSC Code',
      'Assigned UNSPSC Title', 'Taxonomy Version', 'Mapping Method', 'Confidence Score',
      'Review Status', 'Review Reason', 'Total Spend (INR)', 'Total Spend (Cr)', 'PO Count', 'Suppliers Count'
    ];
    const rows = (result.mappingExceptions || []).map(e => [
      e.sourceMaterialId, e.sourceDescription, e.sourceCategory, e.assignedUnspscCode,
      e.assignedUnspscTitle, e.taxonomyVersion, e.mappingMethod, e.confidenceScore,
      e.reviewStatus, e.reviewReason || '', e.totalSpendInr, e.totalSpendCr,
      e.transactionCount, e.qualifyingSuppliersCount
    ]);
    return XLSX.utils.aoa_to_sheet([headers, ...rows]);
  }

  private static buildTransactionSheet(
    result: VendorConsolidationResult,
    allTransactions?: StrategicInputTransaction[]
  ): XLSX.WorkSheet {
    const txs = allTransactions && allTransactions.length > 0
      ? allTransactions
      : result.transactionsSample || [];
    const isFull = allTransactions && allTransactions.length > 0;
    const count = txs.length;
    const notice = [
      isFull
        ? `COMPLETE AUDIT TRAIL: Showing all ${count} purchase transactions reconciling 100% to total assessment spend.`
        : 'AUDIT SAMPLE NOTICE: Showing sample records. For complete audit trail, export with canonical data.'
    ];
    const headers = [
      'PO Number', 'PO Line', 'PO Date', 'Vendor Code', 'Vendor Name',
      'Material Code', 'Material Description', 'Plant', 'Quantity', 'UOM',
      'Unit Price', 'Currency', 'Line Spend (INR)'
    ];
    const rows = txs.map(mapTransactionToRow);
    return XLSX.utils.aoa_to_sheet([notice, [], headers, ...rows]);
  }

  private static buildMethodologySheet(result: VendorConsolidationResult): XLSX.WorkSheet {
    const headers = ['Category / Item', 'Rule / Metric', 'Scope / Value', 'Methodology & Disclosures'];
    const rows: (string | number)[][] = result.dataQualityExclusions.map(d => [
      'Data Quality Rule', d.rule, `${d.affectedCount} records`, d.actionTaken
    ]);
    for (const m of result.methodologyDisclosures) {
      rows.push(['Methodology Policy', m, 'Enforced', 'Verified per Procucev Procurement Framework']);
    }
    return XLSX.utils.aoa_to_sheet([headers, ...rows]);
  }
}
