import { describe, expect, it } from 'vitest';
import { resolveWorkerRuntimeConfig } from '../../src/config/runtimeConfig';
import { ENVIRONMENT_VARIABLES } from '../../src/constants/environment';
import type { CloudflareEnvironment } from '../../src/types/cloudflare';

const completeEnvironment = (): CloudflareEnvironment => ({
  AUTH_SECRET: 'auth-secret-value',
  APP_ENCRYPTION_KEY: 'encryption-key-value',
  FRONTEND_URL: 'https://app.example.com',
  NEXT_PUBLIC_APP_URL: 'https://www.example.com',
  R2_BUCKET: 'consulting-objects',
  D1_DATABASE_NAME: 'consulting-d1',
  ADMIN_EMAIL: 'admin@example.com',
  ADMIN_MOBILE: '+910000000000',
  GEMINI_API_KEY: 'primary-key',
  GEMINI_BACKUP_KEYS: 'backup-one, backup-two',
  GEMINI_BASE_URL: 'https://gemini.example.test/v1beta/models',
  GEMINI_PRIMARY_MODEL: 'gemini-primary',
  GEMINI_FALLBACK_MODELS: 'fallback-a,fallback-b',
  GEMINI_REQUEST_TIMEOUT_MS: '20000',
  GEMINI_TOTAL_BUDGET_MS: '45000',
  GEMINI_MIN_ATTEMPT_MS: '3000',
  GEMINI_MAX_DOCUMENT_BYTES: '10485760',
  GEMINI_MAX_DOCUMENT_TEXT_CHARS: '120000'
});

type NumericOverride = (value: string | undefined) => Partial<CloudflareEnvironment>;

const NUMERIC_SETTINGS: Array<[string, NumericOverride]> = [
  [ENVIRONMENT_VARIABLES.GEMINI_REQUEST_TIMEOUT_MS, (value) => ({ GEMINI_REQUEST_TIMEOUT_MS: value })],
  [ENVIRONMENT_VARIABLES.GEMINI_TOTAL_BUDGET_MS, (value) => ({ GEMINI_TOTAL_BUDGET_MS: value })],
  [ENVIRONMENT_VARIABLES.GEMINI_MIN_ATTEMPT_MS, (value) => ({ GEMINI_MIN_ATTEMPT_MS: value })],
  [ENVIRONMENT_VARIABLES.GEMINI_MAX_DOCUMENT_BYTES, (value) => ({ GEMINI_MAX_DOCUMENT_BYTES: value })],
  [ENVIRONMENT_VARIABLES.GEMINI_MAX_DOCUMENT_TEXT_CHARS, (value) => ({ GEMINI_MAX_DOCUMENT_TEXT_CHARS: value })]
];

const INVALID_NUMBERS: Array<string | undefined> = [undefined, '', '   ', 'abc', '0', '-5', 'Infinity'];

const REQUIRED_SETTINGS: Array<[string, Partial<CloudflareEnvironment>]> = [
  [ENVIRONMENT_VARIABLES.AUTH_SECRET, { AUTH_SECRET: undefined }],
  [ENVIRONMENT_VARIABLES.APP_ENCRYPTION_KEY, { APP_ENCRYPTION_KEY: '   ' }],
  [ENVIRONMENT_VARIABLES.GEMINI_BASE_URL, { GEMINI_BASE_URL: undefined }],
  [ENVIRONMENT_VARIABLES.GEMINI_PRIMARY_MODEL, { GEMINI_PRIMARY_MODEL: '' }]
];

