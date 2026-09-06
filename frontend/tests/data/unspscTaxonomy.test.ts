import { describe, it, expect } from 'vitest';
import {
  unspscOfficialDictionary,
  lookupUNSPSCByDescription,
  searchUNSPSCTaxonomy
} from '../../src/data/unspscTaxonomy';

describe('unspscTaxonomy data module', () => {
  it('should export non-empty official dictionary', () => {
    expect(unspscOfficialDictionary).toBeDefined();
    expect(unspscOfficialDictionary.length).toBeGreaterThan(100);
  });

  describe('lookupUNSPSCByDescription', () => {
    it('should find match by commodity title', () => {
      const match = lookupUNSPSCByDescription('Fresh cut african boxwood');
      expect(match).toBeDefined();
      expect(match.commodityTitle).toContain('boxwood');
    });

    it('should find match by class title', () => {
      const match = lookupUNSPSCByDescription('greens');
      expect(match).toBeDefined();
    });

    it('should find match by commodity code', () => {
      const firstCode = unspscOfficialDictionary[0].commodityCode;
      const match = lookupUNSPSCByDescription(firstCode);
      expect(match.commodityCode).toBe(firstCode);
    });

    it('should fallback to first record if nothing matches', () => {
      const fallback = lookupUNSPSCByDescription('non_existent_super_random_item_123456');
      expect(fallback).toBe(unspscOfficialDictionary[0]);
    });
  });

  describe('searchUNSPSCTaxonomy', () => {
    it('should return top 50 when query and category are empty', () => {
      const res = searchUNSPSCTaxonomy('', '');
      expect(res.length).toBe(50);
    });

    it('should filter by specific category', () => {
      const res = searchUNSPSCTaxonomy('', 'Direct Materials');
      expect(res.every((item) => item.coreBucket === 'Direct Materials')).toBe(true);
    });

    it('should search by commodity title keyword', () => {
      const res = searchUNSPSCTaxonomy('boxwood');
      expect(res.length).toBeGreaterThan(0);
    });

    it('should search by class title keyword', () => {
      const res = searchUNSPSCTaxonomy('species');
      expect(res.length).toBeGreaterThan(0);
    });

    it('should search by segment title keyword', () => {
      const res = searchUNSPSCTaxonomy('Material');
      expect(res.length).toBeGreaterThan(0);
    });

    it('should search with category = ALL', () => {
      const res = searchUNSPSCTaxonomy('boxwood', 'ALL');
      expect(res.length).toBeGreaterThan(0);
    });
  });
});
