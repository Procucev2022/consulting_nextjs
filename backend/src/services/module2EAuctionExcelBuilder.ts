/**
 * Module 2 — Lever 2: E-Auction / Dynamic Bidding Excel Workbook Builder
 * Builds full 6-sheet workbook per Specification C2 and Prompt 425
 * Compliant with Rule 8, 9, max 300 lines, cyclomatic complexity <= 10
 */

import * as XLSX from 'xlsx';
import type { EAuctionResult, EAuctionMaterialCandidate } from '../types/module2EAuction';
import { applyWorksheetFormatting } from './module2ExcelStylingUtils';

export class Module2EAuctionExcelBuilder {
  public static buildWorkbook(result: EAuctionResult): XLSX.WorkBook {
    const wb = XLSX.utils.book_new();
    const allMats = result.categories.flatMap((c) => c.materials);

    XLSX.utils.book_append_sheet(wb, this.buildExecSummarySheet(result), 'Executive Summary');
    XLSX.utils.book_append_sheet(wb, this.buildCategorySheet(result), 'UNSPSC Category Analysis');
    XLSX.utils.book_append_sheet(wb, this.buildMaterialSheet(allMats), 'Material Candidate Analysis');
    XLSX.utils.book_append_sheet(wb, this.buildTransactionSheet(allMats), 'Purchase History Evidence');
    XLSX.utils.book_append_sheet(wb, this.buildDecisionsSheet(result, allMats), 'Candidate Decisions');
    XLSX.utils.book_append_sheet(wb, this.buildDataQualitySheet(), 'Data Quality and Limitations');

    return wb;
  }

  private static buildExecSummarySheet(result: EAuctionResult): XLSX.WorkSheet {
    const sr = result.summarySavingsRange;
    const execSummaryData = [
      ['PROCUCEV PROCUREMENT ANALYTICS — LEVER 2: E-AUCTION / DYNAMIC BIDDING'],
      ['CANDIDATE IDENTIFICATION & SAVINGS ESTIMATION EXECUTIVE SUMMARY'],
      [''],
      ['Metric', 'Value', 'Unit / Note'],
      ['Assessment ID', result.assessmentId, 'Identifier'],
      ['Customer Name', result.customerName, 'Enterprise Account'],
      ['Total Spend Reviewed (INR)', result.totalSpendReviewedInr, 'INR'],
      ['Total Spend Reviewed (Cr)', result.totalSpendReviewedCr, 'Crores INR'],
      ['Total Addressable Candidate Spend (INR)', result.totalAddressableSpendInr, 'INR'],
      ['Total Addressable Candidate Spend (Cr)', result.totalAddressableSpendCr, 'Crores INR'],
      ['Number of Categories Reviewed', result.categoriesReviewedCount, 'Spend Categories'],
      ['Number of Candidate Categories', result.candidateCategoriesCount, 'Qualified for Dynamic Bidding Review'],
      ['Number of Candidate Materials', result.candidateMaterialsCount, 'Candidate Materials'],
      ['Records Requiring Data Review', result.recordsRequiringDataReviewCount, 'Further Data Required / Not Assessed'],
      ['Minimum Estimated Savings (Cr)', sr.minEstimatedSavingsCr || 0, 'Addressable Spend × Minimum Savings Rate'],
      ['Expected Estimated Savings (Cr)', sr.expectedEstimatedSavingsCr || 0, 'Addressable Spend × Expected Savings Rate'],
      ['Maximum Estimated Savings (Cr)', sr.maxEstimatedSavingsCr || 0, 'Addressable Spend × Maximum Savings Rate'],
      ['Savings Estimation Status', sr.savingsRangeStatus, 'ESTIMATED / NOT YET QUANTIFIABLE'],
      ['Savings Rate Benchmark Source', sr.rateSource || 'N/A', 'Proposed Planning Assumptions — Subject to Management Review'],
      ['Planning Assumption Approval Status', sr.approvalStatus || 'Proposed Planning Assumption — Approval Required', 'Provisional — Approval required by authorised user'],
      ['Governance & Editability', 'EDITABLE_BY_AUTHORISED_USER', 'Planning assumptions editable in governance settings'],
      ['Commercially Validated Savings (INR)', 0, 'Strictly ₹0.00 until live auction execution'],
      ['Commercially Validated Savings (Cr)', 0, 'Crores INR'],
      ['Certification Status', 'INDICATIVE FEASIBILITY ONLY', 'NOT Commercially Validated Savings'],
      ['Important Limitation 1', result.importantLimitations[0] || '', 'Historical evidence limitation'],
      ['Important Limitation 2', result.importantLimitations[1] || '', 'Price dispersion disclaimer'],
      ['Important Limitation 3', result.importantLimitations[2] || '', 'Procurement review prerequisite']
    ];
    const ws = XLSX.utils.aoa_to_sheet(execSummaryData);
    applyWorksheetFormatting(ws, execSummaryData.length, 3);
    return ws;
  }

