import { describe, it, expect } from 'vitest';
import {
  OFFICIAL_UNSPSC_TAXONOMY_RULES,
  buildOfficialTaxonomyRules
} from '../../src/constants/module2MaterialMappingTaxonomy';

describe('Module 2 — Material Mapping Taxonomy Reference Rules', () => {
  it('loads all official taxonomy rules with valid properties', () => {
    expect(OFFICIAL_UNSPSC_TAXONOMY_RULES.length).toBeGreaterThanOrEqual(30);

    for (const rule of OFFICIAL_UNSPSC_TAXONOMY_RULES) {
      expect(rule.pattern).toBeInstanceOf(RegExp);
      expect(rule.unspscCode).toMatch(/^\d{8}$/);
      expect(rule.unspscTitle.length).toBeGreaterThan(0);
      expect(rule.segmentCode).toMatch(/^\d{8}$/);
      expect(rule.segmentTitle.length).toBeGreaterThan(0);
      expect(rule.familyCode).toMatch(/^\d{8}$/);
      expect(rule.familyTitle.length).toBeGreaterThan(0);
      expect(rule.classCode).toMatch(/^\d{8}$/);
      expect(rule.classTitle.length).toBeGreaterThan(0);
      expect(rule.commodityCode).toMatch(/^\d{8}$/);
      expect(rule.commodityTitle.length).toBeGreaterThan(0);
      expect(rule.confidenceScore).toBeGreaterThanOrEqual(75);
      expect(rule.evidence.length).toBeGreaterThan(0);
    }
  });

  it('matches high-spend patterns correctly', () => {
    const dieselRule = OFFICIAL_UNSPSC_TAXONOMY_RULES.find(r => r.unspscCode === '15101505');
    expect(dieselRule).toBeDefined();
    expect(dieselRule?.pattern.test('HIGH SPEED DIESEL HSD')).toBe(true);

    const coalRule = OFFICIAL_UNSPSC_TAXONOMY_RULES.find(r => r.unspscCode === '15101601');
    expect(coalRule).toBeDefined();
    expect(coalRule?.pattern.test('STEAM COAL 5500 GAR')).toBe(true);

    const manpowerRule = OFFICIAL_UNSPSC_TAXONOMY_RULES.find(r => r.unspscCode === '80111600');
    expect(manpowerRule).toBeDefined();
    expect(manpowerRule?.pattern.test('ASSTT FOR PACKING')).toBe(true);

    const refractoryRule = OFFICIAL_UNSPSC_TAXONOMY_RULES.find(r => r.unspscCode === '30161500');
    expect(refractoryRule).toBeDefined();
    expect(refractoryRule?.pattern.test('FIRE BRICK 70% ALUMINA')).toBe(true);
  });

  it('handles fallback taxonomy mapping when commodity record is absent', () => {
    const fallbackRules = buildOfficialTaxonomyRules([]);
    expect(fallbackRules.length).toBe(OFFICIAL_UNSPSC_TAXONOMY_RULES.length);

    const first = fallbackRules[0];
    expect(first.unspscTitle).toContain('Commodity');
    expect(first.segmentTitle).toBe('Industrial Segment');
    expect(first.familyTitle).toBe('Industrial Family');
    expect(first.classTitle).toBe('Industrial Class');
  });
});
