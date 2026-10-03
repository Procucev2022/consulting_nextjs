import { describe, it, expect } from 'vitest';
import { ENTERPRISE_STATUS_MAP, getStatusDesign } from '../../src/constants/statusDesign';
import type { PCBIEnterpriseStatus } from '../../src/types/pcbiCommodityDataLab';

describe('Enterprise Status Design System (Part L)', () => {
  const all12Statuses: PCBIEnterpriseStatus[] = [
    'PRODUCTION_READY',
    'PARTIAL_HISTORY',
    'NO_HISTORY',
    'MISSING',
    'SOURCE_UNVERIFIED',
    'METHODOLOGY_PENDING',
    'SPECIFICATION_MISMATCH',
    'FREQUENCY_MISMATCH',
    'NOT_BENCHMARKABLE',
    'VALIDATION_PENDING',
    'APPROVED',
    'REJECTED'
  ];

  it('should define all 12 non-negotiable enterprise statuses in the map', () => {
    all12Statuses.forEach((status) => {
      const config = ENTERPRISE_STATUS_MAP[status];
      expect(config).toBeDefined();
      expect(config.key).toBe(status);
      expect(config.label).toBeTruthy();
      expect(config.badgeClass).toBeTruthy();
      expect(config.dotClass).toBeTruthy();
      expect(config.description).toBeTruthy();
    });
  });

  it('should correctly retrieve status design via getStatusDesign for exact and lowercase matches', () => {
    const prodConfig = getStatusDesign('production_ready');
    expect(prodConfig.key).toBe('PRODUCTION_READY');
    expect(prodConfig.label).toBe('Production Ready');
    expect(prodConfig.dotClass).toBe('bg-emerald-400');

    const missingConfig = getStatusDesign('MISSING');
    expect(missingConfig.key).toBe('MISSING');
    expect(missingConfig.label).toBe('Missing PCBI');
  });

  it('should provide fallback configuration for unknown statuses', () => {
    const fallback = getStatusDesign('CUSTOM_UNKNOWN_STATUS');
    expect(fallback.key).toBe('NOT_BENCHMARKABLE');
    expect(fallback.label).toBe('CUSTOM UNKNOWN STATUS');
    expect(fallback.dotClass).toBe('bg-slate-400');
  });
});
