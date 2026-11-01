/**
 * Industry & Sector Classification Constants (Frontend)
 *
 * Single source of truth for Major and Minor industry sectors, material taxonomy DNA,
 * spend distribution benchmarks, and sector-calibrated material categorization.
 */

import type {
  IndustryMajorSector,
  IndustryMaterialProfile,
  SectorCategorizationResult
} from '../types/industry';

export const DEFAULT_INDUSTRY_MAJOR_SECTOR: IndustryMajorSector = 'Chemical & Petrochemicals';
export const DEFAULT_INDUSTRY_MINOR_SECTOR = 'Specialty Chemicals';

/**
 * Returns all distinct Major Industry Sectors
 */
export function getDistinctMajorSectors(profiles: IndustryMaterialProfile[]): IndustryMajorSector[] {
  const seen = new Set<IndustryMajorSector>();
  profiles.forEach((item) => seen.add(item.majorSector));
  return Array.from(seen);
}

/**
 * Returns all Minor Sectors for a given Major Sector
 */
export function getMinorSectorsForMajor(profiles: IndustryMaterialProfile[], majorSector: string): string[] {
  const matching = profiles.filter((item) => item.majorSector === majorSector);
  return matching.map((m) => m.minorSector);
}

/**
 * Finds the material profile for a specific Major and Minor Sector
 */
export function getIndustryMaterialProfile(
  profiles: IndustryMaterialProfile[],
  majorSector: string,
  minorSector?: string
): IndustryMaterialProfile | undefined {
  return profiles.find((item) => {
    if (item.majorSector !== majorSector) return false;
    if (minorSector && item.minorSector !== minorSector) return false;
    return true;
  });
}

const PACKAGING_TERMS = [
  'drum', 'ibc', 'box', 'corrugated', 'carton', 'pallet',
  'sack', 'bag', 'film', 'bottle', 'vial', 'foil'
];
const PACKAGING_PREFIXES = ['14', '24'];

const LOGISTICS_TERMS = [
  'freight', 'logistics', 'transport', 'shipping',
  'tanker', 'drayage', 'haulage', 'courier'
];
const LOGISTICS_PREFIXES = ['78'];

const DIRECT_PREFIXES = ['10', '11', '12', '13', '20', '25', '30', '32', '50', '51', '43', '72', '76', '80', '81', '82', '84', '86'];

const MRO_TERMS = ['pump', 'valve', 'bearing', 'gasket', 'tool', 'gear', 'lubricant', 'maintenance'];
const MRO_PREFIXES = ['31', '40', '39'];

function isPackagingItem(desc: string, prefix: string): boolean {
  return PACKAGING_PREFIXES.includes(prefix) || PACKAGING_TERMS.some((term) => desc.includes(term));
}

function isLogisticsItem(desc: string, prefix: string): boolean {
  return LOGISTICS_PREFIXES.includes(prefix) || LOGISTICS_TERMS.some((term) => desc.includes(term));
}

function isCoreDirectItem(prefix: string, matchesKeyword: boolean, matchesPrefix: boolean): boolean {
  return matchesKeyword || (matchesPrefix && DIRECT_PREFIXES.includes(prefix));
}

function isGeneralMroItem(desc: string, prefix: string): boolean {
  return MRO_PREFIXES.includes(prefix) || MRO_TERMS.some((term) => desc.includes(term));
}

function classifyPackaging(profile: IndustryMaterialProfile, isCritical: boolean): SectorCategorizationResult {
  return {
    coreBucket: 'Packaging Materials',
    sectorRelevance: isCritical ? 'CRITICAL_PACKAGING' : 'GENERAL_MRO',
    confidenceBoost: isCritical ? 12 : 5,
    explanation: isCritical
      ? `Calibrated as critical packaging aligned with ${profile.majorSector} (matches characteristic ${profile.minorSector} container standards).`
      : 'Standard secondary packaging material.'
  };
}

function classifyLogistics(profile: IndustryMaterialProfile, matchesKeyword: boolean): SectorCategorizationResult {
  return {
    coreBucket: 'Logistics & Freight',
    sectorRelevance: 'SECTOR_LOGISTICS',
    confidenceBoost: matchesKeyword ? 15 : 8,
    explanation: `Calibrated as specialized logistics aligned with ${profile.majorSector} distribution patterns.`
  };
}

/**
 * Calibrates material categorization based on the active industry Major and Minor sector.
 * Considers industry material profile, typical keywords, UNSPSC prefixes, and spend distribution.
 */
export function categorizeMaterialWithIndustryContext(
  itemDesc: string,
  unspscCode: string,
  profile?: IndustryMaterialProfile
): SectorCategorizationResult {
  if (!profile) {
    return {
      coreBucket: 'Indirect & MRO',
      sectorRelevance: 'CROSS_DOMAIN',
      confidenceBoost: 0,
      explanation: 'Industry profile data is unavailable from D1; sector-specific classification was not applied.'
    };
  }
  const descLower = itemDesc.toLowerCase();
  const prefix2 = unspscCode ? unspscCode.slice(0, 2) : '';

  const matchesSectorKeyword = profile.keyKeywords.some((kw) => descLower.includes(kw));
  const matchesPrefix = profile.characteristicUNSPSCPrefixes.includes(prefix2);

  if (isPackagingItem(descLower, prefix2)) {
    return classifyPackaging(profile, matchesSectorKeyword || matchesPrefix);
  }

  if (isLogisticsItem(descLower, prefix2)) {
    return classifyLogistics(profile, matchesSectorKeyword);
  }

  if (isCoreDirectItem(prefix2, matchesSectorKeyword, matchesPrefix)) {
    return {
      coreBucket: 'Direct Materials',
      sectorRelevance: 'CORE_DIRECT',
      confidenceBoost: 16,
      explanation: `Calibrated as Core Direct Production Material for ${profile.majorSector} › ${profile.minorSector}.`
    };
  }

  if (isGeneralMroItem(descLower, prefix2)) {
    return {
      coreBucket: 'Indirect & MRO',
      sectorRelevance: 'GENERAL_MRO',
      confidenceBoost: 6,
      explanation: 'Calibrated as Indirect Plant MRO / Maintenance spares.'
    };
  }

  return {
    coreBucket: 'Indirect & MRO',
    sectorRelevance: 'CROSS_DOMAIN',
    confidenceBoost: -5,
    explanation: `General non-sector classified procurement; flagged for cross-domain review against ${profile.minorSector} taxonomy.`
  };
}
