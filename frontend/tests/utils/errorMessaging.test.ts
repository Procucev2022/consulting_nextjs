import { describe, it, expect, vi } from 'vitest';
import {
  getDefaultErrorTitle,
  getDefaultActionableAdvice,
  createDescriptiveError,
  formatApiError
} from '../../src/utils/errorMessaging';
import { ERROR_CATEGORIES, ERROR_SEVERITIES } from '../../src/constants/errors';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import { frontendLogger } from '../../src/utils/logger';

describe('Descriptive UI Error Messaging Utilities (utils/errorMessaging.ts)', () => {
  it('should return correct default titles for all error categories', () => {
    expect(getDefaultErrorTitle(ERROR_CATEGORIES.VALIDATION_ERROR)).toBe(UI_STRINGS.errors.titles.validation);
    expect(getDefaultErrorTitle(ERROR_CATEGORIES.NETWORK_ERROR)).toBe(UI_STRINGS.errors.titles.network);
    expect(getDefaultErrorTitle(ERROR_CATEGORIES.AUTH_ERROR)).toBe(UI_STRINGS.errors.titles.auth);
    expect(getDefaultErrorTitle(ERROR_CATEGORIES.NOT_FOUND_ERROR)).toBe(UI_STRINGS.errors.titles.notFound);
    expect(getDefaultErrorTitle(ERROR_CATEGORIES.CONFLICT_ERROR)).toBe(UI_STRINGS.errors.titles.conflict);
    expect(getDefaultErrorTitle(ERROR_CATEGORIES.SERVER_ERROR)).toBe(UI_STRINGS.errors.titles.server);
    expect(getDefaultErrorTitle(ERROR_CATEGORIES.RATE_LIMIT_ERROR)).toBe(UI_STRINGS.errors.titles.rateLimit);
    expect(getDefaultErrorTitle('UNKNOWN_CATEGORY' as any)).toBe(UI_STRINGS.errors.titles.generic);
  });

  it('should return correct default actionable advice for all error categories', () => {
    expect(getDefaultActionableAdvice(ERROR_CATEGORIES.VALIDATION_ERROR)).toBe(UI_STRINGS.errors.validation.actionableAdvice);
    expect(getDefaultActionableAdvice(ERROR_CATEGORIES.NETWORK_ERROR)).toBe(UI_STRINGS.errors.network.actionableAdvice);
    expect(getDefaultActionableAdvice(ERROR_CATEGORIES.AUTH_ERROR)).toBe(UI_STRINGS.errors.auth.actionableAdvice);
    expect(getDefaultActionableAdvice(ERROR_CATEGORIES.NOT_FOUND_ERROR)).toBe(UI_STRINGS.errors.notFound.actionableAdvice);
    expect(getDefaultActionableAdvice(ERROR_CATEGORIES.CONFLICT_ERROR)).toBe(UI_STRINGS.errors.conflict.actionableAdvice);
    expect(getDefaultActionableAdvice(ERROR_CATEGORIES.SERVER_ERROR)).toBe(UI_STRINGS.errors.server.actionableAdvice);
    expect(getDefaultActionableAdvice(ERROR_CATEGORIES.RATE_LIMIT_ERROR)).toBe(UI_STRINGS.errors.rateLimit.actionableAdvice);
    expect(getDefaultActionableAdvice('UNKNOWN_CATEGORY' as any)).toBe(UI_STRINGS.errors.server.actionableAdvice);
  });

  it('should create a DescriptiveError with defaults and log with error level', () => {
    const errorSpy = vi.spyOn(frontendLogger, 'error');
    const result = createDescriptiveError({
      category: ERROR_CATEGORIES.SERVER_ERROR,
      message: 'Failed to process transaction'
    });

    expect(result.id).toMatch(/^err-/);
    expect(result.category).toBe(ERROR_CATEGORIES.SERVER_ERROR);
    expect(result.severity).toBe(ERROR_SEVERITIES.ERROR);
    expect(result.title).toBe(UI_STRINGS.errors.titles.server);
    expect(result.actionableAdvice).toBe(UI_STRINGS.errors.server.actionableAdvice);
    expect(result.requestId).toMatch(/^req-/);
    expect(errorSpy).toHaveBeenCalledWith(
      `[${ERROR_CATEGORIES.SERVER_ERROR}] Failed to process transaction`,
      expect.objectContaining({
        category: ERROR_CATEGORIES.SERVER_ERROR
      }),
      result.requestId
    );
  });

  it('should create a DescriptiveError with custom options and log with warn level', () => {
    const warnSpy = vi.spyOn(frontendLogger, 'warn');
    const result = createDescriptiveError({
      category: ERROR_CATEGORIES.VALIDATION_ERROR,
      title: 'Custom Validation Title',
      message: 'Invalid email address',
      actionableAdvice: 'Provide a valid email',
      failureDetail: 'Regex match failed',
      field: 'email',
      statusCode: 400,
      requestId: 'custom-req-123',
      severity: ERROR_SEVERITIES.WARNING
    });

    expect(result.title).toBe('Custom Validation Title');
    expect(result.actionableAdvice).toBe('Provide a valid email');
    expect(result.failureDetail).toBe('Regex match failed');
    expect(result.field).toBe('email');
    expect(result.statusCode).toBe(400);
    expect(result.requestId).toBe('custom-req-123');
    expect(result.severity).toBe(ERROR_SEVERITIES.WARNING);
    expect(warnSpy).toHaveBeenCalledWith(
      `[${ERROR_CATEGORIES.VALIDATION_ERROR}] Invalid email address`,
      expect.objectContaining({
        field: 'email',
        statusCode: 400
      }),
      'custom-req-123'
    );
  });

  it('should format Error instances into DescriptiveError', () => {
    // Network error
    const netErr = new Error('Network request failed');
    const netResult = formatApiError(netErr);
    expect(netResult.category).toBe(ERROR_CATEGORIES.NETWORK_ERROR);
    expect(netResult.message).toBe('Network request failed');

    // General server error
    const serverErr = new Error('Database connection failed');
    const serverResult = formatApiError(serverErr);
    expect(serverResult.category).toBe(ERROR_CATEGORIES.SERVER_ERROR);
    expect(serverResult.message).toBe('Database connection failed');
  });

  it('should format string and unknown errors into DescriptiveError', () => {
    const strResult = formatApiError('Something went wrong on server');
    expect(strResult.category).toBe(ERROR_CATEGORIES.SERVER_ERROR);
    expect(strResult.message).toBe('Something went wrong on server');

    const unknownResult = formatApiError({ unknownObj: true }, 'Fallback error text');
    expect(unknownResult.category).toBe(ERROR_CATEGORIES.SERVER_ERROR);
    expect(unknownResult.message).toBe('Fallback error text');
  });
});
