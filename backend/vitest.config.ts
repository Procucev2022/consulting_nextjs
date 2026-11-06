import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    globalSetup: ['./tests/setupD1.mjs'],
    pool: 'forks',
    maxWorkers: 1,
    isolate: true,
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 30000,
    env: {
      D1_LOCAL_SQLITE_PATH: path.resolve(__dirname, `scratch/test-d1-${process.pid}.sqlite`),
      APP_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef',
      AUTH_SECRET: 'a1b2c3d4e5f60718293a4b5c6d7e8f90_procucev_secret_key_2026',
      ADMIN_MOBILE: '+919876543210',
      ADMIN_EMAIL: 'admin@procucev.com',
      GEMINI_BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models',
      GEMINI_PRIMARY_MODEL: 'gemini-3.5-flash',
      GEMINI_FALLBACK_MODELS: 'gemini-flash-latest,gemini-3.5-flash-lite',
      GEMINI_REQUEST_TIMEOUT_MS: '20000',
      GEMINI_TOTAL_BUDGET_MS: '45000',
      GEMINI_MIN_ATTEMPT_MS: '3000',
      GEMINI_MAX_DOCUMENT_BYTES: '10485760',
      GEMINI_MAX_DOCUMENT_TEXT_CHARS: '120000'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/types/**'
      ],
      thresholds: {
        lines: 90,
        statements: 90,
        branches: 90,
        functions: 90,
        perFile: true,
        autoUpdate: false
      }
    }
  }
});
