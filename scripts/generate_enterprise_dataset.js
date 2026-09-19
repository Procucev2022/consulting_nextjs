const path = require('path');
const fs = require('fs');
const XLSX = require(path.resolve(__dirname, '../frontend/node_modules/xlsx'));

const suppliers = [
  { name: 'Acme Chemical Global LLC', mg: 'CHEMICAL', curr: 'USD', baseRate: 85.5 },
  { name: 'Contoso Polymer Logistics Ltd', mg: 'POLYMERS', curr: 'EUR', baseRate: 92.4 },
  { name: 'DHL Global Freight Solutions', mg: 'FREIGHT', curr: 'EUR', baseRate: 92.4 },
  { name: 'Basell Polyolefins Europe NV', mg: 'POLYMERS', curr: 'EUR', baseRate: 92.4 },
  { name: 'Amcor Packaging India Ltd', mg: 'PACKAGING', curr: 'INR', baseRate: 1.0 },
  { name: 'TCPL Packaging Containers', mg: 'PACKAGING', curr: 'INR', baseRate: 1.0 },
  { name: 'Parksons Packaging Solutions', mg: 'PACKAGING', curr: 'INR', baseRate: 1.0 },
  { name: 'Universal Corrugators Pvt Ltd', mg: 'PACKAGING', curr: 'INR', baseRate: 1.0 },
  { name: 'Borealis Chemical Supply GmbH', mg: 'CHEMICAL', curr: 'EUR', baseRate: 92.4 },
  { name: 'Maersk Line Logistics India', mg: 'FREIGHT', curr: 'USD', baseRate: 85.5 },
  { name: 'SKF Bearing Technologies India', mg: 'MRO', curr: 'INR', baseRate: 1.0 },
  { name: 'Siemens Industrial Automation Ltd', mg: 'MRO', curr: 'EUR', baseRate: 92.4 },
  { name: '3M Safety & Industrial PPE Ltd', mg: 'CONSUMABLES', curr: 'USD', baseRate: 85.5 },
  { name: 'Schneider Electric Power Systems', mg: 'MRO', curr: 'INR', baseRate: 1.0 },
  { name: 'Kuehne + Nagel Supply Chain Ltd', mg: 'FREIGHT', curr: 'USD', baseRate: 85.5 },
  { name: 'Dow Chemical Americas Inc', mg: 'CHEMICAL', curr: 'USD', baseRate: 85.5 },
  { name: 'SABIC Petrochemical Middle East', mg: 'POLYMERS', curr: 'USD', baseRate: 85.5 },
  { name: 'Signode Industrial Packaging Ltd', mg: 'PACKAGING', curr: 'INR', baseRate: 1.0 },
  { name: 'Atlas Copco Compressor India', mg: 'MRO', curr: 'INR', baseRate: 1.0 },
  { name: 'Castrol Industrial Lubricants Ltd', mg: 'MRO', curr: 'INR', baseRate: 1.0 },
  { name: 'Pidilite Industrial Adhesives Ltd', mg: 'CHEMICAL', curr: 'INR', baseRate: 1.0 },
  { name: 'Huhtamaki Flexible Packaging Ltd', mg: 'PACKAGING', curr: 'INR', baseRate: 1.0 },
  { name: 'Blue Dart Express Domestic Freight', mg: 'FREIGHT', curr: 'INR', baseRate: 1.0 },
  { name: 'ABB Power Grids India Pvt Ltd', mg: 'MRO', curr: 'INR', baseRate: 1.0 },
  { name: 'BASF Speciality Chemicals SE', mg: 'CHEMICAL', curr: 'EUR', baseRate: 92.4 },
  { name: 'UPL Agro & Bulk Chemical Corp', mg: 'CHEMICAL', curr: 'INR', baseRate: 1.0 },
  { name: 'Essel Propack Laminated Tubes', mg: 'PACKAGING', curr: 'INR', baseRate: 1.0 },
  { name: 'TCI Freight Transport Logistics', mg: 'FREIGHT', curr: 'INR', baseRate: 1.0 },
  { name: 'Festo Pneumatics India Pvt Ltd', mg: 'MRO', curr: 'INR', baseRate: 1.0 },
  { name: 'Honeywell Industrial Automation', mg: 'MRO', curr: 'USD', baseRate: 85.5 }
];

