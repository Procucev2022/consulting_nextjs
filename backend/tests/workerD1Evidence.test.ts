/**
 * End-to-end tests for the Evidence API routes. Requests run through handleEvidenceRoute against an
 * in-memory SQLite database that uses the production D1 schema and seeded evidence fixtures.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { EVIDENCE_ERROR_CATEGORIES, EVIDENCE_MESSAGES } from '../src/constants/evidenceMessages';
import { EVIDENCE_PACKAGE_MIME_TYPE, EVIDENCE_WORKBOOK_MIME_TYPE, EVIDENCE_SHEET_NAMES, EVIDENCE_WORKBOOK_SHEETS } from '../src/constants/evidenceWorkbook';
import type { CloudflareEnvironment } from '../src/types/cloudflare';
import { handleEvidenceRoute } from '../src/workerD1Evidence';
import {
  createEvidenceDatabase,
  EVIDENCE_TEST_SECRET,
  issueEvidenceToken,
  testEnvironment,
  tokenFor,
  type EvidenceDatabaseFixture
} from './helpers/evidenceSqlite';
import { crcMatches, readStoredZip } from './helpers/storedZip';

const JOB_READY = 'AIC-A';
const JOB_NO_LEDGER = 'AIC-C';
const JOB_LEDGER_ONLY = 'AIC-D';
const JOB_MISMATCH = 'AIC-B';

interface CallOptions {
  token?: string | null;
  method?: string;
  env?: CloudflareEnvironment;
  headers?: Record<string, string>;
}

let fixture: EvidenceDatabaseFixture;
let adminToken = '';
let buyerToken = '';
let otherToken = '';

const call = async (path: string, options: CallOptions = {}): Promise<Response> => {
  const headers = new Headers(options.headers ?? {});
  if (options.token) headers.set('Authorization', `Bearer ${options.token}`);
  const url = new URL(`https://consulting.edge${path}`);
  const request = new Request(url, { method: options.method ?? 'GET', headers });
  const response = await handleEvidenceRoute(request, options.env ?? testEnvironment(fixture.d1), url);
  return response as Response;
};

const callJson = async (path: string, options: CallOptions = {}): Promise<{ status: number; body: Record<string, unknown> }> => {
  const response = await call(path, options);
  return { status: response.status, body: (await response.json()) as Record<string, unknown> };
};

const sheetNamesOf = (bytes: ArrayBuffer): string[] => XLSX.read(new Uint8Array(bytes), { type: 'array' }).SheetNames;

beforeAll(async () => {
  fixture = createEvidenceDatabase();
  adminToken = await tokenFor('usr-admin', 'ADMIN');
  buyerToken = await tokenFor('usr-buyer');
  otherToken = await tokenFor('usr-other');
});

afterAll(() => {
  fixture.close();
});

describe('Evidence routing and authentication', () => {
  it('answers unknown evidence paths with a JSON 404 that names the category', async () => {
    const { status, body } = await callJson('/api/evidence/unknown', { token: adminToken });
    expect(status).toBe(404);
    expect(body).toMatchObject({ success: false, message: EVIDENCE_MESSAGES.routeNotFound, errorCategory: EVIDENCE_ERROR_CATEGORIES.NOT_FOUND });
  });

  it('rejects non-GET methods with 405 JSON', async () => {
    const { status, body } = await callJson(`/api/evidence/jobs/${JOB_READY}/inventory`, { token: adminToken, method: 'POST' });
    expect(status).toBe(405);
    expect(body.message).toBe(EVIDENCE_MESSAGES.methodNotAllowed);
  });

  it('requires a Bearer token and ignores client-sent role headers', async () => {
    const missing = await callJson(`/api/evidence/jobs/${JOB_READY}/inventory`);
    expect(missing.status).toBe(401);
    expect(missing.body.message).toBe(EVIDENCE_MESSAGES.missingBearerToken);

    const spoofed = await callJson(`/api/evidence/jobs/${JOB_READY}/inventory`, {
      token: otherToken,
      headers: { 'x-user-role': 'ADMIN', 'x-user-id': 'usr-admin', 'x-tenant-id': 'TNT-TEST' }
    });
    expect(spoofed.status).toBe(403);
    expect(spoofed.body.message).toBe(EVIDENCE_MESSAGES.accessDenied(JOB_READY));
  });

  it('rejects malformed tokens with 401 instead of a server error', async () => {
    const { status, body } = await callJson(`/api/evidence/jobs/${JOB_READY}/inventory`, { token: 'a.b.c' });
    expect(status).toBe(401);
    expect(body.message).toBe(EVIDENCE_MESSAGES.invalidToken);
  });

  it('rejects a token signed with another secret', async () => {
    const forged = await issueEvidenceToken({ userId: 'usr-admin', role: 'ADMIN' }, 'other-secret');
    const { status } = await callJson(`/api/evidence/jobs/${JOB_READY}/inventory`, { token: forged });
    expect(status).toBe(401);
  });

  it('rejects a token without a userId claim', async () => {
    const token = await issueEvidenceToken({ role: 'ADMIN' });
    const { status, body } = await callJson(`/api/evidence/jobs/${JOB_READY}/inventory`, { token });
    expect(status).toBe(401);
    expect(body.message).toBe(EVIDENCE_MESSAGES.invalidToken);
  });

  it('rejects a token for an account that no longer exists', async () => {
    const token = await tokenFor('usr-deleted');
    const { status, body } = await callJson(`/api/evidence/jobs/${JOB_READY}/inventory`, { token });
    expect(status).toBe(401);
    expect(body.message).toBe(EVIDENCE_MESSAGES.userNotFound);
  });

  it('blocks suspended accounts with 403', async () => {
    const token = await tokenFor('usr-suspended');
    const { status, body } = await callJson(`/api/evidence/jobs/${JOB_READY}/inventory`, { token });
    expect(status).toBe(403);
    expect(body.message).toBe(EVIDENCE_MESSAGES.accountInactive('SUSPENDED'));
  });

  it('blocks roles that are not ADMIN or USER', async () => {
    const token = await tokenFor('usr-guest');
    const { status, body } = await callJson(`/api/evidence/jobs/${JOB_READY}/inventory`, { token });
    expect(status).toBe(403);
    expect(body.message).toBe(EVIDENCE_MESSAGES.unsupportedRole('GUEST'));
  });

  it('returns 503 when the D1 binding or AUTH_SECRET is missing', async () => {
    const noDb = await callJson(`/api/evidence/jobs/${JOB_READY}/inventory`, { token: adminToken, env: { AUTH_SECRET: EVIDENCE_TEST_SECRET } });
    expect(noDb.status).toBe(503);
    expect(noDb.body.message).toBe(EVIDENCE_MESSAGES.databaseNotConfigured);

    const noSecret = await callJson(`/api/evidence/jobs/${JOB_READY}/inventory`, { token: adminToken, env: { DB: fixture.d1 } });
    expect(noSecret.status).toBe(503);
    expect(noSecret.body.message).toBe(EVIDENCE_MESSAGES.authSecretNotConfigured);
  });

  it('turns unexpected D1 failures into a 500 with a request ID and no internal detail', async () => {
    const failingDb = { prepare: (): never => { throw new Error('connection reset by peer'); } };
    const env = testEnvironment(failingDb as unknown as typeof fixture.d1);
    const { status, body } = await callJson(`/api/evidence/jobs/${JOB_READY}/inventory`, {
      token: adminToken,
      env,
      headers: { 'x-request-id': 'req-test-001' }
    });
    expect(status).toBe(500);
    expect(body.errorCategory).toBe(EVIDENCE_ERROR_CATEGORIES.SERVER);
    expect(body.requestId).toBe('req-test-001');
    expect(body.message).toBe(EVIDENCE_MESSAGES.serverError('req-test-001'));
    expect(String(body.message)).not.toContain('connection reset');
  });

  it('echoes a valid x-request-id and generates one when the header is invalid', async () => {
    const echoed = await call(`/api/evidence/jobs/${JOB_READY}/inventory`, { token: adminToken, headers: { 'x-request-id': 'abc-123' } });
    expect(echoed.headers.get('X-Request-Id')).toBe('abc-123');

    const generated = await call(`/api/evidence/jobs/${JOB_READY}/inventory`, { token: adminToken, headers: { 'x-request-id': 'bad id with spaces' } });
    expect(generated.headers.get('X-Request-Id')).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('Evidence input validation', () => {
  it('rejects invalid job IDs with 400 and structured issues', async () => {
    const { status, body } = await callJson('/api/evidence/jobs/%2e%2e%2Fsecret/inventory', { token: adminToken });
    expect(status).toBe(400);
    expect(body).toMatchObject({ success: false, message: EVIDENCE_MESSAGES.validationFailed, errorCategory: EVIDENCE_ERROR_CATEGORIES.VALIDATION });
    expect(Array.isArray(body.errors)).toBe(true);
  });

  it('rejects an unknown workbookType query value on parity', async () => {
    const { status, body } = await callJson(`/api/evidence/jobs/${JOB_READY}/parity?workbookType=NOT_A_TYPE`, { token: adminToken });
    expect(status).toBe(400);
    expect(body.message).toBe(EVIDENCE_MESSAGES.validationFailed);
  });

  it('rejects an unknown workbook type and an unknown savings type in path segments', async () => {
    const workbook = await callJson(`/api/evidence/jobs/${JOB_READY}/workbooks/BOGUS/download`, { token: adminToken });
    expect(workbook.status).toBe(400);
    const savings = await callJson(`/api/evidence/jobs/${JOB_READY}/savings/BOGUS/inventory`, { token: adminToken });
    expect(savings.status).toBe(400);
  });
});

describe('Evidence job scope', () => {
  it('lets an admin read any job, including one with no records', async () => {
    const { status, body } = await callJson(`/api/evidence/jobs/${JOB_NO_LEDGER}/inventory`, { token: adminToken });
    expect(status).toBe(200);
    expect(body.jobId).toBe(JOB_NO_LEDGER);
  });

  it('lets a customer read a job whose customer contact email matches, case-insensitively', async () => {
    const { status } = await callJson(`/api/evidence/jobs/${JOB_READY}/inventory`, { token: buyerToken });
    expect(status).toBe(200);
  });

  it('denies a customer any job not linked to the account, including unknown job IDs', async () => {
    const otherCustomer = await callJson(`/api/evidence/jobs/${JOB_MISMATCH}/inventory`, { token: buyerToken });
    expect(otherCustomer.status).toBe(403);
    const unknown = await callJson('/api/evidence/jobs/AIC-NOPE/inventory', { token: buyerToken });
    expect(unknown.status).toBe(403);
    expect(unknown.body.message).toBe(EVIDENCE_MESSAGES.accessDenied('AIC-NOPE'));
  });

  it('returns 404 to an admin for a job that does not exist', async () => {
    const { status, body } = await callJson('/api/evidence/jobs/AIC-NOPE/inventory', { token: adminToken });
    expect(status).toBe(404);
    expect(body.errorCategory).toBe(EVIDENCE_ERROR_CATEGORIES.NOT_FOUND);
    expect(body.message).toBe(EVIDENCE_MESSAGES.jobNotFound('AIC-NOPE'));
  });

  it('returns 503 when the resolved tenant has no TenantMaster row', async () => {
    const { status, body } = await callJson(`/api/evidence/jobs/${JOB_READY}/inventory`, {
      token: adminToken,
      env: { ...testEnvironment(fixture.d1), REQUEST_TENANT_ID: 'TNT-UNKNOWN' }
    });
    expect(status).toBe(503);
    expect(body.message).toBe(EVIDENCE_MESSAGES.tenantMissing);
  });

  it('requires trusted tenant scope even when authentication succeeds', async () => {
    const { status, body } = await callJson(`/api/evidence/jobs/${JOB_READY}/inventory`, {
      token: adminToken,
      env: { ...testEnvironment(fixture.d1), REQUEST_TENANT_ID: undefined }
    });
    expect(status).toBe(403);
    expect(body.message).toBe(EVIDENCE_MESSAGES.tenantAssignmentRequired);
  });
});

describe('Evidence inventory and parity', () => {
  it('returns the exact inventory contract with one item per workbook type', async () => {
    const { status, body } = await callJson(`/api/evidence/jobs/${JOB_READY}/inventory`, { token: adminToken });
    expect(status).toBe(200);
    expect(Object.keys(body).sort()).toEqual(['items', 'jobId', 'success', 'tenantId']);
    expect(body.tenantId).toBe('TNT-TEST');
    const items = body.items as Array<Record<string, unknown>>;
    expect(items).toHaveLength(9);
    expect(Object.keys(items[0]).sort()).toEqual(['description', 'filename', 'isAvailable', 'requiredRole', 'sheetCount', 'title', 'type']);
    const available = items.filter((item) => item.isAvailable === true).map((item) => item.type);
    expect(available).toEqual(expect.arrayContaining(['MODULE_1_EVIDENCE', 'SAVINGS_ENGINE_EVIDENCE', 'FINANCIAL_VALIDATION', 'DATA_VERSION_DIFF', 'MANAGEMENT_QUICK_SUMMARY_EVIDENCE', 'ANALYSIS_RUN_CONTROL']));
    expect(available).toHaveLength(6);
    const moduleTwo = items.find((item) => item.type === 'MODULE_2_EVIDENCE');
    expect(moduleTwo).toMatchObject({ isAvailable: false, sheetCount: 0 });
    expect(String(moduleTwo?.description)).toContain('not persisted');
  });

  it('explains why each dependent workbook is unavailable for a job without ledger rows', async () => {
    const { body } = await callJson(`/api/evidence/jobs/${JOB_NO_LEDGER}/inventory`, { token: adminToken });
    const items = body.items as Array<Record<string, unknown>>;
    const moduleOne = items.find((item) => item.type === 'MODULE_1_EVIDENCE');
    expect(moduleOne).toMatchObject({ isAvailable: false, description: EVIDENCE_MESSAGES.ledgerEmpty(JOB_NO_LEDGER) });
    const dataDiff = items.find((item) => item.type === 'DATA_VERSION_DIFF');
    expect(dataDiff).toMatchObject({ isAvailable: false, description: EVIDENCE_MESSAGES.noDataVersion(JOB_NO_LEDGER) });
    const runControl = items.find((item) => item.type === 'ANALYSIS_RUN_CONTROL');
    expect(runControl).toMatchObject({ isAvailable: false, description: EVIDENCE_MESSAGES.noAnalysisRuns(JOB_NO_LEDGER) });
  });

  it('reports a missing approved run for a job that has ledger rows but no approved analysis', async () => {
    const { body } = await callJson(`/api/evidence/jobs/${JOB_LEDGER_ONLY}/inventory`, { token: adminToken });
    const items = body.items as Array<Record<string, unknown>>;
    expect(items.find((item) => item.type === 'MODULE_1_EVIDENCE')).toMatchObject({ isAvailable: true, sheetCount: 7 });
    expect(items.find((item) => item.type === 'SAVINGS_ENGINE_EVIDENCE')).toMatchObject({ isAvailable: false, description: EVIDENCE_MESSAGES.noApprovedRun(JOB_LEDGER_ONLY) });
  });

  it('returns a passing parity summary with exact check fields for a reconciled job', async () => {
    const { status, body } = await callJson(`/api/evidence/jobs/${JOB_READY}/parity`, { token: adminToken });
    expect(status).toBe(200);
    const parity = body.parity as Record<string, unknown>;
    expect(parity).toMatchObject({ jobId: JOB_READY, dataVersionId: 'DV-A2', totalChecks: 4, passedChecks: 4, failedChecks: 0, overallStatus: 'PASS', discrepancies: [] });
    expect(Object.keys((parity.checks as Array<Record<string, unknown>>)[0]).sort()).toEqual(
      ['evidenceValue', 'kpi', 'notes', 'sourceValue', 'status', 'supportingSheet', 'tolerance', 'uiValue', 'unit', 'variance']
    );
  });

  it('filters parity checks by workbook type and reports zero checks as not verified', async () => {
    const moduleOne = await callJson(`/api/evidence/jobs/${JOB_READY}/parity?workbookType=MODULE_1_EVIDENCE`, { token: adminToken });
    expect((moduleOne.body.parity as Record<string, unknown>).totalChecks).toBe(2);
    const dataDiff = await callJson(`/api/evidence/jobs/${JOB_READY}/parity?workbookType=DATA_VERSION_DIFF`, { token: adminToken });
    expect(dataDiff.body.parity).toMatchObject({ totalChecks: 0, overallStatus: 'FAIL' });
  });

  it('lists discrepancies with expected and actual values when UI, ledger, and run disagree', async () => {
    const { body } = await callJson(`/api/evidence/jobs/${JOB_MISMATCH}/parity`, { token: adminToken });
    const parity = body.parity as { overallStatus: string; failedChecks: number; discrepancies: Array<{ kpi: string; reason: string }> };
    expect(parity.overallStatus).toBe('FAIL');
    expect(parity.failedChecks).toBe(4);
    expect(parity.discrepancies[0].kpi).toBe('Total Spend');
    expect(parity.discrepancies[0].reason).toBe(EVIDENCE_MESSAGES.discrepancyReason('6.5', '6', '6'));
  });

  it('marks checks with missing inputs as failed instead of passing them', async () => {
    const { body } = await callJson(`/api/evidence/jobs/${JOB_NO_LEDGER}/parity`, { token: adminToken });
    const parity = body.parity as { overallStatus: string; checks: Array<{ status: string; notes: string }> };
    expect(parity.overallStatus).toBe('FAIL');
    expect(parity.checks.every((check) => check.status === 'FAIL')).toBe(true);
    expect(parity.checks[0].notes).toContain('Missing input');
  });
});

describe('Evidence workbook downloads', () => {
  it('serves a MODULE_1 workbook with the expected sheets and real ledger aggregates', async () => {
    const response = await call(`/api/evidence/jobs/${JOB_READY}/workbooks/MODULE_1_EVIDENCE/download`, { token: adminToken });
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe(EVIDENCE_WORKBOOK_MIME_TYPE);
    expect(response.headers.get('Content-Disposition')).toBe('attachment; filename="01_Module_1_Evidence.xlsx"');
    const bytes = await response.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(bytes), { type: 'array' });
    expect(workbook.SheetNames).toEqual(EVIDENCE_WORKBOOK_SHEETS.MODULE_1_EVIDENCE);
    const supplierSheet = XLSX.utils.sheet_to_json<Array<string | number>>(workbook.Sheets[EVIDENCE_SHEET_NAMES.SUPPLIER_SPEND], { header: 1 });
    expect(supplierSheet[1][0]).toBe('Alpha Chem');
    expect(supplierSheet[1][2]).toBe(4);
    const summary = XLSX.utils.sheet_to_json<Array<string | number>>(workbook.Sheets[EVIDENCE_SHEET_NAMES.SUMMARY], { header: 1 });
    expect(summary.some((row) => row[0] === 'Ledger rows in scope' && row[1] === 4)).toBe(true);
  });

  it('serves each available workbook type and one record per sheet list', async () => {
    for (const workbookType of ['SAVINGS_ENGINE_EVIDENCE', 'FINANCIAL_VALIDATION', 'DATA_VERSION_DIFF', 'MANAGEMENT_QUICK_SUMMARY_EVIDENCE', 'ANALYSIS_RUN_CONTROL'] as const) {
      const response = await call(`/api/evidence/jobs/${JOB_READY}/workbooks/${workbookType}/download`, { token: adminToken });
      expect(response.status).toBe(200);
      expect(sheetNamesOf(await response.arrayBuffer())).toEqual(EVIDENCE_WORKBOOK_SHEETS[workbookType]);
    }
  });

  it('answers 409 JSON, not a file, for types D1 cannot produce', async () => {
    for (const workbookType of ['MODULE_2_EVIDENCE', 'PCBI_EVIDENCE', 'REPORT_EVIDENCE'] as const) {
      const response = await call(`/api/evidence/jobs/${JOB_READY}/workbooks/${workbookType}/download`, { token: adminToken });
      expect(response.status).toBe(409);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      const body = (await response.json()) as Record<string, unknown>;
      expect(body.errorCategory).toBe(EVIDENCE_ERROR_CATEGORIES.CONFLICT);
      expect(String(body.message)).toContain(EVIDENCE_MESSAGES.workbookUnavailable(JOB_READY, '').slice(0, 60));
    }
  });

  it('answers 409 with the missing-ledger reason for a job without transactions', async () => {
    const response = await call(`/api/evidence/jobs/${JOB_NO_LEDGER}/workbooks/MODULE_1_EVIDENCE/download`, { token: adminToken });
    expect(response.status).toBe(409);
    expect((await response.json()) as Record<string, unknown>).toMatchObject({
      message: EVIDENCE_MESSAGES.workbookUnavailable(JOB_NO_LEDGER, EVIDENCE_MESSAGES.ledgerEmpty(JOB_NO_LEDGER))
    });
  });

  it('lets the owning customer download and denies other customers', async () => {
    const owner = await call(`/api/evidence/jobs/${JOB_READY}/workbooks/ANALYSIS_RUN_CONTROL/download`, { token: buyerToken });
    expect(owner.status).toBe(200);
    const stranger = await call(`/api/evidence/jobs/${JOB_READY}/workbooks/ANALYSIS_RUN_CONTROL/download`, { token: otherToken });
    expect(stranger.status).toBe(403);
    expect(stranger.headers.get('Content-Type')).toBe('application/json');
  });

  it('builds a complete package ZIP whose entries are valid workbooks and a package index', async () => {
    const response = await call(`/api/evidence/jobs/${JOB_READY}/package/download`, { token: adminToken });
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe(EVIDENCE_PACKAGE_MIME_TYPE);
    expect(response.headers.get('Content-Disposition')).toBe(`attachment; filename="Complete_Analysis_Evidence_Package_${JOB_READY}.zip"`);
    const entries = readStoredZip(new Uint8Array(await response.arrayBuffer()));
    expect(entries.map((entry) => entry.name)).toEqual([
      '01_Module_1_Evidence.xlsx',
      '04_Savings_Engine_Evidence.xlsx',
      '05_Financial_Validation.xlsx',
      '06_Data_Version_Diff.xlsx',
      '08_Management_Quick_Summary_Evidence.xlsx',
      '09_Analysis_Run_Control.xlsx',
      '00_PACKAGE_INDEX.txt'
    ]);
    expect(entries.every(crcMatches)).toBe(true);
    const index = new TextDecoder().decode(entries[entries.length - 1].data);
    expect(index).toContain('02_Module_2_Evidence.xlsx');
    expect(index).toContain('04A_Vendor_Consolidation_Evidence.xlsx');
    const workbook = XLSX.read(entries[0].data, { type: 'array' });
    expect(workbook.SheetNames).toEqual(EVIDENCE_WORKBOOK_SHEETS.MODULE_1_EVIDENCE);
  });

  it('builds a one-workbook package for a job whose only evidence is the ledger', async () => {
    const response = await call(`/api/evidence/jobs/${JOB_LEDGER_ONLY}/package/download`, { token: adminToken });
    expect(response.status).toBe(200);
    expect(readStoredZip(new Uint8Array(await response.arrayBuffer())).map((entry) => entry.name)).toEqual([
      '01_Module_1_Evidence.xlsx',
      '00_PACKAGE_INDEX.txt'
    ]);
  });

  it('answers 409 for a package when no workbook can be produced', async () => {
    const response = await call(`/api/evidence/jobs/${JOB_NO_LEDGER}/package/download`, { token: adminToken });
    expect(response.status).toBe(409);
    expect((await response.json()) as Record<string, unknown>).toMatchObject({ message: EVIDENCE_MESSAGES.packageEmpty(JOB_NO_LEDGER) });
  });
});

describe('Evidence savings type routes', () => {
  it('lists all seven savings types as unavailable with a reason and the contract fields', async () => {
    const { status, body } = await callJson(`/api/evidence/jobs/${JOB_READY}/savings/inventory`, { token: adminToken });
    expect(status).toBe(200);
    expect(Object.keys(body).sort()).toEqual(['items', 'jobId', 'success', 'tenantId']);
    const items = body.items as Array<Record<string, unknown>>;
    expect(items).toHaveLength(7);
    expect(Object.keys(items[0]).sort()).toEqual(
      ['classificationNote', 'description', 'filename', 'initiativeId', 'isAvailable', 'netAmountCr', 'requiredRole', 'savingsType', 'sheetCount', 'title']
    );
    expect(items.every((item) => item.isAvailable === false && item.sheetCount === 0)).toBe(true);
  });

  it('returns a single savings type when the type is in the path', async () => {
    const { body } = await callJson(`/api/evidence/jobs/${JOB_READY}/savings/VENDOR_CONSOLIDATION/inventory`, { token: adminToken });
    const items = body.items as Array<Record<string, unknown>>;
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ savingsType: 'VENDOR_CONSOLIDATION', initiativeId: 'OPP-001', requiredRole: 'CONSULTANT' });
  });

  it('answers 409 with the reason when a savings type workbook is requested', async () => {
    const response = await call(`/api/evidence/jobs/${JOB_READY}/savings/VENDOR_CONSOLIDATION/download`, { token: adminToken });
    expect(response.status).toBe(409);
    const body = (await response.json()) as Record<string, unknown>;
    expect(String(body.message)).toContain('OPP-001');
    expect(String(body.message)).toContain('04_Savings_Engine_Evidence.xlsx');
  });

  it('enforces job scope before answering the savings download', async () => {
    const response = await call(`/api/evidence/jobs/${JOB_MISMATCH}/savings/VENDOR_CONSOLIDATION/download`, { token: buyerToken });
    expect(response.status).toBe(403);
  });
});
