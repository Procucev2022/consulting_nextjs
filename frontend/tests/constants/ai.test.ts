import { describe, it, expect } from 'vitest';
import { AI_STATUS, AI_ENDPOINTS } from '../../src/constants/ai';

describe('Frontend AI Constants', () => {
  it('should define AI status values', () => {
    expect(AI_STATUS.IDLE).toBe('IDLE');
    expect(AI_STATUS.LOADING).toBe('LOADING');
    expect(AI_STATUS.SUCCESS).toBe('SUCCESS');
    expect(AI_STATUS.ERROR).toBe('ERROR');
  });

  it('should define AI endpoints correctly', () => {
    expect(AI_ENDPOINTS.CONFIG).toBe('/api/ai/config');
    expect(AI_ENDPOINTS.EXTRACT).toBe('/api/ai/extract');
    expect(AI_ENDPOINTS.CATEGORIZE).toBe('/api/ai/categorize');
    expect(AI_ENDPOINTS.EXECUTIVE_SUMMARY).toBe('/api/ai/executive-summary');
    expect(AI_ENDPOINTS.ANOMALIES).toBe('/api/ai/analyze-anomalies');
  });
});
