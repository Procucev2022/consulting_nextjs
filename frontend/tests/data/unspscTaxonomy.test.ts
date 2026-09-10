import { describe, it, expect } from 'vitest';
import {
  unspscOfficialDictionary,
  lookupUNSPSCByDescription,
  searchUNSPSCTaxonomy,
  lookupUNSPSCDetails
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

  describe('lookupUNSPSCDetails', () => {
    it('should return default commodity and class when query is empty', () => {
      const res = lookupUNSPSCDetails('', 'Packaging Materials');
      expect(res.commodityTitle).toBe('Industrial Material Commodity');
      expect(res.classTitle).toBe('Packaging Materials');
    });

    it('should return default class when query is empty and fallback is undefined', () => {
      const res = lookupUNSPSCDetails('');
      expect(res.classTitle).toBe('Direct Materials');
    });

    it('should resolve details by commodity code', () => {
      const first = unspscOfficialDictionary[0];
      const res = lookupUNSPSCDetails(first.commodityCode);
      expect(res.commodityTitle).toBe(first.commodityTitle);
      expect(res.classTitle).toBe(first.classTitle);
    });

    it('should resolve details by commodity title keyword', () => {
      const res = lookupUNSPSCDetails('boxwood');
      expect(res.commodityTitle.toLowerCase()).toContain('boxwood');
    });

    it('should fallback to query and fallback category if no match is found', () => {
      const res = lookupUNSPSCDetails('non_existent_random_token_9999', 'Indirect & MRO');
      expect(res.commodityTitle).toBe('non_existent_random_token_9999');
      expect(res.classTitle).toBe('Indirect & MRO');
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
