import * as path from 'path';
import * as fs from 'fs';
import * as XLSX from 'xlsx';
import { Module2CanonicalService } from '../src/services/module2CanonicalService';

async function check() {
  console.log('--- RECONCILING 23,570 vs 23,573 & 19,670 vs 19,673 ---');
  
  // 1. Check raw excel files directly
  const textilePath = path.resolve('c:/Users/srini/Desktop/Antigravity Consulting Files/consulting_nextjs/data/dev/assessments/AIC-2026-0002/uploads/Textile1.xlsx');
  const wbTextile = XLSX.readFile(textilePath);
  const textileSheet = wbTextile.Sheets[wbTextile.SheetNames[0]];
  const textileRows: any[] = XLSX.utils.sheet_to_json(textileSheet, { defval: '', blankrows: false });
  console.log(`Textile1.xlsx parsed rows: ${textileRows.length}`);

  const cementPath = path.resolve('c:/Users/srini/Desktop/Antigravity Consulting Files/consulting_nextjs/backend/storage/objects/consulting-doc/1791864181561_Cement2.xlsx');
  const wbCement = XLSX.readFile(cementPath);
  const cementSheet = wbCement.Sheets[wbCement.SheetNames[0]];
  const cementRows: any[] = XLSX.utils.sheet_to_json(cementSheet, { defval: '', blankrows: false });
  console.log(`Cement2.xlsx parsed rows: ${cementRows.length}`);

  // 2. Check canonical input
  const canTextile = await Module2CanonicalService.getCanonicalInput('AIC-2026-0002');
  console.log(`Canonical Textile transactions: ${canTextile.transactions.length}, sourceRowCount: ${canTextile.sourceRowCount}, validRowCount: ${canTextile.validRowCount}, excluded: ${canTextile.excludedRowCount}`);

  const canCement = await Module2CanonicalService.getCanonicalInput('AIC-2026-0003');
  console.log(`Canonical Cement transactions: ${canCement.transactions.length}, sourceRowCount: ${canCement.sourceRowCount}, validRowCount: ${canCement.validRowCount}, excluded: ${canCement.excludedRowCount}`);

  // 3. Search MODULE_1_CERTIFIED_HANDOFF.json for counts
  const handoffPath = path.resolve('MODULE_1_CERTIFIED_HANDOFF.json');
  if (fs.existsSync(handoffPath)) {
    const raw = fs.readFileSync(handoffPath, 'utf-8');
    const handoff = JSON.parse(raw);
    console.log(`Handoff totalRecords: ${handoff.totalRecords}`);

    // Group handoff by assessment or plant or vendor if possible
    // Let's check how many records are in handoff
    console.log(`handoff.handoffRecords length: ${handoff.handoffRecords?.length}`);
    const textileTxsInHandoff = handoff.handoffRecords.filter((r: any) => r.plant === '1008' || r.supplierId?.startsWith('1200') || r.materialGroup?.startsWith('FIN'));
    console.log(`Handoff records matching Textile patterns: ${textileTxsInHandoff.length}`);
  }

  // 4. Check if there are 3 additional rows in any sheets of Textile1.xlsx or Cement2.xlsx
  console.log('\n--- Checking all sheet names in both files ---');
  for (const s of wbTextile.SheetNames) {
    const r: any[] = XLSX.utils.sheet_to_json(wbTextile.Sheets[s], { defval: '' });
    console.log(`Textile Sheet: "${s}", rows: ${r.length}`);
  }
  for (const s of wbCement.SheetNames) {
    const r: any[] = XLSX.utils.sheet_to_json(wbCement.Sheets[s], { defval: '' });
    console.log(`Cement Sheet: "${s}", rows: ${r.length}`);
  }
}

check().catch(console.error);