  private static buildCategorySheet(result: EAuctionResult): XLSX.WorkSheet {
    const catHeaders = [
      'Column L Code', 'Procurement Category', 'Total Spend (INR)', 'Total Spend (Cr)',
      'Addressable Spend (INR)', 'Addressable Spend (Cr)', 'Purchase Quantity', 'UOM',
      'Distinct Material Count', 'PO Count', 'Supplier Count', 'Plant Count',
      'Price Variation Indicator', 'Auction Suitability', 'Savings Range Status',
      'Min Rate (%)', 'Expected Rate (%)', 'Max Rate (%)',
      'Min Estimated Savings (INR)', 'Expected Estimated Savings (INR)', 'Max Estimated Savings (INR)',
      'Benchmark Rate Source', 'Approval Status', 'Confidence', 'Evidence-Based Rationale', 'Data Limitations'
    ];
    const catRows = result.categories.map((c) => {
      const sr = c.savingsRange;
      const minRatePct = sr.minSavingsRate != null ? Number((sr.minSavingsRate * 100).toFixed(2)) : 0;
      const expRatePct = sr.expectedSavingsRate != null ? Number((sr.expectedSavingsRate * 100).toFixed(2)) : 0;
      const maxRatePct = sr.maxSavingsRate != null ? Number((sr.maxSavingsRate * 100).toFixed(2)) : 0;

      return [
        c.unspscCode, c.unspscCategory, c.totalSpendInr, c.totalSpendCr,
        c.addressableSpendInr, c.addressableSpendCr, c.purchaseQuantity, c.uom,
        c.distinctMaterialCount, c.poCount, c.supplierCount, c.plantCount,
        c.priceVariationIndicator, c.auctionSuitability, sr.savingsRangeStatus,
        minRatePct, expRatePct, maxRatePct,
        sr.minEstimatedSavingsInr || 0, sr.expectedEstimatedSavingsInr || 0, sr.maxEstimatedSavingsInr || 0,
        sr.rateSource || 'N/A', sr.approvalStatus || 'UNQUANTIFIABLE', sr.confidence || 'N/A',
        c.evidenceBasedRationale, c.dataLimitations
      ];
    });
    const ws = XLSX.utils.aoa_to_sheet([catHeaders, ...catRows]);
    applyWorksheetFormatting(ws, catRows.length + 1, catHeaders.length);
    return ws;
  }

  private static buildMaterialSheet(allMats: EAuctionMaterialCandidate[]): XLSX.WorkSheet {
    const matHeaders = [
      'Material Code', 'Material Description', 'Procurement Category', 'Column L Code',
      'Financial Year', 'Total Spend (INR)', 'Total Spend (Cr)', 'Addressable Spend (INR)',
      'Addressable Spend (Cr)', 'Total Quantity', 'UOM', 'PO Count', 'Supplier Count',
      'Plant Count', 'Lowest Unit Price', 'Highest Unit Price', 'Price Range',
      'Weighted Average Price', 'Candidate Classification', 'Savings Range Status',
      'Min Rate (%)', 'Expected Rate (%)', 'Max Rate (%)',
      'Min Estimated Savings (INR)', 'Expected Estimated Savings (INR)', 'Max Estimated Savings (INR)',
      'Benchmark Rate Source', 'Approval Status', 'Evidence Supporting Classification', 'Missing Information & Limitations'
    ];
    const matRows = allMats.map((m) => {
      const sr = m.savingsRange;
      const minRatePct = sr.minSavingsRate != null ? Number((sr.minSavingsRate * 100).toFixed(2)) : 0;
      const expRatePct = sr.expectedSavingsRate != null ? Number((sr.expectedSavingsRate * 100).toFixed(2)) : 0;
      const maxRatePct = sr.maxSavingsRate != null ? Number((sr.maxSavingsRate * 100).toFixed(2)) : 0;

      return [
        m.materialCode, m.materialDesc, m.spendCategory, m.unspscCode,
        m.financialYear, m.totalSpendInr, m.totalSpendCr, m.addressableSpendInr,
        m.addressableSpendCr, m.totalQuantity, m.uom, m.poCount, m.supplierCount,
        m.plantCount, m.lowestUnitPrice, m.highestUnitPrice, m.priceRangeStr,
        m.weightedAveragePrice, m.suitability, sr.savingsRangeStatus,
        minRatePct, expRatePct, maxRatePct,
        sr.minEstimatedSavingsInr || 0, sr.expectedEstimatedSavingsInr || 0, sr.maxEstimatedSavingsInr || 0,
        sr.rateSource || 'N/A', sr.approvalStatus || 'UNQUANTIFIABLE',
        m.evidenceRationale, m.missingInfoLimitations
      ];
    });
    const ws = XLSX.utils.aoa_to_sheet([matHeaders, ...matRows]);
    applyWorksheetFormatting(ws, matRows.length + 1, matHeaders.length);
    return ws;
  }

