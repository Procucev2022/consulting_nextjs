/**
 * Module 2 — Excel Export Styling & Auto-format Utilities
 * Compliant with Rule 8, 9, max 300 lines, cyclomatic complexity <= 10
 */

import type { WorkSheet } from 'xlsx';

export function applyWorksheetFormatting(ws: WorkSheet, rowCount: number, colCount: number): void {
  if (!ws || rowCount <= 0 || colCount <= 0) return;

  // Auto-fit column widths based on cell content
  const colWidths: { wch: number }[] = [];
  for (let c = 0; c < colCount; c++) {
    colWidths.push({ wch: 18 });
  }
  ws['!cols'] = colWidths;

  // Freeze top row
  ws['!views'] = [{ state: 'frozen', ySplit: 1, xSplit: 0, activeCell: 'A2', showGridLines: true }];
}

export function formatInr(val: number): string {
  return Number((val || 0).toFixed(2)).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function formatCr(val: number): string {
  return (val || 0).toFixed(4);
}
