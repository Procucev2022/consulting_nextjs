import { describe, it, expect } from 'vitest';
import {
  MODULE_3_SOFTWARE_STATUS,
  DATA_OPERATING_MODE,
  NEXT_DEVELOPMENT_PHASE,
  NEXT_BUSINESS_ACTIVITY,
  INITIAL_COMMODITY_GAP_QUEUE,
  PCBI_MULTI_SOURCES_REGISTRY
} from '../../src/constants/pcbiCommodityCoverage';

describe('PCBI Commodity Coverage Constants (backend/src/constants/pcbiCommodityCoverage.ts)', () => {
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
    expect(ferroMoly?.pcbiDefinitionStatus).toBe('DEFINED');
    expect(ferroMoly?.pcbiDataStatus).toBe('NO_HISTORY');
    expect(ferroMoly?.requiredStartDate).toBe('2020-04-01');
    expect(ferroMoly?.requiredEndDate).toBe('2026-06-30');
    expect(ferroMoly?.requiredFrequency).toBe('WEEKLY');
    expect(ferroMoly?.requiredUnit).toBe('INR/MT');
    expect(ferroMoly?.requiredCurrency).toBe('INR');
    expect(ferroMoly?.requiredGeography).toBe('INDIA_DOMESTIC');
    expect(ferroMoly?.priority).toBe('P1 — Critical Coverage Gap');
    expect(ferroMoly?.adminAction).toBe('SEARCH / ADD SOURCE');
    expect(ferroMoly?.researchStatus).toBe('QUEUED');

    const pumps = INITIAL_COMMODITY_GAP_QUEUE.find((g) => g.commodityId === 'COM-EQP-SLP');
    expect(pumps?.priority).toBe('P1 — Critical Coverage Gap');

    const inserts = INITIAL_COMMODITY_GAP_QUEUE.find((g) => g.commodityId === 'COM-MET-TCI');
    expect(inserts?.priority).toBe('P2 — High Coverage Gap');

    const hdpe = INITIAL_COMMODITY_GAP_QUEUE.find((g) => g.commodityId === 'COM-PLM-HDP');
    expect(hdpe?.priority).toBe('P3 — Medium Coverage Gap');

    const scrap = INITIAL_COMMODITY_GAP_QUEUE.find((g) => g.commodityId === 'COM-STL-SCR');
    expect(scrap?.priority).toBe('P3 — Medium Coverage Gap');

    const oil = INITIAL_COMMODITY_GAP_QUEUE.find((g) => g.commodityId === 'COM-LUB-HYD');
    expect(oil?.priority).toBe('P4 — Low Coverage Gap');
  });

  it('should define multi-source registry examples with independent metadata', () => {
    const fmoSources = PCBI_MULTI_SOURCES_REGISTRY['COM-MET-FMO'];
    expect(fmoSources).toBeDefined();
    expect(fmoSources.length).toBe(3);

    const govSource = fmoSources.find((s) => s.sourceType === 'GOVERNMENT');
    expect(govSource).toBeDefined();
    expect(govSource?.sourceId).toBe('SRC-FMO-01-GOV');
    expect(govSource?.checksum).toBeDefined();

    const pubSource = fmoSources.find((s) => s.sourceType === 'COMMERCIAL');
    expect(pubSource?.sourceId).toBe('SRC-FMO-02-PUB');
    expect(pubSource?.frequency).toBe('WEEKLY');

    const indSource = fmoSources.find((s) => s.sourceType === 'INDUSTRY_ASSOCIATION');
    expect(indSource?.sourceId).toBe('SRC-FMO-03-IND');
  });
});
