/**
 * Safe Filename Sanitizer Utility (Prompt 258 Section 12)
 */

import { REPORT_FILENAME_PREFIX } from '../constants/executiveBriefExportConstants';

/**
 * Sanitizes unsafe characters: / \ : * ? " < > | and spaces
 */
export function sanitizeFilenamePart(input: string): string {
  if (!input) return 'Client';
  const cleaned = input
    .replace(/[/\\:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return cleaned || 'Client';
}

/**
 * Generates official standardized PDF filename
 */
export function getOfficialPdfFilename(clientName: string, dateStr?: string): string {
  const safeClient = sanitizeFilenamePart(clientName);
  const safeDate = dateStr || new Date().toISOString().split('T')[0];
  return `${REPORT_FILENAME_PREFIX}${safeClient}_${safeDate}.pdf`;
}

/**
 * Generates official standardized PPTX filename
 */
export function getOfficialPptxFilename(clientName: string, dateStr?: string): string {
  const safeClient = sanitizeFilenamePart(clientName);
  const safeDate = dateStr || new Date().toISOString().split('T')[0];
  return `${REPORT_FILENAME_PREFIX}${safeClient}_${safeDate}.pptx`;
}
