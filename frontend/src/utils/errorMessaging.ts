/**
 * Descriptive UI Error Messaging Utilities (Frontend)
 *
 * Implements centralized error construction, categorization,
 * actionable remediation guidance, and structured logging.
 */

import { UI_STRINGS } from '../constants/uiStrings';
import { ERROR_CATEGORIES, ERROR_SEVERITIES } from '../constants/errors';
import { DescriptiveError, CreateDescriptiveErrorOptions, ErrorCategory, ErrorSeverity } from '../types/errors';
import { frontendLogger } from './logger';

/**
 * Maps an ErrorCategory to a localized title from UI_STRINGS.errors.titles.
 */
export const getDefaultErrorTitle = (category: ErrorCategory): string => {
  switch (category) {
    case ERROR_CATEGORIES.VALIDATION_ERROR:
      return UI_STRINGS.errors.titles.validation;
    case ERROR_CATEGORIES.NETWORK_ERROR:
      return UI_STRINGS.errors.titles.network;
    case ERROR_CATEGORIES.AUTH_ERROR:
      return UI_STRINGS.errors.titles.auth;
    case ERROR_CATEGORIES.NOT_FOUND_ERROR:
      return UI_STRINGS.errors.titles.notFound;
    case ERROR_CATEGORIES.CONFLICT_ERROR:
      return UI_STRINGS.errors.titles.conflict;
    case ERROR_CATEGORIES.SERVER_ERROR:
      return UI_STRINGS.errors.titles.server;
    case ERROR_CATEGORIES.RATE_LIMIT_ERROR:
      return UI_STRINGS.errors.titles.rateLimit;
    default:
      return UI_STRINGS.errors.titles.generic;
  }
};

/**
 * Maps an ErrorCategory to default actionable advice from UI_STRINGS.errors.
 */
export const getDefaultActionableAdvice = (category: ErrorCategory): string => {
  switch (category) {
    case ERROR_CATEGORIES.VALIDATION_ERROR:
      return UI_STRINGS.errors.validation.actionableAdvice;
    case ERROR_CATEGORIES.NETWORK_ERROR:
      return UI_STRINGS.errors.network.actionableAdvice;
    case ERROR_CATEGORIES.AUTH_ERROR:
      return UI_STRINGS.errors.auth.actionableAdvice;
    case ERROR_CATEGORIES.NOT_FOUND_ERROR:
      return UI_STRINGS.errors.notFound.actionableAdvice;
    case ERROR_CATEGORIES.CONFLICT_ERROR:
      return UI_STRINGS.errors.conflict.actionableAdvice;
    case ERROR_CATEGORIES.SERVER_ERROR:
      return UI_STRINGS.errors.server.actionableAdvice;
    case ERROR_CATEGORIES.RATE_LIMIT_ERROR:
      return UI_STRINGS.errors.rateLimit.actionableAdvice;
    default:
      return UI_STRINGS.errors.server.actionableAdvice;
  }
};

/**
 * Creates a structured DescriptiveError, logs it with structured context,
 * and returns the user-facing error model.
 */
export const createDescriptiveError = (
  options: CreateDescriptiveErrorOptions
): DescriptiveError => {
  const {
    category,
    title = getDefaultErrorTitle(category),
    message,
    actionableAdvice = getDefaultActionableAdvice(category),
    failureDetail,
    field,
    statusCode,
    requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    severity = ERROR_SEVERITIES.ERROR
  } = options;

  const errorObj: DescriptiveError = {
    id: `err-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    category,
    severity,
    title,
    message,
    actionableAdvice,
    failureDetail,
    field,
    statusCode,
    requestId,
    timestamp: new Date().toISOString()
  };

  const logContext = {
    errorId: errorObj.id,
    category: errorObj.category,
    field: errorObj.field,
    statusCode: errorObj.statusCode,
    failureDetail: errorObj.failureDetail,
    actionableAdvice: errorObj.actionableAdvice
  };

  if (severity === ERROR_SEVERITIES.WARNING || severity === ERROR_SEVERITIES.INFO) {
    frontendLogger.warn(`[${category}] ${message}`, logContext, requestId);
  } else {
    frontendLogger.error(`[${category}] ${message}`, logContext, requestId);
  }

  return errorObj;
};

/**
 * Inspects any thrown error or rejection and produces a DescriptiveError.
 */
export const formatApiError = (
  error: unknown,
  fallbackMessage: string = UI_STRINGS.errors.titles.generic
): DescriptiveError => {
  if (error instanceof Error) {
    // Check network / timeout patterns
    if (error.message.toLowerCase().includes('network') || error.message.toLowerCase().includes('fetch')) {
      return createDescriptiveError({
        category: ERROR_CATEGORIES.NETWORK_ERROR,
        message: error.message,
        failureDetail: error.stack
      });
    }

    return createDescriptiveError({
      category: ERROR_CATEGORIES.SERVER_ERROR,
      message: error.message,
      failureDetail: error.stack
    });
  }

  if (typeof error === 'string') {
    return createDescriptiveError({
      category: ERROR_CATEGORIES.SERVER_ERROR,
      message: error
    });
  }

  return createDescriptiveError({
    category: ERROR_CATEGORIES.SERVER_ERROR,
    message: fallbackMessage
  });
};
