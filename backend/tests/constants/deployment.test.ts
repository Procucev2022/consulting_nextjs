import { describe, it, expect } from 'vitest';
import { DEPLOYMENT_VERIFICATION_CONSTANTS } from '../../src/constants/deployment';

describe('Deployment Verification Constants', () => {
  it('should define expected endpoint constants', () => {
    expect(DEPLOYMENT_VERIFICATION_CONSTANTS.HEALTH_ENDPOINT).toBe('/api/health');
    expect(DEPLOYMENT_VERIFICATION_CONSTANTS.TENANT_ENDPOINT).toBe('/api/tenant');
    expect(DEPLOYMENT_VERIFICATION_CONSTANTS.INGESTION_ENDPOINT).toBe('/api/ingestion');
  });

  it('should define valid sample file ingestion metadata', () => {
    expect(DEPLOYMENT_VERIFICATION_CONSTANTS.SAMPLE_FILE_NAME).toContain('.xlsx');
    expect(DEPLOYMENT_VERIFICATION_CONSTANTS.SAMPLE_FILE_TYPE).toBe('XLSX');
    expect(DEPLOYMENT_VERIFICATION_CONSTANTS.SAMPLE_FILE_SIZE_MB).toBeGreaterThan(0);
    expect(DEPLOYMENT_VERIFICATION_CONSTANTS.SAMPLE_RECORDS_COUNT).toBeGreaterThan(0);
    expect(DEPLOYMENT_VERIFICATION_CONSTANTS.SAMPLE_CONVERTED_INR_CRORES).toBeGreaterThan(0);
  });

  it('should define status identifiers and timeout', () => {
    expect(DEPLOYMENT_VERIFICATION_CONSTANTS.STATUS_PASSED).toBe('passed');
    expect(DEPLOYMENT_VERIFICATION_CONSTANTS.STATUS_FAILED).toBe('failed');
    expect(DEPLOYMENT_VERIFICATION_CONSTANTS.TIMEOUT_MS).toBe(5000);
  });
});
