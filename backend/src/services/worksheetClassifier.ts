/**
 * Worksheet Classification Helpers
 * 
 * Classifies worksheet types based on names and detected column signatures.
 */

import type { WorksheetClassification } from '../types/worksheetDiscovery';
import { NON_TRANSACTION_SHEET_KEYWORDS } from '../constants/schemaMatching';

export function classifyNonTransactionSheet(
  sheetName: string
): { classification: WorksheetClassification; confidence: number; reason: string } | null {
  const lower = sheetName.toLowerCase();
  const isNonTx = NON_TRANSACTION_SHEET_KEYWORDS.some((kw) => lower.includes(kw));
  if (!isNonTx) return null;

  if (lower.includes('cover') || lower.includes('readme') || lower.includes('instruction')) {
    return {
      classification: 'COVER_PAGE',
      confidence: 0.05,
      reason: `Sheet name matches cover/instruction pattern '${sheetName}'.`
    };
  }
  if (lower.includes('summary') || lower.includes('dashboard') || lower.includes('pivot')) {
    return {
      classification: 'SUMMARY',
      confidence: 0.15,
      reason: `Sheet name matches summary/dashboard pattern '${sheetName}'.`
    };
  }
  if (lower.includes('lookup') || lower.includes('mapping')) {
    return {
      classification: 'LOOKUP',
      confidence: 0.10,
      reason: `Sheet name matches lookup pattern '${sheetName}'.`
    };
  }
  return {
    classification: 'METADATA',
    confidence: 0.10,
    reason: `Sheet name matches metadata pattern '${sheetName}'.`
  };
}

export function computeTransactionConfidence(
  hasVendor: boolean,
  hasDate: boolean,
  hasPo: boolean,
  dataRowCount: number
): number {
  let base = 0.50;
  if (hasVendor && hasDate) base += 0.30;
  if (hasPo) base += 0.10;
  if (dataRowCount >= 100) base += 0.05;
  if (dataRowCount >= 1000) base += 0.05;
  return Math.min(1.0, Number(base.toFixed(2)));
}

export function classifyByFieldSignatures(
  bestMatchedFields: string[],
  dataRowCount: number,
  totalColsInRange: number
): { classification: WorksheetClassification; confidence: number; reason: string } {
  const hasSpendField = bestMatchedFields.includes('netSpendAmount') ||
    bestMatchedFields.includes('convertedSpendAmount');
  const hasVendorField = bestMatchedFields.includes('vendorName');
  const hasDateField = bestMatchedFields.includes('documentDate');
  const hasPoField = bestMatchedFields.includes('purchaseOrderNumber');

  if (hasSpendField && (hasVendorField || hasDateField || hasPoField) && dataRowCount >= 1) {
    const confidence = computeTransactionConfidence(
      hasVendorField,
      hasDateField,
      hasPoField,
      dataRowCount
    );
    return {
      classification: 'TRANSACTION_TABLE',
      confidence,
      reason: `Recognized core transaction fields (${bestMatchedFields.join(', ')}) with ${dataRowCount} data rows.`
    };
  }

  if (bestMatchedFields.length >= 2 && dataRowCount >= 5) {
    return {
      classification: 'TRANSACTION_TABLE',
      confidence: 0.45,
      reason: `Recognized multiple procurement fields (${bestMatchedFields.join(', ')}).`
    };
  }

  if (dataRowCount < 5 && totalColsInRange < 4) {
    return {
      classification: 'METADATA',
      confidence: 0.05,
      reason: `Sparse sheet with few rows (${dataRowCount}) and columns (${totalColsInRange}).`
    };
  }

  return {
    classification: 'UNKNOWN',
    confidence: 0.15,
    reason: 'Unrecognized column structure.'
  };
}
