import { describe, it, expect } from 'vitest';
import {
  LOG_DIAGNOSTIC_SEVERITIES,
  DIAGNOSTIC_ERROR_CATEGORIES,
  DEFAULT_MAX_PARSE_LINES,
  AUTO_RESOLVE_ACTIONS,
} from '../../src/constants/logDiagnostics';

describe('Log Diagnostics Constants', () => {
  it('should list valid diagnostic severities', () => {
    expect(LOG_DIAGNOSTIC_SEVERITIES).toContain('error');
    expect(LOG_DIAGNOSTIC_SEVERITIES).toContain('warn');
  });

  it('should list all designated error categories', () => {
    expect(DIAGNOSTIC_ERROR_CATEGORIES).toContain('VALIDATION_ERROR');
    expect(DIAGNOSTIC_ERROR_CATEGORIES).toContain('DATABASE_ERROR');
    expect(DIAGNOSTIC_ERROR_CATEGORIES).toContain('NETWORK_ERROR');
    expect(DIAGNOSTIC_ERROR_CATEGORIES).toContain('AUTH_ERROR');
    expect(DIAGNOSTIC_ERROR_CATEGORIES).toContain('INTERNAL_ERROR');
    expect(DIAGNOSTIC_ERROR_CATEGORIES).toContain('UNKNOWN_ERROR');
  });

  it('should configure sensible parse defaults and auto-resolve actions', () => {
    expect(DEFAULT_MAX_PARSE_LINES).toBe(1000);
    expect(AUTO_RESOLVE_ACTIONS.RETRY).toBe('RETRY');
    expect(AUTO_RESOLVE_ACTIONS.VALIDATE_INPUT).toBe('VALIDATE_INPUT');
    expect(AUTO_RESOLVE_ACTIONS.CHECK_DB_CONNECTION).toBe('CHECK_DB_CONNECTION');
    expect(AUTO_RESOLVE_ACTIONS.CHECK_CREDENTIALS).toBe('CHECK_CREDENTIALS');
    expect(AUTO_RESOLVE_ACTIONS.INVESTIGATE_UNHANDLED).toBe('INVESTIGATE_UNHANDLED');
  });
});
