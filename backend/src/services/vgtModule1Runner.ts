import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as XLSX from 'xlsx';
import { module1ForensicService } from './module1ForensicService';
import { fxReferenceService } from './fxReferenceService';
import { analysisOrchestrationService } from './analysisOrchestrationService';
import { VgtEvidenceBuilder } from './vgtEvidenceBuilder';
import { VgtLedgerParser } from './vgtLedgerParser';
import { VgtForensicBridgeCalculator } from './vgtForensicBridgeCalculator';
import { logger } from '../utils/logger';
import type {
  FxTransactionInput,
  VgtProcessingResult
} from '../types';
import {
  VGT_DATASET_FILENAME,
  VGT_CUSTOMER_PROFILE_FX_RATES
} from '../constants/vgtConstants';

let cachedVgtResult: VgtProcessingResult | null = null;

function resolveVgtPath(customPath?: string): string {
  const target = customPath ? path.resolve(customPath) : path.resolve(process.cwd(), VGT_DATASET_FILENAME);
  if (fs.existsSync(target)) {
    return target;
  }
  const baseName = customPath ? path.basename(customPath) : VGT_DATASET_FILENAME;
  const candidates = [
    path.resolve(process.cwd(), 'backend', baseName),
    path.resolve(process.cwd(), baseName),
    path.resolve(process.cwd(), '..', 'backend', baseName),
    path.resolve(process.cwd(), '..', baseName)
  ];
  const found = candidates.find((c) => fs.existsSync(c));
  if (found) {
    return found;
  }
  throw new Error(`VGT FILE NOT FOUND: ${target}`);
}

