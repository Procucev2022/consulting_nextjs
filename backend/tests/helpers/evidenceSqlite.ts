/**
 * Test helper: an in-memory SQLite database that runs the production D1 schema, seeded with
 * evidence fixtures, plus a D1-shaped adapter and HS256 token issuing that matches workerAuth.
 */

import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync, type SQLInputValue, type StatementSync } from 'node:sqlite';
import type {
  CloudflareD1Database,
  CloudflareD1PreparedStatement,
  CloudflareEnvironment
} from '../../src/types/cloudflare';
import { seedTestTenantRegistry } from './tenantFixtures';

export const EVIDENCE_TEST_SECRET = 'evidence-test-secret-2026';
export const EVIDENCE_TEST_TENANT = 'TNT-TEST';

const BACKEND_ROOT = path.resolve(__dirname, '..', '..');

const wrapStatement = (statement: StatementSync, values: SQLInputValue[]): CloudflareD1PreparedStatement => ({
  bind: (...next: unknown[]): CloudflareD1PreparedStatement =>
    wrapStatement(statement, next as SQLInputValue[]),
  first: async <T = Record<string, unknown>>(): Promise<T | null> =>
    (statement.get(...values) as T | undefined) ?? null,
  all: async <T = Record<string, unknown>>(): Promise<{ results: T[] }> => ({
    results: statement.all(...values) as T[]
  }),
  run: async (): Promise<unknown> => statement.run(...values)
});

export const createSqliteD1 = (db: DatabaseSync): CloudflareD1Database => ({
  prepare: (sql: string): CloudflareD1PreparedStatement => wrapStatement(db.prepare(sql), [])
});

const insertRows = (db: DatabaseSync, sql: string, rows: SQLInputValue[][]): void => {
  const statement = db.prepare(sql);
  for (const row of rows) statement.run(...row);
};

const seedUsers = (db: DatabaseSync): void => {
  insertRows(db, 'INSERT INTO User (id, name, mobile_number, email, company_name, company_address, password_hash, role, status, subscription_tier, tenant_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
    ['usr-admin', 'Admin', '+910000000001', 'admin@procucev.com', 'Procucev', 'Bengaluru', 'hash', 'ADMIN', 'ACTIVE', 'GOLD', EVIDENCE_TEST_TENANT],
    ['usr-buyer', 'Buyer', '+910000000002', 'buyer@example.com', 'Alpha Textile', 'Pune', 'hash', 'USER', 'ACTIVE', 'BRONZE', EVIDENCE_TEST_TENANT],
    ['usr-other', 'Other', '+910000000003', 'other@example.com', 'Other Co', 'Delhi', 'hash', 'USER', 'ACTIVE', 'BRONZE', EVIDENCE_TEST_TENANT],
    ['usr-suspended', 'Suspended', '+910000000004', 'suspended@example.com', 'Susp Co', 'Mumbai', 'hash', 'USER', 'SUSPENDED', 'BRONZE', EVIDENCE_TEST_TENANT],
    ['usr-guest', 'Guest', '+910000000005', 'guest@example.com', 'Guest Co', 'Chennai', 'hash', 'GUEST', 'ACTIVE', 'BRONZE', EVIDENCE_TEST_TENANT]
  ]);
};

const seedAssessments = (db: DatabaseSync): void => {
  insertRows(db, 'INSERT INTO CustomerRecord (customer_id, customer_name, industry, contact_email, status, tenant_id) VALUES (?, ?, ?, ?, ?, ?)', [
    ['CUST-A', 'Alpha Textile', 'Textile', 'Buyer@Example.com', 'ACTIVE', EVIDENCE_TEST_TENANT],
    ['CUST-B', 'Beta Cement', 'Cement', null, 'ACTIVE', EVIDENCE_TEST_TENANT]
  ]);
  insertRows(db, 'INSERT INTO AssessmentRecord (assessment_id, customer_id, customer_name, industry, assessment_owner, total_spend_cr, validated_spend_cr, gross_opportunity_cr, overlap_deductions_cr, net_defensible_opportunity_cr, potential_savings_cr, savings_pct, status, tenant_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
    ['AIC-A', 'CUST-A', 'Alpha Textile', 'Textile', 'analyst@procucev.com', 7.5, 7.5, 3, 1, 2, 2, 26.6667, 'APPROVED', EVIDENCE_TEST_TENANT],
    ['AIC-B', 'CUST-B', 'Beta Cement', 'Cement', 'analyst@procucev.com', 6.5, 6.5, 3, 1, 2, 2, 30.7692, 'APPROVED', EVIDENCE_TEST_TENANT],
    ['AIC-C', 'CUST-A', 'Alpha Textile', 'Textile', 'analyst@procucev.com', 0, 0, null, null, null, null, null, 'DRAFT', EVIDENCE_TEST_TENANT],
    ['AIC-D', 'CUST-B', 'Beta Cement', 'Cement', 'analyst@procucev.com', 2, 2, null, null, null, null, null, 'DRAFT', EVIDENCE_TEST_TENANT]
  ]);
};

