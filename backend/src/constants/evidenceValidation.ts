/**
 * Zod validation schemas for Output Evidence & Validation Workbooks (Prompt 305)
 */

import { z } from 'zod';

export const evidenceWorkbookTypeSchema = z.enum([
  'MODULE_1_EVIDENCE',
  'MODULE_2_EVIDENCE',
  'PCBI_EVIDENCE',
  'SAVINGS_ENGINE_EVIDENCE',
  'FINANCIAL_VALIDATION',
  'DATA_VERSION_DIFF',
  'REPORT_EVIDENCE',
  'MANAGEMENT_QUICK_SUMMARY_EVIDENCE',
  'ANALYSIS_RUN_CONTROL'
]);

export const downloadWorkbookParamSchema = z.object({
  jobId: z.string().min(1, 'jobId is required'),
  workbookType: evidenceWorkbookTypeSchema
});

export const downloadPackageParamSchema = z.object({
  jobId: z.string().min(1, 'jobId is required')
});

export const parityQuerySchema = z.object({
  workbookType: evidenceWorkbookTypeSchema.optional()
});

export const savingsTypeSchema = z.enum([
  'VENDOR_CONSOLIDATION',
  'BENCHMARK_PRICE_GAP',
  'STRATEGIC_SOURCING',
  'STRATEGIC_MARKET_VALUE',
  'PROCESS_PRODUCTIVITY',
  'COST_AVOIDANCE_RISK',
  'REALIZED_SAVINGS'
]);

export const downloadSavingsTypeParamSchema = z.object({
  jobId: z.string().min(1, 'jobId is required'),
  savingsType: savingsTypeSchema
});

export const savingsTypeInventoryParamSchema = z.object({
  jobId: z.string().min(1, 'jobId is required'),
  savingsType: savingsTypeSchema.optional()
});

