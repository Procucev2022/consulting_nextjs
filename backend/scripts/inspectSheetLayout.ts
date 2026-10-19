import * as XLSX from 'xlsx';
import { Module2ExcelExportService } from '../src/services/module2ExcelExportService';

async function inspect() {
  const { buffer } = await Module2ExcelExportService.generateVendorConsolidationWorkbookBuffer('AIC-2026-0002');
  const wb = XLSX.read(buffer, { type: 'buffer' });

  console.log('--- 1. Executive Summary rows (first 25): ---');
  const s1: any[][] = XLSX.utils.sheet_to_json(wb.Sheets['1. Executive Summary'], { header: 1 });
  s1.slice(0, 25).forEach((r, i) => console.log(`Row ${i}:`, r));

  console.log('\n--- 2. UNSPSC Category Analysis rows (first 10): ---');
  const s2: any[][] = XLSX.utils.sheet_to_json(wb.Sheets['2. UNSPSC Category Analysis'], { header: 1 });
  s2.slice(0, 10).forEach((r, i) => console.log(`Row ${i}:`, r));

  console.log('\n--- 3. Source Material Groups rows (first 10): ---');
  const s3: any[][] = XLSX.utils.sheet_to_json(wb.Sheets['3. Source Material Groups'], { header: 1 });
  s3.slice(0, 10).forEach((r, i) => console.log(`Row ${i}:`, r));
}

inspect().catch(console.error);
