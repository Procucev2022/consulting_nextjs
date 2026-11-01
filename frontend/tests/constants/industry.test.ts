import { describe, it, expect } from 'vitest';
import type { IndustryMaterialProfile } from '../../src/types/industry';
import {
  DEFAULT_INDUSTRY_MAJOR_SECTOR,
  DEFAULT_INDUSTRY_MINOR_SECTOR,
  getDistinctMajorSectors,
  getMinorSectorsForMajor,
  getIndustryMaterialProfile,
  categorizeMaterialWithIndustryContext
} from '../../src/constants/industry';

const profile = (overrides: Partial<IndustryMaterialProfile> = {}): IndustryMaterialProfile => ({
  majorSector: 'Chemical & Petrochemicals',
  minorSector: 'Specialty Chemicals',
  sectorCode: 'CHEM-SPEC',
  tagline: 'Test profile',
  description: 'D1 fixture profile',
  typicalDirectMaterials: ['Catalyst'],
  typicalPackagingMaterials: ['UN drum'],
  typicalLogisticsCategories: ['Hazmat freight'],
  typicalMroCategories: ['Slurry pumps'],
  characteristicUNSPSCPrefixes: ['12', '14'],
  benchmarkSpendSplit: { directPct: 56, packagingPct: 18, logisticsPct: 14, mroPct: 12 },
  categorizationGuidance: 'Review the matched material.',
  keyKeywords: ['catalyst', 'hazmat'],
  ...overrides
});

describe('D1 industry catalog helpers and classification engine', () => {
  it('keeps application defaults as configuration and derives sector options from database rows', () => {
    const chemical = profile();
    const manufacturing = profile({ majorSector: 'Manufacturing & Industrial', minorSector: 'Precision Engineering' });
    expect(DEFAULT_INDUSTRY_MAJOR_SECTOR).toBe('Chemical & Petrochemicals');
    expect(DEFAULT_INDUSTRY_MINOR_SECTOR).toBe('Specialty Chemicals');
    expect(getDistinctMajorSectors([chemical, manufacturing])).toEqual([
      'Chemical & Petrochemicals', 'Manufacturing & Industrial'
    ]);
    expect(getMinorSectorsForMajor([chemical, manufacturing], 'Manufacturing & Industrial')).toEqual(['Precision Engineering']);
    expect(getMinorSectorsForMajor([], 'Unknown')).toEqual([]);
    expect(getIndustryMaterialProfile([chemical], 'Chemical & Petrochemicals', 'Specialty Chemicals')).toEqual(chemical);
    expect(getIndustryMaterialProfile([chemical], 'Unknown', 'Unknown')).toBeUndefined();
    expect(getIndustryMaterialProfile([chemical], 'Chemical & Petrochemicals')).toEqual(chemical);
  });

  it('classifies characteristic and secondary packaging from the selected D1 profile', () => {
    const critical = categorizeMaterialWithIndustryContext('UN-certified steel drum for catalyst', '14121506', profile());
    expect(critical).toMatchObject({ coreBucket: 'Packaging Materials', sectorRelevance: 'CRITICAL_PACKAGING', confidenceBoost: 12 });
    const prefixDriven = categorizeMaterialWithIndustryContext('Standard corrugated box', '14111601', profile({ keyKeywords: [] }));
    expect(prefixDriven.sectorRelevance).toBe('CRITICAL_PACKAGING');
    const secondary = categorizeMaterialWithIndustryContext('Generic pallet wrap film', '99000000', profile({ keyKeywords: [] }));
    expect(secondary).toMatchObject({ coreBucket: 'Packaging Materials', sectorRelevance: 'GENERAL_MRO', confidenceBoost: 5 });
  });

  it('classifies logistics using both keyword and UNSPSC evidence', () => {
    const keywordMatch = categorizeMaterialWithIndustryContext('Hazmat liquid tanker freight', '99999999', profile());
    expect(keywordMatch).toMatchObject({ coreBucket: 'Logistics & Freight', sectorRelevance: 'SECTOR_LOGISTICS', confidenceBoost: 15 });
    const genericLogistics = categorizeMaterialWithIndustryContext('Express courier delivery', '78101801', profile({ keyKeywords: [] }));
    expect(genericLogistics).toMatchObject({ sectorRelevance: 'SECTOR_LOGISTICS', confidenceBoost: 8 });
  });

  it('classifies direct materials, MRO, cross-domain and unavailable-profile cases', () => {
    expect(categorizeMaterialWithIndustryContext('Specialty catalyst grade B', '99000000', profile()).sectorRelevance).toBe('CORE_DIRECT');
    expect(categorizeMaterialWithIndustryContext('Raw compound feedstock', '12000000', profile({ keyKeywords: [] })).coreBucket).toBe('Direct Materials');
    expect(categorizeMaterialWithIndustryContext('Centrifugal slurry pump seal', '40151501', profile({ keyKeywords: [] })))
      .toMatchObject({ coreBucket: 'Indirect & MRO', sectorRelevance: 'GENERAL_MRO', confidenceBoost: 6 });
    expect(categorizeMaterialWithIndustryContext('Routine maintenance service', '99999999', profile({ keyKeywords: [] })).sectorRelevance)
      .toBe('GENERAL_MRO');
    expect(categorizeMaterialWithIndustryContext('Office ergonomic chair', '56112102', profile({ keyKeywords: [] })))
      .toMatchObject({ coreBucket: 'Indirect & MRO', sectorRelevance: 'CROSS_DOMAIN', confidenceBoost: -5 });
    expect(categorizeMaterialWithIndustryContext('Chemical feedstock', '12000000')).toMatchObject({
      sectorRelevance: 'CROSS_DOMAIN', confidenceBoost: 0
    });
  });
});
