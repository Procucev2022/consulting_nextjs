import { describe, it, expect } from 'vitest';
import { ERROR_CATEGORIES, ERROR_SEVERITIES, DEFAULT_ERROR_AUTO_DISMISS_MS } from '../../src/constants/errors';

describe('Error Constants Module (Frontend)', () => {
  it('should export standard ERROR_CATEGORIES', () => {
    expect(ERROR_CATEGORIES.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    expect(ERROR_CATEGORIES.NETWORK_ERROR).toBe('NETWORK_ERROR');
    expect(ERROR_CATEGORIES.AUTH_ERROR).toBe('AUTH_ERROR');
    expect(ERROR_CATEGORIES.NOT_FOUND_ERROR).toBe('NOT_FOUND_ERROR');
    expect(ERROR_CATEGORIES.CONFLICT_ERROR).toBe('CONFLICT_ERROR');
    expect(ERROR_CATEGORIES.SERVER_ERROR).toBe('SERVER_ERROR');
    expect(ERROR_CATEGORIES.RATE_LIMIT_ERROR).toBe('RATE_LIMIT_ERROR');
  });

  it('should export standard ERROR_SEVERITIES', () => {
    expect(ERROR_SEVERITIES.INFO).toBe('info');
    expect(ERROR_SEVERITIES.WARNING).toBe('warning');
    expect(ERROR_SEVERITIES.ERROR).toBe('error');
    expect(ERROR_SEVERITIES.CRITICAL).toBe('critical');
  });

  it('should export DEFAULT_ERROR_AUTO_DISMISS_MS', () => {
    expect(DEFAULT_ERROR_AUTO_DISMISS_MS).toBe(6000);
  });
});
