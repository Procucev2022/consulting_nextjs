import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import { Module2BundleBuilder } from '../../src/services/module2BundleBuilder';
import type { RawBundleInput, Module2ValidRowInput } from '../../src/types';

describe('Module2BundleBuilder Unit Tests', () => {
  const workspaceRoot = fs.existsSync(path.resolve(__dirname, '../../../package.json'))
    ? path.resolve(__dirname, '../../../')
    : process.cwd();

  describe('resolveFilePath', () => {
    it('resolves when path is an absolute path to an existing file', () => {
      const existing = path.resolve(workspaceRoot, 'package.json');
      const resolved = Module2BundleBuilder.resolveFilePath(existing);
      expect(resolved).toBe(existing);
    });

    it('resolves relative path relative to store dataDir or fallback candidates', () => {
      const resolved = Module2BundleBuilder.resolveFilePath('package.json');
      expect(fs.existsSync(resolved)).toBe(true);
    });

    it('resolves dev to test storage path fallback if data/dev path is simulated', () => {
      const devPath = path.resolve(workspaceRoot, 'data/dev/assessments.json');
      const resolved = Module2BundleBuilder.resolveFilePath(devPath);
      expect(fs.existsSync(resolved)).toBe(true);
    });

    it('resolves via filename candidate search when fileName is provided', () => {
      const resolved = Module2BundleBuilder.resolveFilePath('non_existent_dir/package.json', 'package.json');
      expect(fs.existsSync(resolved)).toBe(true);
    });

    it('throws error when file cannot be found in any candidate locations', () => {
      expect(() => {
        Module2BundleBuilder.resolveFilePath('completely_unreal_file_123456789.xyz');
      }).toThrow(/Data version file not found on disk at/);
    });
  });

  describe('buildBundleFromTransactions', () => {
    const createMockRow = (id: string, over: Partial<Module2ValidRowInput> = {}): Module2ValidRowInput => ({
      recordId: id,
      poNumber: `PO-${id}`,
      poLine: 1,
      transactionDate: '2026-06-15',
      vendorCode: 'V001',
      vendorName: 'Acme Corp',
      itemCode: 'ITEM-1',
      itemDescription: 'Sample Item',
      quantity: 10,
      uom: 'EA',
      netPrice: 100,
      lineSpendInr: 1000,
      currency: 'INR',
      plant: 'PLANT-1',
      materialGroup: 'DIRECT_MATERIALS',
      billingMonth: '2026-06',
      ...over
    });

    it('builds bundle correctly for non-Borosil dataset with default fiscal period', () => {
      const validRows: Module2ValidRowInput[] = [
        createMockRow('1', { lineSpendInr: 5000000 }),
        createMockRow('2', { lineSpendInr: 5000000, vendorName: '  Beta   Supplies  ' })
      ];

      const input: RawBundleInput = {
        datasetId: 'abc123456789012345',
        dataVersionId: 'DV-01',
        sourceFileName: 'Sample_Dataset.xlsx',
        sourceRowCount: 2,
        validRowCount: 2,
        excludedRowCount: 0,
        anomalyRowCount: 0,
        totalValidatedSpendInr: 10000000,
        totalValidatedSpendCr: 1.0,
        currenciesDetected: ['INR'],
        fileSha256: 'abcdef1234567890abcdef1234567890',
        validRows,
        validNormalized: [
          { inrNormalizedValue: 5000000 },
          { inrNormalizedValue: 5000000 }
        ]
      };

      const bundle = Module2BundleBuilder.buildBundleFromTransactions(input);
      expect(bundle).toBeDefined();
      expect(bundle.canonicalInput.fiscalYear).toBeUndefined(); // inside period
      expect(bundle.canonicalInput.period.fiscalYear).toBe('FY22');
      expect(bundle.canonicalInput.validRowCount).toBe(2);
      expect(bundle.sourcingResult.summary.rawSupplierCount).toBe(2);
      expect(bundle.sourcingResult.summary.normalizedSupplierCount).toBe(2);
    });

    it('builds bundle with Borosil fiscal period and classifies deleted/blocked and STO lines', () => {
      const validRows: Module2ValidRowInput[] = [
        createMockRow('1', {
          lineSpendInr: 10000000,
          vendorName: 'Borosil Chemical Ltd',
          transactionClassification: 'ACTIVE_PROCUREMENT'
        }),
        createMockRow('2', {
          lineSpendInr: 2000000,
          vendorName: 'Blocked Vendor Corp',
          transactionClassification: 'DELETED_OR_BLOCKED_LINE'
        }),
        createMockRow('3', {
          lineSpendInr: 0,
          vendorName: 'Internal Plant STO',
          transactionClassification: 'INTERNAL_TRANSFER_STO'
        })
      ];

      const input: RawBundleInput = {
        datasetId: 'borosil123456789',
        dataVersionId: 'DV-BOROSIL-01',
        sourceFileName: 'Borosil_PO_Consol_Excluding_BSL_Pune.xlsx',
        sourceRowCount: 3,
        validRowCount: 3,
        excludedRowCount: 0,
        anomalyRowCount: 0,
        totalValidatedSpendInr: 12000000,
        totalValidatedSpendCr: 1.2,
        currenciesDetected: ['INR'],
        fileSha256: 'borosilsha256hash1234567890',
        validRows,
        validNormalized: [
          { inrNormalizedValue: 10000000 },
          { inrNormalizedValue: 2000000 },
          { inrNormalizedValue: 0 }
        ],
        suspectedDuplicateRowCount: 1
      };

      const bundle = Module2BundleBuilder.buildBundleFromTransactions(input);
      expect(bundle).toBeDefined();
      expect(bundle.canonicalInput.period.fiscalYear).toBe('FY27');
      expect(bundle.canonicalInput.validRowCount).toBe(1); // Only active line
      expect(bundle.sourcingResult.summary.excludedDeletedBlockedRowCount).toBe(1);
      expect(bundle.sourcingResult.summary.excludedStoRowCount).toBe(1);
      expect(bundle.sourcingResult.summary.grossUploadedSpendInrCr).toBe(1.2);
      expect(bundle.sourcingResult.summary.netBaselineSpendInrCr).toBe(1.0);
      expect(bundle.sourcingResult.summary.excludedDeletedBlockedSpendInrCr).toBe(0.2);
      expect(bundle.sourcingResult.summary.spendExclusionExplanation).toContain('0.2000 Cr');
    });

    it('builds bundle from parsed dataset wrapper using bundleFromParsed', () => {
      const mockParsed: any = {
        file: { filename: 'Sample.xlsx', sha256: 'samplehash123456789' },
        dataVersion: { dataVersionId: 'DV-SAMPLE' },
        data: {
          sourceRowCount: 1,
          validRowCount: 1,
          excludedRowCount: 0,
          anomalyRowCount: 0,
          duplicateRowCount: 0
        },
        module1: {
          totalConvertedInrSpend: 500000,
          totalConvertedInrSpendCr: 0.05
        },
        currency: { currenciesDetected: ['INR'] },
        validRows: [createMockRow('1', { lineSpendInr: 500000 })],
        validNormalizedTransactions: [{ inrNormalizedValue: 500000 }]
      };

      const bundle = Module2BundleBuilder.bundleFromParsed(mockParsed);
      expect(bundle).toBeDefined();
      expect(bundle.canonicalInput.sourceFileName).toBe('Sample.xlsx');
      expect(bundle.sourcingResult.summary.totalSpendAnalyzedInr).toBe(500000);
    });

    it('handles empty vendor, missing billing month, taxonomy matches and undefined values gracefully', () => {
      const validRows: Module2ValidRowInput[] = [
        createMockRow('1', {
          vendorName: '',
          billingMonth: undefined,
          itemDescription: 'Soda Ash Dense Grade',
          lineSpendInr: undefined
        }),
        createMockRow('2', {
          vendorName: undefined,
          billingMonth: '',
          itemDescription: '',
          itemCode: 'Soda Ash Dense',
          lineSpendInr: 500
        })
      ];

      const input: RawBundleInput = {
        datasetId: 'ds-no-vendor',
        dataVersionId: 'DV-NO-VENDOR',
        sourceRowCount: 2,
        validRowCount: 2,
        excludedRowCount: 0,
        anomalyRowCount: 0,
        totalValidatedSpendInr: 500,
        totalValidatedSpendCr: 0.0001,
        currenciesDetected: ['INR'],
        fileSha256: 'sha-novendor-123456',
        validRows,
        validNormalized: []
      };

      const bundle = Module2BundleBuilder.buildBundleFromTransactions(input);
      expect(bundle).toBeDefined();
      expect(bundle.sourcingResult.summary.rawSupplierCount).toBe(0);
      expect(bundle.transactions[0].unspsc_code).toBeDefined();
      expect(bundle.transactions[1].unspsc_code).toBeDefined();
    });
  });
});
