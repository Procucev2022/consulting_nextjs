/**
 * Test helper: an in-memory SQLite database that runs the production D1 schema (d1-schema.sql), so
 * Worker SQL is validated against the real table definitions. Also builds a complete runtime
 * environment object because the Worker reads configuration from the environment it is given.
 */

import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { createSqliteD1 } from './evidenceSqlite';
import { seedTestTenantRegistry } from './tenantFixtures';
import type { CloudflareD1Database, CloudflareEnvironment } from '../../src/types/cloudflare';

const BACKEND_ROOT = path.resolve(__dirname, '..', '..');

export const WORKER_CORE_SECRET = 'worker-core-test-secret-2026';
export const WORKER_CORE_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef';

export interface WorkerDatabaseFixture {
  db: DatabaseSync;
  d1: CloudflareD1Database;
  close: () => void;
}

export const createWorkerDatabase = (): WorkerDatabaseFixture => {
  const db = new DatabaseSync(':memory:');
  db.exec(fs.readFileSync(path.join(BACKEND_ROOT, 'd1-schema.sql'), 'utf8'));
  seedTestTenantRegistry(db);
  return { db, d1: createSqliteD1(db), close: () => db.close() };
};

export const insertRows = (db: DatabaseSync, sql: string, rows: SQLInputValue[][]): void => {
  const statement = db.prepare(sql);
  for (const row of rows) statement.run(...row);
};

export const runtimeEnvironment = (overrides: CloudflareEnvironment = {}): CloudflareEnvironment => ({
  AUTH_SECRET: WORKER_CORE_SECRET,
  APP_ENCRYPTION_KEY: WORKER_CORE_ENCRYPTION_KEY,
  GEMINI_BASE_URL: 'https://gemini.example.test/v1beta/models',
  GEMINI_PRIMARY_MODEL: 'gemini-test-primary',
  GEMINI_FALLBACK_MODELS: 'gemini-test-fallback',
  GEMINI_REQUEST_TIMEOUT_MS: 1000,
  GEMINI_TOTAL_BUDGET_MS: 2000,
  GEMINI_MIN_ATTEMPT_MS: 100,
  GEMINI_MAX_DOCUMENT_BYTES: 1024,
  GEMINI_MAX_DOCUMENT_TEXT_CHARS: 1000,
  ...overrides
});
