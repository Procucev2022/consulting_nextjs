/**
 * Industry & Sector Classification Constants (Backend)
 *
 * Single source of truth for Major and Minor industry sectors, material taxonomy DNA,
 * spend distribution benchmarks, and sector-calibrated material categorization.
 */

import type {
  IndustryMajorSector,
  IndustryMaterialProfile,
  SectorCategorizationResult
} from '../types/industry';
import { INDUSTRY_SECTORS_PART1 } from './industrySectorsPart1';
import { INDUSTRY_SECTORS_PART2 } from './industrySectorsPart2';
import { INDUSTRY_SECTORS_SERVICES_PART1 } from './industrySectorsServicesPart1';
import { INDUSTRY_SECTORS_SERVICES_PART2 } from './industrySectorsServicesPart2';

export const DEFAULT_INDUSTRY_MAJOR_SECTOR: IndustryMajorSector = 'Chemical & Petrochemicals';
export const DEFAULT_INDUSTRY_MINOR_SECTOR = 'Specialty Chemicals';

export const INDUSTRY_MAJOR_SECTORS: IndustryMaterialProfile[] = [
  ...INDUSTRY_SECTORS_PART1,
  ...INDUSTRY_SECTORS_PART2,
  ...INDUSTRY_SECTORS_SERVICES_PART1,
  ...INDUSTRY_SECTORS_SERVICES_PART2
];

export const ENTERPRISE_INDUSTRY_PRESETS: Record<string, { major: IndustryMajorSector; minor: string }> = {
  'Apex Industrial Dynamics': {
    major: 'Chemical & Petrochemicals',
    minor: 'Specialty Chemicals'
  },
  'Apex Industrial Dynamics (Fortune 500)': {
    major: 'Chemical & Petrochemicals',
    minor: 'Specialty Chemicals'
  },
  'Vanguard Eurocorp AG': {
    major: 'Automotive & Transportation',
    minor: 'Auto Components & Tier-1 Assemblies'
  },
  'Global Packaging Holdings': {
    major: 'Consumer Packaged Goods (CPG)',
    minor: 'Packaging & Paperboard'
  },
  'Starlight Precision LLC': {
    major: 'Manufacturing & Industrial',
    minor: 'Precision Engineering & Tooling'
  },
  'Quantum Cloud Systems': {
    major: 'IT, Software & Cloud Services',
    minor: 'Enterprise Software & SaaS Subscriptions'
  },
  'Horizon Financial Advisory': {
    major: 'Banking, Financial Services & Insurance (BFSI)',
    minor: 'Payment Processing & Merchant Gateways'
  },
  'Pinnacle Global Logistics': {
    major: 'Logistics, 3PL & Supply Chain Services',
    minor: '3PL Contract Logistics & Warehousing'
  }
};

export function getDistinctMajorSectors(): IndustryMajorSector[] {
  const seen = new Set<IndustryMajorSector>();
  INDUSTRY_MAJOR_SECTORS.forEach((item) => seen.add(item.majorSector));
  return Array.from(seen);
}

export function getMinorSectorsForMajor(majorSector: string): string[] {
  const matching = INDUSTRY_MAJOR_SECTORS.filter((item) => item.majorSector === majorSector);
  if (matching.length === 0) {
    return [DEFAULT_INDUSTRY_MINOR_SECTOR];
  }
  return matching.map((m) => m.minorSector);
}

export function getIndustryMaterialProfile(majorSector: string, minorSector?: string): IndustryMaterialProfile {
  const match = INDUSTRY_MAJOR_SECTORS.find((item) => {
    if (item.majorSector !== majorSector) return false;
    if (minorSector && item.minorSector !== minorSector) return false;
    return true;
  });

  return match || INDUSTRY_MAJOR_SECTORS[0];
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

const MRO_TERMS = ['pump', 'valve', 'bearing', 'gasket', 'tool', 'gear', 'lubricant'];
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

export function categorizeMaterialWithIndustryContext(
  itemDesc: string,
  unspscCode: string,
  majorSector: string = DEFAULT_INDUSTRY_MAJOR_SECTOR,
  minorSector: string = DEFAULT_INDUSTRY_MINOR_SECTOR
): SectorCategorizationResult {
  const profile = getIndustryMaterialProfile(majorSector, minorSector);
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
