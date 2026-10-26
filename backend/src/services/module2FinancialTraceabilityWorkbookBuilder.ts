/**
 * Module 2 Final Traceability Evidence Workbook Builder
 * Generates MODULE_2_FINAL_TRACEABILITY_EVIDENCE.xlsx with all 20 transaction-traceable sheets.
 * Version: MODULE_2_TRACEABILITY_V1.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as XLSX from 'xlsx';
import { Module2CanonicalService } from './module2CanonicalService';
import { Module2FinancialTraceabilityEngine } from './module2FinancialTraceabilityEngine';
import { Module2FinancialTraceabilityTestEvaluator } from './module2FinancialTraceabilityTestEvaluator';
import { Module2TraceabilityWorkbookSheets } from './module2TraceabilityWorkbookSheets';
import { TRACEABILITY_WORKBOOK_FILENAME } from '../constants/module2FinancialTraceability';
import { logger } from '../utils/logger';

export class Module2FinancialTraceabilityWorkbookBuilder {
  private static appendSheet<T>(wb: XLSX.WorkBook, data: T[], sheetName: string): void {
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  public static buildWorkbook(): {
    workbookPath: string;
    workbookSha256: string;
    sheetsCount: number;
    sheets: string[];
  } {
    const txs = Module2CanonicalService.getCanonicalTransactions();
    const summary = Module2FinancialTraceabilityEngine.getAuditSummary();
    const txLineage = Module2FinancialTraceabilityEngine.buildTransactionLineage(txs);
    const oppLineage = Module2FinancialTraceabilityEngine.buildOpportunityLineage(txs);
    const denoms = Module2FinancialTraceabilityEngine.buildDenominatorReconciliation();
    const cats = Module2FinancialTraceabilityEngine.buildCategoryReconciliation();
    const overlaps = Module2FinancialTraceabilityEngine.buildOverlapTrace(txs);
    const provens = Module2FinancialTraceabilityEngine.buildProvenOpportunityTrace(txs);
    const testResults = Module2FinancialTraceabilityTestEvaluator.evaluateAll(
      oppLineage,
      denoms,
      provens,
      overlaps,
      cats,
      summary
    );

    const wb = XLSX.utils.book_new();

    // 01_EXECUTIVE_CERTIFICATION
    this.appendSheet(wb, Module2TraceabilityWorkbookSheets.buildExecCertSheet(summary), '01_EXECUTIVE_CERTIFICATION');

    // 02_GOLDEN_BASELINE
    this.appendSheet(wb, Module2TraceabilityWorkbookSheets.buildGoldenBaselineSheet(summary), '02_GOLDEN_BASELINE');

    // 03_TRANSACTION_LINEAGE (sample top 500 for compact sheet size while preserving drillability)
    this.appendSheet(wb, txLineage.slice(0, 500), '03_TRANSACTION_LINEAGE');

    // 04_OPPORTUNITY_LINEAGE
    this.appendSheet(wb, oppLineage, '04_OPPORTUNITY_LINEAGE');

    // 05_DENOMINATOR_RECONCILIATION
    this.appendSheet(wb, denoms, '05_DENOMINATOR_RECONCILIATION');

    // 06_VOLUME_BUNDLING_TRACE
    const volRows = oppLineage.filter((o) => o.primaryLever.includes('Bundling'));
    this.appendSheet(wb, volRows, '06_VOLUME_BUNDLING_TRACE');

    // 07_VENDOR_CONSOLIDATION_TRACE
    const consolRows = oppLineage.filter((o) => o.primaryLever.includes('Consolidation'));
    this.appendSheet(wb, consolRows, '07_VENDOR_CONSOLIDATION_TRACE');

    // 08_E_AUCTION_TRACE
    const eauctionRows = oppLineage.filter((o) => o.primaryLever.includes('Auction'));
    this.appendSheet(wb, eauctionRows, '08_E_AUCTION_TRACE');

    // 09_PRICE_VARIANCE_TRACE
    const priceVarRows = oppLineage.filter((o) => o.primaryLever.includes('Variance'));
    this.appendSheet(wb, priceVarRows, '09_PRICE_VARIANCE_TRACE');

    // 10_PROVEN_OPPORTUNITY_TRACE
    this.appendSheet(wb, provens, '10_PROVEN_OPPORTUNITY_TRACE');

    // 11_OVERLAP_TRACE
    this.appendSheet(wb, overlaps, '11_OVERLAP_TRACE');

    // 12_CATEGORY_RECONCILIATION
    this.appendSheet(wb, Module2TraceabilityWorkbookSheets.buildCategoryReconciliationSheet(cats), '12_CATEGORY_RECONCILIATION');

    // 13_PRODUCTION_VS_INDEPENDENT
    this.appendSheet(wb, Module2TraceabilityWorkbookSheets.buildProductionVsIndependentSheet(summary), '13_PRODUCTION_VS_INDEPENDENT');

    // 14_ASSUMPTION_REGISTER
    this.appendSheet(wb, Module2TraceabilityWorkbookSheets.buildAssumptionRegisterSheet(), '14_ASSUMPTION_REGISTER');

    // 15_EXCLUSIONS
    this.appendSheet(wb, Module2TraceabilityWorkbookSheets.buildExclusionsSheet(summary), '15_EXCLUSIONS');

    // 16_DELIVERY_RANGE
    this.appendSheet(wb, Module2TraceabilityWorkbookSheets.buildDeliveryRangeSheet(summary), '16_DELIVERY_RANGE');

    // 17_UI_API_REPORT_PARITY
    this.appendSheet(wb, Module2TraceabilityWorkbookSheets.buildUiApiReportParitySheet(summary), '17_UI_API_REPORT_PARITY');

    // 18_TEST_RESULTS
    this.appendSheet(wb, testResults, '18_TEST_RESULTS');

    // 19_CHECKSUMS
    this.appendSheet(wb, Module2TraceabilityWorkbookSheets.buildChecksumsSheet(summary), '19_CHECKSUMS');

    // 20_FINAL_SIGNOFF
    this.appendSheet(wb, Module2TraceabilityWorkbookSheets.buildFinalSignoffSheet(summary), '20_FINAL_SIGNOFF');

    const destPath = path.resolve(process.cwd(), TRACEABILITY_WORKBOOK_FILENAME);
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    fs.writeFileSync(destPath, buf);

    const hash = crypto.createHash('sha256').update(buf).digest('hex');
    logger.info('Generated MODULE_2_FINAL_TRACEABILITY_EVIDENCE.xlsx', {
      destination: destPath,
      sha256: hash,
      sheetsCount: wb.SheetNames.length
    });

    return {
      workbookPath: destPath,
      workbookSha256: hash,
      sheetsCount: wb.SheetNames.length,
      sheets: wb.SheetNames
    };
  }
}
