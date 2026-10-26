import { describe, it, expect } from 'vitest';
import {
  unspscOfficialDictionary,
  lookupUNSPSCByDescription,
  searchUNSPSCTaxonomy,
  lookupUNSPSCDetails,
  UNCLASSIFIED_COMMODITY_RECORD
} from '../../src/data/unspscTaxonomy';
import {
  UNCLASSIFIED_COMMODITY_CODE,
  UNCLASSIFIED_COMMODITY_TITLE
} from '../../src/constants/taxonomy';

describe('unspscTaxonomy data module (backend)', () => {
  it('should export non-empty official dictionary', () => {
    expect(unspscOfficialDictionary).toBeDefined();
    expect(unspscOfficialDictionary.length).toBeGreaterThan(100);
  });

  it('should ensure index 0 (African boxwood) has Direct Materials coreBucket, not Packaging Materials', () => {
    const record0 = unspscOfficialDictionary[0];
    expect(record0.commodityCode).toBe('10502909');
    expect(record0.commodityTitle).toBe('Fresh cut african boxwood');
    expect(record0.coreBucket).toBe('Direct Materials');
    expect(record0.coreBucket).not.toBe('Packaging Materials');
  });

  describe('lookupUNSPSCByDescription - Phase 1 Taxonomy & Classification Correction', () => {
    // Test A: A known valid official UNSPSC lookup returns the correct code and title
    it('Test A: should return the correct code and title for a known valid official commodity', () => {
      const match = lookupUNSPSCByDescription('Fresh cut african boxwood');
      expect(match).toBeDefined();
      expect(match?.commodityCode).toBe('10502909');
      expect(match?.commodityTitle).toBe('Fresh cut african boxwood');
      expect(match?.classificationStatus).toBe('CLASSIFIED');
    });

    it('should find match by class title', () => {
      const match = lookupUNSPSCByDescription('greens');
      expect(match).toBeDefined();
      expect(match?.classCode).toBe('10502900');
      expect(match?.classificationStatus).toBe('CLASSIFIED');
    });

    // Test E: Genuine official commodity code 10502909 remains valid
    it('Test E: genuine official commodity code 10502909 remains valid when looked up directly', () => {
      const match = lookupUNSPSCByDescription('10502909');
      expect(match).toBeDefined();
      expect(match?.commodityCode).toBe('10502909');
      expect(match?.commodityTitle).toBe('Fresh cut african boxwood');
      expect(match?.coreBucket).toBe('Direct Materials');
      expect(match?.classificationStatus).toBe('CLASSIFIED');
    });

    // Test B: An unknown description returns UNCLASSIFIED, never African boxwood
    it('Test B: an unknown description returns UNCLASSIFIED and never African boxwood', () => {
      const result = lookupUNSPSCByDescription('non_existent_super_random_item_123456');
      expect(result).toBeDefined();
      expect(result?.commodityCode).toBe(UNCLASSIFIED_COMMODITY_CODE);
      expect(result?.commodityTitle).toBe(UNCLASSIFIED_COMMODITY_TITLE);
      expect(result?.classificationStatus).toBe('UNCLASSIFIED');
      expect(result?.commodityCode).not.toBe('10502909');
      expect(result?.commodityTitle).not.toBe('Fresh cut african boxwood');
    });

    // Test C: Textile packaging descriptions do not map to African boxwood
    it('Test C: textile packaging descriptions return UNCLASSIFIED, never African boxwood', () => {
      const polybag = lookupUNSPSCByDescription('Textile Polybag LDPE 50 Micron');
      expect(polybag).toBeDefined();
      expect(polybag?.commodityCode).toBe(UNCLASSIFIED_COMMODITY_CODE);
      expect(polybag?.commodityTitle).toBe(UNCLASSIFIED_COMMODITY_TITLE);
      expect(polybag?.classificationStatus).toBe('UNCLASSIFIED');
      expect(polybag?.commodityCode).not.toBe('10502909');

      const carton = lookupUNSPSCByDescription('Corrugated Carton 7-Ply Outer Shipper');
      expect(carton).toBeDefined();
      expect(carton?.commodityCode).toBe(UNCLASSIFIED_COMMODITY_CODE);
      expect(carton?.commodityTitle).toBe(UNCLASSIFIED_COMMODITY_TITLE);
      expect(carton?.classificationStatus).toBe('UNCLASSIFIED');
      expect(carton?.commodityCode).not.toBe('10502909');
    });

    // Test D: An ambiguous description does not silently receive an unrelated code
    it('Test D: an ambiguous description does not silently receive boxwood or unrelated code', () => {
      // Searching single word "box" must NOT match "Fresh cut african boxwood"
      const boxResult = lookupUNSPSCByDescription('box');
      expect(boxResult?.commodityCode).not.toBe('10502909');
      expect(boxResult?.commodityTitle).not.toBe('Fresh cut african boxwood');

      // Ambiguous description without match must return UNCLASSIFIED
      const ambiguous = lookupUNSPSCByDescription('miscellaneous ambiguous supplies xyz');
      expect(ambiguous?.commodityCode).toBe(UNCLASSIFIED_COMMODITY_CODE);
      expect(ambiguous?.commodityTitle).toBe(UNCLASSIFIED_COMMODITY_TITLE);
      expect(ambiguous?.classificationStatus).toBe('UNCLASSIFIED');
    });

    it('should return undefined when query is empty or whitespace only', () => {
      expect(lookupUNSPSCByDescription('')).toBeUndefined();
      expect(lookupUNSPSCByDescription('   ')).toBeUndefined();
    });

    it('should export UNCLASSIFIED_COMMODITY_RECORD matching constant specification', () => {
      expect(UNCLASSIFIED_COMMODITY_RECORD.commodityCode).toBe('00000000');
      expect(UNCLASSIFIED_COMMODITY_RECORD.commodityTitle).toBe('Unclassified Commodity');
      expect(UNCLASSIFIED_COMMODITY_RECORD.classificationStatus).toBe('UNCLASSIFIED');
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
