import { EXTRACTION_STATUS } from '../constants/ai';
import type {
  GeminiInputValidationResult,
  GeminiJsonGenerationDependencies,
  GeminiJsonGenerationInput,
  GeminiJsonGenerationResult
} from '../types/ai';
import logger from '../utils/logger';

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
  for (const model of dependencies.resolveModelChain()) {
    for (const apiKey of dependencies.resolveKeyChain()) {
      const remainingMs = deadline - Date.now();
      if (remainingMs < dependencies.config.MIN_ATTEMPT_MS) break;
      try {
        const data = await dependencies.callModel<T>(
          model,
          requestBody,
          Math.min(dependencies.config.REQUEST_TIMEOUT_MS, remainingMs),
          apiKey
        );
        logger.info(`Gemini ${model} completed ${label} successfully`, { model, label });
        return { status: EXTRACTION_STATUS.SUCCESS, data, model, error: null };
      } catch (error: unknown) {
        const failure = error as Error;
        failures.push(`${model}: ${failure.message}`);
        logger.warn(`Gemini ${label} attempt failed on ${model}`, { error: failure.message });
        if (failure.message.includes('404')) break;
      }
    }
  }
  return { status: EXTRACTION_STATUS.AI_FAILED, data: null, model: null, error: failures.join(' | ') };
};
