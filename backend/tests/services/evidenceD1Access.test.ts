/**
 * Tests for the evidence D1 read model, the access service, and the snapshot loader, run against
 * the in-memory SQLite database built from the production schema.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { EVIDENCE_ERROR_CATEGORIES, EVIDENCE_HTTP_STATUS, EVIDENCE_MESSAGES } from '../../src/constants/evidenceMessages';
import { EVIDENCE_LEDGER_GROUP_COLUMNS, buildLedgerGroupSql, EVIDENCE_SQL } from '../../src/constants/evidenceSql';
import {
  authenticateEvidenceUser,
  authorizeEvidenceJobAccess,
  requireEvidenceDatabase
} from '../../src/services/evidenceAccessService';
import {
  loadAnalysisRunRecords,
  loadDataVersionRecords,
  loadJobAccessRecord,
  loadLedgerDetail,
  loadLedgerTotals,
  loadTenantId,
  loadUserRecord,
  toNullableNumber,
  toNullableText,
  toNumber,
  toText
} from '../../src/services/evidenceD1Repository';
import { EvidenceRequestError } from '../../src/services/evidenceRequestError';
import { isActiveRun, loadEvidenceSnapshot } from '../../src/services/evidenceSnapshotService';
import type { CloudflareD1Database, CloudflareEnvironment } from '../../src/types/cloudflare';
import type { EvidenceUserRecord } from '../../src/types/evidenceWorkbook';
import {
  createEvidenceDatabase,
  EVIDENCE_TEST_SECRET,
  EVIDENCE_TEST_TENANT,
  testEnvironment,
  tokenFor,
  type EvidenceDatabaseFixture
} from '../helpers/evidenceSqlite';
import { makeRun } from '../helpers/evidenceSnapshotFactory';

let fixture: EvidenceDatabaseFixture;
let d1: CloudflareD1Database;

const REQUEST = 'req-access-test';

const userFixture = (overrides: Partial<EvidenceUserRecord> = {}): EvidenceUserRecord => ({
  userId: 'usr-buyer',
  name: 'Buyer',
  email: 'buyer@example.com',
  role: 'USER',
  status: 'ACTIVE',
  ...overrides
});

const requestWith = (authorization: string | null): Request => {
  const headers = new Headers();
  if (authorization !== null) headers.set('Authorization', authorization);
  return new Request('https://consulting.edge/api/evidence/jobs/AIC-A/inventory', { headers });
};

const failingDb: CloudflareD1Database = { prepare: (): never => { throw new Error('database offline'); } };

beforeAll(() => {
  fixture = createEvidenceDatabase();
  d1 = fixture.d1;
});

afterAll(() => {
  fixture.close();
});

describe('value mappers', () => {
  it('maps blanks and non-finite values to null and keeps parsable numbers', () => {
    expect(toNullableNumber(null)).toBeNull();
    expect(toNullableNumber(undefined)).toBeNull();
    expect(toNullableNumber('')).toBeNull();
    expect(toNullableNumber('abc')).toBeNull();
    expect(toNullableNumber('2.5')).toBe(2.5);
    expect(toNumber(undefined)).toBe(0);
    expect(toNumber('7')).toBe(7);
  });

  it('maps null and undefined text to null and stringifies other values', () => {
    expect(toNullableText(null)).toBeNull();
    expect(toNullableText(undefined)).toBeNull();
    expect(toNullableText('abc')).toBe('abc');
    expect(toNullableText(12)).toBe('12');
    expect(toText(null)).toBe('');
    expect(toText('x')).toBe('x');
  });

  it('builds the group query only from the allowlisted ledger columns', () => {
    expect(buildLedgerGroupSql(EVIDENCE_LEDGER_GROUP_COLUMNS.PLANT)).toContain('GROUP BY group_key');
    expect(buildLedgerGroupSql(EVIDENCE_LEDGER_GROUP_COLUMNS.SUPPLIER)).toContain('TRIM(supplier_name)');
    expect(EVIDENCE_SQL.ledgerTotals).toContain('assessment_id = ?');
  });
});

describe('D1 read model', () => {
  it('reads the tenant, users, jobs, runs, and versions from D1', async () => {
    expect(await loadTenantId(d1, REQUEST)).toBe(EVIDENCE_TEST_TENANT);
    expect(await loadUserRecord(d1, 'usr-buyer', REQUEST)).toMatchObject({ role: 'USER', email: 'buyer@example.com', status: 'ACTIVE' });
    expect(await loadUserRecord(d1, 'usr-missing', REQUEST)).toBeNull();

    const job = await loadJobAccessRecord(d1, 'AIC-A', REQUEST);
    expect(job).toMatchObject({ assessmentId: 'AIC-A', totalSpendCr: 7.5, customerContactEmail: 'Buyer@Example.com' });
    expect(await loadJobAccessRecord(d1, 'AIC-NOPE', REQUEST)).toBeNull();

    const runs = await loadAnalysisRunRecords(d1, 'AIC-A', REQUEST);
    expect(runs.map((run) => run.analysisRunId)).toEqual(['RUN-A2', 'RUN-A1']);
    expect(runs[0]).toMatchObject({ isApproved: true, isSuperseded: false, allGatesPassed: true });
    expect(runs[1].isSuperseded).toBe(true);

    const versions = await loadDataVersionRecords(d1, 'AIC-A', REQUEST);
    expect(versions.map((version) => version.dataVersionId)).toEqual(['DV-A2', 'DV-A1']);
    expect(versions[0]).toMatchObject({ recordCount: 5, isSuperseded: false });
  });

  it('scopes ledger totals to the job and tenant and excludes legacy rows', async () => {
    expect(await loadLedgerTotals(d1, EVIDENCE_TEST_TENANT, 'AIC-A', REQUEST)).toEqual({ rowCount: 4, totalCr: 7.5 });
    expect(await loadLedgerTotals(d1, 'TNT-OTHER', 'AIC-A', REQUEST)).toEqual({ rowCount: 0, totalCr: 0 });
    expect(await loadLedgerTotals(d1, EVIDENCE_TEST_TENANT, 'AIC-C', REQUEST)).toEqual({ rowCount: 0, totalCr: 0 });
  });

  it('loads grouped ledger detail with blanks labelled and the sample capped', async () => {
    const detail = await loadLedgerDetail(d1, EVIDENCE_TEST_TENANT, 'AIC-A', REQUEST);
    expect(detail.suppliers.map((group) => group.groupKey)).toEqual(['Alpha Chem', 'Beta Metals', '(blank)']);
    expect(detail.suppliers[0]).toEqual({ groupKey: 'Alpha Chem', rowCount: 2, totalCr: 4 });
    expect(detail.plants.map((group) => group.groupKey)).toEqual(['P1', 'P2', '(blank)']);
    expect(detail.materialGroups).toHaveLength(3);
    expect(detail.sample).toHaveLength(4);
    expect(detail.sample[3]).toMatchObject({ transactionId: 'TX-A4', plant: null, totalInCrRaw: 0.5 });
    expect(detail.sampleLimit).toBe(5000);
  });

  it('returns no records for an unknown tenant in the snapshot queries', async () => {
    expect(await loadTenantId(failingDb, REQUEST).catch((error: unknown) => error)).toBeInstanceOf(Error);
    expect(await loadDataVersionRecords(d1, 'AIC-NOPE', REQUEST)).toEqual([]);
  });
});

describe('snapshot loader', () => {
  const job = {
    assessmentId: 'AIC-A',
    customerName: 'Alpha Textile',
    status: 'APPROVED',
    totalSpendCr: 7.5,
    validatedSpendCr: 7.5,
    grossOpportunityCr: 3,
    overlapDeductionsCr: 1,
    netDefensibleOpportunityCr: 2,
    potentialSavingsCr: 2,
    savingsPct: 26.6667,
    customerContactEmail: 'buyer@example.com'
  };

  it('assembles the active run, active version, and ledger totals for a job', async () => {
    const snapshot = await loadEvidenceSnapshot(d1, job, { requestId: REQUEST, generatedAt: '2026-10-01T00:00:00.000Z' });
    expect(snapshot).toMatchObject({
      jobId: 'AIC-A',
      tenantId: EVIDENCE_TEST_TENANT,
      generatedAt: '2026-10-01T00:00:00.000Z',
      activeRun: { analysisRunId: 'RUN-A2' },
      activeVersion: { dataVersionId: 'DV-A2' },
      ledger: { rowCount: 4, totalCr: 7.5 },
      detail: null
    });
  });

  it('stamps the snapshot with the current time when no generation time is supplied', async () => {
    const snapshot = await loadEvidenceSnapshot(d1, job, { requestId: REQUEST });
    expect(Number.isNaN(Date.parse(snapshot.generatedAt))).toBe(false);
  });

  it('leaves active run and version empty when none is approved or current', async () => {
    const snapshot = await loadEvidenceSnapshot(d1, { ...job, assessmentId: 'AIC-C' }, { requestId: REQUEST });
    expect(snapshot.activeRun).toBeNull();
    expect(snapshot.activeVersion).toBeNull();
    expect(snapshot.ledger.rowCount).toBe(0);
  });

  it('recognises approved, non-superseded runs as active', () => {
    expect(isActiveRun(makeRun())).toBe(true);
    expect(isActiveRun(makeRun({ isApproved: false }))).toBe(false);
    expect(isActiveRun(makeRun({ isSuperseded: true }))).toBe(false);
  });

  it('fails with a 503 when the tenant row is missing', async () => {
    const scoped = createEvidenceDatabase();
    scoped.db.exec('DELETE FROM TenantMaster');
    try {
      await loadEvidenceSnapshot(scoped.d1, job, { requestId: REQUEST });
      throw new Error('expected a 503');
    } catch (error) {
      expect(error).toMatchObject({ status: EVIDENCE_HTTP_STATUS.SERVICE_UNAVAILABLE, category: EVIDENCE_ERROR_CATEGORIES.SERVER });
    } finally {
      scoped.close();
    }
  });
});

describe('access service', () => {
  const environment: CloudflareEnvironment = testEnvironment(undefined);

  it('requires a configured D1 binding', () => {
    expect(() => requireEvidenceDatabase(environment)).toThrow(EVIDENCE_MESSAGES.databaseNotConfigured);
    expect(requireEvidenceDatabase(testEnvironment(d1))).toBe(d1);
  });

  it('rejects requests without a Bearer scheme or token', async () => {
    for (const header of [null, 'Basic abc', 'Bearer']) {
      await expect(authenticateEvidenceUser(requestWith(header), testEnvironment(d1), d1, REQUEST)).rejects.toMatchObject({
        status: EVIDENCE_HTTP_STATUS.UNAUTHORIZED,
        message: EVIDENCE_MESSAGES.missingBearerToken
      });
    }
  });

  it('authenticates a valid token and returns the D1 user record', async () => {
    const token = await tokenFor('usr-admin', 'ADMIN');
    const user = await authenticateEvidenceUser(requestWith(`Bearer ${token}`), testEnvironment(d1), d1, REQUEST);
    expect(user).toMatchObject({ userId: 'usr-admin', role: 'ADMIN', status: 'ACTIVE' });
  });

  it('requires AUTH_SECRET before verifying tokens', async () => {
    const token = await tokenFor('usr-admin', 'ADMIN');
    await expect(authenticateEvidenceUser(requestWith(`Bearer ${token}`), { DB: d1 }, d1, REQUEST)).rejects.toMatchObject({
      status: EVIDENCE_HTTP_STATUS.SERVICE_UNAVAILABLE,
      message: EVIDENCE_MESSAGES.authSecretNotConfigured
    });
    await expect(
      authenticateEvidenceUser(requestWith(`Bearer ${token}`), { DB: d1, AUTH_SECRET: EVIDENCE_TEST_SECRET }, d1, REQUEST)
    ).resolves.toMatchObject({ role: 'ADMIN' });
  });

  it('lets an admin read any job and returns 404 for a job that does not exist', () => {
    const admin = userFixture({ role: 'ADMIN' });
    const job = { assessmentId: 'AIC-A', customerName: 'x', status: 'y', totalSpendCr: 1, validatedSpendCr: 1, grossOpportunityCr: 1, overlapDeductionsCr: 0, netDefensibleOpportunityCr: 1, potentialSavingsCr: 1, savingsPct: 1, customerContactEmail: null };
    expect(authorizeEvidenceJobAccess(admin, job, 'AIC-A')).toBe(job);
    expect(() => authorizeEvidenceJobAccess(admin, null, 'AIC-Z')).toThrow(EVIDENCE_MESSAGES.jobNotFound('AIC-Z'));
  });

  it('matches customer emails case-insensitively and denies every other customer request', () => {
    const job = { assessmentId: 'AIC-A', customerName: 'x', status: 'y', totalSpendCr: 1, validatedSpendCr: 1, grossOpportunityCr: 1, overlapDeductionsCr: 0, netDefensibleOpportunityCr: 1, potentialSavingsCr: 1, savingsPct: 1, customerContactEmail: ' BUYER@example.com ' };
    expect(authorizeEvidenceJobAccess(userFixture(), job, 'AIC-A')).toBe(job);
    const noContact = { ...job, customerContactEmail: null };
    const other = userFixture({ email: 'other@example.com' });
    expect(() => authorizeEvidenceJobAccess(other, job, 'AIC-A')).toThrow(EVIDENCE_MESSAGES.accessDenied('AIC-A'));
    expect(() => authorizeEvidenceJobAccess(userFixture(), noContact, 'AIC-A')).toThrow(EvidenceRequestError);
    expect(() => authorizeEvidenceJobAccess(userFixture(), null, 'AIC-A')).toThrow(EVIDENCE_MESSAGES.accessDenied('AIC-A'));
  });
});
