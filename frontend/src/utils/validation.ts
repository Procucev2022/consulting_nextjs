/**
 * Frontend Input Validation Utilities
 * 
 * Reusable schema validation functions for validating form inputs, modal controls,
 * and outgoing API payloads against centralized Zod schemas.
 */

import type { z, ZodError } from 'zod';
import frontendLogger from './logger';
import type { ValidationResult, ValidationErrorsMap } from '../types/validation';

export const formatFrontendZodErrors = (error: ZodError): ValidationErrorsMap => {
  const map: ValidationErrorsMap = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : 'root';
    if (!map[key]) {
      map[key] = issue.message;
    }
  }
  return map;
};

/**
 * Validates any arbitrary input against a centralized Zod schema.
 */
export const validateInput = <T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): ValidationResult<z.infer<T>> => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = formatFrontendZodErrors(result.error);
    frontendLogger.warn('Input validation failed', { errors, input: data });
    return {
      success: false,
      errors,
      message: 'Validation failed'
    };
  }
  return {
    success: true,
    data: result.data
  };
};
