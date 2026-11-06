import { GEMINI_PROVIDER_STATUS_CODE_PATTERN } from '../constants/ai';
import type { GeminiProviderAttemptFailureContext } from '../types/ai';
import logger from '../utils/logger';

export const logGeminiProviderAttemptFailure = (
  error: unknown,
  context: GeminiProviderAttemptFailureContext,
  failures: string[]
): boolean => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const statusCodeMatch = GEMINI_PROVIDER_STATUS_CODE_PATTERN.exec(errorMessage);
  const statusCode = statusCodeMatch ? Number(statusCodeMatch[1]) : undefined;
  const modelNotFound = statusCode === 404;
  const fallbackAttemptConfigured = modelNotFound
    ? context.modelIndex < context.modelCount - 1
    : context.keyIndex < context.keyCount - 1 || context.modelIndex < context.modelCount - 1;

  failures.push(`${context.model}: ${errorMessage}`);
  logger.warn(context.message, {
    action: context.action,
    provider: 'gemini',
    model: context.model,
    label: context.label,
    requestId: context.requestId,
    statusCode,
    durationMs: context.durationMs,
    fallbackAttemptConfigured,
    error: errorMessage
  }, error);
  return modelNotFound;
};
