import * as path from 'path';
import * as XLSX from 'xlsx';

function inspectFile(filePath: string, label: string) {
  console.log(`\n=================== ${label}: ${filePath} ===================`);
  const wb = XLSX.readFile(filePath);
  for (const s of wb.SheetNames) {
    const sheet = wb.Sheets[s];
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
    console.log(`Sheet "${s}" !ref: ${sheet['!ref']}`);
    console.log(`Total rows indicated by ref: ${range.e.r - range.s.r + 1} (start row ${range.s.r}, end row ${range.e.r})`);

    // json with header: 1 (raw array of arrays)
    const rawArrays: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, blankrows: true });
    console.log(`Raw rows including empty (header: 1): ${rawArrays.length}`);

    // json with first row as header
    const rowsWithHeader: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '', blankrows: false });
    console.log(`sheet_to_json (blankrows: false): ${rowsWithHeader.length}`);

    const rowsWithHeaderBlankTrue: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '', blankrows: true });
    console.log(`sheet_to_json (blankrows: true): ${rowsWithHeaderBlankTrue.length}`);

    // Check last 10 rows
    console.log('--- Last 5 rows of rawArrays ---');
    for (let r = Math.max(0, rawArrays.length - 5); r < rawArrays.length; r++) {
      console.log(`Row ${r}:`, JSON.stringify(rawArrays[r]?.slice(0, 5)));
    }
  }
}

const textilePath = path.resolve('c:/Users/srini/Desktop/Antigravity Consulting Files/consulting_nextjs/data/dev/assessments/AIC-2026-0002/uploads/Textile1.xlsx');
const cementPath = path.resolve('c:/Users/srini/Desktop/Antigravity Consulting Files/consulting_nextjs/backend/storage/objects/consulting-doc/1791864181561_Cement2.xlsx');

inspectFile(textilePath, 'ABC Textile');
inspectFile(cementPath, 'PQR Cement');
