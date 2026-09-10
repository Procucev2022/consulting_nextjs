import { describe, it, expect } from 'vitest';
import {
  UNSPSC_COMMODITY_SPEND_THRESHOLD_CR,
  UNSPSC_CLASS_TITLES_BY_CODE,
  UNSPSC_SEGMENT_FALLBACK_CLASSES,
  resolveUNSPSCCategoryDisplay
} from '../../src/constants/taxonomy';

describe('UNSPSC Taxonomy Constants and Resolver', () => {
  it('should define standard thresholds and lookup tables', () => {
    expect(UNSPSC_COMMODITY_SPEND_THRESHOLD_CR).toBe(50.0);
    expect(Object.keys(UNSPSC_CLASS_TITLES_BY_CODE).length).toBeGreaterThan(0);
    expect(Object.keys(UNSPSC_SEGMENT_FALLBACK_CLASSES).length).toBeGreaterThan(0);
  });

  it('should resolve high spend category to COMMODITY title in AUTO mode', () => {
    const result = resolveUNSPSCCategoryDisplay(
      '12352204',
      'Chemical Catalysts & Neutralizing Agents',
      192.60,
      'AUTO'
    );
    expect(result.level).toBe('COMMODITY');
    expect(result.displayTitle).toBe('Chemical Catalysts & Neutralizing Agents');
    expect(result.classTitle).toBe('Catalysts and Reaction Modifiers');
    expect(result.isCommodity).toBe(true);
    expect(result.code).toBe('12352204');
  });

  it('should resolve low spend category to CLASS title in AUTO mode when values are less', () => {
    const result = resolveUNSPSCCategoryDisplay(
      '31201501',
      'BOPP Adhesive Packaging Tapes & Films',
      42.42,
      'AUTO'
    );
    expect(result.level).toBe('CLASS');
    expect(result.displayTitle).toBe('Industrial Tapes and Adhesives');
    expect(result.commodityTitle).toBe('BOPP Adhesive Packaging Tapes & Films');
    expect(result.isCommodity).toBe(false);
  });

  it('should honor explicit COMMODITY filter mode regardless of spend value', () => {
    const result = resolveUNSPSCCategoryDisplay(
      '31201501',
      'BOPP Adhesive Packaging Tapes & Films',
      10.0,
      'COMMODITY'
    );
    expect(result.level).toBe('COMMODITY');
    expect(result.displayTitle).toBe('BOPP Adhesive Packaging Tapes & Films');
    expect(result.isCommodity).toBe(true);
  });

  it('should honor explicit CLASS filter mode regardless of spend value', () => {
    const result = resolveUNSPSCCategoryDisplay(
      '12352204',
      'Chemical Catalysts & Neutralizing Agents',
      200.0,
      'CLASS'
    );
    expect(result.level).toBe('CLASS');
    expect(result.displayTitle).toBe('Catalysts and Reaction Modifiers');
    expect(result.isCommodity).toBe(false);
  });

  it('should handle unmapped codes using segment fallback or generic fallback', () => {
    // Known segment prefix fallback
    const result1 = resolveUNSPSCCategoryDisplay('24999999', '', 20.0, 'CLASS');
    expect(result1.classTitle).toBe('Material Handling, Storage Packaging & Containers');
    expect(result1.commodityTitle).toBe('General Commodity Item');

    // Unknown segment prefix fallback
    const result2 = resolveUNSPSCCategoryDisplay('99999999', 'Specialty Sensor', 20.0, 'CLASS');
    expect(result2.classTitle).toBe('Specialty Sensor (Class Level)');

    // Missing code fallback
    const result3 = resolveUNSPSCCategoryDisplay('', '', 100.0, 'AUTO');
    expect(result3.level).toBe('COMMODITY');
    expect(result3.classTitle).toBe('Chemicals, Catalysts & Bio-Chemical Materials');
  });
});
