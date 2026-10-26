/**
 * Module 4 Savings Workbook Builder
 * Builds and saves MODULE_4_FINAL_SAVINGS_EVIDENCE.xlsx across all 26 authoritative sheets.
 */

import * as XLSX from 'xlsx';
import * as path from 'path';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { Module4SavingsForensicEngine } from './module4SavingsForensicEngine';
import { Module4SavingsIndependentCalculator } from './module4SavingsIndependentCalculator';
import { Module4SavingsWorkbookSheetsA } from './module4SavingsWorkbookSheetsA';
import { Module4SavingsWorkbookSheetsB } from './module4SavingsWorkbookSheetsB';
import { MODULE_4_WORKBOOK_FILENAME } from '../constants/module4SavingsForensic';
import { logger } from '../utils/logger';

export class Module4SavingsWorkbookBuilder {
  public static buildWorkbook(destinationPath?: string): { filePath: string; sha256: string } {
    const wb = XLSX.utils.book_new();

    const bridge = Module4SavingsForensicEngine.getFinancialBridge();
    const opps = Module4SavingsForensicEngine.getCanonicalOpportunityLedger();
    const traces = Module4SavingsForensicEngine.getTransactionTrace();
    const levers = Module4SavingsForensicEngine.getLeverGovernance();
    const denoms = Module4SavingsForensicEngine.getDenominatorRegister();
    const overlaps = Module4SavingsForensicEngine.getOverlapLedger();
    const exclusions = Module4SavingsForensicEngine.getExclusions();
    const recalc = Module4SavingsIndependentCalculator.runIndependentRecalculation();
    const tests = Module4SavingsForensicEngine.getTestMatrix();
    const register = Module4SavingsForensicEngine.getCertificationReport();

    Module4SavingsWorkbookSheetsA.appendSheets1To13(
      wb,
      bridge,
      opps,
      traces,
      levers,
      denoms,
      overlaps,
      exclusions
    );

    Module4SavingsWorkbookSheetsB.appendSheets14To26(
      wb,
      bridge,
      recalc,
      tests,
      register
    );

    const lineageRows = Module4SavingsForensicEngine.getCompleteTransactionLineage();
    Module4SavingsWorkbookSheetsB.appendSheet27(wb, lineageRows);

    const lineageSummary = Module4SavingsForensicEngine.getLineageSetReconciliation();
    Module4SavingsWorkbookSheetsB.appendSheet28(wb, lineageSummary);

    const targetPath = destinationPath
      ? path.resolve(destinationPath)
      : path.resolve(process.cwd(), MODULE_4_WORKBOOK_FILENAME);

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    fs.writeFileSync(targetPath, buf);

    const sha256 = crypto.createHash('sha256').update(buf).digest('hex');

    logger.info('Generated Module 4 Savings Final Evidence Workbook', {
      targetPath,
      sheetsCount: wb.SheetNames.length,
      sha256
    });

    return { filePath: targetPath, sha256 };
  }
}
