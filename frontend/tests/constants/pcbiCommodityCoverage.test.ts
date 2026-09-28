import { describe, it, expect } from 'vitest';
import {
  MODULE_3_SOFTWARE_STATUS,
  DATA_OPERATING_MODE,
  NEXT_DEVELOPMENT_PHASE,
  NEXT_BUSINESS_ACTIVITY,
  INITIAL_COMMODITY_GAP_QUEUE,
  PCBI_MULTI_SOURCES_REGISTRY
} from '../../src/constants/pcbiCommodityCoverage';

describe('Frontend PCBI Commodity Coverage Constants (frontend/src/constants/pcbiCommodityCoverage.ts)', () => {
  it('should define operational statuses and modes', () => {
    expect(MODULE_3_SOFTWARE_STATUS).toBe('PRODUCTION_READY_DYNAMIC_PCBI');
    expect(DATA_OPERATING_MODE).toBe('CONTINUOUS_COMMODITY_EXPANSION');
    expect(NEXT_DEVELOPMENT_PHASE).toBe('ONLY_DEFECT_DRIVEN');
    expect(NEXT_BUSINESS_ACTIVITY).toBe('PCBI_DATA_RESEARCH_AND_ADMIN_POPULATION');
  });

  it('should initialize all 6 commodity gaps with 24 required fields', () => {
    expect(INITIAL_COMMODITY_GAP_QUEUE.length).toBe(6);

    const ferroMoly = INITIAL_COMMODITY_GAP_QUEUE.find((g) => g.commodityId === 'COM-MET-FMO');
    expect(ferroMoly).toBeDefined();
    expect(ferroMoly?.commodityName).toBe('Ferro Molybdenum 65%');
    expect(ferroMoly?.customerSpend).toBe(12500000);
    expect(ferroMoly?.customerSpendCr).toBe('₹1.25 Cr');
    expect(ferroMoly?.transactionCount).toBe(65);
    expect(ferroMoly?.pcbiId).toBe('PCBI-IND-MET-FMO-001');
    expect(ferroMoly?.priority).toBe('P1 — Critical Coverage Gap');
  });

  it('should define multi-source registry examples with independent metadata', () => {
    const fmoSources = PCBI_MULTI_SOURCES_REGISTRY['COM-MET-FMO'];
    expect(fmoSources).toBeDefined();
    expect(fmoSources.length).toBe(3);
  });
});
