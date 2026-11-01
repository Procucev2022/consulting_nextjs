/**
 * Module 3 PCBI — Borosil Commodity Benchmark Resolver Types
 * Conforms to Rule 9 (Types isolation, no inline types) and file length <= 300 lines.
 */

export type BorosilCommodityOperationalStatus =
  | 'AWAITING_VERIFIED_BENCHMARKS'
  | 'OBSERVATIONS_PENDING_VALIDATION'
  | 'MATERIAL_MAPPING_REQUIRED'
  | 'NON_BENCHMARKABLE';

export interface BorosilCommodityResolution {
  dropdownLabel: string;
  pcbiSeriesId: string | null;
  benchmarkFamily: string;
  benchmarkSeriesName: string;
  materialDefinition: string;
  linkedSapCodes: string[];
  sapCodeDescriptions: string[];
  canonicalTransactionCount: number;
  canonicalSpendInrCr: number;
  availableObservationsCount: number;
  observationValidationStatus: string;
  publisherSource: string;
  unit: string;
  currency: string;
  gradeSpecification: string;
  geography: string;
  priceBasis: string;
  operationalStatus: BorosilCommodityOperationalStatus;
  operationalStatusLabel: string;
  missingEvidenceRequired: string;
  displayStatusMessage: string;
}

export interface SelectedBenchmarkDetailCardProps {
  resolution: BorosilCommodityResolution;
  className?: string;
  onViewGapRegister?: () => void;
}
