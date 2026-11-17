/**
 * API error response types (Backend)
 *
 * The category and code unions are derived from the constants so the two cannot drift apart.
 */
import type { API_ERROR_CATEGORY, API_ERROR_CODE } from '../constants/errors';

export type ApiErrorCategory = (typeof API_ERROR_CATEGORY)[keyof typeof API_ERROR_CATEGORY];
export type ApiErrorCode = (typeof API_ERROR_CODE)[keyof typeof API_ERROR_CODE];

export interface ApiErrorBody {
  success: false;
  message: string;
  errorCode: ApiErrorCode;
  errorCategory: ApiErrorCategory;
  requestId?: string;
  [key: string]: unknown;
}

export interface ApiErrorBodyOptions {
  requestId?: string;
  extra?: Record<string, unknown>;
}
