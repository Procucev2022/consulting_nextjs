/**
 * Industry & Sector Classification Types (Backend)
 *
 * Provides strongly-typed domain interfaces for Major and Minor industry sectors,
 * material taxonomy DNA profiles, spend distribution benchmarks, and
 * sector-calibrated material categorization.
 */

export type IndustryMajorSector =
  | 'Chemical & Petrochemicals'
  | 'Manufacturing & Industrial'
  | 'Healthcare & Life Sciences'
  | 'Consumer Packaged Goods (CPG)'
  | 'Automotive & Transportation'
  | 'Energy, Utilities & Mining'
  | 'Technology & Telecommunications'
  | 'Construction & Infrastructure'
  | 'Aerospace & Defense'
  | 'Metals & Mining'
  | 'IT, Software & Cloud Services'
  | 'Professional, Legal & Consulting Services'
  | 'Banking, Financial Services & Insurance (BFSI)'
  | 'Logistics, 3PL & Supply Chain Services'
  | 'Facility, Real Estate & Corporate Services'
  | 'Media, Marketing & Creative Services';

export interface SectorSpendBenchmark {
  directPct: number;
  packagingPct: number;
  logisticsPct: number;
  mroPct: number;
}

export interface IndustryMaterialProfile {
  majorSector: IndustryMajorSector;
  minorSector: string;
  sectorCode: string;
  tagline: string;
  description: string;
  typicalDirectMaterials: string[];
  typicalPackagingMaterials: string[];
  typicalLogisticsCategories: string[];
  typicalMroCategories: string[];
  characteristicUNSPSCPrefixes: string[];
  benchmarkSpendSplit: SectorSpendBenchmark;
  categorizationGuidance: string;
  keyKeywords: string[];
}

export interface SectorCategorizationResult {
  coreBucket: 'Direct Materials' | 'Packaging Materials' | 'Indirect & MRO' | 'Logistics & Freight';
  sectorRelevance: 'CORE_DIRECT' | 'CRITICAL_PACKAGING' | 'SECTOR_LOGISTICS' | 'GENERAL_MRO' | 'CROSS_DOMAIN';
  confidenceBoost: number;
  explanation: string;
}

export interface IndustrySectorPreset {
  clientName: string;
  majorSector: IndustryMajorSector;
  minorSector: string;
}
