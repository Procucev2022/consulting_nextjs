import { describe, it, expect } from 'vitest';
import {
  BOROSIL_CANDIDATE_SERIES_CATALOG,
  CATEGORY_TO_BENCHMARK_FAMILY_MAP,
  getBenchmarkFamilyForCategory,
  getSpendCategoryForRequirement,
  getCandidateSeriesForRequirement
} from '../../src/constants/pcbiMappingMaster';
import type { PCBIMissingIndexGapItem } from '../../src/types/module3GapList';

describe('pcbiMappingMaster constants and helpers', () => {
  it('contains expected candidate series for Borosil commodities', () => {
    expect(BOROSIL_CANDIDATE_SERIES_CATALOG.length).toBeGreaterThan(0);
    const seriesIds = BOROSIL_CANDIDATE_SERIES_CATALOG.map((s) => s.seriesId);
    expect(seriesIds).toContain('PCBI-IND-CHM-SDA-001');
    expect(seriesIds).toContain('PCBI-IND-CHM-SDA-002');
    expect(seriesIds).toContain('PCBI-IND-MIN-SLS-001');
    expect(seriesIds).toContain('PCBI-IND-PPR-KFT-001');
    expect(seriesIds).toContain('PCBI-IND-PET-LSHS-001');
    expect(seriesIds).toContain('PCBI-IND-POL-PP-001');
  });

  it('correctly maps category codes to benchmark families', () => {
    expect(getBenchmarkFamilyForCategory('11100')).toBe(CATEGORY_TO_BENCHMARK_FAMILY_MAP['11100']);
    expect(getBenchmarkFamilyForCategory('11300')).toBe(CATEGORY_TO_BENCHMARK_FAMILY_MAP['11300']);
    expect(getBenchmarkFamilyForCategory('40000')).toBe(CATEGORY_TO_BENCHMARK_FAMILY_MAP['40000']);
    expect(getBenchmarkFamilyForCategory('ST-ENG-B')).toBe(CATEGORY_TO_BENCHMARK_FAMILY_MAP['ST-ENG-B']);
  });

  it('infers benchmark family from classification text if category is unknown', () => {
    expect(getBenchmarkFamilyForCategory(undefined, 'Sodium Carbonate Dense Grade')).toBe('Alkali Chemicals');
    expect(getBenchmarkFamilyForCategory(undefined, 'Washed Silica Sand 99.5%')).toBe('Industrial Minerals');
    expect(getBenchmarkFamilyForCategory(undefined, 'Corrugated Cartons and Boxes')).toBe('Packaging & Paper');
    expect(getBenchmarkFamilyForCategory(undefined, 'Industrial Fuel Oil LSHS')).toBe('Petroleum & Fuels');
    expect(getBenchmarkFamilyForCategory(undefined, 'Electrocast Refractory Blocks')).toBe('Refractories & High-Temp Ceramics');
    expect(getBenchmarkFamilyForCategory(undefined, 'Turnkey LNG Vaporization Equipment')).toBe('Capital Machinery & Turnkey Equipment');
    expect(getBenchmarkFamilyForCategory(undefined, 'Office Furniture & Stationery')).toBe('General Industrial Supplies');
  });

  it('correctly derives spend category for various material codes', () => {
    const mockItem = (code: string): PCBIMissingIndexGapItem => ({
      id: 'GAP-TEST',
      materialCode: code,
      materialDescription: 'Test',
      commodityClassification: 'Test Class',
      unspscCode: '12345678',
      existingGradeSpecification: 'Standard',
      customerSpendCr: 10,
      customerSpendInr: 100000000,
      transactionCount: 5,
      spendSharePct: 2,
      pcbiSeriesId: null,
      benchmarkSeriesName: null,
      benchmarkPublisherSource: null,
      sourceStatus: 'UNMAPPED',
      observationCoverage: 'None',
      latestObservationDate: null,
      gapStatus: 'UNMAPPED — RESEARCH REQUIRED',
      gapReason: 'Reason',
      nextActionRequired: 'Action'
    });

    expect(getSpendCategoryForRequirement(mockItem('100SA01T'))).toBe('11100 (Direct Chemicals)');
    expect(getSpendCategoryForRequirement(mockItem('100SSW13FG-L'))).toBe('11100 (Direct Minerals)');
    expect(getSpendCategoryForRequirement(mockItem('300PP112'))).toBe('11300 (Packaging Materials)');
    expect(getSpendCategoryForRequirement(mockItem('400LSH01I'))).toBe('40000 (Industrial Fuels)');
    expect(getSpendCategoryForRequirement(mockItem('STTV2062'))).toBe('ST-ENG-B (Furnace Refractories)');
    expect(getSpendCategoryForRequirement(mockItem('600LNG01'))).toBe('60000 (Capital Turnkey Equipment)');
    expect(getSpendCategoryForRequirement(mockItem('MISC-001'))).toBe('TAIL-MRO (Operating Consumables)');
  });

  it('filters candidate series strictly and never returns unrelated fallbacks', () => {
    const baseItem: PCBIMissingIndexGapItem = {
      id: 'GAP-TEST',
      materialCode: '100SA02G',
      materialDescription: 'Soda Ash Dense - GHCL',
      commodityClassification: 'Chemical Raw Materials',
      unspscCode: '12142104',
      existingGradeSpecification: 'Na2CO3 >= 99.2%',
      customerSpendCr: 58.117,
      customerSpendInr: 581170000,
      transactionCount: 6,
      spendSharePct: 10.44,
      pcbiSeriesId: 'PCBI-IND-CHM-SDA-001',
      benchmarkSeriesName: 'AMAI Soda Ash',
      benchmarkPublisherSource: 'AMAI',
      sourceStatus: 'DATA NOT ACQUIRED',
      observationCoverage: '0 obs',
      latestObservationDate: null,
      gapStatus: 'SOURCE IDENTIFIED — DATA NOT ACQUIRED',
      gapReason: 'Reason',
      nextActionRequired: 'Action'
    };

    // Soda Ash returns only Alkali Chemicals series
    const sodaCandidates = getCandidateSeriesForRequirement(baseItem);
    expect(sodaCandidates.length).toBe(2);
    expect(sodaCandidates.every((c) => c.benchmarkFamily === 'Alkali Chemicals')).toBe(true);

    // Silica Sand returns only Industrial Minerals
    const silicaItem = {
      ...baseItem,
      materialCode: '100SSW13FG-L',
      materialDescription: 'SILICA SAND (L)',
      commodityClassification: 'Direct Minerals'
    };
    const silicaCandidates = getCandidateSeriesForRequirement(silicaItem);
    expect(silicaCandidates.length).toBe(1);
    expect(silicaCandidates[0].seriesId).toBe('PCBI-IND-MIN-SLS-001');

    // Kraft paper returns Packaging & Paper / Polymers
    const paperItem = {
      ...baseItem,
      materialCode: '300PP112',
      materialDescription: 'KRAFT PAPER 112.5CM',
      commodityClassification: 'Packaging / Corrugated Cartons & Sheets'
    };
    const paperCandidates = getCandidateSeriesForRequirement(paperItem);
    expect(paperCandidates.length).toBeGreaterThanOrEqual(1);
    expect(paperCandidates.every((c) => c.benchmarkFamily.includes('Packaging'))).toBe(true);

    // Fuels return petroleum
    const fuelItem = {
      ...baseItem,
      materialCode: '400LSH01I',
      materialDescription: 'LSHS Oil',
      commodityClassification: 'Industrial Fuels'
    };
    const fuelCandidates = getCandidateSeriesForRequirement(fuelItem);
    expect(fuelCandidates.length).toBe(1);
    expect(fuelCandidates[0].seriesId).toBe('PCBI-IND-PET-LSHS-001');

    // Refractories and Turnkey Capital Equipment return EMPTY array (No public benchmark exists)
    const refractoryItem = {
      ...baseItem,
      materialCode: 'STTV2062',
      materialDescription: 'Cumirex Super Refractory tiles',
      commodityClassification: 'Furnace Refractories'
    };
    expect(getCandidateSeriesForRequirement(refractoryItem)).toEqual([]);

    const equipmentItem = {
      ...baseItem,
      materialCode: '600LNG01',
      materialDescription: 'Turnkey LNG Vaporization System',
      commodityClassification: 'Turnkey Machinery'
    };
    expect(getCandidateSeriesForRequirement(equipmentItem)).toEqual([]);

    const tailItem = {
      ...baseItem,
      materialCode: 'UNMAPPED-TAIL-MRO',
      materialDescription: 'Tail MRO Consumables',
      commodityClassification: 'Tail MRO'
    };
    expect(getCandidateSeriesForRequirement(tailItem)).toEqual([]);
  });
});
