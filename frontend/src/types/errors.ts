/**
 * Error Types & Interfaces (Frontend)
 */

import type { ERROR_CATEGORIES, ERROR_SEVERITIES } from '../constants/errors';

export type ErrorCategory = (typeof ERROR_CATEGORIES)[keyof typeof ERROR_CATEGORIES];

export type ErrorSeverity = (typeof ERROR_SEVERITIES)[keyof typeof ERROR_SEVERITIES];

export interface DescriptiveError {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  title: string;
  message: string;
  actionableAdvice: string;
  failureDetail?: string;
  field?: string;
  statusCode?: number;
  requestId?: string;
  timestamp: string;
}

export interface CreateDescriptiveErrorOptions {
  category: ErrorCategory;
  title?: string;
  message: string;
  actionableAdvice?: string;
  failureDetail?: string;
  field?: string;
  statusCode?: number;
  requestId?: string;
  severity?: ErrorSeverity;
}
