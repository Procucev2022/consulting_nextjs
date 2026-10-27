/**
 * Module 3 PCBI Phase 2 — Borosil Ltd Authoritative Benchmark Requirements Catalog & Source Matrix
 * Derived strictly from canonical Borosil purchase transactions (AIC-2026-0002).
 * Rule 8: Isolated in constants, no hardcoded magic values, Rule 9: typed. Max 300 lines.
 */

import type {
  BorosilBenchmarkRequirementsItem,
  BorosilBenchmarkCoverageSummary
} from '../types/module3PcbiMapping';

export * from './module3PcbiBorosilMappings';

export const BOROSIL_BENCHMARK_REQUIREMENTS_CATALOG: BorosilBenchmarkRequirementsItem[] = [
  {
    materialGroupId: 'GRP-BOR-SODA-ASH',
    materialGroupName: 'Soda Ash (Dense & Light)',
    priorityRank: 1,
    materialsCount: 3,
    transactionCount: 12,
    totalHistoricalSpendCr: 74.0170,
    sapMaterialCodes: ['100SA02G', '100SA01T', 'KPMAINT07134'],
    module2Categories: ['11100', 'KPMISC'],
    purchaseUoms: ['MT', 'EA'],
    normalizedUom: 'MT',
    requiredBenchmarkSpecification: 'Dense Soda Ash (Na2CO3 >= 99.2%, Bulk Density 1.0-1.1 g/cm3), Ex-Works Gujarat',
    candidatePublisher: 'Alkali Manufacturers Association of India (AMAI) / Chemical Weekly / ICIS Asia',
    sourceFrequency: 'MONTHLY',
    geographicCoverage: 'Domestic India (Gujarat Manufacturing Belt)',
    requiredCurrency: 'INR',
    deliveryTerms: 'Ex-Works / FOR Destination (Dahej/Bharuch)',
    actualSourceAvailability: 'SOURCE_IDENTIFIED_DATA_NOT_ACQUIRED',
    mappingConfidence: 'HIGH',
    unresolvedQuestions: [
      'AMAI published bulletins require official acquisition for FY 2026-27 observations.',
      'Price bridge required between local spot supplier vs. contracted primary producer (GHCL).'
    ]
  },
  {
    materialGroupId: 'GRP-BOR-SILICA-QUARTZ',
    materialGroupName: 'Silica Sand & Quartz',
    priorityRank: 2,
    materialsCount: 4,
    transactionCount: 28,
    totalHistoricalSpendCr: 39.0219,
    sapMaterialCodes: ['100SSW13FG-L', '100SSW12FG', '100QS01PR', 'R44319012'],
    module2Categories: ['11100', 'WIP-L-SIP'],
    purchaseUoms: ['MT', 'EA'],
    normalizedUom: 'MT',
    requiredBenchmarkSpecification: 'High Purity Beneficiated Silica Sand (SiO2 > 99.5%, Fe2O3 < 100-150 ppm, Mesh 30-100)',
    candidatePublisher: 'Indian Bureau of Mines (IBM) Monthly Mineral Statistics / Ministry of Mines',
    sourceFrequency: 'MONTHLY',
    geographicCoverage: 'Domestic India (Quarry Gate Gujarat/Rajasthan)',
    requiredCurrency: 'INR',
    deliveryTerms: 'Ex-Quarry / FOR Plant Govali',
    actualSourceAvailability: 'MANUAL_VALIDATION_REQUIRED',
    mappingConfidence: 'MEDIUM',
    unresolvedQuestions: [
      'IBM statistics track unwashed commercial sand, whereas solar glass demands ultra-low iron (<100 ppm) washed silica sand.',
      'Washing, grading, and magnetic separation cost premiums require formal engineering validation.'
    ]
  },
  {
    materialGroupId: 'GRP-BOR-BORIC-BORAX',
    materialGroupName: 'Boric Acid and Borax',
    priorityRank: 3,
    materialsCount: 0,
    transactionCount: 0,
    totalHistoricalSpendCr: 0.0000,
    sapMaterialCodes: [],
    module2Categories: [],
    purchaseUoms: [],
    normalizedUom: 'MT',
    requiredBenchmarkSpecification: 'Technical Grade Boric Acid (H3BO3 99.5%) / Disodium Octaborate Tetrahydrate',
    candidatePublisher: 'Chemical Weekly / US Geological Survey (USGS) Mineral Industry Surveys',
    sourceFrequency: 'MONTHLY',
    geographicCoverage: 'Import / Domestic India',
    requiredCurrency: 'INR',
    deliveryTerms: 'CIF Nhava Sheva / Ex-Warehouse',
    actualSourceAvailability: 'NO_SUITABLE_SOURCE_IDENTIFIED',
    mappingConfidence: 'HIGH',
    unresolvedQuestions: [
      'Borosil solar glass manufacturing PO ledger does not contain boric acid or borax purchases (Spend = ₹0.00 Cr).',
      'Confirmed absent from AIC-2026-0002 dataset. No benchmark series required for this plant scope.'
    ]
  },
  {
    materialGroupId: 'GRP-BOR-CORRUGATED-PAPER',
    materialGroupName: 'Corrugated Boxes, Cartons and Kraft Paper',
    priorityRank: 4,
    materialsCount: 108,
    transactionCount: 413,
    totalHistoricalSpendCr: 8.1840,
    sapMaterialCodes: ['300PP112', '583IM158', '574IM090', '524LI050'],
    module2Categories: ['11300', '11583', '11574', '11524'],
    purchaseUoms: ['KG', 'NO'],
    normalizedUom: 'KG',
    requiredBenchmarkSpecification: 'Virgin & Semi-Kraft Paper (16-20 BF, 120-150 GSM) Ex-Mill Western India',
    candidatePublisher: 'RBI WPI Paper & Pulp Index / Federation of Corrugated Box Manufacturers (FCBM)',
    sourceFrequency: 'MONTHLY',
    geographicCoverage: 'Domestic India (Western Region)',
    requiredCurrency: 'INR',
    deliveryTerms: 'FOR Govali Plant',
    actualSourceAvailability: 'SOURCE_IDENTIFIED_DATA_NOT_ACQUIRED',
    mappingConfidence: 'MEDIUM',
    unresolvedQuestions: [
      'Raw Kraft paper (300PP112, ₹6.96 Cr) has identified source via WPI, but 2026 series is not yet acquired.',
      'Finished customized carton boxes cannot be linked directly to raw paper without conversion spread models.'
    ]
  },
  {
    materialGroupId: 'GRP-BOR-POLYMERS',
    materialGroupName: 'Polypropylene, LDPE and HDPE',
    priorityRank: 5,
    materialsCount: 181,
    transactionCount: 685,
    totalHistoricalSpendCr: 9.3046,
    sapMaterialCodes: ['KPPMSCBSP110911400', '300PS511', '300PS050', '300PS512'],
    module2Categories: ['KPCAPS', '11300'],
    purchaseUoms: ['PAC', 'M', 'KG'],
    normalizedUom: 'KG',
    requiredBenchmarkSpecification: 'Polypropylene Raffia / HDPE Injection / LDPE Film Grade Ex-Hazira/Dahej',
    candidatePublisher: 'Reliance Industries Limited (RIL) Pricing Circulars / Platts PolymerScan India / ICIS',
    sourceFrequency: 'WEEKLY',
    geographicCoverage: 'Domestic India (Ex-Refinery Gujarat)',
    requiredCurrency: 'INR',
    deliveryTerms: 'Ex-Works Refinery / FOR Destination',
    actualSourceAvailability: 'LICENSE_REQUIRED',
    mappingConfidence: 'MEDIUM',
    unresolvedQuestions: [
      'Platts and ICIS polymer feeds require paid commercial subscriptions.',
      'Plastic caps and packaging accessories include moulding value-add that must be decoupled from polymer resin.'
    ]
  },
  {
    materialGroupId: 'GRP-BOR-REFRACTORIES',
    materialGroupName: 'Refractories and Furnace Consumables',
    priorityRank: 6,
    materialsCount: 12,
    transactionCount: 13,
    totalHistoricalSpendCr: 0.1026,
    sapMaterialCodes: ['STTV2062', 'STE00598', 'STE00599', 'STMV0334'],
    module2Categories: ['ST-ENG-B'],
    purchaseUoms: ['EA'],
    normalizedUom: 'EA',
    requiredBenchmarkSpecification: 'Sintered Sillimanite / Fused Cast Alumina-Zirconia-Silica (AZS) Furnace Contact Tiles',
    candidatePublisher: 'None (Custom Engineered Proprietary Molded Ceramics)',
    sourceFrequency: 'NONE',
    geographicCoverage: 'Specialized Domestic / Imported',
    requiredCurrency: 'INR',
    deliveryTerms: 'FOR Plant',
    actualSourceAvailability: 'NO_SUITABLE_SOURCE_IDENTIFIED',
    mappingConfidence: 'LOW',
    unresolvedQuestions: [
      'Furnace refractory tiles are custom engineered for glass tank geometry; no public spot commodity index exists.',
      'Must remain classified as NOT_BENCHMARKABLE in PCBI to prevent fictitious variance calculations.'
    ]
  },
  {
    materialGroupId: 'GRP-BOR-FUEL-ENERGY',
    materialGroupName: 'Fuel and Energy (LSHS, LPG, Diesel)',
    priorityRank: 7,
    materialsCount: 6,
    transactionCount: 79,
    totalHistoricalSpendCr: 21.1989,
    sapMaterialCodes: ['400LSH01I', 'KPRMLPG', 'KPRMDIESEL', '400HD001', '400LP01A'],
    module2Categories: ['11400', 'KPGAS', 'KPDIESEL'],
    purchaseUoms: ['MT', 'KG', 'L'],
    normalizedUom: 'MT',
    requiredBenchmarkSpecification: 'IOCL Industrial LSHS Ex-Koyali / IOCL Commercial Bulk LPG / Wholesale Consumer HSD',
    candidatePublisher: 'Indian Oil Corporation Ltd (IOCL) / Petroleum Planning & Analysis Cell (PPAC)',
    sourceFrequency: 'FORTNIGHTLY',
    geographicCoverage: 'Domestic India (Gujarat Depot)',
    requiredCurrency: 'INR',
    deliveryTerms: 'Ex-Installation / Delivered Tanker',
    actualSourceAvailability: 'SOURCE_IDENTIFIED_DATA_NOT_ACQUIRED',
    mappingConfidence: 'HIGH',
    unresolvedQuestions: [
      'IOCL industrial price revision circulars are published fortnightly; 2026 series must be ingested.',
      'LSHS oil (₹15.37 Cr) and Bulk LPG (₹3.26 Cr) represent prime candidates for Phase 3 benchmark data acquisition.'
    ]
  },
  {
    materialGroupId: 'GRP-BOR-MRO-METALS-LUBES',
    materialGroupName: 'Standard MRO (Steel, Aluminium, Lubricants)',
    priorityRank: 8,
    materialsCount: 837,
    transactionCount: 1497,
    totalHistoricalSpendCr: 23.6324,
    sapMaterialCodes: ['534SL042', '500CO010', 'KPPMSCSCA002004100', '600SP022'],
    module2Categories: ['11534', '11500', 'KPCAPS', '11600'],
    purchaseUoms: ['M', 'L', 'PAC', 'NO'],
    normalizedUom: 'UNIT_VARIES',
    requiredBenchmarkSpecification: 'SS304 Seamless Pipe Price List / JPC IS 2062 / Base Oils SN 150/500 Ex-Mumbai',
    candidatePublisher: 'SteelMint / Joint Plant Committee (JPC) / Argus Base Oils Asia',
    sourceFrequency: 'MONTHLY',
    geographicCoverage: 'Domestic India (Western Region)',
    requiredCurrency: 'INR',
    deliveryTerms: 'FOR Govali Plant',
    actualSourceAvailability: 'LICENSE_REQUIRED',
    mappingConfidence: 'MEDIUM',
    unresolvedQuestions: [
      'Cutting oil and lubricants require commercial subscription to Argus Base Oils Asia.',
      'Finished fabrication items (pallets, brackets) include labor and fabrication cost components.'
    ]
  }
];

export const BOROSIL_BENCHMARK_COVERAGE_SUMMARY: BorosilBenchmarkCoverageSummary = {
  assessmentId: 'AIC-2026-0002',
  customerName: 'Borosil Ltd',
  baselineSpendCr: 556.5346,
  baselineTransactions: 27777,
  evaluatedMaterialsCount: 8976,
  mappedApprovedSpendCr: 0.0000,
  mappedApprovedSpendPct: 0.00,
  mappedPendingApprovalSpendCr: 133.0317,
  sourceIdentifiedSpendCr: 103.3999,
  licenseRequiredSpendCr: 32.9370,
  manualValidationRequiredSpendCr: 39.0219,
  noSuitableSourceSpendCr: 0.0153,
  unmappedSpendCr: 423.4876,
  unmappedSpendPct: 76.09,
  marketVarianceValueCr: 0.0000,
  certifiedSavingsCr: 0.0000,
  realizedSavingsCr: 0.0000,
  module4Executed: false
};
