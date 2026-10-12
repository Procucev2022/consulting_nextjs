/**
 * Module 2 Final Transaction-Level Financial Traceability Constants
 * Version: MODULE_2_TRACEABILITY_V1.0
 */

export const TRACEABILITY_WORKBOOK_FILENAME = 'MODULE_2_FINAL_TRACEABILITY_EVIDENCE.xlsx';

export const TRACEABILITY_WORKBOOK_SHEETS = [
  '01_EXECUTIVE_CERTIFICATION',
  '02_GOLDEN_BASELINE',
  '03_TRANSACTION_LINEAGE',
  '04_OPPORTUNITY_LINEAGE',
  '05_DENOMINATOR_RECONCILIATION',
  '06_VOLUME_BUNDLING_TRACE',
  '07_VENDOR_CONSOLIDATION_TRACE',
  '08_E_AUCTION_TRACE',
  '09_PRICE_VARIANCE_TRACE',
  '10_PROVEN_OPPORTUNITY_TRACE',
  '11_OVERLAP_TRACE',
  '12_CATEGORY_RECONCILIATION',
  '13_PRODUCTION_VS_INDEPENDENT',
  '14_ASSUMPTION_REGISTER',
  '15_EXCLUSIONS',
  '16_DELIVERY_RANGE',
  '17_UI_API_REPORT_PARITY',
  '18_TEST_RESULTS',
  '19_CHECKSUMS',
  '20_FINAL_SIGNOFF'
] as const;

export const TRACEABILITY_DENOMINATORS = {
  HISTORICAL_PRICE_VARIANCE_SPEND: {
    type: 'HISTORICAL_PRICE_VARIANCE_SPEND',
    spendCr: 443.621,
    description: 'Addressable spend lines with comparable UOM, INR currency, and valid historical price variance',
    transactionCount: 16789
  },
  VOLUME_BUNDLING_ELIGIBLE_SPEND: {
    type: 'VOLUME_BUNDLING_ELIGIBLE_SPEND',
    spendCr: 685.240,
    description: 'Multi-plant spend in common consumable commodity families eligible for aggregated batch purchasing',
    transactionCount: 18450
  },
  VENDOR_CONSOLIDATION_ELIGIBLE_SPEND: {
    type: 'VENDOR_CONSOLIDATION_ELIGIBLE_SPEND',
    spendCr: 443.621,
    description: 'Spend in tail and fragmented categories with >= 3 vendors eligible for supplier base consolidation',
    transactionCount: 16789
  },
  E_AUCTION_ELIGIBLE_SPEND: {
    type: 'E_AUCTION_ELIGIBLE_SPEND',
    spendCr: 218.450,
    description: 'Homogeneous, highly standardized commodity spend with dynamic bidding price dispersion',
    transactionCount: 7892
  }
} as const;

export interface CanonicalOpportunityRegistryItem {
  id: string;
  category: string;
  lever: string;
  denominatorType: string;
  grossCr: number;
  overlapCr: number;
  netCr: number;
  provenCr: number;
  formula: string;
  confidence: 'HIGH' | 'MEDIUM';
}

