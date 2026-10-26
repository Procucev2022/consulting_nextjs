/**
 * Dynamic Worksheet Discovery Types
 * 
 * Defines data structures for inspecting, classifying, and selecting worksheets
 * across heterogeneous procurement workbooks (.xlsx, .xls).
 */

export type WorksheetClassification =
  | 'TRANSACTION_TABLE'
  | 'METADATA'
  | 'COVER_PAGE'
  | 'SUMMARY'
  | 'LOOKUP'
  | 'EMPTY'
  | 'UNKNOWN';

export type WorksheetSelectionStatus =
  | 'AUTO_SELECTED'
  | 'USER_SELECTED'
  | 'AMBIGUOUS'
  | 'NO_USABLE_SHEET';

export interface WorksheetInspectionResult {
  sheetName: string;
  totalRows: number;
  totalColumns: number;
  headerRowIndex: number;
  headers: string[];
  classification: WorksheetClassification;
  confidence: number; // 0.0 to 1.0
  isCandidate: boolean;
  matchedCanonicalFields: string[];
  reasons: string[];
}

export interface WorkbookDiscoveryResult {
  inspectedSheets: WorksheetInspectionResult[];
  selectedSheetName: string | null;
  selectionStatus: WorksheetSelectionStatus;
  selectionReason: string;
  candidateSheets: string[];
  requiresAnalystSelection: boolean;
}