describe('resolveWorkerRuntimeConfig', () => {
  it('maps a complete environment into worker and Gemini settings', () => {
    expect(resolveWorkerRuntimeConfig(completeEnvironment())).toEqual({
      authSecret: 'auth-secret-value',
      appEncryptionKey: 'encryption-key-value',
      frontendUrl: 'https://app.example.com',
      appUrl: 'https://www.example.com',
      r2Bucket: 'consulting-objects',
      d1DatabaseName: 'consulting-d1',
      adminEmail: 'admin@example.com',
      adminMobile: '+910000000000',
      gemini: {
        apiKey: 'primary-key',
        backupKeys: ['backup-one', 'backup-two'],
        baseUrl: 'https://gemini.example.test/v1beta/models',
        primaryModel: 'gemini-primary',
        fallbackModels: ['fallback-a', 'fallback-b'],
        requestTimeoutMs: 20000,
        totalBudgetMs: 45000,
        minAttemptMs: 3000,
        maxDocumentBytes: 10485760,
        maxDocumentTextChars: 120000
      }
    });
  });

  it('trims surrounding whitespace from configured strings', () => {
    const config = resolveWorkerRuntimeConfig({
      ...completeEnvironment(),
      AUTH_SECRET: '  auth-secret-value \n',
      FRONTEND_URL: '  https://app.example.com  ',
      GEMINI_API_KEY: '  primary-key  ',
      GEMINI_PRIMARY_MODEL: ' gemini-primary '
    });

    expect(config.authSecret).toBe('auth-secret-value');
    expect(config.frontendUrl).toBe('https://app.example.com');
    expect(config.gemini.apiKey).toBe('primary-key');
    expect(config.gemini.primaryModel).toBe('gemini-primary');
  });

  it('leaves optional settings undefined and lists empty when they are absent or blank', () => {
    const config = resolveWorkerRuntimeConfig({
      AUTH_SECRET: 'auth-secret-value',
      APP_ENCRYPTION_KEY: 'encryption-key-value',
      NEXT_PUBLIC_APP_URL: '   ',
      R2_BUCKET: '',
      D1_DATABASE_NAME: '\t',
      ADMIN_EMAIL: '  ',
      ADMIN_MOBILE: '',
      GEMINI_API_KEY: '   ',
      GEMINI_BASE_URL: 'https://gemini.example.test/v1beta/models',
      GEMINI_PRIMARY_MODEL: 'gemini-primary',
      GEMINI_REQUEST_TIMEOUT_MS: '20000',
      GEMINI_TOTAL_BUDGET_MS: '45000',
      GEMINI_MIN_ATTEMPT_MS: '3000',
      GEMINI_MAX_DOCUMENT_BYTES: '10485760',
      GEMINI_MAX_DOCUMENT_TEXT_CHARS: '120000'
    });

    expect(config.frontendUrl).toBeUndefined();
    expect(config.appUrl).toBeUndefined();
    expect(config.r2Bucket).toBeUndefined();
    expect(config.d1DatabaseName).toBeUndefined();
    expect(config.adminEmail).toBeUndefined();
    expect(config.adminMobile).toBeUndefined();
    expect(config.gemini.apiKey).toBeUndefined();
    expect(config.gemini.backupKeys).toEqual([]);
    expect(config.gemini.fallbackModels).toEqual([]);
  });

  it('splits comma-separated lists and drops blank entries', () => {
    const config = resolveWorkerRuntimeConfig({
      ...completeEnvironment(),
      GEMINI_BACKUP_KEYS: ' key-a , ,key-b,  ',
      GEMINI_FALLBACK_MODELS: ' , '
    });

    expect(config.gemini.backupKeys).toEqual(['key-a', 'key-b']);
    expect(config.gemini.fallbackModels).toEqual([]);
  });

  it('accepts numeric budgets given as numbers or as padded decimal strings', () => {
    const config = resolveWorkerRuntimeConfig({
      ...completeEnvironment(),
      GEMINI_REQUEST_TIMEOUT_MS: 15000,
      GEMINI_TOTAL_BUDGET_MS: ' 45000.5 ',
      GEMINI_MIN_ATTEMPT_MS: 1
    });

    expect(config.gemini.requestTimeoutMs).toBe(15000);
    expect(config.gemini.totalBudgetMs).toBe(45000.5);
    expect(config.gemini.minAttemptMs).toBe(1);
  });

  it.each(REQUIRED_SETTINGS)('rejects a missing or blank %s', (key, override) => {
    expect(() => resolveWorkerRuntimeConfig({ ...completeEnvironment(), ...override })).toThrow(
      `${key} must be configured in the deployment environment`
    );
  });

  it.each(NUMERIC_SETTINGS)('rejects an invalid or missing %s', (key, buildOverride) => {
    for (const value of INVALID_NUMBERS) {
      expect(
        () => resolveWorkerRuntimeConfig({ ...completeEnvironment(), ...buildOverride(value) }),
        `value ${String(value)}`
      ).toThrow(`${key} must be a positive number in the deployment environment`);
    }
  });
});
