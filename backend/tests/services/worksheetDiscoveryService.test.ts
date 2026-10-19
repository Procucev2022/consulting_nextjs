import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { WorksheetDiscoveryService } from '../../src/services/worksheetDiscoveryService';

describe('WorksheetDiscoveryService Unit Tests', () => {
  function createWorkbook(sheets: Record<string, unknown[][]>): XLSX.WorkBook {
    const wb = XLSX.utils.book_new();
    for (const [sheetName, data] of Object.entries(sheets)) {
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }
    return wb;
  }

  describe('Workbook Discovery', () => {
    it('handles empty or missing workbooks', () => {
      const emptyWb = { SheetNames: [], Sheets: {} } as XLSX.WorkBook;
      const res = WorksheetDiscoveryService.discoverWorksheets(emptyWb);
      expect(res.selectionStatus).toBe('NO_USABLE_SHEET');
      expect(res.selectedSheetName).toBeNull();
    });

    it('honors preferred sheet selection by analyst', () => {
      const wb = createWorkbook({
        'Transactions': [
          ['PO Number', 'Vendor Name', 'Doc Date', 'Net Spend Amount'],
          ['PO-1', 'Vendor A', '2025-01-01', 50000]
        ],
        'Summary': [
          ['Title', 'Value'],
          ['Total', 50000]
        ]
      });

      const res = WorksheetDiscoveryService.discoverWorksheets(wb, 'Transactions');
      expect(res.selectionStatus).toBe('USER_SELECTED');
      expect(res.selectedSheetName).toBe('Transactions');
    });

    it('falls back to auto selection if preferredSheetName does not exist in workbook', () => {
      const wb = createWorkbook({
        'Transactions': [
          ['PO Number', 'Vendor Name', 'Doc Date', 'Net Spend Amount'],
          ['PO-1', 'Vendor A', '2025-01-01', 50000]
        ]
      });
      const res = WorksheetDiscoveryService.discoverWorksheets(wb, 'NonExistent');
      expect(res.selectionStatus).toBe('AUTO_SELECTED');
      expect(res.selectedSheetName).toBe('Transactions');
    });

    it('returns NO_USABLE_SHEET when no sheets have transaction data', () => {
      const wb = createWorkbook({
        'Cover': [
          ['Project Name', 'Client Assessment'],
          ['Author', 'John Doe']
        ],
        'Readme': [
          ['Instructions', 'Please read carefully'],
          ['Step 1', 'Upload file']
        ]
      });

      const res = WorksheetDiscoveryService.discoverWorksheets(wb);
      expect(res.selectionStatus).toBe('NO_USABLE_SHEET');
      expect(res.selectedSheetName).toBeNull();
    });

    it('auto-selects a single candidate sheet', () => {
      const wb = createWorkbook({
        'Cover Page': [
          ['Title', 'Report'],
          ['Date', '2025']
        ],
        'Purchases': [
          ['Purchasing Document', 'Vendor Name', 'Doc. Date', 'Net Spend Amount'],
          ['45001', 'Supplier X', '2025-01-15', 100000],
          ['45002', 'Supplier Y', '2025-01-16', 200000]
        ]
      });

      const res = WorksheetDiscoveryService.discoverWorksheets(wb);
      expect(res.selectionStatus).toBe('AUTO_SELECTED');
      expect(res.selectedSheetName).toBe('Purchases');
      expect(res.requiresAnalystSelection).toBe(false);
    });

    it('auto-selects dominant sheet when clear winner exists', () => {
      const largeRows: unknown[][] = [
        ['PO Number', 'Vendor Name', 'Doc Date', 'Net Value']
      ];
      for (let i = 0; i < 150; i++) {
        largeRows.push([`PO-${i}`, `Supplier ${i}`, '2025-01-01', 10000 * (i + 1)]);
      }

      const wb = createWorkbook({
        'Minor Transactions': [
          ['PO Number', 'Vendor Name', 'Doc Date', 'Net Value'],
          ['PO-A', 'Supplier A', '2025-01-01', 5000],
          ['PO-B', 'Supplier B', '2025-01-02', 6000]
        ],
        'Full Procurement Transactions': largeRows
      });

      const res = WorksheetDiscoveryService.discoverWorksheets(wb);
      expect(res.selectedSheetName).toBe('Full Procurement Transactions');
      expect(res.selectionStatus).toBe('AUTO_SELECTED');
    });

    it('flags AMBIGUOUS when multiple competing sheets have similar confidence and volume', () => {
      const rowsA: unknown[][] = [['PO Number', 'Vendor Name', 'Doc Date', 'Net Value']];
      const rowsB: unknown[][] = [['PO Number', 'Vendor Name', 'Doc Date', 'Net Value']];
      for (let i = 0; i < 50; i++) {
        rowsA.push([`PO-A-${i}`, `Vendor ${i}`, '2025-01-01', 10000]);
        rowsB.push([`PO-B-${i}`, `Vendor ${i}`, '2025-01-01', 10000]);
      }

      const wb = createWorkbook({
        'North Region Spend': rowsA,
        'South Region Spend': rowsB
      });

      const res = WorksheetDiscoveryService.discoverWorksheets(wb);
      expect(res.selectionStatus).toBe('AMBIGUOUS');
      expect(res.requiresAnalystSelection).toBe(true);
      expect(res.selectedSheetName).toBeNull();
    });
  });

  describe('Single Sheet Inspection', () => {
    it('handles empty sheet references', () => {
      const ws = {} as XLSX.WorkSheet;
      const res = WorksheetDiscoveryService.inspectSingleSheet(ws, 'Empty');
      expect(res.classification).toBe('EMPTY');
      expect(res.isCandidate).toBe(false);
    });

    it('handles sheet with fewer than 2 rows', () => {
      const ws = XLSX.utils.aoa_to_sheet([['SingleRow']]);
      const res = WorksheetDiscoveryService.inspectSingleSheet(ws, 'OneRow');
      expect(res.classification).toBe('EMPTY');
      expect(res.totalRows).toBe(1);
      expect(res.isCandidate).toBe(false);
    });

    it('classifies cover pages and instructions', () => {
      const ws = XLSX.utils.aoa_to_sheet([
        ['Cover Title', 'Info'],
        ['Notes', 'Details']
      ]);
      const res = WorksheetDiscoveryService.inspectSingleSheet(ws, 'Cover Page');
      expect(res.classification).toBe('COVER_PAGE');
      expect(res.isCandidate).toBe(false);
    });

    it('classifies summary and dashboard sheets', () => {
      const ws = XLSX.utils.aoa_to_sheet([
        ['KPI Summary', 'Total'],
        ['Spend', 1000000]
      ]);
      const res = WorksheetDiscoveryService.inspectSingleSheet(ws, 'Spend Summary');
      expect(res.classification).toBe('SUMMARY');
      expect(res.isCandidate).toBe(false);
    });

    it('classifies lookup and mapping sheets', () => {
      const ws = XLSX.utils.aoa_to_sheet([
        ['Code', 'Description'],
        ['CAT01', 'Electronics']
      ]);
      const res = WorksheetDiscoveryService.inspectSingleSheet(ws, 'Category Lookup');
      expect(res.classification).toBe('LOOKUP');
      expect(res.isCandidate).toBe(false);
    });

    it('classifies metadata sheets with other keywords', () => {
      const ws = XLSX.utils.aoa_to_sheet([
        ['Metadata Key', 'Value'],
        ['Environment', 'Production']
      ]);
      const res = WorksheetDiscoveryService.inspectSingleSheet(ws, 'Audit Notes');
      expect(res.classification).toBe('METADATA');
      expect(res.isCandidate).toBe(false);
    });

    it('recognizes transaction tables with varying row counts', () => {
      const baseHeaders = ['PO Number', 'Vendor Name', 'Doc Date', 'Net Value'];
      const data1000: unknown[][] = [baseHeaders];
      for (let i = 0; i < 1050; i++) {
        data1000.push([`PO-${i}`, `Vendor-${i}`, '2025-01-01', 500]);
      }
      const ws = XLSX.utils.aoa_to_sheet(data1000);
      const res = WorksheetDiscoveryService.inspectSingleSheet(ws, 'Spend Data');
      expect(res.classification).toBe('TRANSACTION_TABLE');
      expect(res.confidence).toBeGreaterThanOrEqual(0.9);
      expect(res.isCandidate).toBe(true);
    });

    it('classifies partial transaction tables without spend amount', () => {
      const rows: unknown[][] = [['PO Number', 'Vendor Name']];
      for (let i = 0; i < 10; i++) rows.push([`PO-${i}`, `Vendor-${i}`]);
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const res = WorksheetDiscoveryService.inspectSingleSheet(ws, 'Partials');
      expect(res.classification).toBe('TRANSACTION_TABLE');
      expect(res.confidence).toBe(0.45);
    });

    it('classifies sparse sheets with few rows and cols as METADATA', () => {
      const ws = XLSX.utils.aoa_to_sheet([['A', 'B'], ['1', '2']]);
      const res = WorksheetDiscoveryService.inspectSingleSheet(ws, 'Sparse');
      expect(res.classification).toBe('METADATA');
      expect(res.confidence).toBe(0.05);
    });

    it('classifies unrecognized structures as UNKNOWN', () => {
      const rows: unknown[][] = [['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon']];
      for (let i = 0; i < 8; i++) rows.push(['1', '2', '3', '4', '5']);
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const res = WorksheetDiscoveryService.inspectSingleSheet(ws, 'Random');
      expect(res.classification).toBe('UNKNOWN');
    });

    it('calculates confidence for transaction tables with 150 rows', () => {
      const rows: unknown[][] = [['PO Number', 'Vendor Name', 'Doc Date', 'Net Spend Amount']];
      for (let i = 0; i < 150; i++) rows.push([`PO-${i}`, `Vendor-${i}`, '2025-01-01', 100]);
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const res = WorksheetDiscoveryService.inspectSingleSheet(ws, 'Medium Spend');
      expect(res.confidence).toBeGreaterThanOrEqual(0.95);
    });

    it('handles transaction sheet with only spend and po', () => {
      const rows: unknown[][] = [['Purchase Order Number', 'Net Spend Amount']];
      for (let i = 0; i < 10; i++) rows.push([`PO-${i}`, 100]);
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const res = WorksheetDiscoveryService.inspectSingleSheet(ws, 'Spend PO');
      expect(res.classification).toBe('TRANSACTION_TABLE');
    });
  });

  describe('Row Extraction', () => {
    it('returns empty results for empty sheets or null', () => {
      const ws = {} as XLSX.WorkSheet;
      expect(WorksheetDiscoveryService.extractRowsFromSheet(ws)).toEqual({ headers: [], rows: [] });
      expect(WorksheetDiscoveryService.extractRowsFromSheet(null as unknown as XLSX.WorkSheet)).toEqual({ headers: [], rows: [] });
      expect(WorksheetDiscoveryService.inspectSingleSheet(null as unknown as XLSX.WorkSheet, 'nullSheet').classification).toBe('EMPTY');
    });

    it('handles fallback header names for empty cells', () => {
      const ws = XLSX.utils.aoa_to_sheet([
        ['PO Number', '', '   ', 'Spend'],
        ['PO-100', 'Val1', 'Val2', 25000]
      ]);
      const res = WorksheetDiscoveryService.extractRowsFromSheet(ws, 0);
      expect(res.headers).toContain('_COL_1');
      expect(res.headers).toContain('_COL_2');
      expect(res.rows.length).toBe(1);
    });

    it('returns empty results if sheet has only 1 row', () => {
      const ws = XLSX.utils.aoa_to_sheet([['ColA', 'ColB']]);
      const res = WorksheetDiscoveryService.extractRowsFromSheet(ws, 0);
      expect(res.rows).toEqual([]);
      expect(res.headers).toEqual([]);
    });

    it('extracts headers and data rows correctly, skipping empty rows', () => {
      const ws = XLSX.utils.aoa_to_sheet([
        ['PO Number', 'Vendor Name', 'Spend'],
        ['PO-100', 'Supplier 1', 25000],
        ['', null, undefined], // Empty row to skip
        ['PO-101', 'Supplier 2', 35000]
      ]);

      const res = WorksheetDiscoveryService.extractRowsFromSheet(ws, 0);
      expect(res.headers).toEqual(['PO Number', 'Vendor Name', 'Spend']);
      expect(res.rows.length).toBe(2);
      expect(res.rows[0]['PO Number']).toBe('PO-100');
      expect(res.rows[1]['PO Number']).toBe('PO-101');
    });

    it('extracts rows with missing trailing columns as null', () => {
      const ws = XLSX.utils.aoa_to_sheet([
        ['PO Number', 'Vendor Name', 'Spend'],
        ['PO-100']
      ]);
      const res = WorksheetDiscoveryService.extractRowsFromSheet(ws, 0);
      expect(res.rows[0]['Vendor Name']).toBeNull();
      expect(res.rows[0]['Spend']).toBeNull();
    });

    it('handles multiple header scan rows where later rows have lower score', () => {
      const ws = XLSX.utils.aoa_to_sheet([
        ['PO Number', 'Vendor Name', 'Doc Date', 'Net Spend Amount'],
        ['Just Some Note', 'Value'],
        ['PO-1', 'Vendor A', '2025-01-01', 50000]
      ]);
      const res = WorksheetDiscoveryService.inspectSingleSheet(ws, 'ScanTest');
      expect(res.headerRowIndex).toBe(0);
    });

    it('does not merge multiple sheets or omit transaction rows from selected sheet', () => {
      const sheetAData = [
        ['PO Number', 'Vendor Name', 'Net Spend Amount'],
        ['PO-A1', 'Vendor 1', 1000],
        ['PO-A2', 'Vendor 2', 2000]
      ];
      const wsA = XLSX.utils.aoa_to_sheet(sheetAData);
      const resA = WorksheetDiscoveryService.extractRowsFromSheet(wsA, 0);
      expect(resA.rows.length).toBe(2);
      expect(resA.rows.map((r) => r['PO Number'])).toEqual(['PO-A1', 'PO-A2']);
    });
  });
});
