/**
 * Module 2 — Lever 10: New-Vendor Development & Alternate Sourcing Frontend Types
 * Compliant with Rule 4, 8, 9, max 300 lines, line length <= 120 chars, complexity <= 10
 */

export type AlternateVendorMatchType = 'EXACT' | 'HIERARCHY' | 'SYNONYM' | 'RELATED' | 'UNMATCHED';

export type GeographicPreference = 'ALL_LOCATIONS' | 'SAME_STATE' | 'SAME_CITY' | 'OTHER_STATES';

export type AlternateVendorQualificationStatus = 'DATA_UNAVAILABLE' | 'UNQUALIFIED' | 'UNDER_EVALUATION' | 'QUALIFIED';

export interface GeographicVendorBreakdown {
  preferredCity?: string;
  sameCityCount: number;
  sameStateCount: number;
  otherStatesCount: number;
  allLocationsCount: number;
  preferredRegionCount: number;
  topStates: Array<{ state: string; count: number }>;
  topCities: Array<{ city: string; count: number }>;
}

export interface ContactCompletenessMetrics {
  hasWebsiteCount: number;
  hasEmailCount: number;
  hasPhoneCount: number;
  missingContactCount: number;
  hasWebsiteRatioPct: number;
  hasEmailRatioPct: number;
}

export interface AlternateVendorDiscoveryOpportunity {
  opportunityId: string;
  materialCode: string;
  materialDescription: string;
  spendCategory: string;
  subCategory: string;
  specification: string | null;
  customerPlant: string;
  customerPreferredState: string;
  customerPreferredCity: string;
  relevantSpendInr: number;
  relevantSpendCr: number;
  currentSupplierCount: number;
  currentSuppliers: string[];
  currentSuppliersIdentified?: string[];
  currentSuppliersMatchedInMaster?: string[];
  exclusionLimitationNotice?: string;
  matchedVendorCategory: string;
  matchType: AlternateVendorMatchType;
  matchTypeRationale: string;
  potentialVendorsAllLocations: number;
  potentialVendorsPreferredRegion: number;
  exactMatchesCount: number;
  hierarchyMatchesCount: number;
  synonymMatchesCount: number;
  relatedMatchesCount: number;
  qualifiedAlternativesCount: number | 'DATA_UNAVAILABLE';
  qualificationStatus: AlternateVendorQualificationStatus;
  excludedCurrentSuppliersCount: number;
  excludedSupplierNames: string[];
  geographicBreakdown: GeographicVendorBreakdown;
  contactCompleteness: ContactCompletenessMetrics;
  disclosures: string[];
}

export interface AlternateSourcingSummary {
  totalEligibleMaterials: number;
  singleSourceMaterialsCount: number;
  totalPotentialVendorsAllLocations: number;
  totalPotentialVendorsPreferredRegion: number;
  deduplicatedDistinctVendorsAllLocations: number;
  deduplicatedDistinctVendorsPreferredRegion: number;
  cumulativeOpportunityVendorMatches: number;
  totalCurrentSuppliersIdentified: number;
  totalCurrentSuppliersMatchedInMaster: number;
  totalCurrentSuppliersExcluded: number;
  overallDistinctVendorPoolEstimate: number;
  potentialFinancialSavingsInr: number;
  potentialFinancialSavingsCr: number;
  isDiscoveryOnly: boolean;
}

export interface AlternateSourcingResult {
  assessmentId: string;
  summary: AlternateSourcingSummary;
  opportunities: AlternateVendorDiscoveryOpportunity[];
  availableStates: string[];
  availableCities: string[];
  stateToCitiesMap?: Record<string, string[]>;
  disclosures: string[];
}

export interface AlternateSourcingViewProps {
  assessmentId?: string;
}
