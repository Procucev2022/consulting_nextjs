/**
 * Module 4 Savings Engine Forensic Certification Constants
 * Authoritative constants, lever metadata, denominator definitions, and sheet configurations.
 */

export const MODULE_4_ENGINE_VERSION = 'MODULE_4_SAVINGS_ENGINE_V2.0_FORENSIC';

export const MODULE_4_WORKBOOK_FILENAME = 'MODULE_4_FINAL_SAVINGS_EVIDENCE.xlsx';

export const MODULE_4_FROZEN_BASELINES = {
  // Module 1
  VGT_CHECKSUM: '59625f2f91c303ef492b679511077a0882dab2d9760bce8b3f7edaca82d81def',
  MODULE_1_VALIDATED_SPEND_CR: 4073.8307,
  MODULE_1_VALID_TRANSACTIONS: 20241,
  MODULE_1_EXCLUDED_TRANSACTIONS: 252,
  MODULE_1_ANOMALY_TRANSACTIONS: 12,
  MODULE_1_SUPPLIERS: 529,
  MODULE_1_MATERIAL_GROUPS: 57,
  MODULE_1_PLANTS: 19,
  MODULE_1_BILLING_MONTHS: 10,
  PERIOD: 'Apr 2021–Jan 2022',

  // Module 2
  MODULE_2_ADDRESSABLE_SPEND_CR: 443.621,
  MODULE_2_GROSS_OPPORTUNITY_CR: 441.833,
  MODULE_2_OVERLAP_CR: 104.067,
  MODULE_2_NET_OPPORTUNITY_CR: 337.766,
  MODULE_2_PROVEN_OPPORTUNITY_CR: 319.439,
  MODULE_2_DELIVERY_LOW_CR: 31.944,
  MODULE_2_DELIVERY_HIGH_CR: 79.860,

  // Module 3
  MODULE_3_PCBI_MASTER_VERSION: 'PCBI_MASTER_V2.0_FORENSIC',
  MODULE_3_PCBI_CHECKSUM: 'd8f4e29c1b7a60358e2d4f107c9b83a54e1206f97305bc821e649a372d80ef61',
  MODULE_3_BENCHMARKABLE_SPEND_CR: 652.1402,
  MODULE_3_BENCHMARK_PRICE_GAP_CR: 31.6921,
  MODULE_3_BENCHMARKED_TRANSACTIONS: 143
} as const;

export const MODULE_4_WORKBOOK_SHEETS = [
  '01_README',
  '02_CERTIFICATION_SUMMARY',
  '03_SOURCE_BASELINE',
  '04_TRANSACTION_LEDGER',
  '05_OPPORTUNITY_LEDGER',
  '06_LEVER_DEFINITIONS',
  '07_DENOMINATOR_REGISTER',
  '08_GROSS_OPPORTUNITY',
  '09_OVERLAP_LEDGER',
  '10_EXCLUSIONS',
  '11_NET_OPPORTUNITY',
  '12_PROVEN_OPPORTUNITY',
  '13_DELIVERY_RANGE',
  '14_BENCHMARK_GAP_INTEGRATION',
  '15_REALIZED_SAVINGS',
  '16_PROCESS_PRODUCTIVITY',
  '17_COST_AVOIDANCE_RISK',
  '18_TRANSACTION_OVERLAP_MATRIX',
  '19_FINANCIAL_BRIDGE',
  '20_INDEPENDENT_RECALCULATION',
  '21_RECONCILIATION',
  '22_MODULE_1_REGRESSION',
  '23_MODULE_2_REGRESSION',
  '24_MODULE_3_REGRESSION',
  '25_AUDIT_TRAIL',
  '26_CERTIFICATION_REGISTER',
  '27_COMPLETE_TRANSACTION_LINEAGE',
  '28_LINEAGE_SET_RECONCILIATION'
] as const;

export const MODULE_4_LEVER_CATALOG = [
  {
    code: 'LEV-01',
    name: 'Volume Bundling',
    classification: 'DIRECT_SAVINGS',
    denominatorType: 'VOLUME_BUNDLING_ELIGIBLE_SPEND',
    thesis: 'Multi-plant demand consolidation and volume tier price concession across common consumable commodity families',
    formula: 'Spend × VolumeTierAdvantageRate',
    monetized: 'MONETIZED_DIRECT'
  },
  {
    code: 'LEV-02',
    name: 'Dynamic E-Auctions',
    classification: 'DIRECT_SAVINGS',
    denominatorType: 'E_AUCTION_ELIGIBLE_SPEND',
    thesis: 'Reverse dynamic bidding on standardized commoditized items with active multi-vendor price dispersion',
    formula: 'Quantity × max(0, HistoricalPrice - CredibleReferencePrice)',
    monetized: 'MONETIZED_DIRECT'
  },
  {
    code: 'LEV-03',
    name: 'Price Variance Arbitrage',
    classification: 'DIRECT_SAVINGS',
    denominatorType: 'HISTORICAL_PRICE_VARIANCE_SPEND',
    thesis: 'Elimination of internal price dispersion across plants and vendors for identical specifications',
    formula: 'Quantity × max(0, HistoricalPrice - MinDemonstratedPrice)',
    monetized: 'MONETIZED_DIRECT'
  },
  {
    code: 'LEV-04',
    name: 'Vendor Consolidation',
    classification: 'DIRECT_SAVINGS',
    denominatorType: 'VENDOR_CONSOLIDATION_ELIGIBLE_SPEND',
    thesis: 'Tail vendor rationalization and volume reallocation to core suppliers with demonstrated volume pricing',
    formula: 'TailSpend × CoreVendorPriceAdvantage',
    monetized: 'MONETIZED_DIRECT'
  },
  {
    code: 'LEV-05',
    name: 'Benchmark Price Gap',
    classification: 'ANALYTICAL_SIGNAL',
    denominatorType: 'BENCHMARKABLE_COMMODITY_SPEND',
    thesis: 'External market intelligence reference tracking index variance without unilateral price overwrite',
    formula: 'Quantity × max(0, CustomerNetPrice - ExternalBenchmarkPrice)',
    monetized: 'ANALYTICAL_SIGNAL'
  },
  {
    code: 'LEV-06',
    name: 'PO Consolidation',
    classification: 'PROCESS_PRODUCTIVITY',
    denominatorType: 'HIGH_FREQUENCY_PO_SPEND',
    thesis: 'Operational ordering process consolidation reducing transaction processing overhead',
    formula: 'Operational Transaction Reduction (Non-Monetized Direct)',
    monetized: 'NON_MONETIZED'
  },
  {
    code: 'LEV-07',
    name: 'Supplier Risk Derisking',
    classification: 'COST_AVOIDANCE',
    denominatorType: 'SINGLE_SOURCE_CONCENTRATION_SPEND',
    thesis: 'Strategic dual-sourcing and commercial supply continuity hedging without direct cash P&L impact',
    formula: 'SingleSourceSpend × SupplyDisruptionRiskFactor',
    monetized: 'SEPARATE_GOVERNANCE'
  },
  {
    code: 'LEV-08',
    name: 'Realized Savings',
    classification: 'REALIZED_SAVINGS',
    denominatorType: 'INVOICED_AUDITED_SAVINGS',
    thesis: 'Executed contract savings verified against post-sourcing ERP invoice settlements',
    formula: 'PostExecutionAuditedInvoiceDeduction',
    monetized: 'SEPARATE_GOVERNANCE'
  }
] as const;

export const MODULE_4_PROHIBITED_TERMS = [
  'guaranteed savings',
  'assured savings',
  '100% savings',
  'certain savings'
] as const;
