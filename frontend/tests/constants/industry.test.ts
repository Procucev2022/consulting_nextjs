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

describe('Industry Constants and Sector Material Categorization Engine', () => {
  it('defines valid defaults and non-empty major sector list', () => {
    expect(DEFAULT_INDUSTRY_MAJOR_SECTOR).toBe('Chemical & Petrochemicals');
    expect(DEFAULT_INDUSTRY_MINOR_SECTOR).toBe('Specialty Chemicals');
    expect(INDUSTRY_MAJOR_SECTORS.length).toBeGreaterThan(5);
  });

  it('retrieves distinct major sectors including goods and service sectors', () => {
    const majors = getDistinctMajorSectors();
    expect(majors).toContain('Chemical & Petrochemicals');
    expect(majors).toContain('Manufacturing & Industrial');
    expect(majors).toContain('Consumer Packaged Goods (CPG)');
    expect(majors).toContain('Automotive & Transportation');
    expect(majors).toContain('Healthcare & Life Sciences');
    expect(majors).toContain('IT, Software & Cloud Services');
    expect(majors).toContain('Professional, Legal & Consulting Services');
    expect(majors).toContain('Banking, Financial Services & Insurance (BFSI)');
    expect(majors).toContain('Logistics, 3PL & Supply Chain Services');
    expect(majors).toContain('Facility, Real Estate & Corporate Services');
    expect(majors).toContain('Media, Marketing & Creative Services');
  });

  it('retrieves minor sectors for service sectors', () => {
    const itMinors = getMinorSectorsForMajor('IT, Software & Cloud Services');
    expect(itMinors).toContain('Enterprise Software & SaaS Subscriptions');
    expect(itMinors).toContain('Cloud Infrastructure & Hosting (IaaS/PaaS)');

    const profMinors = getMinorSectorsForMajor('Professional, Legal & Consulting Services');
    expect(profMinors).toContain('Strategic & Management Consulting');
    expect(profMinors).toContain('Corporate Legal & Regulatory Counsel');

    const bfsiMinors = getMinorSectorsForMajor('Banking, Financial Services & Insurance (BFSI)');
    expect(bfsiMinors).toContain('Payment Processing & Merchant Gateways');
  });

  it('retrieves minor sectors for a given major sector, and falls back gracefully', () => {
    const chemMinors = getMinorSectorsForMajor('Chemical & Petrochemicals');
    expect(chemMinors).toContain('Specialty Chemicals');
    expect(chemMinors).toContain('Basic Organics & Petrochemicals');

    const unknownMinors = getMinorSectorsForMajor('NonExistentSector');
    expect(unknownMinors).toEqual([DEFAULT_INDUSTRY_MINOR_SECTOR]);
  });

  it('retrieves industry material profiles and falls back to default profile when not found', () => {
    const profile = getIndustryMaterialProfile('Chemical & Petrochemicals', 'Specialty Chemicals');
    expect(profile.majorSector).toBe('Chemical & Petrochemicals');
    expect(profile.sectorCode).toBe('CHEM-SPEC');
    expect(profile.benchmarkSpendSplit.directPct).toBe(56);
    expect(profile.typicalDirectMaterials.length).toBeGreaterThan(0);

    const itProfile = getIndustryMaterialProfile('IT, Software & Cloud Services', 'Enterprise Software & SaaS Subscriptions');
    expect(itProfile.sectorCode).toBe('IT-SAAS');
    expect(itProfile.benchmarkSpendSplit.directPct).toBe(68);

    const profileMajorOnly = getIndustryMaterialProfile('Chemical & Petrochemicals');
    expect(profileMajorOnly.majorSector).toBe('Chemical & Petrochemicals');

    const fallbackProfile = getIndustryMaterialProfile('UnknownMajor', 'UnknownMinor');
    expect(fallbackProfile).toBe(INDUSTRY_MAJOR_SECTORS[0]);
  });

  it('verifies enterprise presets have valid sectors including services', () => {
    expect(ENTERPRISE_INDUSTRY_PRESETS['Apex Industrial Dynamics'].major).toBe('Chemical & Petrochemicals');
    expect(ENTERPRISE_INDUSTRY_PRESETS['Vanguard Eurocorp AG'].major).toBe('Automotive & Transportation');
    expect(ENTERPRISE_INDUSTRY_PRESETS['Global Packaging Holdings'].major).toBe('Consumer Packaged Goods (CPG)');
    expect(ENTERPRISE_INDUSTRY_PRESETS['Starlight Precision LLC'].major).toBe('Manufacturing & Industrial');
    expect(ENTERPRISE_INDUSTRY_PRESETS['Quantum Cloud Systems'].major).toBe('IT, Software & Cloud Services');
    expect(ENTERPRISE_INDUSTRY_PRESETS['Horizon Financial Advisory'].major).toBe('Banking, Financial Services & Insurance (BFSI)');
    expect(ENTERPRISE_INDUSTRY_PRESETS['Pinnacle Global Logistics'].major).toBe('Logistics, 3PL & Supply Chain Services');
  });

  describe('categorizeMaterialWithIndustryContext', () => {
    it('categorizes critical packaging matching sector keywords and prefix', () => {
      const res = categorizeMaterialWithIndustryContext(
        'UN-Certified Steel Drum 200L for Catalysts',
        '14121506',
        'Chemical & Petrochemicals',
        'Specialty Chemicals'
      );
      expect(res.coreBucket).toBe('Packaging Materials');
      expect(res.sectorRelevance).toBe('CRITICAL_PACKAGING');
      expect(res.confidenceBoost).toBe(12);
      expect(res.explanation).toContain('Chemical & Petrochemicals');
    });

    it('categorizes critical packaging for sectors where packaging is characteristic', () => {
      const res = categorizeMaterialWithIndustryContext(
        'Standard Corrugated Shipping Box',
        '14111601',
        'Consumer Packaged Goods (CPG)',
        'Packaging & Paperboard'
      );
      expect(res.coreBucket).toBe('Packaging Materials');
      expect(res.sectorRelevance).toBe('CRITICAL_PACKAGING');
    });

    it('categorizes secondary packaging when prefix does not match characteristic list', () => {
      const res = categorizeMaterialWithIndustryContext(
        'Generic Pallet Wrap Film',
        '99000000',
        'Energy, Utilities & Mining',
        'Oil & Gas (Upstream & Downstream)'
      );
      expect(res.coreBucket).toBe('Packaging Materials');
      expect(res.sectorRelevance).toBe('GENERAL_MRO');
      expect(res.explanation).toContain('Standard secondary packaging');
    });

    it('categorizes specialized logistics freight', () => {
      const res = categorizeMaterialWithIndustryContext(
        'Hazmat Liquid Bulk Tanker Transport Route 44',
        '78101801',
        'Chemical & Petrochemicals',
        'Specialty Chemicals'
      );
      expect(res.coreBucket).toBe('Logistics & Freight');
      expect(res.sectorRelevance).toBe('SECTOR_LOGISTICS');
      expect(res.confidenceBoost).toBe(15);
      expect(res.explanation).toContain('specialized logistics');
    });

    it('categorizes general logistics without sector keywords', () => {
      const res = categorizeMaterialWithIndustryContext(
        'Express Courier Package Delivery',
        '78101801',
        'Chemical & Petrochemicals',
        'Specialty Chemicals'
      );
      expect(res.coreBucket).toBe('Logistics & Freight');
      expect(res.sectorRelevance).toBe('SECTOR_LOGISTICS');
      expect(res.confidenceBoost).toBe(8);
    });

    it('categorizes core direct production materials via keywords or prefix', () => {
      const resKeyword = categorizeMaterialWithIndustryContext(
        'Specialty Catalyst Grade B-79 Bulk',
        '12352204',
        'Chemical & Petrochemicals',
        'Specialty Chemicals'
      );
      expect(resKeyword.coreBucket).toBe('Direct Materials');
      expect(resKeyword.sectorRelevance).toBe('CORE_DIRECT');
      expect(resKeyword.confidenceBoost).toBe(16);

      const resPrefix = categorizeMaterialWithIndustryContext(
        'Raw Chemical Compound Feedstock',
        '12000000',
        'Chemical & Petrochemicals',
        'Specialty Chemicals'
      );
      expect(resPrefix.coreBucket).toBe('Direct Materials');
      expect(resPrefix.sectorRelevance).toBe('CORE_DIRECT');
    });

    it('categorizes plant MRO and maintenance items', () => {
      const res = categorizeMaterialWithIndustryContext(
        'Centrifugal Slurry Pump Mechanical Seal',
        '40151501',
        'Chemical & Petrochemicals',
        'Specialty Chemicals'
      );
      expect(res.coreBucket).toBe('Indirect & MRO');
      expect(res.sectorRelevance).toBe('GENERAL_MRO');
      expect(res.confidenceBoost).toBe(6);
    });

    it('flags cross-domain items out of industry scope', () => {
      const res = categorizeMaterialWithIndustryContext(
        'Office Executive Ergonomic Mesh Chair',
        '56112102',
        'Chemical & Petrochemicals',
        'Specialty Chemicals'
      );
      expect(res.coreBucket).toBe('Indirect & MRO');
      expect(res.sectorRelevance).toBe('CROSS_DOMAIN');
      expect(res.confidenceBoost).toBe(-5);
      expect(res.explanation).toContain('flagged for cross-domain review');
    });
  });
});
