import { describe, it, expect } from 'vitest';
import {
  PLATFORM_STATUS,
  FINAL_PLATFORM_STATUS,
  FINAL_STATUS,
  MODULE_1_STATUS,
  MODULE_2_STATUS,
  PCBI_MASTER_V1_STATUS,
  MODULE_3_STATUS,
  MODULE_4_STATUS,
  OPERATING_MODE,
  FINAL_OPERATING_MODE,
  SOFTWARE_DEVELOPMENT_STATUS,
  DATA_OPERATING_STATUS,
  MODULE_4_PRE_PRODUCTION_AUDIT_REPORT,
  PLATFORM_DEPLOYMENT_CHECKLIST
} from '../../src/constants/pcbiPlatformIntegration';

describe('PCBI Platform Integration Constants (backend)', () => {
  it('should define certified operational and module status values', () => {
    expect(PLATFORM_STATUS).toBe('PRODUCTION_READY_WITH_CONTROLLED_GAPS');
    expect(FINAL_PLATFORM_STATUS).toBe('PRODUCTION_READY_WITH_CONTROLLED_DATA_GAPS');
    expect(FINAL_STATUS).toBe('PRODUCTION_OPERATIONAL');
    expect(MODULE_1_STATUS).toBe('FROZEN_CERTIFIED');
    expect(MODULE_2_STATUS).toBe('FROZEN_CERTIFIED_SOLE_AUTHORITY');
    expect(PCBI_MASTER_V1_STATUS).toBe('IMMUTABLE');
    expect(MODULE_3_STATUS).toBe('PRODUCTION_READY_DYNAMIC_PCBI');
    expect(MODULE_4_STATUS).toBe('ACTIVE_PRODUCTION_INTEGRATION');
    expect(OPERATING_MODE).toBe('PRODUCTIONIZATION_INTEGRATION_END_TO_END_QA');
    expect(FINAL_OPERATING_MODE).toBe('PRODUCTION + CONTINUOUS_COMMODITY_EXPANSION');
    expect(SOFTWARE_DEVELOPMENT_STATUS).toBe('FROZEN / DEFECT_DRIVEN_ONLY');
    expect(DATA_OPERATING_STATUS).toBe('CONTINUOUS_PCBI_RESEARCH_AND_POPULATION');
  });

  it('should define complete pre-production audit components for Module 4', () => {
    expect(MODULE_4_PRE_PRODUCTION_AUDIT_REPORT.length).toBe(12);
    expect(MODULE_4_PRE_PRODUCTION_AUDIT_REPORT.every((item) => item.area && item.status)).toBe(true);
  });

  it('should define complete production deployment checklist items', () => {
    expect(PLATFORM_DEPLOYMENT_CHECKLIST.length).toBe(19);
    expect(PLATFORM_DEPLOYMENT_CHECKLIST.every((item) => item.area && item.status === 'READY')).toBe(true);
  });
});
