/**
 * Module 2 — Excel Export Service
 * Canonical export service for Lever 1 and Lever 2 workbooks
 * Compliant with Rule 8, 9, max 300 lines, cyclomatic complexity <= 10
 */

import * as XLSX from 'xlsx';
import { Module2DirectPriceImprovementEngine } from './module2DirectPriceImprovementEngine';
import { Module2EAuctionEngine } from './module2EAuctionEngine';
import { Module2DirectPriceExcelBuilder } from './module2DirectPriceExcelBuilder';
import { Module2EAuctionExcelBuilder } from './module2EAuctionExcelBuilder';

import { Module2CanonicalService } from './module2CanonicalService';
import { Module2VendorConsolidationEngine } from './module2VendorConsolidationEngine';
import { Module2VendorConsolidationExcelBuilder } from './module2VendorConsolidationExcelBuilder';
import type { DirectPriceImprovementResult } from '../types/module2DirectPriceImprovement';
import type { EAuctionResult } from '../types/module2EAuction';
import type { VendorConsolidationResult, VendorConsolidationQueryOptions } from '../types/module2VendorConsolidation';

export class Module2ExcelExportService {
  public static async generateDirectPriceWorkbookBuffer(
    assessmentIdOrResult: string | DirectPriceImprovementResult,
    financialYear?: string
  ): Promise<{ buffer: Buffer; fileName: string }> {
    const result =
      typeof assessmentIdOrResult === 'string'
        ? await Module2DirectPriceImprovementEngine.calculate(assessmentIdOrResult, { financialYear })
        : assessmentIdOrResult;

    const wb = Module2DirectPriceExcelBuilder.buildWorkbook(result);
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const custSlug = result.customerName.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Lever_1_Direct_Price_Improvement_${custSlug}_${result.assessmentId}.xlsx`;

    return { buffer, fileName };
  }

  public static async generateEAuctionWorkbookBuffer(
    assessmentIdOrResult: string | EAuctionResult,
    financialYear?: string
  ): Promise<{ buffer: Buffer; fileName: string }> {
    const result =
      typeof assessmentIdOrResult === 'string'
        ? await Module2EAuctionEngine.calculate(assessmentIdOrResult, { financialYear })
        : assessmentIdOrResult;

    const wb = Module2EAuctionExcelBuilder.buildWorkbook(result);
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const custSlug = result.customerName.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Lever_2_EAuction_Dynamic_Bidding_${custSlug}_${result.assessmentId}.xlsx`;

    return { buffer, fileName };
  }

  public static async generateVendorConsolidationWorkbookBuffer(
    assessmentIdOrResult: string | VendorConsolidationResult,
    options?: VendorConsolidationQueryOptions
  ): Promise<{ buffer: Buffer; fileName: string }> {
    const result =
      typeof assessmentIdOrResult === 'string'
        ? await Module2VendorConsolidationEngine.calculate(assessmentIdOrResult, options)
        : assessmentIdOrResult;

    const canonical = await Module2CanonicalService.getCanonicalInput(result.assessmentId);
    const allTransactions = canonical?.transactions ?? [];

    const wb = Module2VendorConsolidationExcelBuilder.buildWorkbook(result, allTransactions);
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const custSlug = (result.customerName || result.assessmentId).replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Lever_3_Vendor_Base_Consolidation_${custSlug}_${result.assessmentId}.xlsx`;

    return { buffer, fileName };
  }
}