  private static buildTransactionSheet(allMats: EAuctionMaterialCandidate[]): XLSX.WorkSheet {
    const txHeaders = [
      'PO Number', 'PO Date', 'Material Code', 'Material Description', 'Spend Category',
      'Supplier Name', 'Plant Code', 'Quantity', 'Unit Price', 'Currency', 'Spend (INR)'
    ];
    const txRows: unknown[][] = [];
    for (const m of allMats) {
      if (!m.transactions) continue;
      for (const t of m.transactions) {
        txRows.push([
          t.po_number || 'N/A', t.po_date || 'N/A', m.materialCode, m.materialDesc,
          m.spendCategory, t.vendor_name || 'N/A', t.plant || 'N/A',
          t.quantity || 0, t.unit_price || 0, t.currency || 'INR', t.total_spend_inr || 0
        ]);
      }
    }
    const ws = XLSX.utils.aoa_to_sheet([txHeaders, ...txRows]);
    applyWorksheetFormatting(ws, txRows.length + 1, txHeaders.length);
    return ws;
  }

  private static buildDecisionsSheet(
    result: EAuctionResult,
    allMats: EAuctionMaterialCandidate[]
  ): XLSX.WorkSheet {
    const decHeaders = [
      'Record Level', 'Identifier', 'Description', 'Spend (INR)', 'Addressable Spend (INR)',
      'Suitability Decision', 'Savings Range Status', 'Decision Basis', 'Procurement Next Steps'
    ];
    const decRows = [
      ...result.categories.map((c) => [
        'Category', c.spendCategory, c.unspscCategory, c.totalSpendInr, c.addressableSpendInr,
        c.auctionSuitability, c.savingsRange.savingsRangeStatus, c.evidenceBasedRationale,
        'Conduct category strategy review & market discovery'
      ]),
      ...allMats.map((m) => [
        'Material', m.materialCode, m.materialDesc, m.totalSpendInr, m.addressableSpendInr,
        m.suitability, m.savingsRange.savingsRangeStatus, m.evidenceRationale,
        m.procurementReviewRequirements[0] || 'Technical specification alignment'
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet([decHeaders, ...decRows]);
    applyWorksheetFormatting(ws, decRows.length + 1, decHeaders.length);
    return ws;
  }

  private static buildDataQualitySheet(): XLSX.WorkSheet {
    const dqHeaders = [
      'Limitation Domain', 'Scope Affected', 'Source Observation', 'Auction Impact', 'Governance Requirement'
    ];
    const dqRows = [
      [
        'Supplier Capacity & Willingness', 'Enterprise-wide', 'Not tracked in historical SAP POs',
        'Dynamic bidding requires confirmed supplier participation', 'Mandatory pre-auction RFI / supplier sounding'
      ],
      [
        'Specification Comparability', 'Custom & Engineered Items', 'Part numbers may vary across plants',
        'Risk of comparing non-identical specs', 'Engineering & QA specification sign-off'
      ],
      [
        'Incoterms & Freight', 'Multi-Plant Deliveries', 'Landed vs ex-works price variations',
        'Bids must evaluate normalized freight cost', 'Uniform delivery and freight terms in auction RFP'
      ],
      [
        'UNSPSC Taxonomy', 'All Materials', 'Official 8-digit UNSPSC codes unavailable in SAP export',
        'Grouped under unclassified taxonomy bucket', 'Perform master data enrichment and commodity tagging'
      ]
    ];
    const ws = XLSX.utils.aoa_to_sheet([dqHeaders, ...dqRows]);
    applyWorksheetFormatting(ws, dqRows.length + 1, dqHeaders.length);
    return ws;
  }
}
