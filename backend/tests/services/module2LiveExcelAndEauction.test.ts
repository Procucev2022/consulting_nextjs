import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { Module2DirectPriceImprovementEngine } from '../../src/services/module2DirectPriceImprovementEngine';
import { Module2EAuctionEngine } from '../../src/services/module2EAuctionEngine';
import { Module2ExcelExportService } from '../../src/services/module2ExcelExportService';
import { AssessmentStore } from '../../src/services/assessmentStore';
import { getDevelopmentDataDir } from '../../src/services/assessmentPersistence';
import { AUCTION_SUITABILITY_LABELS } from '../../src/constants/module2EAuction';

describe('Module 2 — Lever 1 and Lever 2 Live Data & Excel Export Verification', () => {
  const store = AssessmentStore.getInstance();
  store.setCustomDataDir(getDevelopmentDataDir());
  store.reloadFromDisk();

  const outDir = path.resolve(process.cwd(), 'artifacts', 'excel_exports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const customers = [
    { id: 'AIC-2026-0002', name: 'ABC Textile Ltd' }
  ];

  for (const cust of customers) {
    describe(`Customer: ${cust.name} (${cust.id})`, () => {
      it('calculates Lever 1 with 100% reconciled UNSPSC category breakdown and generates 7-sheet Excel', async () => {
        const l1 = await Module2DirectPriceImprovementEngine.calculate(cust.id);
        expect(l1.assessmentId).toBe(cust.id);
        expect(l1.commerciallyValidatedSavingsInr).toBe(0);
        expect(l1.commerciallyValidatedSavingsCr).toBe(0);
        expect(l1.categorySummaries.length).toBeGreaterThan(0);
        expect(l1.categoriesAnalysedCount).toBe(l1.categorySummaries.length);

        // Reconciliation: sum of category figures must equal overall figures
        const sumCategoryActual = Math.round(l1.categorySummaries.reduce((s, c) => s + c.actualPurchaseCostInr, 0) * 100) / 100;
        const sumCategoryBench = Math.round(l1.categorySummaries.reduce((s, c) => s + c.benchmarkCostInr, 0) * 100) / 100;
        const sumCategoryLostOpp = Math.round(l1.categorySummaries.reduce((s, c) => s + c.historicalLostOpportunityInr, 0) * 100) / 100;
        const sumCategoryTxs = l1.categorySummaries.reduce((s, c) => s + c.eligibleTransactionCount, 0);

        expect(sumCategoryActual).toBe(l1.actualSpendInr);
        expect(sumCategoryBench).toBe(l1.benchmarkCostInr);
        expect(sumCategoryLostOpp).toBe(l1.historicalLostOpportunityInr);
        expect(sumCategoryTxs).toBe(l1.totalEligibleTransactions);

        // Generate and verify Excel workbook
        const { buffer, fileName } = await Module2ExcelExportService.generateDirectPriceWorkbookBuffer(l1);
        expect(buffer).toBeDefined();
        expect(buffer.length).toBeGreaterThan(1000);
        expect(fileName).toContain('.xlsx');

        const filePath = path.join(outDir, fileName);
        fs.writeFileSync(filePath, buffer);
        expect(fs.existsSync(filePath)).toBe(true);

        const wb = XLSX.read(buffer, { type: 'buffer' });
        const expectedSheets = [
          'Executive Summary',
          'UNSPSC Category Summary',
          'Material-Level Analysis',
          'Transaction-Level Evidence',
          'Excluded Transactions',
          'Data Quality and UNSPSC',
          'Financial-Year Analysis'
        ];
        expect(wb.SheetNames).toEqual(expectedSheets);

        for (const sheet of expectedSheets) {
          expect(wb.Sheets[sheet]).toBeDefined();
          expect(wb.Sheets[sheet]['!ref']).toBeDefined();
        }
        const summaryRows = XLSX.utils.sheet_to_json(wb.Sheets['Executive Summary']);
        expect(summaryRows.length).toBeGreaterThan(0);
      }, 45000);

      it('evaluates Lever 2 E-Auction dynamic bidding candidates and generates 6-sheet Excel', async () => {
        const l2 = await Module2EAuctionEngine.calculate(cust.id);
        expect(l2.assessmentId).toBe(cust.id);
        expect(l2.commerciallyValidatedSavingsInr).toBe(0);
        expect(l2.commerciallyValidatedSavingsCr).toBe(0);
        expect(l2.categories.length).toBeGreaterThan(0);
        expect(l2.candidateCategoriesCount).toBeGreaterThanOrEqual(0);
        expect(l2.candidateMaterialsCount).toBeGreaterThanOrEqual(0);

        const validLabels = [
          AUCTION_SUITABILITY_LABELS.CANDIDATE,
          AUCTION_SUITABILITY_LABELS.FURTHER_DATA,
          AUCTION_SUITABILITY_LABELS.NOT_SUITABLE,
          AUCTION_SUITABILITY_LABELS.NOT_ASSESSED
        ];

        for (const cat of l2.categories) {
          expect(validLabels).toContain(cat.auctionSuitability);
          expect(cat.auctionSuitability).not.toBe('Auction Ready');
          for (const m of cat.materials) {
            expect(validLabels).toContain(m.suitability);
            expect(m.suitability).not.toBe('Auction Ready');
          }
        }

        // Generate and verify Excel workbook
        const { buffer, fileName } = await Module2ExcelExportService.generateEAuctionWorkbookBuffer(l2);
        expect(buffer).toBeDefined();
        expect(buffer.length).toBeGreaterThan(1000);
        expect(fileName).toContain('.xlsx');

        const filePath = path.join(outDir, fileName);
        fs.writeFileSync(filePath, buffer);
        expect(fs.existsSync(filePath)).toBe(true);

        const wb = XLSX.read(buffer, { type: 'buffer' });
        const expectedSheets = [
          'Executive Summary',
          'UNSPSC Category Analysis',
          'Material Candidate Analysis',
          'Purchase History Evidence',
          'Candidate Decisions',
          'Data Quality and Limitations'
        ];
        expect(wb.SheetNames).toEqual(expectedSheets);

        for (const sheet of expectedSheets) {
          expect(wb.Sheets[sheet]).toBeDefined();
          expect(wb.Sheets[sheet]['!ref']).toBeDefined();
        }
        const summaryRows = XLSX.utils.sheet_to_json(wb.Sheets['Executive Summary']);
        expect(summaryRows.length).toBeGreaterThan(0);
      }, 45000);
    });
  }
});