export const CANONICAL_OPPORTUNITY_REGISTRY: CanonicalOpportunityRegistryItem[] = [
  { id: 'OPP-001', category: 'Mechanical Spares', lever: 'Volume Bundling', denominatorType: 'VOLUME_BUNDLING_ELIGIBLE_SPEND', grossCr: 84.500, overlapCr: 19.450, netCr: 65.050, provenCr: 62.660, formula: 'Spend * VolumeTierAdvantage', confidence: 'HIGH' },
  { id: 'OPP-002', category: 'Electrical Equipment', lever: 'E-Auctions', denominatorType: 'E_AUCTION_ELIGIBLE_SPEND', grossCr: 62.300, overlapCr: 14.120, netCr: 48.180, provenCr: 45.680, formula: 'Quantity * max(0, HistPrice - BenchmarkPrice)', confidence: 'HIGH' },
  { id: 'OPP-003', category: 'Refractory Materials', lever: 'Price Variance Arbitrage', denominatorType: 'HISTORICAL_PRICE_VARIANCE_SPEND', grossCr: 58.900, overlapCr: 12.890, netCr: 46.010, provenCr: 43.500, formula: 'Quantity * max(0, HistPrice - BenchmarkPrice)', confidence: 'HIGH' },
  { id: 'OPP-004', category: 'Grinding Media', lever: 'Volume Bundling', denominatorType: 'VOLUME_BUNDLING_ELIGIBLE_SPEND', grossCr: 47.600, overlapCr: 10.890, netCr: 36.710, provenCr: 35.310, formula: 'Spend * VolumeTierAdvantage', confidence: 'HIGH' },
  { id: 'OPP-005', category: 'Packaging & Bags', lever: 'E-Auctions', denominatorType: 'E_AUCTION_ELIGIBLE_SPEND', grossCr: 42.100, overlapCr: 9.150, netCr: 32.950, provenCr: 29.750, formula: 'Quantity * max(0, HistPrice - BenchmarkPrice)', confidence: 'HIGH' },
  { id: 'OPP-006', category: 'Lubricants & Oils', lever: 'Price Variance Arbitrage', denominatorType: 'HISTORICAL_PRICE_VARIANCE_SPEND', grossCr: 31.400, overlapCr: 7.280, netCr: 24.120, provenCr: 22.800, formula: 'Quantity * max(0, HistPrice - BenchmarkPrice)', confidence: 'HIGH' },
  { id: 'OPP-007', category: 'Conveyor Belts', lever: 'Volume Bundling', denominatorType: 'VOLUME_BUNDLING_ELIGIBLE_SPEND', grossCr: 28.900, overlapCr: 6.380, netCr: 22.520, provenCr: 20.720, formula: 'Spend * VolumeTierAdvantage', confidence: 'HIGH' },
  { id: 'OPP-008', category: 'Motors & Drives', lever: 'Vendor Consolidation', denominatorType: 'VENDOR_CONSOLIDATION_ELIGIBLE_SPEND', grossCr: 24.500, overlapCr: 5.480, netCr: 19.020, provenCr: 18.100, formula: 'TailSpend * CoreVendorAdvantage', confidence: 'HIGH' },
  { id: 'OPP-009', category: 'Valves & Actuators', lever: 'Price Variance Arbitrage', denominatorType: 'HISTORICAL_PRICE_VARIANCE_SPEND', grossCr: 19.200, overlapCr: 4.680, netCr: 14.520, provenCr: 13.800, formula: 'Quantity * max(0, HistPrice - BenchmarkPrice)', confidence: 'MEDIUM' },
  { id: 'OPP-010', category: 'Pumps & Spares', lever: 'Price Variance Arbitrage', denominatorType: 'HISTORICAL_PRICE_VARIANCE_SPEND', grossCr: 14.850, overlapCr: 3.590, netCr: 11.260, provenCr: 10.500, formula: 'Quantity * max(0, HistPrice - BenchmarkPrice)', confidence: 'MEDIUM' },
  { id: 'OPP-011', category: 'Instrumentation', lever: 'Vendor Consolidation', denominatorType: 'VENDOR_CONSOLIDATION_ELIGIBLE_SPEND', grossCr: 11.200, overlapCr: 2.600, netCr: 8.600, provenCr: 7.900, formula: 'TailSpend * CoreVendorAdvantage', confidence: 'MEDIUM' },
  { id: 'OPP-012', category: 'Cables & Wiring', lever: 'Volume Bundling', denominatorType: 'VOLUME_BUNDLING_ELIGIBLE_SPEND', grossCr: 7.450, overlapCr: 1.870, netCr: 5.580, provenCr: 5.200, formula: 'Spend * VolumeTierAdvantage', confidence: 'MEDIUM' },
  { id: 'OPP-013', category: 'Safety & PPE', lever: 'Vendor Consolidation', denominatorType: 'VENDOR_CONSOLIDATION_ELIGIBLE_SPEND', grossCr: 4.320, overlapCr: 1.610, netCr: 2.710, provenCr: 2.400, formula: 'TailSpend * CoreVendorAdvantage', confidence: 'MEDIUM' },
  { id: 'OPP-014', category: 'Civil & Structural', lever: 'Price Variance Arbitrage', denominatorType: 'HISTORICAL_PRICE_VARIANCE_SPEND', grossCr: 3.150, overlapCr: 1.430, netCr: 1.720, provenCr: 1.520, formula: 'Quantity * max(0, HistPrice - BenchmarkPrice)', confidence: 'MEDIUM' },
  { id: 'OPP-015', category: 'Office & IT Peripherals', lever: 'E-Auctions', denominatorType: 'E_AUCTION_ELIGIBLE_SPEND', grossCr: 1.850, overlapCr: 0.380, netCr: 1.470, provenCr: 1.350, formula: 'Quantity * max(0, HistPrice - BenchmarkPrice)', confidence: 'MEDIUM' },
  { id: 'OPP-016', category: 'Misc Indirect Supplies', lever: 'Vendor Consolidation', denominatorType: 'VENDOR_CONSOLIDATION_ELIGIBLE_SPEND', grossCr: 1.150, overlapCr: 0.160, netCr: 0.990, provenCr: 0.949, formula: 'TailSpend * CoreVendorAdvantage', confidence: 'MEDIUM' }
];

export const ZERO_OPPORTUNITY_CATEGORIES = [
  { id: 'CAT-Z01', category: 'Raw Materials (Captive / Regulated)', spendCr: 1420.500, reason: 'Single captive source, government statutory pricing, zero market contestability' },
  { id: 'CAT-Z02', category: 'Logistics & Inland Freight', spendCr: 840.120, reason: 'Long-term rail/road concession contracts, regulated freight tariff indexation' },
  { id: 'CAT-Z03', category: 'Utilities & Power (State Grid)', spendCr: 1369.590, reason: 'State electricity board fixed statutory tariff, captive solar PPA locked' }
] as const;

export const CATEGORY_RECONCILIATION_SUMMARY = [
  { metric: 'Total Module 2 categories', count: 19, notes: 'Full domain categorization across spend portfolio' },
  { metric: 'Strategic categories', count: 16, notes: 'Categories meeting strategic sourcing eligibility criteria' },
  { metric: 'Monetary opportunity categories', count: 16, notes: 'Categories yielding quantifiable net opportunity > ₹0' },
  { metric: 'Zero-opportunity categories', count: 3, notes: 'Captive raw materials, regulated utilities, statutory freight' },
  { metric: 'Opportunity IDs', count: 16, notes: 'OPP-001 through OPP-016 mapped 1:1 to monetary categories' }
] as const;
