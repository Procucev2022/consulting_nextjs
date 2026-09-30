import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import * as xlsx from 'xlsx';
import { module1ForensicService } from '../../src/services/module1ForensicService';
import {
  MODULE_1_DATA_CONTRACT_FIELDS,
  MODULE_1_FINANCIAL_BASE_CURRENCY,
  MODULE_1_CONFIGURED_PERIOD_LABEL,
  APPROVED_HISTORICAL_FX_RATES
} from '../../src/constants/module1Forensic';
import type {
  RawTransactionLedgerRecord,
  ValidatedTransactionLedgerRecord,
  DateScopeAuditResult,
  Module1CertificationReport
} from '../../src/types/module1Forensic';

describe('Module 1 Final Forensic Validation & Financial Source-of-Truth Certification', () => {
  let rawLedger: RawTransactionLedgerRecord[];
  let validatedLedger: ValidatedTransactionLedgerRecord[];
  let dateAudit: DateScopeAuditResult;
  let report: Module1CertificationReport;
  let reconciliationWbFile: string;
  let exceptionLedgerFile: string;
  let txAuditFile: string;
  let testResultsFile: string;
  let markdownFile: string;

  beforeAll(() => {
    // Execute full forensic audit end-to-end
    const result = module1ForensicService.executeFullForensicAudit();
    report = result.report;
    rawLedger = result.rawLedger;
    validatedLedger = result.validatedLedger;
    dateAudit = result.dateAudit;
    reconciliationWbFile = result.reconciliationWbPath;
    exceptionLedgerFile = result.exceptionLedgerPath;
    txAuditFile = result.transactionAuditPath;
    testResultsFile = result.testResultsPath;
    markdownFile = result.markdownReportPath;
  }, 30000);

  describe('Section 1 — Data Contract & Data Dictionary', () => {
    it('should have a formal DATA_DICTIONARY and DATA_CONTRACT with required mapping rules', () => {
      expect(MODULE_1_DATA_CONTRACT_FIELDS.length).toBeGreaterThanOrEqual(15);
      const fields = MODULE_1_DATA_CONTRACT_FIELDS.map((f) => f.targetField);
      expect(fields).toContain('poLine');
      expect(fields).toContain('poNumber');
      expect(fields).toContain('transactionDate');
      expect(fields).toContain('vendorCode');
      expect(fields).toContain('vendorName');
      expect(fields).toContain('materialCode');
      expect(fields).toContain('shortText');
      expect(fields).toContain('materialGroup');
      expect(fields).toContain('plant');
      expect(fields).toContain('orderQuantity');
      expect(fields).toContain('uom');
      expect(fields).toContain('netPrice');
      expect(fields).toContain('currency');
      expect(fields).toContain('totalInrRaw');
      expect(fields).toContain('totalInCrsRaw');

      MODULE_1_DATA_CONTRACT_FIELDS.forEach((f) => {
        expect(f.sourceField).toBeDefined();
        expect(f.datatype).toBeDefined();
        expect(typeof f.nullable).toBe('boolean');
        expect(f.transformationRule).toBeDefined();
        expect(f.validationRule).toBeDefined();
        expect(f.displayRule).toBeDefined();
      });
    });
  });

  describe('Section 2 — Raw Data Immutability', () => {
    it('should preserve original customer fields exactly in RAW_TRANSACTION_LEDGER and link back deterministically', () => {
      expect(rawLedger.length).toBe(31671);
      const sample = rawLedger[0];
      expect(Object.isFrozen(sample)).toBe(true);
      expect(sample.recordId).toBe('REC-8800');
      expect(sample.orderQuantity).toBe(340);
      expect(sample.netPrice).toBe(165406.5);
      expect(sample.currency).toBe('INR');

      const validatedSample = validatedLedger[0];
      expect(validatedSample.rawRecordId).toBe(sample.recordId);
      expect(validatedSample.sourceRow).toBe(sample.sourceRow);
      expect(validatedSample.quantity).toBe(sample.orderQuantity);
      expect(validatedSample.netPrice).toBe(sample.netPrice);
    });
  });

  describe('Section 3 — Date / Period Forensic Validation & Scope Mismatch', () => {
    it('should calculate actual transaction date coverage and flag PERIOD_SCOPE_MISMATCH', () => {
      expect(dateAudit.distinctMonthsCount).toBe(24);
      expect(dateAudit.distinctFiscalYearsCount).toBe(2);
      expect(dateAudit.minTransactionDate).toBe('2024-04-01');
      expect(dateAudit.maxTransactionDate).toBe('2026-03-31');
      expect(dateAudit.scopeFlag).toBe('PERIOD_SCOPE_MISMATCH');
      expect(dateAudit.configuredEvaluationPeriod).toBe(MODULE_1_CONFIGURED_PERIOD_LABEL);
      expect(dateAudit.scopeDiscrepancyExplanation).toContain('24 billing months');
    });
  });

  describe('Section 4 & 5 — Primary Spend Formula & FX Forensics', () => {
    it('should apply authoritative spend formula (Quantity * Net Price * FX) with FX = 1.0 for INR', () => {
      const { fxRecords, sampleLineAudits } = module1ForensicService.auditFXAndPrimaryFormula(validatedLedger);
      expect(fxRecords.length).toBeGreaterThanOrEqual(1);
      const inrRecord = fxRecords.find((r) => r.currency === MODULE_1_FINANCIAL_BASE_CURRENCY);
      expect(inrRecord).toBeDefined();
      expect(inrRecord?.sampleFxRate).toBe(1.0);

      sampleLineAudits.forEach((audit) => {
        expect(audit.status).toBe('PASS');
        expect(audit.varianceInr).toBeLessThan(0.01);
      });
    });

    it('should maintain approved historical FX rates without letting live tickers overwrite historical transactions', () => {
      expect(APPROVED_HISTORICAL_FX_RATES.USD.rate).toBe(83.8);
      expect(APPROVED_HISTORICAL_FX_RATES.EUR.rate).toBe(90.5);
      expect(APPROVED_HISTORICAL_FX_RATES.GBP.rate).toBe(105.8);
      expect(APPROVED_HISTORICAL_FX_RATES.AED.rate).toBe(22.82);
    });
  });

  describe('Section 6 — Precision & Rounding Forensics', () => {
    it('should prove DISPLAY_VALUE != CALCULATION_VALUE while preserving full 64-bit numerical precision', () => {
      const precisionResults = module1ForensicService.auditPrecisionAndRounding(validatedLedger);
      expect(precisionResults.length).toBeGreaterThanOrEqual(2);

      const rec8800Precision = precisionResults[0];
      expect(rec8800Precision.calculationValueInr).toBe(56238210);
      expect(rec8800Precision.displayedCrores2Decimals).toBe('5.62');
      expect(rec8800Precision.proofDisplayNotEqualCalculation).toBe(true);
      expect(rec8800Precision.varianceInr).toBe(38210); // 56,238,210 vs 56,200,000
    });
  });

  describe('Section 7 & 19 — Sample Transactions Forensic Verification (REC-8800, REC-8801, REC-8802)', () => {
    it('should mathematically verify REC-8800: 340 * 165406.50 = ₹56,238,210 = ₹5.623821 Cr', () => {
      const r0 = validatedLedger.find((r) => r.recordId === 'REC-8800')!;
      expect(r0).toBeDefined();
      expect(r0.quantity).toBe(340);
      expect(r0.netPrice).toBe(165406.5);
      expect(r0.currency).toBe('INR');
      expect(r0.approvedFxRate).toBe(1.0);
      expect(r0.lineSpendInr).toBe(56238210);
      expect(r0.lineSpendCr).toBeCloseTo(5.623821, 6);
    });

    it('should mathematically verify REC-8801: 160 * 165406.50 = ₹26,465,040 = ₹2.646504 Cr', () => {
      const r1 = validatedLedger.find((r) => r.recordId === 'REC-8801')!;
      expect(r1).toBeDefined();
      expect(r1.quantity).toBe(160);
      expect(r1.netPrice).toBe(165406.5);
      expect(r1.lineSpendInr).toBe(26465040);
      expect(r1.lineSpendCr).toBeCloseTo(2.646504, 6);
    });

    it('should mathematically verify REC-8802: 8 * 1619761.65 = ₹12,958,093.20 = ₹1.295809 Cr', () => {
      const r2 = validatedLedger.find((r) => r.recordId === 'REC-8802')!;
      expect(r2).toBeDefined();
      expect(r2.quantity).toBe(8);
      expect(r2.netPrice).toBe(1619761.65);
      expect(r2.lineSpendInr).toBe(12958093.2);
      expect(r2.lineSpendCr).toBeCloseTo(1.29580932, 6);
    });
  });

  describe('Section 8 & 20 — Zero / Negative / Null & Spend Reconciliation', () => {
    it('should reconcile RAW_SPEND = VALIDATED_SPEND + EXCLUDED_SPEND with zero gap', () => {
      const rawSum = rawLedger.reduce((sum, r) => sum + r.totalInrRaw, 0);
      const validatedSum = validatedLedger.reduce((sum, r) => sum + r.lineSpendInr, 0);
      expect(rawSum).toBeCloseTo(59203477681.6571, 3);
      expect(validatedSum).toBeCloseTo(59203477681.6571, 3);
      expect(Math.abs(rawSum - validatedSum)).toBeLessThan(0.01);
    });

    it('should identify unpriced zero-spend records without silent deletion', () => {
      const zeroSpend = rawLedger.filter((r) => r.totalInrRaw === 0);
      expect(zeroSpend.length).toBe(1071);
      const posSpend = rawLedger.filter((r) => r.totalInrRaw > 0);
      expect(posSpend.length).toBe(30600);
      expect(zeroSpend.length + posSpend.length).toBe(31671);
    });
  });

  describe('Section 9 — Duplicate Forensics', () => {
    it('should classify exact, business, and potential duplicates deterministically', () => {
      const dupAudit = module1ForensicService.auditDuplicates(validatedLedger);
      expect(dupAudit.exactDuplicatesCount).toBe(0);
      expect(dupAudit.businessDuplicatesCount).toBe(0);
      expect(dupAudit.potentialDuplicatesCount).toBe(489);
      expect(dupAudit.status).toBe('PASS');
    });
  });

  describe('Section 10 & 11 — Supplier and Item Master Data Validation', () => {
    it('should validate supplier and item masters and resolve numeric SKU issue', () => {
      const masterAudit = module1ForensicService.auditMasterData(validatedLedger);
      expect(masterAudit.suppliers.length).toBe(974);
      expect(masterAudit.items.length).toBe(6485);
      expect(masterAudit.itemIssueDiagnosis.issueIdentified).toContain('UNIQUE ITEMS = 0');
      expect(masterAudit.itemIssueDiagnosis.rootCause).toContain('regex');
    });
  });

  describe('Section 12-15 & 17 — Multi-Dimensional & Cross-Dimension Reconciliations', () => {
    it('should prove Transaction Spend == Supplier == Item == MaterialGroup == Plant == Monthly Spend', () => {
      const rec = module1ForensicService.auditReconciliations(validatedLedger);
      expect(rec.crossDimension.reconciliationStatus).toBe('PASS');
      expect(rec.crossDimension.maxAbsoluteVarianceInr).toBeLessThan(0.01);
      expect(rec.supplierSummaries.length).toBe(974);
      expect(rec.itemSummaries.length).toBe(6485);
      expect(rec.mgSummaries.length).toBe(256);
      expect(rec.plantSummaries.length).toBe(26);
      expect(rec.monthSummaries.length).toBe(24);
    });
  });

  describe('Section 16 — Mathematical 80% Pareto Threshold Crossing Audit', () => {
    it('should deterministically cross theoretical 80% threshold at Supplier #46 (RANAWAT UDYOG) at ₹4,752.54 Cr', () => {
      const rec = module1ForensicService.auditReconciliations(validatedLedger);
      const pareto = module1ForensicService.auditPareto(rec.supplierSummaries);
      expect(pareto.totalSpendCr).toBe(5920.35);
      expect(pareto.theoretical80ThresholdCr).toBe(4736.28);
      expect(pareto.cutoffEntityIndex).toBe(45); // 0-based
      expect(pareto.cutoffEntityCount).toBe(46);
      expect(pareto.cutoffEntityName).toBe('RANAWAT UDYOG');
      expect(pareto.cutoffCumulativeSpendCr).toBe(4752.54);
      expect(pareto.cutoffCumulativeSharePct).toBe(80.27);
      expect(pareto.isThresholdCrossingDeterministic).toBe(true);
    });
  });

  describe('Section 24 — Adversarial Test Suite (Scenarios A to AD)', () => {
    it('should pass all 30 adversarial scenarios with documented reasons', () => {
      const adversarialResults = module1ForensicService.runAdversarialTestSuite();
      expect(adversarialResults.length).toBe(30);
      const passed = adversarialResults.filter((s) => s.status === 'PASS');
      expect(passed.length).toBe(30);
      adversarialResults.forEach((s) => {
        expect(s.documentedReason).toBeDefined();
        expect(s.documentedReason.length).toBeGreaterThan(5);
      });
    });
  });

  describe('Section 25 — Mathematical Invariants (Invariants 1 to 12)', () => {
    it('should satisfy all 12 mathematical invariants with zero unexplained variance', () => {
      const rec = module1ForensicService.auditReconciliations(validatedLedger);
      const invariantResults = module1ForensicService.verifyMathematicalInvariants(validatedLedger, rec);
      expect(invariantResults.length).toBe(12);
      const satisfied = invariantResults.filter((i) => i.status === 'PASS');
      expect(satisfied.length).toBe(12);
      invariantResults.forEach((i) => {
        expect(i.varianceObserved).toBeLessThan(0.01);
      });
    });
  });

  describe('Section 28 — Quality Index Decomposition', () => {
    it('should decompose Quality Index into Data Quality, Completeness, and Reconciliation', () => {
      const qi = module1ForensicService.decomposeQualityIndex(validatedLedger);
      expect(qi.overallQualityIndexPct).toBe(92.9);
      expect(qi.dataQualityPct).toBeGreaterThanOrEqual(80);
      expect(qi.dataCompletenessPct).toBeGreaterThanOrEqual(95);
      expect(qi.dataReconciliationPct).toBe(100.0);
      expect(qi.procurementPerformanceDisclaimer).toContain('does not imply optimal procurement');
    });
  });

  describe('Section 30 & 31 — Final Certification Gate & Required Artifacts', () => {
    it('should certify status as MODULE_1_E2E_VALIDATED', () => {
      expect(report.finalStatus).toBe('MODULE_1_E2E_VALIDATED');
    });

    it('should create MODULE_1_FINAL_RECONCILIATION.xlsx with 15 tabs', () => {
      expect(fs.existsSync(reconciliationWbFile)).toBe(true);
      const wb = xlsx.readFile(reconciliationWbFile);
      expect(wb.SheetNames.length).toBe(15);
      expect(wb.SheetNames).toContain('Raw Record Summary');
      expect(wb.SheetNames).toContain('Validated Ledger');
      expect(wb.SheetNames).toContain('Exclusion Ledger');
      expect(wb.SheetNames).toContain('FX Audit');
      expect(wb.SheetNames).toContain('Duplicate Audit');
      expect(wb.SheetNames).toContain('Supplier Reconciliation');
      expect(wb.SheetNames).toContain('Item Reconciliation');
      expect(wb.SheetNames).toContain('Category Reconciliation');
      expect(wb.SheetNames).toContain('Material Group Reconcil.');
      expect(wb.SheetNames).toContain('Plant Reconciliation');
      expect(wb.SheetNames).toContain('Monthly Reconciliation');
      expect(wb.SheetNames).toContain('Pareto Audit');
      expect(wb.SheetNames).toContain('UI KPI Audit');
      expect(wb.SheetNames).toContain('Formula Audit');
      expect(wb.SheetNames).toContain('Exception Register');
    });

    it('should create MODULE_1_EXCEPTION_LEDGER.xlsx with 10 columns', () => {
      expect(fs.existsSync(exceptionLedgerFile)).toBe(true);
      const wb = xlsx.readFile(exceptionLedgerFile);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const headerRow = xlsx.utils.sheet_to_json<string[]>(sheet, { header: 1 })[0];
      expect(headerRow.length).toBe(10);
      expect(headerRow).toContain('Record ID');
      expect(headerRow).toContain('Source Row');
      expect(headerRow).toContain('Field');
      expect(headerRow).toContain('Observed Value');
      expect(headerRow).toContain('Expected Rule');
      expect(headerRow).toContain('Status');
      expect(headerRow).toContain('Reason');
      expect(headerRow).toContain('Impact on Spend (INR)');
      expect(headerRow).toContain('Resolution');
      expect(headerRow).toContain('Timestamp');
    });

    it('should create MODULE_1_TRANSACTION_AUDIT.json', () => {
      expect(fs.existsSync(txAuditFile)).toBe(true);
      const data = JSON.parse(fs.readFileSync(txAuditFile, 'utf-8'));
      expect(data.totalRecords).toBe(31671);
      expect(data.totalSpendCr).toBe(5920.3478);
    });

    it('should create MODULE_1_TEST_RESULTS.json', () => {
      expect(fs.existsSync(testResultsFile)).toBe(true);
      const data = JSON.parse(fs.readFileSync(testResultsFile, 'utf-8'));
      expect(data.finalStatus).toBe('MODULE_1_E2E_VALIDATED');
      expect(data.summary.adversarialPassed).toBe(30);
      expect(data.summary.invariantsSatisfied).toBe(12);
    });

    it('should create MODULE_1_FINAL_FORENSIC_VALIDATION.md with required sections', () => {
      expect(fs.existsSync(markdownFile)).toBe(true);
      const content = fs.readFileSync(markdownFile, 'utf-8');
      expect(content).toContain('MODULE_1_E2E_VALIDATED');
      expect(content).toContain('₹5,920.35 Crores');
      expect(content).toContain('PERIOD_SCOPE_MISMATCH');
      expect(content).toContain('REC-8800');
      expect(content).toContain('RANAWAT UDYOG');
      expect(content).toContain('Quality Index Decomposition');
    });
  });

  describe('Branch Coverage & Edge Case Verification', () => {
    it('should handle path resolution and date parsing edge cases', () => {
      const nonExistent = module1ForensicService.resolveDatasetPath('C:/non_existent_folder/fake.xlsx');
      expect(nonExistent).toBeDefined();

      const validStrDate = module1ForensicService.parseExcelDate('2025-05-15');
      expect(validStrDate).toBe('2025-05-15');

      const invalidDate = module1ForensicService.parseExcelDate('NOT_A_DATE');
      expect(invalidDate).toBe('2024-04-01');

      const emptyLedger = module1ForensicService.buildRawTransactionLedger('C:/non_existent_folder/fake.xlsx');
      expect(emptyLedger).toEqual([]);
    });

    it('should handle negative, zero, unmapped, and multi-currency branches in buildValidatedTransactionLedger', () => {
      const syntheticRaw: RawTransactionLedgerRecord[] = [
        {
          recordId: 'SYN-01',
          sourceRow: 2,
          sourceFile: 'synthetic.xlsx',
          poNumber: 'PO-SYN-01',
          poLine: 10,
          documentDateRaw: '2024-05-01',
          supplierCode: 'V01',
          supplierName: 'UNMAPPED_SUPPLIER',
          materialCode: '',
          shortText: 'Item Only Text',
          materialGroup: 'DIRECT',
          plant: '1000',
          orderQuantity: -10,
          orderUnit: 'NOS',
          netPrice: 100,
          currency: 'USD',
          totalInrRaw: -83800,
          totalInCrsRaw: -0.00838
        },
        {
          recordId: 'SYN-02',
          sourceRow: 3,
          sourceFile: 'synthetic.xlsx',
          poNumber: 'PO-SYN-02',
          poLine: 10,
          documentDateRaw: '2024-05-01',
          supplierCode: 'V02',
          supplierName: 'Test Vendor',
          materialCode: 'SKU-ONLY-999',
          shortText: '',
          materialGroup: 'DIRECT',
          plant: '1000',
          orderQuantity: 10,
          orderUnit: 'NOS',
          netPrice: -50,
          currency: 'EUR',
          totalInrRaw: -45250,
          totalInCrsRaw: -0.004525
        },
        {
          recordId: 'SYN-03',
          sourceRow: 4,
          sourceFile: 'synthetic.xlsx',
          poNumber: 'PO-SYN-03',
          poLine: 10,
          documentDateRaw: '2024-05-01',
          supplierCode: 'V03',
          supplierName: 'Test Vendor 3',
          materialCode: '',
          shortText: '',
          materialGroup: 'DIRECT',
          plant: '1000',
          orderQuantity: 0,
          orderUnit: 'NOS',
          netPrice: 100,
          currency: 'INR',
          totalInrRaw: 0,
          totalInCrsRaw: 0
        },
        {
          recordId: 'SYN-04',
          sourceRow: 5,
          sourceFile: 'synthetic.xlsx',
          poNumber: 'PO-SYN-04',
          poLine: 10,
          documentDateRaw: '2024-05-01',
          supplierCode: 'V04',
          supplierName: 'Test Vendor 4',
          materialCode: 'SKU-04',
          shortText: 'Sample',
          materialGroup: 'DIRECT',
          plant: '1000',
          orderQuantity: 10,
          orderUnit: 'NOS',
          netPrice: 0,
          currency: 'INR',
          totalInrRaw: 0,
          totalInCrsRaw: 0
        },
        {
          recordId: 'SYN-05',
          sourceRow: 6,
          sourceFile: 'synthetic.xlsx',
          poNumber: 'PO-SYN-05',
          poLine: 10,
          documentDateRaw: '2024-05-01',
          supplierCode: 'V05',
          supplierName: 'Test Vendor 5',
          materialCode: 'SKU-05',
          shortText: 'Deletion Item',
          materialGroup: 'DIRECT',
          plant: '1000',
          orderQuantity: 10,
          orderUnit: 'NOS',
          netPrice: 100,
          currency: 'UNKNOWN_CURR',
          totalInrRaw: 1000,
          totalInCrsRaw: 0.0001,
          deletionIndicator: 'L'
        }
      ];

      const validated = module1ForensicService.buildValidatedTransactionLedger(syntheticRaw);
      expect(validated[0].anomalyReason).toBe('Negative Quantity or Price Encountered');
      expect(validated[0].vendorConfidence).toBe(0.5);
      expect(validated[0].normalizedItem).toBe('Item Only Text');
      expect(validated[0].approvedFxRate).toBe(83.8);

      expect(validated[1].anomalyReason).toBe('Negative Quantity or Price Encountered');
      expect(validated[1].normalizedItem).toBe('SKU-ONLY-999');
      expect(validated[1].approvedFxRate).toBe(90.5);

      expect(validated[2].exclusionReason).toBe('Zero Quantity Transaction (Sample/FOC)');
      expect(validated[2].normalizedItem).toBe('UNSPECIFIED_ITEM');

      expect(validated[3].exclusionReason).toBe('Zero Price Contract Line');

      expect(validated[4].inclusionStatus).toBe('EXCLUDED');
      expect(validated[4].exclusionReason).toContain('Deletion Indicator');
    });

    it('should handle PERIOD_SCOPE_MATCH branch when given 36 distinct months', () => {
      const records36: ValidatedTransactionLedgerRecord[] = [];
      for (let y = 2023; y <= 2025; y++) {
        for (let m = 1; m <= 12; m++) {
          const mStr = String(m).padStart(2, '0');
          const billingMonth = `${y}-${mStr}`;
          records36.push({
            recordId: `REC-36-${y}-${m}`,
            sourceRow: 2,
            sourceFile: '3years.xlsx',
            rawRecordId: `REC-36-${y}-${m}`,
            poNumber: 'PO-36',
            poLine: 10,
            transactionDate: `${billingMonth}-01`,
            billingMonth,
            fiscalYear: m >= 4 ? `FY${String(y).slice(2)}-FY${String(y + 1).slice(2)}` : `FY${String(y - 1).slice(2)}-FY${String(y).slice(2)}`,
            vendorCode: 'V36',
            vendorName: 'Vendor 36',
            normalizedVendor: 'VENDOR 36',
            vendorConfidence: 1.0,
            itemCode: 'ITEM-36',
            itemDescription: 'Desc 36',
            normalizedItem: 'ITEM 36',
            materialGroup: 'MG36',
            plant: '1000',
            quantity: 10,
            uom: 'NOS',
            netPrice: 100,
            currency: 'INR',
            approvedFxRate: 1.0,
            fxRateDate: '2024-04-01',
            fxRateSource: 'DOMESTIC',
            inrUnitPrice: 100,
            lineSpendInr: 1000,
            lineSpendCr: 0.0001,
            inclusionStatus: 'VALID',
            duplicateStatus: 'LEGITIMATE_REPEAT_TRANSACTION'
          });
        }
      }

      const audit36 = module1ForensicService.auditDateAndPeriodScope(records36);
      expect(audit36.distinctMonthsCount).toBe(36);
      expect(audit36.scopeFlag).toBe('PERIOD_SCOPE_MATCH');
      expect(audit36.scopeDiscrepancyExplanation).toContain('Configured period matches actual');
    });

    it('should test exact duplicate, business duplicate, and zero FX branches', () => {
      const dupRaw: ValidatedTransactionLedgerRecord[] = [
        {
          recordId: 'D1',
          sourceRow: 2,
          sourceFile: 'dup.xlsx',
          rawRecordId: 'D1',
          poNumber: 'PO-DUP',
          poLine: 10,
          transactionDate: '2024-05-01',
          billingMonth: '2024-05',
          fiscalYear: 'FY24-FY25',
          vendorCode: 'V1',
          vendorName: 'Same Vendor',
          normalizedVendor: 'SAME VENDOR',
          vendorConfidence: 1.0,
          itemCode: 'I1',
          itemDescription: 'Same Item',
          normalizedItem: 'Same Item',
          materialGroup: 'MG1',
          plant: '1000',
          quantity: 10,
          uom: 'NOS',
          netPrice: 100,
          currency: 'BAD_CURR',
          approvedFxRate: 0,
          fxRateDate: '2024-04-01',
          fxRateSource: 'TEST',
          inrUnitPrice: 0,
          lineSpendInr: 0,
          lineSpendCr: 0,
          inclusionStatus: 'VALID',
          duplicateStatus: 'EXACT_DUPLICATE'
        },
        {
          recordId: 'D2',
          sourceRow: 3,
          sourceFile: 'dup.xlsx',
          rawRecordId: 'D2',
          poNumber: 'PO-DUP',
          poLine: 10,
          transactionDate: '2024-05-01',
          billingMonth: '2024-05',
          fiscalYear: 'FY24-FY25',
          vendorCode: 'V1',
          vendorName: 'Same Vendor',
          normalizedVendor: 'SAME VENDOR',
          vendorConfidence: 1.0,
          itemCode: 'I1',
          itemDescription: 'Same Item',
          normalizedItem: 'Same Item',
          materialGroup: 'MG1',
          plant: '1000',
          quantity: 10,
          uom: 'NOS',
          netPrice: 100,
          currency: 'BAD_CURR',
          approvedFxRate: 0,
          fxRateDate: '2024-04-01',
          fxRateSource: 'TEST',
          inrUnitPrice: 0,
          lineSpendInr: 0,
          lineSpendCr: 0,
          inclusionStatus: 'VALID',
          duplicateStatus: 'EXACT_DUPLICATE'
        }
      ];

      const dupAudit = module1ForensicService.auditDuplicates(dupRaw);
      expect(dupAudit.exactDuplicatesCount).toBe(1);
      expect(dupAudit.businessDuplicatesCount).toBe(1);

      const fxAudit = module1ForensicService.auditFXAndPrimaryFormula(dupRaw);
      expect(fxAudit.fxRecords[0].status).toBe('FX_ZERO_OR_NEGATIVE');
    });

    it('should directly exercise generateReconciliationWorkbook, generateExceptionLedgerWorkbook, and custom xlsx reading', () => {
      // 1. Comprehensive custom xlsx parsing to cover all optional field branches
      const tinyWb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(
        tinyWb,
        xlsx.utils.json_to_sheet([
          {
            'Purch. Doc. Category': 'F',
            'Purchasing Doc. Type': 'NB',
            'Purchasing Group': '001',
            'Purchasing Document': 'PO-100',
            'Item': 20,
            'Document Date': 45383,
            'Supplier Code': 'V001',
            'Supplier Name': 'SUPP_1',
            'Material': 'M001',
            'Short Text': 'Item 1',
            'Material Group': 'RAW',
            'Plant': '1000',
            'Storage location': '0001',
            'Order Quantity': 10,
            'Order Unit': 'KG',
            'Quantity in SKU': 10,
            'Stockkeeping unit': 'KG',
            'Net Price': 50,
            'Currency': 'USD',
            'Total INR': 500,
            'Total In Crs': 0.00005,
            'Price unit': 1,
            'Deletion indicator': 'L',
            'Item Category': '0',
            'Acct Assignment Cat.': 'K'
          },
          {
            // Row 2 with all optional fields omitted
            'Order Quantity': 0,
            'Net Price': 0
          }
        ]),
        'Sheet1'
      );
      const tinyPath = path.resolve(process.cwd(), 'temp_tiny_test.xlsx');
      xlsx.writeFile(tinyWb, tinyPath);
      const tinyLedger = module1ForensicService.buildRawTransactionLedger(tinyPath);
      expect(tinyLedger.length).toBe(2);
      expect(tinyLedger[0].supplierName).toBe('SUPP_1');
      expect(tinyLedger[0].poLine).toBe(20);
      expect(tinyLedger[1].poLine).toBe(10);
      expect(tinyLedger[1].supplierName).toBe('UNMAPPED_SUPPLIER');
      if (fs.existsSync(tinyPath)) fs.unlinkSync(tinyPath);

      // 2. Direct workbook generation without outputPath and with excluded rows
      const tempReconWb = path.resolve(process.cwd(), 'temp_recon_test.xlsx');
      const rec = module1ForensicService.auditReconciliations(validatedLedger.slice(0, 10));
      const pareto = module1ForensicService.auditPareto(rec.supplierSummaries);
      const fxAudit = module1ForensicService.auditFXAndPrimaryFormula(validatedLedger.slice(0, 10));
      const dateAuditSample = module1ForensicService.auditDateAndPeriodScope(validatedLedger.slice(0, 10));
      const generatedPath = module1ForensicService.generateReconciliationWorkbook(
        rawLedger.slice(0, 10),
        validatedLedger.slice(0, 10),
        rec,
        pareto,
        fxAudit.fxRecords,
        dateAuditSample,
        [],
        tempReconWb
      );
      expect(fs.existsSync(generatedPath)).toBe(true);
      if (fs.existsSync(tempReconWb)) fs.unlinkSync(tempReconWb);

      // 3. Direct exception ledger workbook generation
      const tempExcWb = path.resolve(process.cwd(), 'temp_exc_test.xlsx');
      const genExcPath = module1ForensicService.generateExceptionLedgerWorkbook([], tempExcWb);
      expect(fs.existsSync(genExcPath)).toBe(true);
      if (fs.existsSync(tempExcWb)) fs.unlinkSync(tempExcWb);

      // 4. Test error throw when dataset is missing
      expect(() => module1ForensicService.executeFullForensicAudit('C:/non_existent_folder/missing.xlsx')).toThrow(
        'Failed to load raw customer dataset'
      );

      // 5. Test empty collections in reconciliations, pareto, and precision
      const emptyRec = module1ForensicService.auditReconciliations([]);
      expect(emptyRec.crossDimension.totalTransactionSpendInr).toBe(0);
      const emptyPareto = module1ForensicService.auditPareto([]);
      expect(emptyPareto.totalSpendInr).toBe(0);
      const emptyPrecision = module1ForensicService.auditPrecisionAndRounding([]);
      expect(emptyPrecision).toEqual([]);

      // 6. Test completely unmapped fields in master data
      const unmappedMaster = module1ForensicService.auditMasterData([
        {
          recordId: 'UNMAPPED-01',
          sourceRow: 2,
          sourceFile: 'synthetic.xlsx',
          rawRecordId: 'UNMAPPED-01',
          poNumber: 'PO-U',
          poLine: 10,
          transactionDate: '2024-04-01',
          billingMonth: '2024-04',
          fiscalYear: 'FY24-FY25',
          vendorCode: '',
          vendorName: '',
          normalizedVendor: '',
          vendorConfidence: 0.5,
          itemCode: '',
          itemDescription: '',
          normalizedItem: '',
          materialGroup: '',
          plant: '',
          quantity: 1,
          uom: 'NOS',
          netPrice: 10,
          currency: 'INR',
          approvedFxRate: 1.0,
          fxRateDate: '2024-04-01',
          fxRateSource: 'TEST',
          inrUnitPrice: 10,
          lineSpendInr: 10,
          lineSpendCr: 0.000001,
          inclusionStatus: 'VALID',
          duplicateStatus: 'LEGITIMATE_REPEAT_TRANSACTION'
        }
      ]);
      expect(unmappedMaster.suppliers[0].rawVendor).toBe('UNMAPPED_SUPPLIER');
      expect(unmappedMaster.items[0].rawItemCode).toBe('UNMAPPED_ITEM');

      // 7. Test auditDateAndPeriodScope on empty ledger
      const emptyDateAudit = module1ForensicService.auditDateAndPeriodScope([]);
      expect(emptyDateAudit.distinctMonthsCount).toBe(0);
      expect(emptyDateAudit.minTransactionDate).toBe('2024-04-01');

      // 8. Test auditFXAndPrimaryFormula with artificial discrepancy and non-INR
      const fakeDiscrepancy: ValidatedTransactionLedgerRecord = {
        ...validatedLedger[0],
        lineSpendInr: 99999999, // deliberate mismatch to trigger status FAIL
        currency: 'USD',
        approvedFxRate: 83.8
      };
      const fxFailAudit = module1ForensicService.auditFXAndPrimaryFormula([fakeDiscrepancy]);
      expect(fxFailAudit.sampleLineAudits[0].status).toBe('FAIL');
      expect(fxFailAudit.fxRecords[0].methodology).toContain('Approved Historical Central Bank');

      // 9. Test decomposeQualityIndex with empty array
      const emptyQuality = module1ForensicService.decomposeQualityIndex([]);
      expect(emptyQuality.overallQualityIndexPct).toBeDefined();

      // 10. Test generateReconciliationWorkbook with non-empty exclusions and exceptions
      const tempReconWbWithExc = path.resolve(process.cwd(), 'temp_recon_with_exc.xlsx');
      const excludedSampleRecord: ValidatedTransactionLedgerRecord = {
        ...validatedLedger[0],
        recordId: 'EXC-1',
        inclusionStatus: 'EXCLUDED',
        lineSpendInr: 0,
        exclusionReason: 'Zero Quantity Test'
      };
      const exceptionSampleEntry: ExceptionRegisterEntry = {
        recordId: 'EXC-1',
        sourceRow: 10,
        field: 'Order Quantity',
        observedValue: '0',
        expectedRule: 'Quantity > 0',
        status: 'EXCLUDED',
        reason: 'Zero Quantity Test',
        impactOnSpendInr: 0,
        resolution: 'Flagged and excluded',
        timestamp: new Date().toISOString()
      };
      module1ForensicService.generateReconciliationWorkbook(
        rawLedger.slice(0, 5),
        [excludedSampleRecord],
        rec,
        pareto,
        fxAudit.fxRecords,
        dateAuditSample,
        [exceptionSampleEntry],
        tempReconWbWithExc
      );
      expect(fs.existsSync(tempReconWbWithExc)).toBe(true);
      if (fs.existsSync(tempReconWbWithExc)) fs.unlinkSync(tempReconWbWithExc);

      // 11. Test Live FX Rate Independence
      const fxInd = module1ForensicService.testLiveFxRateIndependence(validatedLedger);
      expect(fxInd.isIndependent).toBe(true);
      expect(fxInd.varianceInr).toBe(0);
      expect(fxInd.status).toBe('PASS');
      expect(fxInd.isolationConfirmed).toBe(true);

      // 12. Test Pipeline Reproducibility (Run 1 Total === Run 2 Total)
      const repro = module1ForensicService.testPipelineReproducibility();
      expect(repro.isReproducible).toBe(true);
      expect(repro.varianceInr).toBe(0);
      expect(repro.status).toBe('PASS');

      // 13. Test 16 Data Quality Rules Evaluation
      const qualityRules = module1ForensicService.evaluateDataQualityRules(validatedLedger);
      expect(qualityRules.length).toBe(16);
      expect(qualityRules.every((r) => r.recordsEvaluated === 31671)).toBe(true);
      expect(qualityRules.find((r) => r.ruleId === 'DQR-12')?.status).toBe('WARN');

      // 14. Test generateTransactionProofLedgerWorkbook
      const tempProofWb = path.resolve(process.cwd(), 'temp_proof_test.xlsx');
      const genProofPath = module1ForensicService.generateTransactionProofLedgerWorkbook(
        validatedLedger.slice(0, 10),
        tempProofWb
      );
      expect(fs.existsSync(genProofPath)).toBe(true);
      if (fs.existsSync(tempProofWb)) fs.unlinkSync(tempProofWb);

      // 15. Test generateDataQualityAuditWorkbook
      const tempQualityWb = path.resolve(process.cwd(), 'temp_quality_test.xlsx');
      const qualityIndex = module1ForensicService.decomposeQualityIndex(validatedLedger.slice(0, 10));
      const genQualityPath = module1ForensicService.generateDataQualityAuditWorkbook(
        qualityRules,
        qualityIndex,
        tempQualityWb
      );
      expect(fs.existsSync(genQualityPath)).toBe(true);
      if (fs.existsSync(tempQualityWb)) fs.unlinkSync(tempQualityWb);

      // 16. Test generateSourceToKpiLineageWorkbook
      const tempLineageWb = path.resolve(process.cwd(), 'temp_lineage_test.xlsx');
      const genLineagePath = module1ForensicService.generateSourceToKpiLineageWorkbook(
        rawLedger.slice(0, 10),
        validatedLedger.slice(0, 10),
        rec,
        pareto,
        tempLineageWb
      );
      expect(fs.existsSync(genLineagePath)).toBe(true);
      if (fs.existsSync(tempLineageWb)) fs.unlinkSync(tempLineageWb);

      // 17. Verify all 34 adversarial scenarios (A through AH)
      const allAdversarial = module1ForensicService.runAdversarialTestSuite();
      expect(allAdversarial.length).toBe(34);
      expect(allAdversarial.every((s) => s.status === 'PASS')).toBe(true);
      expect(allAdversarial.find((s) => s.scenarioCode === 'AE')?.scenarioName).toBe('Missing Category / Material Group');
      expect(allAdversarial.find((s) => s.scenarioCode === 'AF')?.scenarioName).toBe('Missing Plant / Facility');
      expect(allAdversarial.find((s) => s.scenarioCode === 'AG')?.scenarioName).toBe('Small-Value Transaction Rounding');
      expect(allAdversarial.find((s) => s.scenarioCode === 'AH')?.scenarioName).toBe('Large-Value Transaction Arithmetic');
    });
  });
});
