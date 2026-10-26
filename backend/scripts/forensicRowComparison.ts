import * as path from 'path';
import * as fs from 'fs';
import * as XLSX from 'xlsx';
import { Module2CanonicalService } from '../src/services/module2CanonicalService';

async function forensic() {
  console.log('=== FORENSIC ROW AUDIT ===');
  
  // 1. ABC Textile
  const textilePath = path.resolve('c:/Users/srini/Desktop/Antigravity Consulting Files/consulting_nextjs/data/dev/assessments/AIC-2026-0002/uploads/Textile1.xlsx');
  const wbTextile = XLSX.readFile(textilePath);
  const sheetT = wbTextile.Sheets[wbTextile.SheetNames[0]];
  const rawDataT: any[][] = XLSX.utils.sheet_to_json(sheetT, { header: 1, defval: null });
  console.log(`ABC Textile raw matrix rows (including header): ${rawDataT.length}`);
  console.log('Header row:', rawDataT[0]);

  // Check if there are any blank or summary rows at the bottom
  for (let r = rawDataT.length - 10; r < rawDataT.length; r++) {
    console.log(`Textile Row ${r}:`, rawDataT[r]?.slice(0, 5));
  }

  // 2. PQR Cement
  const cementPath = path.resolve('c:/Users/srini/Desktop/Antigravity Consulting Files/consulting_nextjs/backend/storage/objects/consulting-doc/1791864181561_Cement2.xlsx');
  const wbCement = XLSX.readFile(cementPath);
  const sheetC = wbCement.Sheets[wbCement.SheetNames[0]];
  const rawDataC: any[][] = XLSX.utils.sheet_to_json(sheetC, { header: 1, defval: null });
  console.log(`PQR Cement raw matrix rows (including header): ${rawDataC.length}`);
  console.log('Header row:', rawDataC[0]);

  for (let r = rawDataC.length - 10; r < rawDataC.length; r++) {
    console.log(`Cement Row ${r}:`, rawDataC[r]?.slice(0, 5));
  }

  // 3. Check if there are other files in the assessment folders
  const dirT = path.resolve('c:/Users/srini/Desktop/Antigravity Consulting Files/consulting_nextjs/data/dev/assessments/AIC-2026-0002');
  console.log('Dir AIC-2026-0002 contents:', fs.readdirSync(dirT));
  const dirC = path.resolve('c:/Users/srini/Desktop/Antigravity Consulting Files/consulting_nextjs/data/dev/assessments/AIC-2026-0003');
  if (fs.existsSync(dirC)) {
    console.log('Dir AIC-2026-0003 contents:', fs.readdirSync(dirC));
  }
}

forensic().catch(console.error);
