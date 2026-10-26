/**
 * E2E-GOLD-001 Golden Test Dataset Generator
 * Generates deterministically 200 rows covering all 10 required dimensions:
 * Currencies, Suppliers, Material Groups, Plants, Multi-Year Dates, Price Units,
 * Data Quality exclusions/anomalies, FX lookups, PCBI Benchmarks, and Savings Levers.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as XLSX from 'xlsx';

export interface GoldenTransactionRow {
  'Purchasing Document': string;
  'Item': string;
  'Document Date': string;
  'Posting Date': string;
  'Vendor': string;
  'Name of Supplier': string;
  'Material': string;
  'Short Text': string;
  'Material Group': string;
  'Plant': string;
  'Order Quantity': number;
  'Order Unit': string;
  'Net Price': number;
  'Price Unit': number;
  'Currency': string;
  'Net Value in INR': number;
  'Deletion Indicator': string;
  'Classification Notes'?: string;
}

export function generateE2EGold001Dataset(): GoldenTransactionRow[] {
  const rows: GoldenTransactionRow[] = [];

  const suppliers = [
    { code: 'SUP-001', name: 'Apex Industrial Piping Ltd' },
    { code: 'SUP-002', name: 'Bharat Heavy Polymers Ltd' },
    { code: 'SUP-003', name: 'Continental Fasteners Corp' },
    { code: 'SUP-004', name: 'Deccan Chemical Synthetics' },
    { code: 'SUP-005', name: 'Everest Packaging Solutions' },
    { code: 'SUP-006', name: 'FastTrack Logistics Services' },
    { code: 'SUP-007', name: 'Global Steel & Alloys Inc' },
    { code: 'SUP-008', name: 'Horizon Electrical Systems' },
    { code: 'SUP-009', name: 'Industrial MRO Spares Ltd' },
    { code: 'SUP-010', name: 'Jupiter Precision Valves' },
    { code: 'SUP-011', name: 'Bharat Heavy Polymers Pvt Ltd' }, // duplicate-looking name with different code
    { code: 'SUP-012', name: 'Quarantined Supplier Ltd' } // supplier with only excluded transactions
  ];

  const materialGroups = [
    { code: 'MG-DIR-01', name: 'Polymers & Resins', desc: 'Polypropylene Granules Grade A', uom: 'KG', basePrice: 145.0, benchmarkPrice: 135.0, isBenchmarkable: true },
    { code: 'MG-DIR-02', name: 'Steel Pipes & Tubes', desc: 'Seamless Carbon Steel Pipe 2 inch', uom: 'MTR', basePrice: 850.0, benchmarkPrice: 800.0, isBenchmarkable: true },
    { code: 'MG-DIR-03', name: 'Precision Fasteners', desc: 'High Tensile Hex Bolts M16', uom: 'EA', basePrice: 42.50, benchmarkPrice: 38.0, isBenchmarkable: true },
    { code: 'MG-PAC-01', name: 'Corrugated Packaging', desc: 'Heavy Duty 5-Ply Corrugated Box', uom: 'BOX', basePrice: 95.0, benchmarkPrice: 90.0, isBenchmarkable: false },
    { code: 'MG-MRO-01', name: 'Industrial MRO Spares', desc: 'Hydraulic Seal Kit Type B', uom: 'SET', basePrice: 1250.0, benchmarkPrice: 0.0, isBenchmarkable: false },
    { code: 'MG-IND-01', name: 'Lubricants & Oils', desc: 'Industrial Gear Oil ISO VG 320', uom: 'LTR', basePrice: 320.0, benchmarkPrice: 295.0, isBenchmarkable: true },
    { code: 'MG-ENG-01', name: 'Custom Engineered Dies', desc: 'Custom Stamping Die Assembly', uom: 'EA', basePrice: 450000.0, benchmarkPrice: 0.0, isBenchmarkable: false },
    { code: 'MG-SRV-01', name: 'Facility Logistics', desc: 'Plant Warehousing & Inbound Freight', uom: 'EA', basePrice: 85000.0, benchmarkPrice: 0.0, isBenchmarkable: false }
  ];

  const plants = ['PL-1010', 'PL-1020', 'PL-1030', 'PL-1040'];

  // Currency exchange rates for conversion
  const fxRates: Record<string, number> = {
    INR: 1.0,
    USD: 83.50,
    EUR: 90.50,
    CNY: 11.60
  };

  // Dates across 14 months (Apr 2024 to May 2025 across FY 24-25 and FY 25-26)
  const sampleDates = [
    '2024-04-15', '2024-04-30', '2024-05-20', '2024-06-18', '2024-07-22',
    '2024-08-14', '2024-09-30', '2024-10-15', '2024-11-25', '2024-12-31',
    '2025-01-02', '2025-01-28', '2025-02-15', '2025-03-31', '2025-04-10', '2025-05-20'
  ];

  let poCounter = 1000;

  // --------------------------------------------------------------------------
  // PART 1: 180 VALID TRANSACTIONS
  // --------------------------------------------------------------------------
  for (let i = 0; i < 180; i++) {
    const poNum = `4500${poCounter + Math.floor(i / 2)}`;
    const lineItem = `${((i % 2) + 1) * 10}`;
    const date = sampleDates[i % sampleDates.length];
    
    // Distribute currencies: ~125 INR, 25 USD, 15 EUR, 15 CNY
    let currency = 'INR';
    if (i >= 125 && i < 150) currency = 'USD';
    else if (i >= 150 && i < 165) currency = 'EUR';
    else if (i >= 165 && i < 180) currency = 'CNY';

    // Supplier assignment (first 11 suppliers, SUP-012 reserved for exclusions)
    const sup = suppliers[i % 11];

    // Material group assignment
    const mg = materialGroups[i % materialGroups.length];
    const plant = plants[i % plants.length];

    // Quantity variants: normal, decimal, large
    let qty = 100 + (i * 7) % 500;
    if (i % 5 === 0) qty = Number((qty + 0.75).toFixed(2));
    if (i % 7 === 0) qty = Number((qty + 0.50).toFixed(2));

    // Price unit: 1, 10, 100, 1000
    let priceUnit = 1;
    if (i % 25 === 0) priceUnit = 10;
    else if (i % 40 === 0) priceUnit = 100;
    else if (i % 75 === 0) priceUnit = 1000;

    // Unit price in transaction currency
    let unitPrice = mg.basePrice;
    if (currency === 'USD') unitPrice = Number((mg.basePrice / 83.50).toFixed(2));
    else if (currency === 'EUR') unitPrice = Number((mg.basePrice / 90.50).toFixed(2));
    else if (currency === 'CNY') unitPrice = Number((mg.basePrice / 11.60).toFixed(2));
    if (priceUnit > 1) unitPrice = unitPrice * priceUnit;

    const rate = fxRates[currency] || 1.0;
    const lineSpendInr = Number(((qty * (unitPrice / priceUnit)) * rate).toFixed(2));

    rows.push({
      'Purchasing Document': poNum,
      'Item': lineItem,
      'Document Date': date,
      'Posting Date': date,
      'Vendor': sup.code,
      'Name of Supplier': sup.name,
      'Material': `MAT-${mg.code}-${String((i % 5) + 1).padStart(3, '0')}`,
      'Short Text': mg.desc,
      'Material Group': mg.code,
      'Plant': plant,
      'Order Quantity': qty,
      'Order Unit': mg.uom,
      'Net Price': unitPrice,
      'Price Unit': priceUnit,
      'Currency': currency,
      'Net Value in INR': lineSpendInr,
      'Deletion Indicator': '',
      'Classification Notes': 'VALID_OPERATIONAL_TRANSACTION'
    });
  }

  // --------------------------------------------------------------------------
  // PART 2: 16 EXCLUDED TRANSACTIONS
  // --------------------------------------------------------------------------
  // 4 rows Deletion L
  for (let i = 0; i < 4; i++) {
    const poNum = `4500${2000 + i}`;
    const date = sampleDates[i];
    const sup = suppliers[i % suppliers.length];
    const mg = materialGroups[0];
    const qty = 50;
    const price = 145.0;
    rows.push({
      'Purchasing Document': poNum,
      'Item': '10',
      'Document Date': date,
      'Posting Date': date,
      'Vendor': sup.code,
      'Name of Supplier': sup.name,
      'Material': `MAT-${mg.code}-001`,
      'Short Text': mg.desc,
      'Material Group': mg.code,
      'Plant': 'PL-1010',
      'Order Quantity': qty,
      'Order Unit': 'KG',
      'Net Price': price,
      'Price Unit': 1,
      'Currency': 'INR',
      'Net Value in INR': qty * price,
      'Deletion Indicator': 'L',
      'Classification Notes': 'EXCLUDED_DELETION_INDICATOR_L'
    });
  }

  // 4 rows Deletion X
  for (let i = 0; i < 4; i++) {
    const poNum = `4500${2010 + i}`;
    const date = sampleDates[i + 4];
    const sup = suppliers[i % suppliers.length];
    const mg = materialGroups[1];
    const qty = 20;
    const price = 850.0;
    rows.push({
      'Purchasing Document': poNum,
      'Item': '10',
      'Document Date': date,
      'Posting Date': date,
      'Vendor': sup.code,
      'Name of Supplier': sup.name,
      'Material': `MAT-${mg.code}-001`,
      'Short Text': mg.desc,
      'Material Group': mg.code,
      'Plant': 'PL-1020',
      'Order Quantity': qty,
      'Order Unit': 'MTR',
      'Net Price': price,
      'Price Unit': 1,
      'Currency': 'INR',
      'Net Value in INR': qty * price,
      'Deletion Indicator': 'X',
      'Classification Notes': 'EXCLUDED_DELETION_INDICATOR_X'
    });
  }

  // 3 rows Zero Quantity
  for (let i = 0; i < 3; i++) {
    const poNum = `4500${2020 + i}`;
    const date = sampleDates[i + 8];
    const sup = suppliers[11]; // SUP-012 Quarantined Supplier
    const mg = materialGroups[2];
    rows.push({
      'Purchasing Document': poNum,
      'Item': '10',
      'Document Date': date,
      'Posting Date': date,
      'Vendor': sup.code,
      'Name of Supplier': sup.name,
      'Material': `MAT-${mg.code}-001`,
      'Short Text': mg.desc,
      'Material Group': mg.code,
      'Plant': 'PL-1030',
      'Order Quantity': 0,
      'Order Unit': 'EA',
      'Net Price': 42.50,
      'Price Unit': 1,
      'Currency': 'INR',
      'Net Value in INR': 0,
      'Deletion Indicator': '',
      'Classification Notes': 'EXCLUDED_ZERO_QUANTITY'
    });
  }

  // 2 rows FOC (Free of Cost / Zero Price)
  for (let i = 0; i < 2; i++) {
    const poNum = `4500${2030 + i}`;
    const date = sampleDates[i + 11];
    const sup = suppliers[4];
    const mg = materialGroups[3];
    rows.push({
      'Purchasing Document': poNum,
      'Item': '10',
      'Document Date': date,
      'Posting Date': date,
      'Vendor': sup.code,
      'Name of Supplier': sup.name,
      'Material': `MAT-${mg.code}-001`,
      'Short Text': `${mg.desc} - FOC SAMPLE`,
      'Material Group': mg.code,
      'Plant': 'PL-1040',
      'Order Quantity': 100,
      'Order Unit': 'BOX',
      'Net Price': 0,
      'Price Unit': 1,
      'Currency': 'INR',
      'Net Value in INR': 0,
      'Deletion Indicator': '',
      'Classification Notes': 'EXCLUDED_FREE_OF_COST_SAMPLE'
    });
  }

  // 3 rows Missing Optional Fields / Quarantined
  for (let i = 0; i < 3; i++) {
    const poNum = `4500${2040 + i}`;
    const date = sampleDates[i];
    const sup = suppliers[11]; // SUP-012
    const mg = materialGroups[4];
    rows.push({
      'Purchasing Document': poNum,
      'Item': '10',
      'Document Date': date,
      'Posting Date': date,
      'Vendor': sup.code,
      'Name of Supplier': sup.name,
      'Material': '',
      'Short Text': 'Unspecified Non-Production Item',
      'Material Group': mg.code,
      'Plant': 'PL-1010',
      'Order Quantity': 1,
      'Order Unit': 'EA',
      'Net Price': 0,
      'Price Unit': 1,
      'Currency': 'INR',
      'Net Value in INR': 0,
      'Deletion Indicator': '',
      'Classification Notes': 'EXCLUDED_UNSPECIFIED_NON_PRODUCTION'
    });
  }

  // --------------------------------------------------------------------------
  // PART 3: 4 ANOMALY TRANSACTIONS
  // --------------------------------------------------------------------------
  // 1. Negative quantity
  rows.push({
    'Purchasing Document': '45003001',
    'Item': '10',
    'Document Date': '2024-05-15',
    'Posting Date': '2024-05-15',
    'Vendor': 'SUP-001',
    'Name of Supplier': 'Apex Industrial Piping Ltd',
    'Material': 'MAT-MG-DIR-02-001',
    'Short Text': 'Seamless Carbon Steel Pipe 2 inch',
    'Material Group': 'MG-DIR-02',
    'Plant': 'PL-1010',
    'Order Quantity': -10,
    'Order Unit': 'MTR',
    'Net Price': 850.0,
    'Price Unit': 1,
    'Currency': 'INR',
    'Net Value in INR': -8500.0,
    'Deletion Indicator': '',
    'Classification Notes': 'ANOMALY_NEGATIVE_QUANTITY'
  });

  // 2. Negative price
  rows.push({
    'Purchasing Document': '45003002',
    'Item': '10',
    'Document Date': '2024-06-20',
    'Posting Date': '2024-06-20',
    'Vendor': 'SUP-002',
    'Name of Supplier': 'Bharat Heavy Polymers Ltd',
    'Material': 'MAT-MG-DIR-01-001',
    'Short Text': 'Polypropylene Granules Grade A',
    'Material Group': 'MG-DIR-01',
    'Plant': 'PL-1020',
    'Order Quantity': 100,
    'Order Unit': 'KG',
    'Net Price': -145.0,
    'Price Unit': 1,
    'Currency': 'INR',
    'Net Value in INR': -14500.0,
    'Deletion Indicator': '',
    'Classification Notes': 'ANOMALY_NEGATIVE_UNIT_PRICE'
  });

  // 3. Blank material group
  rows.push({
    'Purchasing Document': '45003003',
    'Item': '10',
    'Document Date': '2024-07-25',
    'Posting Date': '2024-07-25',
    'Vendor': 'SUP-003',
    'Name of Supplier': 'Continental Fasteners Corp',
    'Material': 'MAT-MG-DIR-03-001',
    'Short Text': 'High Tensile Hex Bolts M16',
    'Material Group': '',
    'Plant': 'PL-1030',
    'Order Quantity': 500,
    'Order Unit': 'EA',
    'Net Price': 42.50,
    'Price Unit': 1,
    'Currency': 'INR',
    'Net Value in INR': 21250.0,
    'Deletion Indicator': '',
    'Classification Notes': 'ANOMALY_BLANK_MATERIAL_GROUP'
  });

  // 4. Duplicate transaction (duplicate of row 0)
  const dupRow = { ...rows[0], 'Classification Notes': 'ANOMALY_EXACT_DUPLICATE_ROW' };
  rows.push(dupRow);

  return rows;
}

export function saveAndFreezeGoldenDataset(): {
  filePath: string;
  sha256: string;
  totalRows: number;
  validRows: number;
  excludedRows: number;
  anomalyRows: number;
} {
  const rows = generateE2EGold001Dataset();
  const dir = path.resolve(__dirname);
  const filePath = path.join(dir, 'E2E_GOLD_001.xlsx');

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'PURCHASE_HISTORY');
  XLSX.writeFile(wb, filePath);

  const fileBuf = fs.readFileSync(filePath);
  const sha256 = crypto.createHash('sha256').update(fileBuf).digest('hex');

  const validRows = rows.filter(r => r['Classification Notes'] === 'VALID_OPERATIONAL_TRANSACTION').length;
  const excludedRows = rows.filter(r => r['Classification Notes']?.startsWith('EXCLUDED_')).length;
  const anomalyRows = rows.filter(r => r['Classification Notes']?.startsWith('ANOMALY_')).length;

  const checksumData = {
    datasetId: 'E2E-GOLD-001',
    fileName: 'E2E_GOLD_001.xlsx',
    sha256,
    frozenAt: new Date().toISOString(),
    rowCount: rows.length,
    columns: Object.keys(rows[0]),
    population: {
      sourceTotalRows: rows.length,
      validRows,
      excludedRows,
      anomalyRows
    }
  };

  fs.writeFileSync(path.join(dir, 'golden-checksums.json'), JSON.stringify(checksumData, null, 2), 'utf-8');

  console.log(`✅ Generated E2E_GOLD_001.xlsx: ${rows.length} rows (Valid: ${validRows}, Excluded: ${excludedRows}, Anomalies: ${anomalyRows})`);
  console.log(`🔒 SHA-256: ${sha256}`);

  return {
    filePath,
    sha256,
    totalRows: rows.length,
    validRows,
    excludedRows,
    anomalyRows
  };
}

if (require.main === module) {
  saveAndFreezeGoldenDataset();
}
