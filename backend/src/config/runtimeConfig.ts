import { ENVIRONMENT_VARIABLES } from '../constants/environment';
import type { CloudflareEnvironment } from '../types/cloudflare';
import type { GeminiRuntimeConfig, WorkerRuntimeConfig } from '../types/runtimeConfig';

type EnvironmentValue = string | number | undefined;

const requireValue = (value: EnvironmentValue, key: string): string => {
  const cleanValue = value === undefined ? undefined : String(value).trim();
  if (!cleanValue) {
    throw new Error(`${key} must be configured in the deployment environment`);
  }
  return cleanValue;
};

const parseList = (value: EnvironmentValue): string[] =>
  (value === undefined ? '' : String(value)).split(',').map((item) => item.trim()).filter(Boolean);

const parsePositiveNumber = (value: EnvironmentValue, key: string): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${key} must be a positive number in the deployment environment`);
  }
  return parsed;
};

const resolveGeminiConfig = (environment: CloudflareEnvironment): GeminiRuntimeConfig => ({
  apiKey: environment.GEMINI_API_KEY?.trim() || undefined,
  backupKeys: parseList(environment.GEMINI_BACKUP_KEYS),
  baseUrl: requireValue(environment.GEMINI_BASE_URL, ENVIRONMENT_VARIABLES.GEMINI_BASE_URL),
  primaryModel: requireValue(environment.GEMINI_PRIMARY_MODEL, ENVIRONMENT_VARIABLES.GEMINI_PRIMARY_MODEL),
  fallbackModels: parseList(environment.GEMINI_FALLBACK_MODELS),
  requestTimeoutMs: parsePositiveNumber(
    environment.GEMINI_REQUEST_TIMEOUT_MS,
    ENVIRONMENT_VARIABLES.GEMINI_REQUEST_TIMEOUT_MS
  ),
  totalBudgetMs: parsePositiveNumber(
    environment.GEMINI_TOTAL_BUDGET_MS,
    ENVIRONMENT_VARIABLES.GEMINI_TOTAL_BUDGET_MS
  ),
  minAttemptMs: parsePositiveNumber(environment.GEMINI_MIN_ATTEMPT_MS, ENVIRONMENT_VARIABLES.GEMINI_MIN_ATTEMPT_MS),
  maxDocumentBytes: parsePositiveNumber(
    environment.GEMINI_MAX_DOCUMENT_BYTES,
    ENVIRONMENT_VARIABLES.GEMINI_MAX_DOCUMENT_BYTES
  ),
  maxDocumentTextChars: parsePositiveNumber(
    environment.GEMINI_MAX_DOCUMENT_TEXT_CHARS,
    ENVIRONMENT_VARIABLES.GEMINI_MAX_DOCUMENT_TEXT_CHARS
  )
});

export const resolveWorkerRuntimeConfig = (environment: CloudflareEnvironment): WorkerRuntimeConfig => ({
  authSecret: requireValue(environment.AUTH_SECRET, ENVIRONMENT_VARIABLES.AUTH_SECRET),
  appEncryptionKey: requireValue(environment.APP_ENCRYPTION_KEY, ENVIRONMENT_VARIABLES.APP_ENCRYPTION_KEY),
  frontendUrl: environment.FRONTEND_URL?.trim() || undefined,
  appUrl: environment.NEXT_PUBLIC_APP_URL?.trim() || undefined,
  r2Bucket: environment.R2_BUCKET?.trim() || undefined,
  d1DatabaseName: environment.D1_DATABASE_NAME?.trim() || undefined,
  adminEmail: environment.ADMIN_EMAIL?.trim() || undefined,
  adminMobile: environment.ADMIN_MOBILE?.trim() || undefined,
  gemini: resolveGeminiConfig(environment)
});