const catalogItems = [
  // Direct Chemicals & Polymers
  { desc: 'High Density Polyethylene (HDPE) Polymers', code: 'MAT-10101', mg: 'POLYMERS', priceRange: [1200, 1550], unit: 'MT' },
  { desc: 'Polypropylene (PP) Injection Moulding Resin', code: 'MAT-10102', mg: 'POLYMERS', priceRange: [1100, 1450], unit: 'MT' },
  { desc: 'Linear Low-Density Polyethylene (LLDPE) Film Grade', code: 'MAT-10103', mg: 'POLYMERS', priceRange: [1150, 1500], unit: 'MT' },
  { desc: 'Hydrochloric Acid 33% Industrial Grade', code: 'MAT-10201', mg: 'CHEMICAL', priceRange: [120, 180], unit: 'KL' },
  { desc: 'Caustic Soda Lye 48% Bulk Solution', code: 'MAT-10202', mg: 'CHEMICAL', priceRange: [280, 390], unit: 'MT' },
  { desc: 'Titanium Dioxide Rutile White Pigment', code: 'MAT-10203', mg: 'CHEMICAL', priceRange: [2200, 2800], unit: 'KG' },
  { desc: 'Sulfuric Acid 98% Commercial Grade', code: 'MAT-10204', mg: 'CHEMICAL', priceRange: [85, 140], unit: 'MT' },
  { desc: 'Polyvinyl Chloride (PVC) Suspension Resin', code: 'MAT-10104', mg: 'POLYMERS', priceRange: [950, 1300], unit: 'MT' },
  { desc: 'Industrial Synthetic Adhesives & Sealants', code: 'MAT-10205', mg: 'CHEMICAL', priceRange: [350, 520], unit: 'KG' },
  
  // Packaging Materials
  { desc: '5-Ply Corrugated Heavy Duty Shipping Boxes', code: 'PKG-20101', mg: 'PACKAGING', priceRange: [35, 65], unit: 'BOX' },
  { desc: 'Printed Multi-Layer Flexible Packaging Laminates', code: 'PKG-20102', mg: 'PACKAGING', priceRange: [220, 310], unit: 'KG' },
  { desc: 'Mono Carton Packaging Printed Paperboard', code: 'PKG-20103', mg: 'PACKAGING', priceRange: [8, 18], unit: 'PCS' },
  { desc: 'Automatic Stretch Film Wrapping Rolls 23 Microns', code: 'PKG-20104', mg: 'PACKAGING', priceRange: [160, 220], unit: 'ROLL' },
  { desc: 'Polypropylene Heavy Duty Strapping Bands', code: 'PKG-20105', mg: 'PACKAGING', priceRange: [850, 1200], unit: 'ROLL' },
  { desc: 'Laminated Barrier Tubes for Specialty Liquids', code: 'PKG-20106', mg: 'PACKAGING', priceRange: [12, 28], unit: 'PCS' },
  { desc: 'HDPE Plastic Drums 200 Litres Capacity', code: 'PKG-20107', mg: 'PACKAGING', priceRange: [1250, 1850], unit: 'DRUM' },
  
  // Logistics & Freight
  { desc: 'Road FTL 32-Foot Multi-Axle Container Trucking', code: 'FRT-30101', mg: 'FREIGHT', priceRange: [45000, 85000], unit: 'TRIP' },
  { desc: '40ft High Cube Ocean Freight Container Shipping', code: 'FRT-30102', mg: 'FREIGHT', priceRange: [1800, 3200], unit: 'CONT' },
  { desc: 'Cold Chain Refrigerated Express Transport', code: 'FRT-30103', mg: 'FREIGHT', priceRange: [65000, 110000], unit: 'TRIP' },
  { desc: 'Warehouse 3PL Material Staging & Storage Services', code: 'FRT-30104', mg: 'FREIGHT', priceRange: [150000, 350000], unit: 'MONTH' },
  { desc: 'Air Cargo Express Customs Cleared Freight', code: 'FRT-30105', mg: 'FREIGHT', priceRange: [320, 580], unit: 'KG' },
  
  // Plant MRO Spares & Consumables
  { desc: 'Deep Groove Ball Bearings SKF Explorer Series', code: 'MRO-40101', mg: 'MRO', priceRange: [1800, 6500], unit: 'SET' },
  { desc: 'Variable Frequency Drives (VFD) 45kW Inverter', code: 'MRO-40102', mg: 'MRO', priceRange: [85000, 160000], unit: 'UNIT' },
  { desc: 'Centrifugal Slurry Pump Impeller Mechanical Seals', code: 'MRO-40103', mg: 'MRO', priceRange: [12000, 28000], unit: 'SET' },
  { desc: 'Industrial Synthetic Gear Oil ISO VG 220 Drum', code: 'MRO-40104', mg: 'MRO', priceRange: [45000, 72000], unit: 'DRUM' },
  { desc: 'Pneumatic Actuator Solenoid Directional Valves', code: 'MRO-40105', mg: 'MRO', priceRange: [4500, 11500], unit: 'PCS' },
  { desc: '3M Industrial N95 Filtering Facepiece Respirators', code: 'PPE-50101', mg: 'CONSUMABLES', priceRange: [45, 95], unit: 'BOX' },
  { desc: 'Heavy Duty Nitrile Chemical Protection Gloves', code: 'PPE-50102', mg: 'CONSUMABLES', priceRange: [120, 260], unit: 'PAIR' }
];

