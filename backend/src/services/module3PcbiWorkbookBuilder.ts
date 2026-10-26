/**
 * PCBI Module 3 Forensic Evidence Workbook Builder
 * Generates the authoritative 25-sheet evidence workbook `MODULE_3_PCBI_FORENSIC_EVIDENCE.xlsx`.
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';
import { Module3PcbiForensicEngine } from './module3PcbiForensicEngine';
import { Module3PcbiIndependentCalculator } from './module3PcbiIndependentCalculator';
import { Module3PcbiWorkbookSheetsA } from './module3PcbiWorkbookSheetsA';
import { Module3PcbiWorkbookSheetsB } from './module3PcbiWorkbookSheetsB';
import { logger } from '../utils/logger';
import type { PcbiCustomerTransactionBenchmarkRecord } from '../types/module3PcbiForensic';

export class Module3PcbiWorkbookBuilder {
  public static buildWorkbook(
    outputPath?: string,
    customLedger?: PcbiCustomerTransactionBenchmarkRecord[]
  ): { filePath: string; sha256: string; sheetsCount: number } {
    const targetPath = outputPath
      ? path.resolve(outputPath)
      : path.resolve(process.cwd(), 'MODULE_3_PCBI_FORENSIC_EVIDENCE.xlsx');

    const wb = XLSX.utils.book_new();

    const { ledger: defaultLedger, reconciliation, priceGap } = Module3PcbiForensicEngine.processCustomerLedger();
    const ledger = customLedger ?? defaultLedger;
    const { comparisons } = Module3PcbiIndependentCalculator.runIndependentRecalculation();
    const testMatrix = Module3PcbiForensicEngine.getTestMatrix();
    const provenance = Module3PcbiForensicEngine.getSourceProvenanceRecords();

    // Sheets 01 to 07
    Module3PcbiWorkbookSheetsA.appendExecutiveSheets(wb, reconciliation, priceGap, provenance);

    // Sheets 08 to 14
    Module3PcbiWorkbookSheetsA.appendTransformationSheets(wb, ledger, priceGap);

    // Sheets 15 to 25
    Module3PcbiWorkbookSheetsB.appendAuditAndGovernanceSheets(
      wb,
      ledger,
      reconciliation,
      priceGap,
      comparisons,
      testMatrix
    );

    // Write workbook to file
    XLSX.writeFile(wb, targetPath);

    const fileBuffer = fs.readFileSync(targetPath);
    const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    logger.info('Generated Module 3 PCBI Forensic Evidence Workbook', {
      targetPath,
      sheetsCount: wb.SheetNames.length,
      sha256
    });

    return {
      filePath: targetPath,
      sha256,
      sheetsCount: wb.SheetNames.length
    };
  }
}
