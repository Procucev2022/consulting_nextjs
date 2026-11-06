import { AI_LOG_ACTIONS, AI_LOG_MESSAGES, GEMINI_PROVIDER_STATUS_CODE_PATTERN } from '../constants/ai';
import type { GeminiExtractionAttemptFailureContext } from '../types/ai';
import logger from '../utils/logger';

export const logGeminiExtractionAttemptFailure = (
  error: unknown,
  context: GeminiExtractionAttemptFailureContext,
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
  logger.warn(AI_LOG_MESSAGES.extractionAttemptFailed, {
    action: AI_LOG_ACTIONS.extractionAttempt,
    provider: 'gemini',
    model: context.model,
    requestId: context.requestId,
    statusCode,
    durationMs: context.durationMs,
    fallbackAttemptConfigured,
    error: errorMessage
  }, error);
  return modelNotFound;
};
