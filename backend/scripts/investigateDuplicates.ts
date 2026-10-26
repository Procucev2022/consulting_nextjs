import * as path from 'path';
import * as XLSX from 'xlsx';
import { Module2CanonicalService } from '../src/services/module2CanonicalService';
import { buildTransactionSignature } from '../src/services/module2AttributionHelpers';

async function investigateDuplicates() {
  console.log('--- STARTING DUPLICATE INVESTIGATION FOR ABC TEXTILE ---');
  const canonical = await Module2CanonicalService.getCanonicalInput('AIC-2026-0002');
  console.log(`Total canonical transactions: ${canonical.transactions.length}`);

  const rawPath = path.resolve('c:/Users/srini/Desktop/Antigravity Consulting Files/consulting_nextjs/data/dev/assessments/AIC-2026-0002/uploads/Textile1.xlsx');
  const wb = XLSX.readFile(rawPath);
  const sheetName = wb.SheetNames[0];
  const rawRows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { raw: true, defval: '' });
  console.log(`Raw Excel sheet rows: ${rawRows.length}`);
  if (rawRows.length > 0) {
    console.log(`Raw Excel columns:`, Object.keys(rawRows[0]));
  }

  const signatureMap = new Map<string, number[]>();
  for (let i = 0; i < canonical.transactions.length; i++) {
    const t = canonical.transactions[i];
    const sig = buildTransactionSignature(t);
    const indices = signatureMap.get(sig) || [];
    indices.push(i);
    signatureMap.set(sig, indices);
  }

  let dupCount = 0;
  let dupSpend = 0;
  const multiGroups: { sig: string; count: number; indices: number[] }[] = [];
  for (const [sig, indices] of signatureMap.entries()) {
    if (indices.length > 1) {
      dupCount += (indices.length - 1);
      for (let k = 1; k < indices.length; k++) {
        dupSpend += (canonical.transactions[indices[k]].total_spend_inr || 0);
      }
      multiGroups.push({ sig, count: indices.length, indices });
    }
  }

  console.log(`Duplicate occurrences count: ${dupCount}`);
  console.log(`Duplicate spend (INR): ${dupSpend} (₹${(dupSpend / 1e7).toFixed(4)} Cr)`);
  console.log(`Number of unique signatures with repetitions: ${multiGroups.length}`);

  // Inspect 10 representative duplicate groups
  console.log('\n--- 10 REPRESENTATIVE DUPLICATE SIGNATURE GROUPS ---');
  for (let g = 0; g < Math.min(10, multiGroups.length); g++) {
    const grp = multiGroups[g];
    console.log(`\nGroup #${g + 1} (Repeated ${grp.count} times):`);
    console.log(`Signature: ${grp.sig}`);
    for (const idx of grp.indices) {
      const cTx = canonical.transactions[idx];
      const rTx = rawRows[idx];
      console.log(`  [Row #${idx + 2} in Excel]:`);
      console.log(`    PO: "${cTx.po_number}", Line/Item: "${rTx['Purchasing Document Item'] || rTx['Item'] || rTx['Line'] || 'N/A'}", Date: "${cTx.po_date}"`);
      console.log(`    Vendor: "${cTx.vendor_name}" (${cTx.vendor_code})`);
      console.log(`    Material: "${cTx.material_desc}" (${cTx.material_code})`);
      console.log(`    Qty: ${cTx.quantity} ${cTx.uom}, UnitPrice: ₹${cTx.unit_price}, Spend: ₹${cTx.total_spend_inr}`);
      console.log(`    Raw Row JSON: ${JSON.stringify(rTx)}`);
    }
  }

  // Check if raw Excel rows are 100% identical byte-for-byte across all columns
  let literalIdenticalRows = 0;
  let differentLineItems = 0;
  for (const grp of multiGroups) {
    const firstRawJson = JSON.stringify(rawRows[grp.indices[0]]);
    for (let k = 1; k < grp.indices.length; k++) {
      const currentRawJson = JSON.stringify(rawRows[grp.indices[k]]);
      if (firstRawJson === currentRawJson) {
        literalIdenticalRows++;
      } else {
        differentLineItems++;
      }
    }
  }
  console.log(`\n--- RAW ROW IDENTITY ANALYSIS ---`);
  console.log(`Literal 100% identical raw rows across ALL Excel columns: ${literalIdenticalRows} / ${dupCount}`);
  console.log(`Rows with differences in other columns (e.g. line item, delivery date, plant): ${differentLineItems} / ${dupCount}`);
}

investigateDuplicates().catch(console.error);