export class VgtModule1Runner {
  public static clearCache(): void {
    cachedVgtResult = null;
  }
  public static processVgtDataset(customPath?: string): VgtProcessingResult {
    if (!customPath && cachedVgtResult) {
      return cachedVgtResult;
    }

    const vgtPath = resolveVgtPath(customPath);
    const fileStats = fs.existsSync(vgtPath) ? fs.statSync(vgtPath) : { size: 68 * 1024 * 1024 };
    const fileBuffer = fs.readFileSync(vgtPath);
    const fileSha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    if (cachedVgtResult && cachedVgtResult.file?.sha256 === fileSha256) {
      return cachedVgtResult;
    }

    const wb = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheets = wb.SheetNames;
    const firstSheetName = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheetName];
    const headerMatrix = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });
    const columnsFound = headerMatrix[0] ?? [];
    const rawLedger = VgtLedgerParser.parseRawRows(ws);
    const sourceRowCount = rawLedger.length;
    const ingestedRowCount = rawLedger.length;

    logger.info('Processing authoritative VGT customer dataset', {
      filename: VGT_DATASET_FILENAME,
      sha256: fileSha256,
      sourceRowCount,
      sheets
    });

    const validatedLedger = module1ForensicService.buildValidatedTransactionLedger(rawLedger);
    const validRows = validatedLedger.filter((r) => r.inclusionStatus === 'VALID');
    const excludedRows = validatedLedger.filter((r) => r.inclusionStatus === 'EXCLUDED');
    const anomalyRows = validatedLedger.filter((r) => r.inclusionStatus === 'ANOMALY');
    const populationVariance = sourceRowCount - (validRows.length + excludedRows.length + anomalyRows.length);

    const seenTxKeys = new Set<string>();
    for (const r of validRows) {
      seenTxKeys.add(`${r.poNumber}|${r.poLine}|${r.itemCode}|${r.transactionDate}`);
    }
    const duplicateRowCount = validRows.length - seenTxKeys.size;

    fxReferenceService.initialize();

    // 1. Authoritative Historical FX Normalization for VALID transactions ONLY
    const validTxInputs: FxTransactionInput[] = validRows.map((r) => ({
      transactionId: r.recordId,
      originalValue: r.quantity * r.netPrice,
      originalCurrency: r.currency,
      transactionDate: r.transactionDate,
      poNumber: r.poNumber,
      lineItem: Number(r.poLine),
      supplierName: r.vendorName,
      materialDescription: r.itemDescription
    }));

    const validFxResult = fxReferenceService.normalizeTransactions(validTxInputs);
    const validFxSummary = validFxResult.summary;
    const validConvertedSpendInr = validFxSummary.convertedSpendInr;
    const validConvertedSpendCr = Number((validConvertedSpendInr / 10000000).toFixed(4));
    const totalNormalizedInr = validFxResult.normalizedTransactions.reduce(
      (sum, tx) => sum + (tx.inrNormalizedValue as number),
      0
    );
    const reconciliationVariance = Number(Math.abs(totalNormalizedInr - validConvertedSpendInr).toFixed(4));

    // 2. All-Row Historical FX Normalization for raw-population audit
    const allTxInputs: FxTransactionInput[] = validatedLedger.map((r) => ({
      transactionId: r.recordId,
      originalValue: r.quantity * r.netPrice,
      originalCurrency: r.currency,
      transactionDate: r.transactionDate,
      poNumber: r.poNumber,
      lineItem: Number(r.poLine),
      supplierName: r.vendorName,
      materialDescription: r.itemDescription
    }));
    const allFxResult = fxReferenceService.normalizeTransactions(allTxInputs);
    const rawAllRowSpendInr = allFxResult.summary.convertedSpendInr;
    const rawAllRowSpendCr = Number((rawAllRowSpendInr / 10000000).toFixed(4));

    // 3. Excluded & Anomaly populations
    const excludedTxInputs: FxTransactionInput[] = excludedRows.map((r) => ({
      transactionId: r.recordId,
      originalValue: r.quantity * r.netPrice,
      originalCurrency: r.currency,
      transactionDate: r.transactionDate,
      poNumber: r.poNumber,
      lineItem: Number(r.poLine),
      supplierName: r.vendorName,
      materialDescription: r.itemDescription
    }));
    const excludedFxResult = fxReferenceService.normalizeTransactions(excludedTxInputs);
    const excludedSpendInr = excludedFxResult.summary.convertedSpendInr;
    const excludedSpendCr = Number((excludedSpendInr / 10000000).toFixed(4));

    const anomalyTxInputs: FxTransactionInput[] = anomalyRows.map((r) => ({
      transactionId: r.recordId,
      originalValue: r.quantity * r.netPrice,
      originalCurrency: r.currency,
      transactionDate: r.transactionDate,
      poNumber: r.poNumber,
      lineItem: Number(r.poLine),
      supplierName: r.vendorName,
      materialDescription: r.itemDescription
    }));
    const anomalyFxResult = fxReferenceService.normalizeTransactions(anomalyTxInputs);
    const anomalySpendInr = anomalyFxResult.summary.convertedSpendInr;
    const anomalySpendCr = Number((anomalySpendInr / 10000000).toFixed(4));

    // 4. Customer Profile FX Baseline calculation for VALID transactions
    const bridgeCalc = VgtForensicBridgeCalculator.computeForensicBridge(
      validRows,
      validFxResult.normalizedTransactions,
      VGT_CUSTOMER_PROFILE_FX_RATES,
      validConvertedSpendInr
    );

    const allRowTxCountByCurr: Record<string, number> = { INR: 0, USD: 0, EUR: 0, CNY: 0 };
    for (const r of validatedLedger) {
      allRowTxCountByCurr[r.currency] = (allRowTxCountByCurr[r.currency] || 0) + 1;
    }

    let rawErpNetValueInrSum = 0;
    for (const r of rawLedger) {
      rawErpNetValueInrSum += r.totalInrRaw;
    }

    const nowIso = new Date().toISOString();
    const dataVersionId = `DATA-VER-VGT-${Date.now().toString(36).toUpperCase()}`;
    const analysisJob = analysisOrchestrationService.createAnalysisJob({
      fileName: VGT_DATASET_FILENAME,
      tenantId: 'TENANT-VGT-ENTERPRISE',
      customerName: 'VGT Enterprise Procurement',
      uploadedBy: 'srini@procucev.com',
      originalUploadId: 'upload-vgt-001',
      fileSizeMb: Number((fileStats.size / (1024 * 1024)).toFixed(2)),
      fileBuffer,
      totalSpendCr: validConvertedSpendCr,
      totalTransactions: validRows.length
    });

    const evidence = VgtEvidenceBuilder.buildVgtEvidenceWorkbook({
      analysisJobId: analysisJob.analysisJobId,
      dataVersionId,
      nowIso,
      ingestedRowCount,
      sourceRowCount,
      fileSha256,
      validRowsCount: validRows.length,
      excludedRowsCount: excludedRows.length,
      anomalyRowsCount: anomalyRows.length,
      rawErpNetValueInrSum,
      fxSummary: {
        totalUploadedSpend: validFxSummary.totalUploadedSpend,
        convertedSpendInr: validConvertedSpendInr,
        fxCoveragePct: validFxSummary.fxCoveragePct,
        fxMasterVersion: validFxSummary.fxMasterVersion,
        fxMasterChecksum: validFxSummary.fxMasterChecksum
      },
      validatedLedger,
      normalizedTransactions: allFxResult.normalizedTransactions,
      validRows,
      validNormalizedTransactions: validFxResult.normalizedTransactions,
      excludedRows,
      anomalyRows,
      totalNormalizedInr,
      reconciliationVariance,
      txCountByCurrency: bridgeCalc.txCountByCurrency,
      originalSpendByCurr: bridgeCalc.originalSpendByCurr,
      convertedSpendByCurr: bridgeCalc.convertedSpendByCurr,
      customerProfileSpendByCurr: bridgeCalc.customerProfileSpendByCurr,
      fxImpactByCurr: bridgeCalc.fxImpactByCurr,
      allRowTxCountByCurr,
      customerProfileValidSpendInr: bridgeCalc.customerProfileValidSpendInr,
      customerProfileValidSpendCr: bridgeCalc.customerProfileValidSpendCr,
      validConvertedSpendInr,
      validConvertedSpendCr,
      fxMethodologyImpactInr: bridgeCalc.fxMethodologyImpactInr,
      fxMethodologyImpactCr: bridgeCalc.fxMethodologyImpactCr,
      rawAllRowSpendInr,
      rawAllRowSpendCr,
      excludedSpendInr,
      excludedSpendCr,
      anomalySpendInr,
      anomalySpendCr,
      foreignTransactionsBridge: bridgeCalc.foreignTransactionsBridge,
      currencyBridges: bridgeCalc.currencyBridges
    });

    const finalResult: VgtProcessingResult = {
      file: {
        filename: VGT_DATASET_FILENAME,
        sha256: fileSha256,
        sourceRowCount,
        sheetNames: sheets,
        columnsFound
      },
      data: {
        sourceRowCount,
        ingestedRowCount,
        validRowCount: validRows.length,
        excludedRowCount: excludedRows.length,
        anomalyRowCount: anomalyRows.length,
        duplicateRowCount
      },
      currency: {
        currenciesDetected: ['INR', 'USD', 'CNY', 'EUR'],
        transactionCountByCurrency: bridgeCalc.txCountByCurrency,
        originalSpendByCurrency: bridgeCalc.originalSpendByCurr,
        convertedSpendInrByCurrency: bridgeCalc.convertedSpendByCurr,
        customerProfileSpendByCurrency: bridgeCalc.customerProfileSpendByCurr,
        fxImpactByCurrency: bridgeCalc.fxImpactByCurr,
        allRowTransactionCountByCurrency: allRowTxCountByCurr,
        fxCoveragePct: validFxSummary.fxCoveragePct, fxValidationStatus: validFxSummary.fxValidationStatus
      },
      module1: {
        totalUploadedSpend: validFxSummary.totalUploadedSpend,
        totalConvertedInrSpend: validConvertedSpendInr,
        totalConvertedInrSpendCr: validConvertedSpendCr,
        customerProfileSpendInr: bridgeCalc.customerProfileValidSpendInr,
        customerProfileSpendCr: bridgeCalc.customerProfileValidSpendCr,
        fxMethodologyImpactInr: bridgeCalc.fxMethodologyImpactInr,
        fxMethodologyImpactCr: bridgeCalc.fxMethodologyImpactCr,
        rawAllRowSpendInr, rawAllRowSpendCr,
        excludedSpendInr, excludedSpendCr,
        anomalySpendInr, anomalySpendCr,
        pendingSpend: Object.values(validFxSummary.pendingFxSpendByCurrency).reduce((a, b) => a + b, 0),
        reconciliationVariance,
        duplicateCount: duplicateRowCount,
        validCount: validRows.length, excludedCount: excludedRows.length, anomalyCount: anomalyRows.length,
        populationVariance,
        reconciliationPassed: reconciliationVariance === 0
      },
      rootCauseAnalysis: VgtForensicBridgeCalculator.buildRootCauseAnalysis(bridgeCalc, validConvertedSpendCr),
      forensicBridge: {
        profileFxValidSpendCr: bridgeCalc.customerProfileValidSpendCr,
        historicalFxValidSpendCr: validConvertedSpendCr,
        fxMethodologyImpactCr: bridgeCalc.fxMethodologyImpactCr,
        fxImpactPct: bridgeCalc.fxImpactPct,
        reconciliationVariance,
        profileRates: VGT_CUSTOMER_PROFILE_FX_RATES,
        rawAllRowHistoricalSpendCr: rawAllRowSpendCr,
        excludedSpendCr,
        anomalySpendCr,
        currencyBridges: bridgeCalc.currencyBridges
      },
      evidence,
      dataVersion: {
        dataVersionId,
        jobId: analysisJob.analysisJobId,
        createdAt: nowIso
      },
      validRows,
      validNormalizedTransactions: validFxResult.normalizedTransactions
    };

    cachedVgtResult = finalResult;
    return finalResult;
  }

  public static parseNum = VgtLedgerParser.parseNum;
  public static parseStr = VgtLedgerParser.parseStr;
  public static parseRawRows = VgtLedgerParser.parseRawRows;
  public static mapRawRow = VgtLedgerParser.mapRawRow;
}
