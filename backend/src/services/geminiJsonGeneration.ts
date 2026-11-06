import { AI_LOG_ACTIONS, AI_LOG_MESSAGES, EXTRACTION_STATUS } from '../constants/ai';
import type {
  GeminiInputValidationResult,
  GeminiJsonGenerationDependencies,
  GeminiJsonGenerationInput,
  GeminiJsonGenerationResult
} from '../types/ai';
import logger from '../utils/logger';
import { logGeminiProviderAttemptFailure } from './geminiProviderLogging';

const invalidGenerationInput = <T>(
  input: GeminiJsonGenerationInput,
  dependencies: GeminiJsonGenerationDependencies
): GeminiJsonGenerationResult<T> | null => {
  const label = input.label || 'generation';
  if (!dependencies.isConfigured()) {
    logger.warn(`Gemini ${label} skipped: GEMINI_API_KEY is not set`, { label }, new Error('Gemini key missing'));
    return { status: EXTRACTION_STATUS.NOT_CONFIGURED, data: null, model: null, error: 'GEMINI_API_KEY not set' };
  }
  if (typeof input.prompt !== 'string' || input.prompt.trim() === '') {
    return { status: EXTRACTION_STATUS.NO_CONTENT, data: null, model: null, error: 'Prompt is empty' };
  }
  if (input.inlineData !== undefined) {
    const validation: GeminiInputValidationResult = dependencies.validateExtractionInput({
      inlineData: input.inlineData,
      mimeType: input.mimeType
    });
    if (!validation.isValid) {
      return {
        status: validation.errorStatus || EXTRACTION_STATUS.AI_FAILED,
        data: null,
        model: null,
        error: validation.errorMessage || 'Invalid inline document data'
      };
    }
  }
  return null;
};

export const generateGeminiJson = async <T = unknown>(
  input: GeminiJsonGenerationInput,
  dependencies: GeminiJsonGenerationDependencies
): Promise<GeminiJsonGenerationResult<T>> => {
  const invalidInput = invalidGenerationInput<T>(input, dependencies);
  if (invalidInput) return invalidInput;

  const label = input.label || 'generation';
  const requestBody = dependencies.buildRequestBody({
    promptText: input.prompt,
    documentText: input.documentText,
    inlineData: input.inlineData,
    mimeType: input.mimeType,
    fileName: input.fileName
  });
  const failures: string[] = [];
  const deadline = Date.now() + dependencies.config.TOTAL_BUDGET_MS;
  const models = dependencies.resolveModelChain();
  const keys = dependencies.resolveKeyChain();
  for (let modelIndex = 0; modelIndex < models.length; modelIndex += 1) {
    const model = models[modelIndex];
    for (let keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
      const apiKey = keys[keyIndex];
      const remainingMs = deadline - Date.now();
      if (remainingMs < dependencies.config.MIN_ATTEMPT_MS) break;
      const attemptStartedAt = Date.now();
      try {
        const data = await dependencies.callModel<T>(
          model,
          requestBody,
          Math.min(dependencies.config.REQUEST_TIMEOUT_MS, remainingMs),
          apiKey
        );
        logger.info(AI_LOG_MESSAGES.jsonGenerationSucceeded, {
          action: AI_LOG_ACTIONS.jsonGenerationSucceeded,
          provider: 'gemini',
          model,
          label,
          requestId: input.requestId,
          durationMs: Date.now() - attemptStartedAt
        });
        return { status: EXTRACTION_STATUS.SUCCESS, data, model, error: null };
      } catch (error: unknown) {
        const modelNotFound = logGeminiProviderAttemptFailure(error, {
          model,
          modelIndex,
          keyIndex,
          modelCount: models.length,
          keyCount: keys.length,
          requestId: input.requestId,
          durationMs: Date.now() - attemptStartedAt,
          action: AI_LOG_ACTIONS.jsonGenerationAttempt,
          message: AI_LOG_MESSAGES.jsonGenerationAttemptFailed,
          label
        }, failures);
        if (modelNotFound) break;
      }
    }
  }
  return { status: EXTRACTION_STATUS.AI_FAILED, data: null, model: null, error: failures.join(' | ') };
};