const seedVersionsAndRuns = (db: DatabaseSync): void => {
  insertRows(db, 'INSERT INTO AssessmentDataVersion (data_version_id, assessment_id, version_number, file_name, file_size, checksum, uploaded_by, uploaded_at, record_count, is_superseded) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
    ['DV-A1', 'AIC-A', 1, 'alpha-v1.xlsx', 1000, 'sum-1', 'analyst@procucev.com', '2026-01-01T00:00:00Z', 4, 1],
    ['DV-A2', 'AIC-A', 2, 'alpha-v2.xlsx', 2000, 'sum-2', 'analyst@procucev.com', '2026-02-01T00:00:00Z', 5, 0],
    ['DV-B1', 'AIC-B', 1, 'beta-v1.xlsx', 900, 'sum-b', 'analyst@procucev.com', '2026-01-15T00:00:00Z', 2, 0]
  ]);
  insertRows(db, 'INSERT INTO AssessmentAnalysisRun (analysis_run_id, assessment_id, data_version_id, status, total_spend_cr, validated_spend_cr, gross_opportunity_cr, overlap_deductions_cr, net_defensible_opportunity_cr, potential_savings_cr, savings_pct, all_gates_passed, is_approved, is_superseded, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
    ['RUN-A1', 'AIC-A', 'DV-A1', 'COMPLETED', 7.0, 7.0, 2.5, 0.5, 2, 2, 28.5714, 1, 1, 1, '2026-01-01T00:00:00Z'],
    ['RUN-A2', 'AIC-A', 'DV-A2', 'COMPLETED', 7.5, 7.5, 3, 1, 2, 2, 26.6667, 1, 1, 0, '2026-02-01T00:00:00Z'],
    ['RUN-B1', 'AIC-B', 'DV-B1', 'COMPLETED', 6, 6, 3, 1, 1.5, 1.5, 25, 0, 1, 0, '2026-01-15T00:00:00Z']
  ]);
};

const seedLedger = (db: DatabaseSync): void => {
  const sql = 'INSERT INTO ProcurementTransaction (transaction_id, tenant_id, assessment_id, source_row_number, po_number, po_line, document_date_raw, supplier_name, material_code, short_text, material_group, plant, order_quantity, order_unit, net_price, currency, total_inr_raw, total_in_cr_raw, raw_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  const row = (id: string, assessment: string | null, sourceRow: number, supplier: string, group: string, plant: string | null, crore: number): SQLInputValue[] =>
    [id, EVIDENCE_TEST_TENANT, assessment, sourceRow, 'PO-1', '1', '2023-01-01', supplier, 'MAT-1', 'Item', group, plant, 10, 'EA', 100, 'INR', crore * 10000000, crore, '{"recordId":"' + id + '"}'];
  insertRows(db, sql, [
    row('TX-A1', 'AIC-A', 1, 'Alpha Chem', 'G1', 'P1', 1.5),
    row('TX-A2', 'AIC-A', 2, 'Alpha Chem', 'G2', 'P2', 2.5),
    row('TX-A3', 'AIC-A', 3, 'Beta Metals', 'G1', 'P1', 3),
    row('TX-A4', 'AIC-A', 4, '   ', 'G3', null, 0.5),
    row('TX-B1', 'AIC-B', 1, 'Gamma Steel', 'G1', 'P9', 4),
    row('TX-B2', 'AIC-B', 2, 'Gamma Steel', 'G2', 'P9', 2),
    row('TX-D1', 'AIC-D', 1, 'Delta Corp', 'G1', 'P1', 1),
    row('TX-LEGACY', null, 1, 'Legacy Supplier', 'G9', 'P0', 100)
  ]);
};

export interface EvidenceDatabaseFixture {
  db: DatabaseSync;
  d1: CloudflareD1Database;
  close: () => void;
}

export const createEvidenceDatabase = (): EvidenceDatabaseFixture => {
  const db = new DatabaseSync(':memory:');
  db.exec(fs.readFileSync(path.join(BACKEND_ROOT, 'd1-schema.sql'), 'utf8'));
  db.exec(
    `INSERT OR IGNORE INTO TenantMaster (tenant_id, enterprise_name) VALUES ('${EVIDENCE_TEST_TENANT}', 'Test Enterprise');`
  );
  seedTestTenantRegistry(db);
  seedUsers(db);
  seedAssessments(db);
  seedVersionsAndRuns(db);
  seedLedger(db);
  return { db, d1: createSqliteD1(db), close: () => db.close() };
};

const base64Url = (bytes: Uint8Array): string =>
  Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');

export const issueEvidenceToken = async (payload: Record<string, unknown>, secret = EVIDENCE_TEST_SECRET): Promise<string> => {
  const encoder = new TextEncoder();
  const header = base64Url(encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = base64Url(encoder.encode(JSON.stringify({ exp: Date.now() + 60_000, ...payload })));
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`${header}.${body}`));
  return `${header}.${body}.${base64Url(new Uint8Array(signature))}`;
};

export const tokenFor = (userId: string, role = 'USER'): Promise<string> => issueEvidenceToken({ userId, role });

export const testEnvironment = (d1: CloudflareD1Database | undefined): CloudflareEnvironment => ({
  DB: d1,
  AUTH_SECRET: EVIDENCE_TEST_SECRET,
  REQUEST_TENANT_ID: EVIDENCE_TEST_TENANT
});
