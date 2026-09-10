import { describe, it, expect } from 'vitest';
import {
  DEFAULT_INDUSTRY_MAJOR_SECTOR,
  DEFAULT_INDUSTRY_MINOR_SECTOR,
  INDUSTRY_MAJOR_SECTORS,
  ENTERPRISE_INDUSTRY_PRESETS,
  getDistinctMajorSectors,
  getMinorSectorsForMajor,
  getIndustryMaterialProfile,
  categorizeMaterialWithIndustryContext
} from '../../src/constants/industry';

describe('Backend Industry Constants and Material Categorization Engine', () => {
  it('defines valid defaults and non-empty major sector list', () => {
    expect(DEFAULT_INDUSTRY_MAJOR_SECTOR).toBe('Chemical & Petrochemicals');
    expect(DEFAULT_INDUSTRY_MINOR_SECTOR).toBe('Specialty Chemicals');
    expect(INDUSTRY_MAJOR_SECTORS.length).toBeGreaterThan(0);
  });

  it('retrieves distinct major sectors including goods and service sectors', () => {
    const majors = getDistinctMajorSectors();
    expect(majors).toContain('Chemical & Petrochemicals');
    expect(majors).toContain('Manufacturing & Industrial');
    expect(majors).toContain('IT, Software & Cloud Services');
    expect(majors).toContain('Banking, Financial Services & Insurance (BFSI)');
    expect(majors).toContain('Logistics, 3PL & Supply Chain Services');
  });

  it('retrieves minor sectors for a given major sector and handles fallback', () => {
    const chemMinors = getMinorSectorsForMajor('Chemical & Petrochemicals');
    expect(chemMinors).toContain('Specialty Chemicals');

    const itMinors = getMinorSectorsForMajor('IT, Software & Cloud Services');
    expect(itMinors).toContain('Enterprise Software & SaaS Subscriptions');

    const unknownMinors = getMinorSectorsForMajor('UnknownSector');
    expect(unknownMinors).toEqual([DEFAULT_INDUSTRY_MINOR_SECTOR]);
  });

  it('retrieves industry material profiles and falls back appropriately', () => {
    const profile = getIndustryMaterialProfile('Chemical & Petrochemicals', 'Specialty Chemicals');
    expect(profile.majorSector).toBe('Chemical & Petrochemicals');
    expect(profile.sectorCode).toBe('CHEM-SPEC');

    const saasProfile = getIndustryMaterialProfile('IT, Software & Cloud Services', 'Enterprise Software & SaaS Subscriptions');
    expect(saasProfile.sectorCode).toBe('IT-SAAS');

    const profileMajorOnly = getIndustryMaterialProfile('Chemical & Petrochemicals');
    expect(profileMajorOnly.majorSector).toBe('Chemical & Petrochemicals');

    const fallbackProfile = getIndustryMaterialProfile('NonExistentSector');
    expect(fallbackProfile).toBe(INDUSTRY_MAJOR_SECTORS[0]);
  });

  it('verifies enterprise presets including service companies', () => {
    expect(ENTERPRISE_INDUSTRY_PRESETS['Apex Industrial Dynamics'].major).toBe('Chemical & Petrochemicals');
    expect(ENTERPRISE_INDUSTRY_PRESETS['Quantum Cloud Systems'].major).toBe('IT, Software & Cloud Services');
    expect(ENTERPRISE_INDUSTRY_PRESETS['Horizon Financial Advisory'].major).toBe('Banking, Financial Services & Insurance (BFSI)');
    expect(ENTERPRISE_INDUSTRY_PRESETS['Pinnacle Global Logistics'].major).toBe('Logistics, 3PL & Supply Chain Services');
  });

  describe('categorizeMaterialWithIndustryContext', () => {
    it('categorizes critical packaging matching keywords or prefixes', () => {
      const res = categorizeMaterialWithIndustryContext(
        'Chemical Drum UN-Approved',
        '14121506',
        'Chemical & Petrochemicals',
        'Specialty Chemicals'
      );
      expect(res.coreBucket).toBe('Packaging Materials');
      expect(res.sectorRelevance).toBe('CRITICAL_PACKAGING');
      expect(res.confidenceBoost).toBe(12);
      expect(res.explanation).toContain('Chemical & Petrochemicals');
    });

    it('categorizes secondary packaging when neither sector keyword nor characteristic prefix match', () => {
      const res = categorizeMaterialWithIndustryContext(
        'Generic Pallet Wrap',
        '99000000',
        'Manufacturing & Industrial',
        'Industrial Machinery & Equipment'
      );
      expect(res.coreBucket).toBe('Packaging Materials');
      expect(res.sectorRelevance).toBe('GENERAL_MRO');
      expect(res.confidenceBoost).toBe(5);
      expect(res.explanation).toBe('Standard secondary packaging material.');
    });

    it('categorizes specialized logistics materials with and without sector keywords', () => {
      const resWithKw = categorizeMaterialWithIndustryContext(
        'Specialty Hazmat Chemical Tanker Transport',
        '78101801',
        'Chemical & Petrochemicals',
        'Specialty Chemicals'
      );
      expect(resWithKw.coreBucket).toBe('Logistics & Freight');
      expect(resWithKw.sectorRelevance).toBe('SECTOR_LOGISTICS');
      expect(resWithKw.confidenceBoost).toBe(15);

      const resGeneric = categorizeMaterialWithIndustryContext(
        'Standard Freight Route',
        '78101801',
        'Chemical & Petrochemicals',
        'Specialty Chemicals'
      );
      expect(resGeneric.coreBucket).toBe('Logistics & Freight');
      expect(resGeneric.confidenceBoost).toBe(8);
    });

    it('categorizes direct production materials via keywords or direct prefix', () => {
      const resKw = categorizeMaterialWithIndustryContext(
        'Specialty Chemical Solvent',
        '99999999',
        'Chemical & Petrochemicals',
        'Specialty Chemicals'
      );
      expect(resKw.coreBucket).toBe('Direct Materials');
      expect(resKw.sectorRelevance).toBe('CORE_DIRECT');

      const resPrefix = categorizeMaterialWithIndustryContext(
        'Unspecified Production Compound',
        '12000000',
        'Chemical & Petrochemicals',
        'Specialty Chemicals'
      );
      expect(resPrefix.coreBucket).toBe('Direct Materials');
      expect(resPrefix.sectorRelevance).toBe('CORE_DIRECT');
    });

    it('categorizes general MRO items', () => {
      const res = categorizeMaterialWithIndustryContext(
        'Hydraulic Pump Maintenance Kit',
        '40151501',
        'Chemical & Petrochemicals',
        'Specialty Chemicals'
      );
      expect(res.coreBucket).toBe('Indirect & MRO');
      expect(res.sectorRelevance).toBe('GENERAL_MRO');
    });

    it('uses default parameters and handles empty unspsc code', () => {
      const resDefault = categorizeMaterialWithIndustryContext(
        'Solvent Wash',
        ''
      );
      expect(resDefault.coreBucket).toBe('Direct Materials');
    });

    it('categorizes core direct service items and handles cross-domain fallback', () => {
      const resService = categorizeMaterialWithIndustryContext(
        'Cloud Compute Instance Cluster Hosting',
        '43211500',
        'IT, Software & Cloud Services',
        'Cloud Infrastructure & Hosting (IaaS/PaaS)'
      );
      expect(resService.coreBucket).toBe('Direct Materials');
      expect(resService.sectorRelevance).toBe('CORE_DIRECT');

      const resCross = categorizeMaterialWithIndustryContext(
        'Office Desk Furniture Set',
        '56101500',
        'IT, Software & Cloud Services',
        'Enterprise Software & SaaS Subscriptions'
      );
      expect(resCross.coreBucket).toBe('Indirect & MRO');
      expect(resCross.sectorRelevance).toBe('CROSS_DOMAIN');
      expect(resCross.confidenceBoost).toBe(-5);
    });
  });
});