const plants = ['1000', '1010', '1020', '2000', '3000'];
const dates = [];

// Generate dates across 3 fiscal years: FY24, FY25, FY26
for (let y = 2023; y <= 2025; y++) {
  for (let m = 1; m <= 12; m++) {
    const moStr = m < 10 ? `0${m}` : `${m}`;
    dates.push(`${y}-${moStr}-15`);
  }
}
dates.push('2026-01-15', '2026-02-15', '2026-03-15');

const rows = [];
let poCounter = 450001;

// Generate 450 line items with rich realistic variations
for (let i = 0; i < 450; i++) {
  const item = catalogItems[i % catalogItems.length];
  const matchingSuppliers = suppliers.filter(s => s.mg === item.mg || s.mg === 'CONSUMABLES');
  const sup = matchingSuppliers.length > 0
    ? matchingSuppliers[i % matchingSuppliers.length]
    : suppliers[i % suppliers.length];

  const dateStr = dates[i % dates.length];
  const year = parseInt(dateStr.slice(0, 4), 10);
  const plant = plants[i % plants.length];
  const poNum = `PO-${year}-${poCounter++}`;

  // Price calculation
  const minPrice = item.priceRange[0];
  const maxPrice = item.priceRange[1];
  const rawUnitPrice = Math.round(minPrice + (maxPrice - minPrice) * ((i % 17) / 17));

  // Quantity calculation
  let qty = 100;
  if (item.unit === 'MT') qty = Math.round(5 + (i % 25) * 2);
  else if (item.unit === 'KG') qty = Math.round(150 + (i % 40) * 50);
  else if (item.unit === 'BOX' || item.unit === 'PCS') qty = Math.round(500 + (i % 50) * 100);
  else if (item.unit === 'TRIP' || item.unit === 'CONT') qty = Math.round(1 + (i % 6));
  else if (item.unit === 'DRUM' || item.unit === 'SET') qty = Math.round(2 + (i % 12));
  else qty = Math.round(10 + (i % 20) * 5);

  const subtotalRaw = qty * rawUnitPrice;
  const fxRate = sup.curr === 'USD' ? 85.5 : sup.curr === 'EUR' ? 92.4 : 1.0;
  const totalInr = subtotalRaw * fxRate;
  const totalCr = Number((totalInr / 10000000).toFixed(4));

  rows.push({
    'PO Number': poNum,
    'Document Date': dateStr,
    'Posting Date': dateStr,
    'Material Code': item.code,
    'Material Description': item.desc,
    'Short Text': item.desc,
    'Supplier Name': sup.name,
    'Order Quantity': qty,
    'Unit of Measure': item.unit,
    'Net Price': rawUnitPrice,
    'Currency': sup.curr,
    'Subtotal Raw': subtotalRaw,
    'FX Rate to INR': fxRate,
    'Total INR': Math.round(totalInr),
    'Total In Crs': totalCr,
    'Material Group': item.mg,
    'Plant': plant,
    'Fiscal Year': year <= 2023 ? 'FY24' : year === 2024 ? 'FY25' : 'FY26'
  });
}

// Create Workbook
const ws = XLSX.utils.json_to_sheet(rows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Purchase_History');

const outputDir = path.resolve(__dirname, '../sample_datasets');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPathXlsx = path.join(outputDir, 'Enterprise_Procurement_Dataset_3Year.xlsx');
XLSX.writeFile(wb, outputPathXlsx);

const csvContent = XLSX.utils.sheet_to_csv(ws);
const outputPathCsv = path.join(outputDir, 'Enterprise_Procurement_Dataset_3Year.csv');
fs.writeFileSync(outputPathCsv, csvContent, 'utf8');

console.log(`Successfully generated ${rows.length} rows to:`);
console.log(` - ${outputPathXlsx}`);
console.log(` - ${outputPathCsv}`);
