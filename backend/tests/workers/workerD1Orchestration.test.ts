import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { ORCHESTRATION_MESSAGES } from '../../src/constants/orchestrationMessages';
import * as assessmentDataVersionD1 from '../../src/services/assessmentDataVersionD1';
import * as assessmentAnalysisD1 from '../../src/services/assessmentAnalysisD1';
import * as orchestrationStore from '../../src/workerD1OrchestrationStore';
import { handleOrchestrationRoute } from '../../src/workerD1Orchestration';
import {
  ADMIN_ID,
  CUSTOMER_A_ID,
  CUSTOMER_B_ID,
  GUEST_ID,
  OTHER_TEST_TENANT_ID,
  SUSPENDED_ID,
  TEST_TENANT_ID,
  createHarness,
  mintToken,
  seedStandardFixtures,
  send,
  tokenFor,
  type CallResult,
  type OrchestrationHarness,
  type SqliteDatabaseLike
} from './orchestrationTestHarness';

vi.mock('../../src/utils/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

type RaceHook = (sql: string, sqlite: SqliteDatabaseLike) => void;

let raceHook: RaceHook | undefined;
let harness: OrchestrationHarness;
let adminToken = '';
let customerToken = '';
let customerBToken = '';

const beforeStatement = (sql: string, sqlite: SqliteDatabaseLike): void => raceHook?.(sql, sqlite);

const adminCall = (options: Parameters<typeof send>[1]): Promise<CallResult> =>
  send(harness, { token: adminToken, ...options });

const customerCall = (options: Parameters<typeof send>[1]): Promise<CallResult> =>
  send(harness, { token: customerToken, ...options });

const generateReport = (jobId = 'AIC-A1'): Promise<CallResult> =>
  adminCall({ method: 'POST', path: `/jobs/${jobId}/generate-report`, body: {} });

const checklistBody = (overrides: { unconfirmedDataQuality?: boolean } = {}): Record<string, unknown> => ({
  dataQuality: {
    sourceDataValidated: true,
    spendReconciles: true,
    duplicateChecksCompleted: !overrides.unconfirmedDataQuality,
    classificationReviewed: true
  },
  pcbi: {
    requiredPcbiCategoriesResolved: true,
    benchmarkSourcesValidated: true,
    exclusionsDocumented: true,
    pcbiCoverageAcceptable: true
  },
  financial: {
    savingsCalculationsValidated: true,
    noDoubleCounting: true,
    overlapsHandled: true,
    exclusionsApplied: true,
    totalsReconcile: true
  },
  report: {
    module1Reviewed: true,
    module2Reviewed: true,
    module3Reviewed: true,
    module4Reviewed: true,
    executiveSummaryReviewed: true
  }
});

const confirmChecklist = (jobId = 'AIC-A1'): Promise<CallResult> =>
  adminCall({ method: 'POST', path: `/jobs/${jobId}/quality-gate`, body: checklistBody() });

/** Generates a report, confirms the checklist for it and submits it to the customer. */
const submitReport = async (jobId = 'AIC-A1'): Promise<string> => {
  const generated = await generateReport(jobId);
  const reportId = generated.body.report.reportVersionId as string;
  await confirmChecklist(jobId);
  await adminCall({ method: 'POST', path: `/jobs/${jobId}/approve-and-submit`, body: { reportVersionId: reportId } });
  return reportId;
};

const jobIds = (result: CallResult): string[] =>
  (result.body.data as Array<{ analysisJobId: string }>).map((job) => job.analysisJobId).sort();

const correctedUploadFor = (csv: string, fileName = 'Corrected_Spend.csv') => {
  const bytes = Buffer.from(csv, 'utf8');
  return {
    fileName,
    fileSize: bytes.byteLength,
    checksum: createHash('sha256').update(bytes).digest('hex'),
    fileBase64: bytes.toString('base64'),
    reason: 'INCORRECT_CATEGORY_MAPPING'
  };
};
const correctedCsv = 'PO Number,Supplier Name,Description,Quantity,Net Price,Currency,Total INR,Transaction Date,Material Group,Plant\n' +
  'PO-CORR-1,Acme Supplies,Packaging,2,5,INR,10,2026-01-01,Packaging,Plant 1';
const correctedFileBytes = Buffer.from(correctedCsv, 'utf8');
const correctedUploadBody = correctedUploadFor(correctedCsv);

beforeEach(async () => {
  raceHook = undefined;
  harness = createHarness({ beforeStatement });
  seedStandardFixtures(harness.sqlite);
  adminToken = await tokenFor(ADMIN_ID);
  customerToken = await tokenFor(CUSTOMER_A_ID);
  customerBToken = await tokenFor(CUSTOMER_B_ID);
});

afterEach(() => {
  vi.restoreAllMocks();
  harness.close();
});

describe('authentication and routing', () => {
  it('returns 401 without a bearer token', async () => {
    const result = await send(harness, { path: '/jobs' });
    expect(result.status).toBe(401);
    expect(result.body).toMatchObject({ success: false, errorCategory: 'AUTH_ERROR' });
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.authRequired);
  });

  it('rejects an Authorization header that is not a Bearer token', async () => {
    const result = await send(harness, { path: '/jobs', authorization: `Token ${adminToken}` });
    expect(result.status).toBe(401);
  });

  it('rejects a token whose signature was altered', async () => {
    const result = await send(harness, { path: '/jobs', token: `${adminToken}x` });
    expect(result.status).toBe(401);
  });

  it('rejects an expired token', async () => {
    const expired = mintToken({ userId: ADMIN_ID, expiresAt: Date.now() - 1000 });
    const result = await send(harness, { path: '/jobs', token: expired });
    expect(result.status).toBe(401);
  });

  it('rejects a token signed with a different secret', async () => {
    const forged = mintToken({ userId: ADMIN_ID, secret: 'attacker-secret' });
    const result = await send(harness, { path: '/jobs', token: forged });
    expect(result.status).toBe(401);
  });

  it('rejects a valid token for a user who no longer exists', async () => {
    const result = await send(harness, { path: '/jobs', token: mintToken({ userId: 'usr-missing' }) });
    expect(result.status).toBe(401);
  });

  it('ignores role claims in the token and uses the role stored for the account', async () => {
    const claimedAdmin = mintToken({ userId: CUSTOMER_A_ID, role: 'ADMIN' });
    const result = await send(harness, { path: '/admin/kpis', token: claimedAdmin });
    expect(result.status).toBe(403);
  });

  it('denies access to suspended accounts with 403', async () => {
    const result = await send(harness, { path: '/jobs', token: await tokenFor(SUSPENDED_ID) });
    expect(result.status).toBe(403);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.accountInactive);
  });

  it('denies access to accounts with an unknown role', async () => {
    const result = await send(harness, { path: '/jobs', token: await tokenFor(GUEST_ID) });
    expect(result.status).toBe(403);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.unknownRole);
  });

  it('returns 503 when AUTH_SECRET is not configured', async () => {
    const unconfigured = createHarness({ environment: { AUTH_SECRET: undefined } });
    seedStandardFixtures(unconfigured.sqlite);
    const result = await send(unconfigured, { path: '/jobs', token: adminToken });
    unconfigured.close();
    expect(result.status).toBe(503);
    expect(result.body.errorCategory).toBe('SERVER_ERROR');
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.authNotConfigured);
  });

  it('returns 503 when the D1 binding is missing', async () => {
    const unbound = createHarness({ environment: { DB: undefined } });
    const result = await send(unbound, { path: '/jobs', token: adminToken });
    unbound.close();
    expect(result.status).toBe(503);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.databaseNotConfigured);
  });

  it('requires the authenticated user to have an explicit tenant assignment', async () => {
    harness.sqlite.exec('DROP TRIGGER trg_user_requires_tenant_on_active_update');
    harness.sqlite.prepare('UPDATE User SET tenant_id = NULL WHERE id = ?').run(CUSTOMER_A_ID);
    const result = await customerCall({ path: '/jobs' });
    expect(result.status).toBe(403);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.tenantAssignmentRequired);
  });

  it('returns 404 for paths that match no endpoint', async () => {
    const result = await adminCall({ path: '/unknown/path' });
    expect(result.status).toBe(404);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.routeNotFound);
  });

  it('returns 405 when a known path is called with the wrong method', async () => {
    const result = await adminCall({ method: 'DELETE', path: '/jobs' });
    expect(result.status).toBe(405);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.methodNotAllowed);
  });

  it('rejects an invalid job identifier in the path', async () => {
    const result = await adminCall({ path: '/jobs/%20bad' });
    expect(result.status).toBe(400);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.validationFailed);
  });

  it('rejects a path segment with malformed percent-encoding', async () => {
    const result = await adminCall({ path: '/jobs/%E0%A4%A' });
    expect(result.status).toBe(400);
    expect(result.body.errors[0].message).toBe(ORCHESTRATION_MESSAGES.invalidPathEncoding);
  });

  it('echoes a well-formed X-Request-Id and generates one when the header is malformed', async () => {
    const echoed = await adminCall({ path: '/jobs', requestId: 'trace-123.abc' });
    expect(echoed.headers.get('X-Request-Id')).toBe('trace-123.abc');
    const generated = await adminCall({ path: '/jobs', requestId: 'bad id with spaces' });
    expect(generated.headers.get('X-Request-Id')).toMatch(/^req-/);
  });

  it('returns 500 with the request id when the database fails unexpectedly', async () => {
    raceHook = (sql) => {
      if (sql.includes('FROM AssessmentRecord')) throw new Error('disk I/O error');
    };
    const result = await adminCall({ path: '/jobs', requestId: 'req-fail-1' });
    expect(result.status).toBe(500);
    expect(result.body.requestId).toBe('req-fail-1');
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.unexpectedError('req-fail-1'));
  });
});

describe('listing jobs', () => {
  it('returns every job to an administrator, including jobs without data', async () => {
    const result = await adminCall({ path: '/jobs' });
    expect(result.status).toBe(200);
    expect(result.body.success).toBe(true);
    expect(typeof result.body.timestamp).toBe('string');
    expect(jobIds(result)).toEqual(['AIC-A1', 'AIC-A2', 'AIC-B1', 'AIC-C1', 'AIC-D1', 'AIC-E1', 'AIC-F1', 'AIC-G1']);
    const uploaded = (result.body.data as Array<{ analysisJobId: string; status: string }>)
      .find((job) => job.analysisJobId === 'AIC-C1');
    expect(uploaded?.status).toBe('UPLOADED');
  });

  it('shows a customer only their own jobs that already have data', async () => {
    const result = await customerCall({ path: '/jobs' });
    expect(jobIds(result)).toEqual(['AIC-A1', 'AIC-A2', 'AIC-D1', 'AIC-E1', 'AIC-F1', 'AIC-G1']);
    expect(jobIds(await customerCall({ path: '/jobs', query: '?status=ALL' })).length).toBe(6);
  });

  it('filters assessment lists and direct reads by the resolved tenant', async () => {
    harness.sqlite.prepare('INSERT INTO TenantMaster (tenant_id, enterprise_name) VALUES (?, ?)')
      .run(OTHER_TEST_TENANT_ID, 'Other Test Tenant');
    harness.sqlite.prepare(
      'INSERT INTO CustomerRecord (customer_id, tenant_id, customer_name, industry, contact_email) VALUES (?, ?, ?, ?, ?)'
    ).run('CUST-OTHER', OTHER_TEST_TENANT_ID, 'Other Enterprise', 'Industrial', 'other@example.test');
    harness.sqlite.prepare(
      'INSERT INTO AssessmentRecord (assessment_id, tenant_id, customer_id, customer_name, industry, assessment_owner) VALUES (?, ?, ?, ?, ?, ?)'
    ).run('AIC-OTHER', OTHER_TEST_TENANT_ID, 'CUST-OTHER', 'Other Enterprise', 'Industrial', 'analyst@example.test');
    harness.sqlite.prepare(
      'INSERT INTO OrchestrationNotification (notification_id, recipient_type, tenant_id, assessment_id, title, message, severity, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run('NOTIF-OTHER', 'ADMIN', OTHER_TEST_TENANT_ID, 'AIC-OTHER', 'Other tenant notice', 'Private message', 'INFO', '2026-01-01T00:00:00.000Z');
    harness.sqlite.prepare(
      'INSERT INTO OrchestrationAuditEvent (event_id, tenant_id, assessment_id, actor_id, actor_role, event_type, entity_type, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run('AUDIT-OTHER', OTHER_TEST_TENANT_ID, 'AIC-OTHER', ADMIN_ID, 'ADMIN', 'TEST_EVENT', 'TestEntity', 'AIC-OTHER', '2026-01-01T00:00:00.000Z');

    const selectedTenant = await adminCall({ path: '/jobs', tenantId: OTHER_TEST_TENANT_ID });
    expect(jobIds(selectedTenant)).toEqual(['AIC-OTHER']);
    expect((await adminCall({ path: '/jobs' })).body.data).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ analysisJobId: 'AIC-OTHER' })
    ]));
    expect((await adminCall({ path: '/jobs/AIC-OTHER' })).status).toBe(404);
    const ownNotifications = await adminCall({ path: '/notifications' });
    expect(ownNotifications.body.data).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ notificationId: 'NOTIF-OTHER' })
    ]));
    const otherNotifications = await adminCall({ path: '/notifications', tenantId: OTHER_TEST_TENANT_ID });
    expect(otherNotifications.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ notificationId: 'NOTIF-OTHER', tenantId: OTHER_TEST_TENANT_ID })
    ]));
    const ownAudit = await adminCall({ path: '/audit-trail' });
    expect(ownAudit.body.data).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ eventId: 'AUDIT-OTHER' })
    ]));
    const otherAudit = await adminCall({ path: '/audit-trail', tenantId: OTHER_TEST_TENANT_ID });
    expect(otherAudit.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ eventId: 'AUDIT-OTHER', tenantId: OTHER_TEST_TENANT_ID })
    ]));
  });

  it('requires an explicit tenant scope for orchestration reads', async () => {
    const result = await adminCall({ path: '/jobs', tenantId: null });
    expect(result.status).toBe(403);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.tenantAssignmentRequired);
  });

  it('shows customer B only the assessment linked to their account', async () => {
    expect(jobIds(await send(harness, { path: '/jobs', token: customerBToken }))).toEqual(['AIC-B1']);
  });

  it('filters by status and treats ALL as no filter', async () => {
    expect(jobIds(await adminCall({ path: '/jobs', query: '?status=ANALYSIS_BLOCKED' }))).toEqual(['AIC-F1']);
    expect(jobIds(await adminCall({ path: '/jobs', query: '?status=ALL' })).length).toBe(8);
  });

  it('rejects an unknown status filter with a validation error', async () => {
    const result = await adminCall({ path: '/jobs', query: '?status=NOT_A_STATUS' });
    expect(result.status).toBe(400);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.validationFailed);
    expect(Array.isArray(result.body.errors)).toBe(true);
  });

  it('searches the customer name, job id and customer id without case sensitivity', async () => {
    expect(jobIds(await adminCall({ path: '/jobs', query: '?search=ALPHA' }))).toEqual(['AIC-A1', 'AIC-A2']);
    expect(jobIds(await adminCall({ path: '/jobs', query: '?search=aic-b1' }))).toEqual(['AIC-B1']);
    expect(jobIds(await adminCall({ path: '/jobs', query: '?search=CUST-USER-B' }))).toEqual(['AIC-B1']);
    expect(jobIds(await adminCall({ path: '/jobs', query: '?search=no-such-job' }))).toEqual([]);
  });

  it('treats an empty search as no filter', async () => {
    expect(jobIds(await adminCall({ path: '/jobs', query: '?search=' })).length).toBe(8);
  });

  it('rejects a search longer than the limit', async () => {
    const result = await adminCall({ path: '/jobs', query: `?search=${'x'.repeat(101)}` });
    expect(result.status).toBe(400);
  });
});

describe('job detail and readiness', () => {
  it('returns the full detail to an administrator', async () => {
    const result = await adminCall({ path: '/jobs/AIC-A1' });
    expect(result.status).toBe(200);
    const data = result.body.data;
    expect(data.job).toMatchObject({
      analysisJobId: 'AIC-A1',
      tenantId: TEST_TENANT_ID,
      customerName: 'Alpha Textile',
      uploadedBy: 'analyst@procucev.com',
      originalUploadId: 'DV-A1',
      currentDataVersionId: 'DV-A1',
      module1VersionId: 'm1-DV-A1',
      status: 'READY_FOR_GENERATION',
      totalSpendCr: 100,
      totalTransactions: 42,
      analysisPeriod: 'Jan 2023 - Dec 2023',
      slaHoursTarget: 48
    });
    expect(data.versions).toHaveLength(1);
    expect(data.versions[0]).toMatchObject({
      versionId: 'DV-A1',
      uploaderRole: 'ADMIN',
      fileType: 'XLSX',
      fileSizeMb: 2,
      source: 'CUSTOMER_ORIGINAL',
      processingStatus: 'PROCESSED',
      validationStatus: 'VALID',
      transactionCount: 42,
      supplierCount: 2,
      plantCount: 2,
      categoryCount: 2,
      spendInrCr: 2.25
    });
    expect(data.pcbiGaps).toHaveLength(2);
    expect(data.pcbiGaps[0]).toMatchObject({
      itemCategory: 'MG1',
      customerSpendInrCr: 2,
      transactionCount: 2,
      existingPcbiMapping: 'PCBI-TEST',
      status: 'PCBI_COVERED',
      resolutionStatus: 'MAPPED'
    });
    expect(data.reports).toEqual([]);
    expect(data.correctionRequests).toEqual([]);
    expect(data.readiness.overallReadiness).toBe('READY_TO_GENERATE');
    expect(data.readiness.categoryCoveragePct).toBe(100);
    expect(data.checklist).toBeUndefined();
    expect(data.acknowledgement).toBeUndefined();
  });

  it('returns the owning customer their job without the internal quality gate checklist', async () => {
    await generateReport();
    await confirmChecklist();
    const result = await customerCall({ path: '/jobs/AIC-A1' });
    expect(result.status).toBe(200);
    expect(result.body.data.checklist).toBeUndefined();
    expect(result.body.data.reports).toEqual([]);
    expect(result.body.data.job.reportVersionId).toBeUndefined();
    expect(result.body.data.job.status).toBe('ADMIN_REVIEW');
  });

  it('returns 403 when a customer asks for another customer job', async () => {
    const result = await customerCall({ path: '/jobs/AIC-B1' });
    expect(result.status).toBe(403);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.jobOutOfScope);
  });

  it('hides a customer job that has no data version with 404', async () => {
    const result = await customerCall({ path: '/jobs/AIC-C1' });
    expect(result.status).toBe(404);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.jobNotFound('AIC-C1'));
  });

  it('returns 404 for an unknown job id', async () => {
    const result = await adminCall({ path: '/jobs/AIC-ZZZ' });
    expect(result.status).toBe(404);
  });

  it('returns versions in order with parent links and per-version validation status', async () => {
    const result = await adminCall({ path: '/jobs/AIC-E1' });
    const [first, second] = result.body.data.versions;
    expect(first.parentVersionId).toBeUndefined();
    expect(first).toMatchObject({ versionId: 'DV-E1', processingStatus: 'PROCESSED', validationStatus: 'VALID' });
    expect(second).toMatchObject({
      versionId: 'DV-E2',
      parentVersionId: 'DV-E1',
      source: 'ADMIN_CORRECTION',
      processingStatus: 'PENDING',
      validationStatus: 'WARNINGS',
      supplierCount: 0
    });
    expect(result.body.data.job.currentDataVersionId).toBe('DV-E2');
  });

  it('reports the readiness reasons for a stale run, a failed run and low spend coverage', async () => {
    const stale = await adminCall({ path: '/jobs/AIC-E1/readiness' });
    expect(stale.body.data.blockingReasons[0]).toContain('RUN-E1');
    expect(stale.body.data.overallReadiness).toBe('ACTION_REQUIRED');

    const failed = await adminCall({ path: '/jobs/AIC-F1/readiness' });
    expect(failed.body.data.blockingReasons).toEqual([
      ORCHESTRATION_MESSAGES.readinessNotApproved('RUN-F1'),
      ORCHESTRATION_MESSAGES.readinessGatesFailed('RUN-F1')
    ]);

    const lowCoverage = await adminCall({ path: '/jobs/AIC-G1/readiness' });
    expect(lowCoverage.body.data.spendCoveragePct).toBe(50);
    expect(lowCoverage.body.data.blockingReasons).toEqual([
      ORCHESTRATION_MESSAGES.readinessBelowThreshold(50, 85)
    ]);
  });

  it('reports spend coverage as unavailable when addressable spend is missing', async () => {
    const result = await adminCall({ path: '/jobs/AIC-B1/readiness' });
    expect(result.body.data.spendCoveragePct).toBe(0);
    expect(result.body.data.blockingReasons).toEqual([ORCHESTRATION_MESSAGES.readinessSpendUnavailable('RUN-B1')]);
  });

  it('reports no-run readiness for a job that has data but no analysis', async () => {
    const result = await adminCall({ path: '/jobs/AIC-D1/readiness' });
    expect(result.body.data.categoryCoveragePct).toBe(0);
    expect(result.body.data.blockingReasons).toEqual([ORCHESTRATION_MESSAGES.readinessNoRun]);
  });

  it('blocks readiness when an approved run has no D1 procurement rows to review', async () => {
    harness.sqlite.prepare('DELETE FROM ProcurementTransaction WHERE assessment_id = ?').run('AIC-A2');
    const result = await adminCall({ path: '/jobs/AIC-A2/readiness' });
    expect(result.body.data.overallReadiness).toBe('ACTION_REQUIRED');
    expect(result.body.data.blockingReasons).toEqual([ORCHESTRATION_MESSAGES.readinessPcbiEvidenceUnavailable]);
  });

  it('lets the owning customer read readiness but not another customer', async () => {
    expect((await customerCall({ path: '/jobs/AIC-A1/readiness' })).status).toBe(200);
    expect((await send(harness, { path: '/jobs/AIC-A1/readiness', token: customerBToken })).status).toBe(403);
  });
});

describe('administrator KPIs, notifications and audit trail', () => {
  it('computes KPI counts from job status', async () => {
    const result = await adminCall({ path: '/admin/kpis' });
    expect(result.body.data).toEqual({
      newAnalyses: 3,
      pcbiReviewsPending: 0,
      dataCorrectionsPending: 0,
      reportsPendingReview: 0,
      reportsReadyToSubmit: 0,
      customerAcknowledgementsPending: 0,
      blockedAnalyses: 1,
      totalAnalyses: 8
    });
  });

  it('denies KPIs, notifications and the audit trail to customers', async () => {
    for (const path of ['/admin/kpis', '/notifications', '/audit-trail']) {
      const result = await customerCall({ path });
      expect(result.status).toBe(403);
      expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.adminRequired);
    }
  });

  it('lists the audit trail and notifications newest first after a workflow', async () => {
    const reportId = await submitReport();
    const audit = await adminCall({ path: '/audit-trail' });
    const eventTypes = audit.body.data.map((event: { eventType: string }) => event.eventType);
    expect(eventTypes).toEqual(expect.arrayContaining(['REPORT_GENERATED', 'QUALITY_GATE_SAVED', 'REPORT_SUBMITTED']));
    expect(audit.body.data[0].timestamp >= audit.body.data[audit.body.data.length - 1].timestamp).toBe(true);
    const generated = audit.body.data.find((event: { eventType: string }) => event.eventType === 'REPORT_GENERATED');
    expect(generated).toMatchObject({ entityId: reportId, actorRole: 'ADMIN', newState: 'ADMIN_REVIEW' });

    const notifications = await adminCall({ path: '/notifications' });
    expect(notifications.body.data).toHaveLength(1);
    expect(notifications.body.data[0]).toMatchObject({
      recipientType: 'CUSTOMER',
      severity: 'SUCCESS',
      read: false,
      emailDelivery: { status: 'NOT_SENT', retryCount: 0, lastError: ORCHESTRATION_MESSAGES.emailNotConfiguredLastError }
    });
  });
});

describe('quality gate', () => {
  it('stores a checklist as received and reports it as unbound when no report is awaiting review', async () => {
    const result = await adminCall({
      method: 'POST',
      path: '/jobs/AIC-A1/quality-gate',
      body: checklistBody({ unconfirmedDataQuality: true })
    });
    expect(result.status).toBe(200);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.checklistWithoutReport);
    const stored = harness.sqlite.prepare('SELECT is_complete, unconfirmed_count, report_version_id FROM OrchestrationQualityChecklist').all();
    expect(stored).toEqual([{ is_complete: 0, unconfirmed_count: 1, report_version_id: null }]);
  });

  it('reports the unconfirmed count when a report is awaiting review', async () => {
    await generateReport();
    const incomplete = await adminCall({
      method: 'POST',
      path: '/jobs/AIC-A1/quality-gate',
      body: checklistBody({ unconfirmedDataQuality: true })
    });
    expect(incomplete.body.message).toBe(ORCHESTRATION_MESSAGES.checklistIncompleteSaved(1));

    const complete = await confirmChecklist();
    expect(complete.body.message).toBe(ORCHESTRATION_MESSAGES.checklistConfirmed);
    const stored = harness.sqlite.prepare(
      'SELECT is_complete, confirmed_by, confirmed_at FROM OrchestrationQualityChecklist ORDER BY created_at DESC'
    ).all() as Array<Record<string, unknown>>;
    expect(stored[0]).toMatchObject({ is_complete: 1, confirmed_by: ADMIN_ID });
    expect(stored[0].confirmed_at).not.toBeNull();
  });

  it('rejects a checklist with a value that is not a boolean', async () => {
    const body = checklistBody();
    (body.dataQuality as Record<string, unknown>).sourceDataValidated = 'yes';
    const result = await adminCall({ method: 'POST', path: '/jobs/AIC-A1/quality-gate', body });
    expect(result.status).toBe(400);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.validationFailed);
  });

  it('denies the quality gate to customers', async () => {
    const result = await customerCall({ method: 'POST', path: '/jobs/AIC-A1/quality-gate', body: checklistBody() });
    expect(result.status).toBe(403);
  });

  it('returns 404 for an unknown job', async () => {
    const result = await adminCall({ method: 'POST', path: '/jobs/AIC-ZZZ/quality-gate', body: checklistBody() });
    expect(result.status).toBe(404);
  });
});

describe('report generation', () => {
  it('creates a report in ADMIN_REVIEW from the latest analysis run', async () => {
    const result = await generateReport();
    expect(result.status).toBe(200);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.reportGenerated);
    expect(result.body.report).toMatchObject({
      reportVersionId: 'RPT-AIC-A1-v1',
      analysisJobId: 'AIC-A1',
      datasetVersionId: 'DV-A1',
      status: 'GENERATED_PENDING_ADMIN_REVIEW',
      workflowState: 'ADMIN_REVIEW',
      isCustomerVisible: false,
      generatedBy: ADMIN_ID,
      pcbiStateVersion: 'NOT_RECORDED'
    });
    const detail = await adminCall({ path: '/jobs/AIC-A1' });
    expect(detail.body.data.job.status).toBe('ADMIN_REVIEW');
    expect(detail.body.data.job.reportVersionId).toBe('RPT-AIC-A1-v1');
    expect(detail.body.data.reports).toHaveLength(1);
  });

  it('refuses to generate while readiness is blocked', async () => {
    const result = await generateReport('AIC-B1');
    expect(result.status).toBe(409);
    expect(result.body.errorCategory).toBe('CONFLICT_ERROR');
    expect(result.body.blockingReasons).toEqual([ORCHESTRATION_MESSAGES.readinessSpendUnavailable('RUN-B1')]);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.reportNotReady(result.body.blockingReasons));
  });

  it('refuses a second active report while one is pending', async () => {
    await generateReport();
    const second = await generateReport();
    expect(second.status).toBe(409);
    expect(second.body.message).toBe(ORCHESTRATION_MESSAGES.reportAlreadyActive('RPT-AIC-A1-v1', 'ADMIN_REVIEW'));
  });

  it('refuses generation for a job with no analysis run', async () => {
    const result = await generateReport('AIC-D1');
    expect(result.status).toBe(409);
    expect(result.body.blockingReasons).toEqual([ORCHESTRATION_MESSAGES.readinessNoRun]);
  });

  it('rejects a body that is not a JSON object', async () => {
    const result = await adminCall({ method: 'POST', path: '/jobs/AIC-A1/generate-report', rawBody: '[]' });
    expect(result.status).toBe(400);
  });

  it('rejects malformed JSON in a request body', async () => {
    const result = await adminCall({ method: 'POST', path: '/jobs/AIC-A1/quality-gate', rawBody: '{not json' });
    expect(result.status).toBe(400);
    expect(result.body.errors[0].message).toBe(ORCHESTRATION_MESSAGES.invalidJson);
  });

  it('denies report generation to customers', async () => {
    const result = await customerCall({ method: 'POST', path: '/jobs/AIC-A1/generate-report', body: {} });
    expect(result.status).toBe(403);
  });

  it('returns 409 with a concurrency message when another writer takes the same sequence number', async () => {
    let injected = false;
    raceHook = (sql, sqlite) => {
      if (!injected && sql.includes('INSERT INTO OrchestrationReportVersion')) {
        injected = true;
        sqlite.prepare(
          "INSERT INTO OrchestrationReportVersion (report_version_id, assessment_id, sequence_number, analysis_run_id, "
            + "data_version_id, workflow_state, generated_by, generated_at) "
            + "VALUES ('RPT-RACE', 'AIC-A1', 1, 'RUN-A1', 'DV-A1', 'SUPERSEDED', 'other', '2026-01-01T00:00:00.000Z')"
        ).run();
      }
    };
    const result = await generateReport();
    expect(result.status).toBe(409);
    expect(result.body.message).toContain('saved at the same time');
    // The injected row and the failed insert are rolled back together, so no report row remains.
    expect(harness.sqlite.prepare('SELECT COUNT(*) AS total FROM OrchestrationReportVersion').get())
      .toEqual({ total: 0 });
  });
});

describe('approval and submission', () => {
  it('refuses approval before the checklist has been confirmed for the report', async () => {
    const generated = await generateReport();
    const reportId = generated.body.report.reportVersionId;
    const result = await adminCall({
      method: 'POST',
      path: '/jobs/AIC-A1/approve-and-submit',
      body: { reportVersionId: reportId }
    });
    expect(result.status).toBe(409);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.checklistMissing(reportId));
  });

  it('refuses approval while checklist items remain unconfirmed', async () => {
    const generated = await generateReport();
    const reportId = generated.body.report.reportVersionId;
    await adminCall({
      method: 'POST',
      path: '/jobs/AIC-A1/quality-gate',
      body: checklistBody({ unconfirmedDataQuality: true })
    });
    const result = await adminCall({
      method: 'POST',
      path: '/jobs/AIC-A1/approve-and-submit',
      body: { reportVersionId: reportId }
    });
    expect(result.status).toBe(409);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.checklistIncomplete(1));
  });

  it('approves a confirmed report, notifies the customer and records that no email was sent', async () => {
    const reportId = await submitReport();
    const result = await adminCall({ path: '/jobs/AIC-A1' });
    expect(result.body.data.job.status).toBe('SUBMITTED_TO_CUSTOMER');
    expect(result.body.data.reports[0]).toMatchObject({
      reportVersionId: reportId,
      status: 'SUBMITTED',
      isCustomerVisible: true,
      workflowState: 'SUBMITTED_TO_CUSTOMER',
      approvedBy: ADMIN_ID
    });
    const customer = await customerCall({ path: '/jobs/AIC-A1' });
    expect(customer.body.data.reports).toHaveLength(1);
    expect(customer.body.data.job.reportVersionId).toBe(reportId);
    expect(customer.body.data.job.submittedAt).toBeDefined();
    const notifications = harness.sqlite.prepare('SELECT email_status FROM OrchestrationNotification').all();
    expect(notifications).toEqual([{ email_status: 'NOT_SENT' }]);
  });

  it('returns the approval message stating that no email was sent', async () => {
    const generated = await generateReport();
    await confirmChecklist();
    const result = await adminCall({
      method: 'POST',
      path: '/jobs/AIC-A1/approve-and-submit',
      body: { reportVersionId: generated.body.report.reportVersionId }
    });
    expect(result.status).toBe(200);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.reportSubmitted);
  });

  it('reports email delivery after approval when the provider accepts the notification', async () => {
    const generated = await generateReport();
    await confirmChecklist();
    harness.sqlite.prepare(
      'UPDATE CustomerRecord SET contact_email = ?1 WHERE customer_id = ?2 AND tenant_id = ?3'
    ).run('finance@example.test', CUSTOMER_A_ID, TEST_TENANT_ID);
    harness.environment.RESEND_API_KEY = 'resend-test-token';
    harness.environment.RESEND_FROM = 'Reports <reports@example.test>';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ id: 'email-123' }), { status: 200 }));

    const result = await adminCall({
      method: 'POST',
      path: '/jobs/AIC-A1/approve-and-submit',
      body: { reportVersionId: generated.body.report.reportVersionId }
    });

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({
      success: true,
      emailStatus: 'SENT',
      message: ORCHESTRATION_MESSAGES.reportSubmittedEmailSent
    });
  });

  it('refuses to approve a report that is no longer awaiting review', async () => {
    const reportId = await submitReport();
    const again = await adminCall({ method: 'POST', path: '/jobs/AIC-A1/approve-and-submit', body: { reportVersionId: reportId } });
    expect(again.status).toBe(409);
    expect(again.body.message).toBe(ORCHESTRATION_MESSAGES.reportNotAwaitingReview(reportId, 'SUBMITTED_TO_CUSTOMER'));
  });

  it('refuses approval of a report whose checklist was confirmed for an older report', async () => {
    await submitReport();
    await adminCall({ method: 'POST', path: '/jobs/AIC-A1/supersede-report', body: { reportVersionId: 'RPT-AIC-A1-v1', reason: 'Replaced by corrected analysis' } });
    const generated = await generateReport();
    const reportId = generated.body.report.reportVersionId;
    const result = await adminCall({ method: 'POST', path: '/jobs/AIC-A1/approve-and-submit', body: { reportVersionId: reportId } });
    expect(result.status).toBe(409);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.checklistMissing(reportId));
  });

  it('returns 404 when the report id does not belong to the job', async () => {
    const result = await adminCall({ method: 'POST', path: '/jobs/AIC-A1/approve-and-submit', body: { reportVersionId: 'RPT-missing' } });
    expect(result.status).toBe(404);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.reportNotFound('RPT-missing'));
  });

  it('rejects an empty report id', async () => {
    const result = await adminCall({ method: 'POST', path: '/jobs/AIC-A1/approve-and-submit', body: { reportVersionId: '  ' } });
    expect(result.status).toBe(400);
  });

  it('refuses approval when the report changed between the check and the update', async () => {
    const generated = await generateReport();
    const reportId = generated.body.report.reportVersionId;
    await confirmChecklist();
    let changed = false;
    raceHook = (sql, sqlite) => {
      if (!changed && sql.includes("SET workflow_state = 'SUBMITTED_TO_CUSTOMER'")) {
        changed = true;
        sqlite.prepare("UPDATE OrchestrationReportVersion SET workflow_state = 'SUPERSEDED' WHERE report_version_id = ?1").run(reportId);
      }
    };
    const result = await adminCall({ method: 'POST', path: '/jobs/AIC-A1/approve-and-submit', body: { reportVersionId: reportId } });
    expect(result.status).toBe(409);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.stateChanged);
  });
});

describe('customer view and acknowledgement', () => {
  it('records the first view of a submitted report and treats repeat views as no-ops', async () => {
    const reportId = await submitReport();
    const first = await customerCall({ method: 'POST', path: '/jobs/AIC-A1/record-view', body: { reportVersionId: reportId } });
    expect(first.status).toBe(200);
    expect(first.body.message).toBe(ORCHESTRATION_MESSAGES.viewRecorded);
    const repeat = await customerCall({ method: 'POST', path: '/jobs/AIC-A1/record-view', body: { reportVersionId: reportId } });
    expect(repeat.body.message).toBe(ORCHESTRATION_MESSAGES.viewAlreadyRecorded);
    const detail = await customerCall({ path: '/jobs/AIC-A1' });
    expect(detail.body.data.job.status).toBe('CUSTOMER_VIEWED');
    expect(detail.body.data.job.customerViewedAt).toBeDefined();
  });

  it('refuses a view of a report that has not been submitted', async () => {
    const generated = await generateReport();
    const result = await customerCall({
      method: 'POST',
      path: '/jobs/AIC-A1/record-view',
      body: { reportVersionId: generated.body.report.reportVersionId }
    });
    expect(result.status).toBe(409);
    expect(result.body.message).toBe(
      ORCHESTRATION_MESSAGES.reportNotVisible(generated.body.report.reportVersionId, 'ADMIN_REVIEW')
    );
  });

  it('denies views to administrators and to other customers', async () => {
    const reportId = await submitReport();
    const admin = await adminCall({ method: 'POST', path: '/jobs/AIC-A1/record-view', body: { reportVersionId: reportId } });
    expect(admin.status).toBe(403);
    const other = await send(harness, {
      method: 'POST',
      path: '/jobs/AIC-A1/record-view',
      token: customerBToken,
      body: { reportVersionId: reportId }
    });
    expect(other.status).toBe(403);
  });

  it('refuses a view when the report changed between the check and the update', async () => {
    const reportId = await submitReport();
    let changed = false;
    raceHook = (sql, sqlite) => {
      if (!changed && sql.includes("SET workflow_state = 'CUSTOMER_VIEWED'")) {
        changed = true;
        sqlite.prepare("UPDATE OrchestrationReportVersion SET workflow_state = 'SUPERSEDED' WHERE report_version_id = ?1").run(reportId);
      }
    };
    const result = await customerCall({ method: 'POST', path: '/jobs/AIC-A1/record-view', body: { reportVersionId: reportId } });
    expect(result.status).toBe(409);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.stateChanged);
  });

  it('acknowledges a viewed report once and records the customer name and notes', async () => {
    const reportId = await submitReport();
    await customerCall({ method: 'POST', path: '/jobs/AIC-A1/record-view', body: { reportVersionId: reportId } });
    const ack = await customerCall({
      method: 'POST',
      path: '/jobs/AIC-A1/acknowledge',
      body: { reportVersionId: reportId, notes: '  Reviewed with finance  ' }
    });
    expect(ack.status).toBe(200);
    expect(ack.body.message).toBe(ORCHESTRATION_MESSAGES.acknowledged);
    expect(ack.body.acknowledgement).toMatchObject({
      reportVersionId: reportId,
      userId: CUSTOMER_A_ID,
      userName: 'Asha Customer',
      status: 'ACKNOWLEDGED',
      notes: 'Reviewed with finance'
    });
    const detail = await customerCall({ path: '/jobs/AIC-A1' });
    expect(detail.body.data.job.status).toBe('CUSTOMER_ACKNOWLEDGED');
    expect(detail.body.data.acknowledgement.reportVersionId).toBe(reportId);
    const adminDetail = await adminCall({ path: '/jobs/AIC-A1' });
    expect(adminDetail.body.data.acknowledgement.userName).toBe('Asha Customer');

    const second = await customerCall({ method: 'POST', path: '/jobs/AIC-A1/acknowledge', body: { reportVersionId: reportId } });
    expect(second.status).toBe(409);
    expect(second.body.message).toBe(ORCHESTRATION_MESSAGES.reportAlreadyAcknowledged(reportId));
  });

  it('stores no notes when the acknowledgement omits them', async () => {
    const reportId = await submitReport();
    await customerCall({ method: 'POST', path: '/jobs/AIC-A1/record-view', body: { reportVersionId: reportId } });
    const ack = await customerCall({ method: 'POST', path: '/jobs/AIC-A1/acknowledge', body: { reportVersionId: reportId } });
    expect(ack.body.acknowledgement.notes).toBeUndefined();
  });

  it('refuses acknowledgement before the report is viewed', async () => {
    const reportId = await submitReport();
    const result = await customerCall({ method: 'POST', path: '/jobs/AIC-A1/acknowledge', body: { reportVersionId: reportId } });
    expect(result.status).toBe(409);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.reportNotViewed(reportId));
  });

  it('refuses acknowledgement of a report that is not visible to the customer', async () => {
    const generated = await generateReport();
    const result = await customerCall({
      method: 'POST',
      path: '/jobs/AIC-A1/acknowledge',
      body: { reportVersionId: generated.body.report.reportVersionId }
    });
    expect(result.status).toBe(409);
    expect(result.body.message).toContain('not available to the customer');
  });

  it('rejects acknowledgement notes longer than the limit', async () => {
    const reportId = await submitReport();
    const result = await customerCall({
      method: 'POST',
      path: '/jobs/AIC-A1/acknowledge',
      body: { reportVersionId: reportId, notes: 'n'.repeat(2001) }
    });
    expect(result.status).toBe(400);
  });

  it('denies acknowledgement to administrators', async () => {
    const reportId = await submitReport();
    const result = await adminCall({ method: 'POST', path: '/jobs/AIC-A1/acknowledge', body: { reportVersionId: reportId } });
    expect(result.status).toBe(403);
  });

  it('refuses acknowledgement when the report changed between the check and the update', async () => {
    const reportId = await submitReport();
    await customerCall({ method: 'POST', path: '/jobs/AIC-A1/record-view', body: { reportVersionId: reportId } });
    let changed = false;
    raceHook = (sql, sqlite) => {
      if (!changed && sql.includes("SET workflow_state = 'CUSTOMER_ACKNOWLEDGED'")) {
        changed = true;
        sqlite.prepare("UPDATE OrchestrationReportVersion SET workflow_state = 'SUPERSEDED' WHERE report_version_id = ?1").run(reportId);
      }
    };
    const result = await customerCall({ method: 'POST', path: '/jobs/AIC-A1/acknowledge', body: { reportVersionId: reportId } });
    expect(result.status).toBe(409);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.stateChanged);
  });
});

describe('correction requests', () => {
  it('stores an OPEN correction request and notifies administrators', async () => {
    const result = await customerCall({
      method: 'POST',
      path: '/jobs/AIC-A1/request-correction',
      body: { category: 'INCORRECT_SUPPLIER_MAPPING', description: 'Supplier codes are merged incorrectly.' }
    });
    expect(result.status).toBe(200);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.correctionRequested);
    expect(result.body.request).toMatchObject({
      analysisJobId: 'AIC-A1',
      tenantId: TEST_TENANT_ID,
      userId: CUSTOMER_A_ID,
      category: 'INCORRECT_SUPPLIER_MAPPING',
      status: 'OPEN'
    });
    expect(result.body.request.supportingFileName).toBeUndefined();

    const detail = await adminCall({ path: '/jobs/AIC-A1' });
    expect(detail.body.data.correctionRequests).toHaveLength(1);
    const kpis = await adminCall({ path: '/admin/kpis' });
    expect(kpis.body.data.dataCorrectionsPending).toBe(1);
    const notifications = await adminCall({ path: '/notifications' });
    expect(notifications.body.data[0]).toMatchObject({ recipientType: 'ADMIN', severity: 'WARNING' });
  });

  it('keeps the supporting file name when one is given', async () => {
    const result = await customerCall({
      method: 'POST',
      path: '/jobs/AIC-A1/request-correction',
      body: { category: 'MISSING_TRANSACTIONS', description: 'Two plants are missing.', supportingFileName: 'plants.xlsx' }
    });
    expect(result.body.request.supportingFileName).toBe('plants.xlsx');
  });

  it('rejects a description shorter than the minimum', async () => {
    const result = await customerCall({
      method: 'POST',
      path: '/jobs/AIC-A1/request-correction',
      body: { category: 'OTHER', description: 'bad' }
    });
    expect(result.status).toBe(400);
  });

  it('denies correction requests to administrators and hides data-less jobs from customers', async () => {
    const admin = await adminCall({
      method: 'POST',
      path: '/jobs/AIC-A1/request-correction',
      body: { category: 'OTHER', description: 'Administrator attempt' }
    });
    expect(admin.status).toBe(403);
    const hidden = await customerCall({
      method: 'POST',
      path: '/jobs/AIC-C1/request-correction',
      body: { category: 'OTHER', description: 'No data yet' }
    });
    expect(hidden.status).toBe(404);
  });

  it('denies correction requests from a customer who does not own the job', async () => {
    const result = await send(harness, {
      method: 'POST',
      path: '/jobs/AIC-A1/request-correction',
      token: customerBToken,
      body: { category: 'OTHER', description: 'Wrong customer' }
    });
    expect(result.status).toBe(403);
  });
});

describe('supersession', () => {
  it('supersedes the report, returns the job to ready-for-generation and allows a new version', async () => {
    const reportId = await submitReport();
    const result = await adminCall({
      method: 'POST',
      path: '/jobs/AIC-A1/supersede-report',
      body: { reportVersionId: reportId, reason: 'Corrected supplier mapping' }
    });
    expect(result.status).toBe(200);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.reportSuperseded(reportId));
    const detail = await adminCall({ path: '/jobs/AIC-A1' });
    expect(detail.body.data.job.status).toBe('READY_FOR_GENERATION');
    expect(detail.body.data.reports[0]).toMatchObject({ status: 'SUPERSEDED', isCustomerVisible: false });
    const customer = await customerCall({ path: '/jobs/AIC-A1' });
    expect(customer.body.data.reports).toEqual([]);

    const regenerated = await generateReport();
    expect(regenerated.body.report.reportVersionId).toBe('RPT-AIC-A1-v2');
  });

  it('refuses to supersede the same report twice', async () => {
    const reportId = await submitReport();
    await adminCall({ method: 'POST', path: '/jobs/AIC-A1/supersede-report', body: { reportVersionId: reportId, reason: 'First reason' } });
    const again = await adminCall({ method: 'POST', path: '/jobs/AIC-A1/supersede-report', body: { reportVersionId: reportId, reason: 'Second reason' } });
    expect(again.status).toBe(409);
    expect(again.body.message).toBe(ORCHESTRATION_MESSAGES.reportAlreadySuperseded(reportId));
  });

  it('rejects a reason shorter than the minimum', async () => {
    const reportId = await submitReport();
    const result = await adminCall({ method: 'POST', path: '/jobs/AIC-A1/supersede-report', body: { reportVersionId: reportId, reason: 'no' } });
    expect(result.status).toBe(400);
  });

  it('returns 404 when the report belongs to a different job', async () => {
    const otherReport = await submitReport('AIC-A2');
    const result = await adminCall({
      method: 'POST',
      path: '/jobs/AIC-A1/supersede-report',
      body: { reportVersionId: otherReport, reason: 'Wrong job on purpose' }
    });
    expect(result.status).toBe(404);
  });

  it('refuses supersession when the report changed between the check and the update', async () => {
    const generated = await generateReport();
    const reportId = generated.body.report.reportVersionId;
    let changed = false;
    raceHook = (sql, sqlite) => {
      if (!changed && sql.includes("SET workflow_state = 'SUPERSEDED'")) {
        changed = true;
        sqlite.prepare("UPDATE OrchestrationReportVersion SET workflow_state = 'SUPERSEDED' WHERE report_version_id = ?1").run(reportId);
      }
    };
    const result = await adminCall({
      method: 'POST',
      path: '/jobs/AIC-A1/supersede-report',
      body: { reportVersionId: reportId, reason: 'Race with another admin' }
    });
    expect(result.status).toBe(409);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.stateChanged);
  });

  it('denies supersession to customers', async () => {
    const reportId = await submitReport();
    const result = await customerCall({
      method: 'POST',
      path: '/jobs/AIC-A1/supersede-report',
      body: { reportVersionId: reportId, reason: 'Customer attempt' }
    });
    expect(result.status).toBe(403);
  });
});

describe('resending notifications', () => {
  it('records a NOT_SENT notification and answers 503 with guidance', async () => {
    const reportId = await submitReport();
    const result = await adminCall({
      method: 'POST',
      path: '/jobs/AIC-A1/resend-notification',
      body: { reportVersionId: reportId }
    });
    expect(result.status).toBe(503);
    expect(result.body).toMatchObject({ success: false, message: ORCHESTRATION_MESSAGES.emailNotConfigured });
    expect(result.body.notification.emailDelivery.status).toBe('NOT_SENT');
    const audit = await adminCall({ path: '/audit-trail' });
    expect(audit.body.data.map((event: { eventType: string }) => event.eventType))
      .toContain('NOTIFICATION_RESEND_ATTEMPTED');
  });

  it('sends the report email and persists the SENT status when provider credentials and customer email exist', async () => {
    const reportId = await submitReport();
    harness.sqlite.prepare(
      'UPDATE CustomerRecord SET contact_email = ?1 WHERE customer_id = ?2 AND tenant_id = ?3'
    ).run('finance@example.test', CUSTOMER_A_ID, TEST_TENANT_ID);
    harness.environment.RESEND_API_KEY = 'resend-test-token';
    harness.environment.RESEND_FROM = 'Reports <reports@example.test>';
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'email-123' }), { status: 200 })
    );

    const result = await adminCall({
      method: 'POST',
      path: '/jobs/AIC-A1/resend-notification',
      body: { reportVersionId: reportId }
    });

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ success: true, message: ORCHESTRATION_MESSAGES.notificationEmailSent });
    expect(result.body.notification.emailDelivery).toMatchObject({ status: 'SENT', retryCount: 1 });
    expect(harness.sqlite.prepare(
      'SELECT email_status, email_retry_count FROM OrchestrationNotification ORDER BY created_at DESC LIMIT 1'
    ).get()).toEqual({ email_status: 'SENT', email_retry_count: 1 });
    expect(fetch).toHaveBeenCalledWith('https://api.resend.com/emails', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer resend-test-token' })
    }));
    const requestBody = JSON.parse(String(fetch.mock.calls[0]?.[1]?.body)) as { to: string[] };
    expect(requestBody.to).toEqual(['finance@example.test']);
  });

  it('records a failed provider response and returns actionable resend guidance', async () => {
    const reportId = await submitReport();
    harness.sqlite.prepare(
      'UPDATE CustomerRecord SET contact_email = ?1 WHERE customer_id = ?2 AND tenant_id = ?3'
    ).run('finance@example.test', CUSTOMER_A_ID, TEST_TENANT_ID);
    harness.environment.RESEND_API_KEY = 'resend-test-token';
    harness.environment.RESEND_FROM = 'Reports <reports@example.test>';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'Provider rate limit' }), { status: 429 })
    );

    const result = await adminCall({
      method: 'POST',
      path: '/jobs/AIC-A1/resend-notification',
      body: { reportVersionId: reportId }
    });

    expect(result.status).toBe(503);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.notificationProviderFailed('Provider rate limit'));
    expect(result.body.notification.emailDelivery).toMatchObject({
      status: 'FAILED',
      retryCount: 1,
      lastError: 'Provider rate limit'
    });
  });

  it('records a provider network exception as FAILED and allows a later retry', async () => {
    const reportId = await submitReport();
    harness.sqlite.prepare(
      'UPDATE CustomerRecord SET contact_email = ?1 WHERE customer_id = ?2 AND tenant_id = ?3'
    ).run('finance@example.test', CUSTOMER_A_ID, TEST_TENANT_ID);
    harness.environment.RESEND_API_KEY = 'resend-test-token';
    harness.environment.RESEND_FROM = 'Reports <reports@example.test>';
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network unavailable'));

    const result = await adminCall({
      method: 'POST',
      path: '/jobs/AIC-A1/resend-notification',
      body: { reportVersionId: reportId }
    });

    expect(result.status).toBe(503);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.notificationProviderFailed('Network unavailable'));
    expect(result.body.notification.emailDelivery).toMatchObject({ status: 'FAILED', lastError: 'Network unavailable' });
  });

  it('returns a server error if the email delivery result cannot be persisted', async () => {
    const reportId = await submitReport();
    harness.sqlite.prepare(
      'UPDATE CustomerRecord SET contact_email = ?1 WHERE customer_id = ?2 AND tenant_id = ?3'
    ).run('finance@example.test', CUSTOMER_A_ID, TEST_TENANT_ID);
    harness.environment.RESEND_API_KEY = 'resend-test-token';
    harness.environment.RESEND_FROM = 'Reports <reports@example.test>';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ id: 'email-123' }), { status: 200 }));
    raceHook = (sql, sqlite) => {
      if (sql.includes('UPDATE OrchestrationNotification')) {
        sqlite.prepare('DELETE FROM OrchestrationNotification').run();
      }
    };

    const result = await adminCall({
      method: 'POST',
      path: '/jobs/AIC-A1/resend-notification',
      body: { reportVersionId: reportId }
    });

    expect(result.status).toBe(500);
  });

  it('does not call the provider when the customer record has no contact email', async () => {
    const reportId = await submitReport();
    harness.sqlite.prepare('UPDATE CustomerRecord SET contact_email = NULL WHERE customer_id = ? AND tenant_id = ?')
      .run(CUSTOMER_A_ID, TEST_TENANT_ID);
    harness.environment.RESEND_API_KEY = 'resend-test-token';
    harness.environment.RESEND_FROM = 'Reports <reports@example.test>';
    const fetch = vi.spyOn(globalThis, 'fetch');

    const result = await adminCall({
      method: 'POST',
      path: '/jobs/AIC-A1/resend-notification',
      body: { reportVersionId: reportId }
    });

    expect(result.status).toBe(503);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.notificationRecipientMissing);
    expect(result.body.notification.emailDelivery.status).toBe('NOT_SENT');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('refuses to resend for a report that has not been submitted', async () => {
    const generated = await generateReport();
    const result = await adminCall({
      method: 'POST',
      path: '/jobs/AIC-A1/resend-notification',
      body: { reportVersionId: generated.body.report.reportVersionId }
    });
    expect(result.status).toBe(409);
  });

  it('rejects a resend without a report id', async () => {
    const result = await adminCall({ method: 'POST', path: '/jobs/AIC-A1/resend-notification', body: {} });
    expect(result.status).toBe(400);
  });
});

describe('PCBI gap resolution and corrected dataset workflows', () => {
  it('lists category gaps from current-version transactions and saves an audited mapping', async () => {
    harness.sqlite.prepare(
      'DELETE FROM OrchestrationPCBIGapResolution WHERE assessment_id = ? AND category_key = ?'
    ).run('AIC-A1', 'MG1');
    const detail = await adminCall({ path: '/jobs/AIC-A1' });
    const gap = detail.body.data.pcbiGaps.find((entry: { itemCategory: string }) => entry.itemCategory === 'MG1');
    expect(gap).toMatchObject({
      customerSpendInrCr: 2,
      transactionCount: 2,
      supplierCount: 2,
      plantCount: 2,
      status: 'PCBI_REQUIRED',
      resolutionStatus: 'PENDING'
    });
    expect(detail.body.data.readiness).toMatchObject({
      categoryCoveragePct: 50,
      categoriesRequiringReview: 1,
      overallReadiness: 'ACTION_REQUIRED'
    });

    const result = await adminCall({
      method: 'POST',
      path: `/jobs/AIC-A1/pcbi-gap/${gap.gapId}/resolve`,
      body: { action: 'MAP_EXISTING', targetPcbiSeries: 'PCBI-TEST' }
    });
    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({
      success: true,
      message: ORCHESTRATION_MESSAGES.pcbiGapResolved,
      gap: { status: 'PCBI_COVERED', resolutionStatus: 'MAPPED', existingPcbiMapping: 'PCBI-TEST' }
    });
    expect(harness.sqlite.prepare(
      'SELECT action, target_pcbi_series FROM OrchestrationPCBIGapResolution WHERE assessment_id = ? AND category_key = ?'
    ).get('AIC-A1', 'MG1')).toEqual({ action: 'MAP_EXISTING', target_pcbi_series: 'PCBI-TEST' });
    expect(harness.sqlite.prepare(
      'SELECT event_type, entity_type FROM OrchestrationAuditEvent WHERE assessment_id = ? ORDER BY created_at DESC LIMIT 1'
    ).get('AIC-A1')).toEqual({ event_type: 'PCBI_GAP_RESOLVED', entity_type: 'OrchestrationPCBIGapResolution' });
  });

  it('validates active benchmark series and rejects unknown categories', async () => {
    harness.sqlite.prepare(
      'DELETE FROM OrchestrationPCBIGapResolution WHERE assessment_id = ? AND category_key = ?'
    ).run('AIC-A1', 'MG1');
    const detail = await adminCall({ path: '/jobs/AIC-A1' });
    const gap = detail.body.data.pcbiGaps.find((entry: { itemCategory: string }) => entry.itemCategory === 'MG1');
    const missingSeries = await adminCall({
      method: 'POST', path: `/jobs/AIC-A1/pcbi-gap/${gap.gapId}/resolve`,
      body: { action: 'MAP_EXISTING', targetPcbiSeries: 'PCBI-MISSING' }
    });
    expect(missingSeries.status).toBe(404);
    expect(missingSeries.body.message).toBe(ORCHESTRATION_MESSAGES.pcbiSeriesNotFound('PCBI-MISSING'));

    const missingTarget = await adminCall({
      method: 'POST', path: `/jobs/AIC-A1/pcbi-gap/${gap.gapId}/resolve`, body: { action: 'MAP_EXISTING' }
    });
    expect(missingTarget.status).toBe(400);

    const unknownGap = await adminCall({
      method: 'POST', path: '/jobs/AIC-A1/pcbi-gap/PCBI-GAP-unknown/resolve',
      body: { action: 'REQUEST_RESEARCH' }
    });
    expect(unknownGap.status).toBe(404);
    expect(unknownGap.body.message).toBe(ORCHESTRATION_MESSAGES.pcbiGapNotFound('PCBI-GAP-unknown'));
  });

  it('requires a current data version before resolving a PCBI category', async () => {
    const result = await adminCall({
      method: 'POST', path: '/jobs/AIC-C1/pcbi-gap/PCBI-GAP-unknown/resolve',
      body: { action: 'REQUEST_RESEARCH' }
    });
    expect(result.status).toBe(409);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.readinessPcbiEvidenceUnavailable);
  });

  it('persists exclusion, service, non-benchmarkable, research, and add-map decisions', async () => {
    harness.sqlite.prepare(
      'DELETE FROM OrchestrationPCBIGapResolution WHERE assessment_id = ? AND category_key = ?'
    ).run('AIC-A1', 'MG1');
    const detail = await adminCall({ path: '/jobs/AIC-A1' });
    const gap = detail.body.data.pcbiGaps.find((entry: { itemCategory: string }) => entry.itemCategory === 'MG1');
    const cases = [
      { body: { action: 'EXCLUDE', exclusionReason: 'OTHER', exclusionNotes: 'No benchmark evidence' }, status: 'EXCLUDED' },
      { body: { action: 'MARK_NOT_BENCHMARKABLE' }, status: 'EXCLUDED' },
      { body: { action: 'MARK_SERVICE' }, status: 'EXCLUDED' },
      { body: { action: 'REQUEST_RESEARCH' }, status: 'RESEARCH_REQUESTED' },
      { body: { action: 'ADD_MAP_PCBI', targetPcbiSeries: 'PCBI-TEST' }, status: 'MAPPED' }
    ];
    for (const { body, status } of cases) {
      const result = await adminCall({
        method: 'POST', path: `/jobs/AIC-A1/pcbi-gap/${gap.gapId}/resolve`, body
      });
      expect(result.status).toBe(200);
      expect(result.body.gap.resolutionStatus).toBe(status);
    }
    expect(harness.sqlite.prepare(
      'SELECT action FROM OrchestrationPCBIGapResolution WHERE assessment_id = ? AND category_key = ?'
    ).get('AIC-A1', 'MG1')).toEqual({ action: 'ADD_MAP_PCBI' });
  });

  it('keeps PCBI gaps private to customer accounts and refuses to report with an unresolved category', async () => {
    harness.sqlite.prepare(
      'DELETE FROM OrchestrationPCBIGapResolution WHERE assessment_id = ? AND category_key = ?'
    ).run('AIC-A1', 'MG1');
    const customerDetail = await customerCall({ path: '/jobs/AIC-A1' });
    expect(customerDetail.body.data.pcbiGaps).toEqual([]);
    const report = await generateReport();
    expect(report.status).toBe(409);
    expect(report.body.blockingReasons).toContain(ORCHESTRATION_MESSAGES.readinessPcbiReviewPending(1));
  });

  it('stores a corrected dataset in R2 and D1, reruns Module 1, and records its lineage', async () => {
    const storedObjects = new Map<string, Uint8Array>();
    harness.environment.R2_BUCKET = 'test-assessments';
    harness.environment.OBJECTS = {
      put: vi.fn(async (key, value) => {
        storedObjects.set(key, value instanceof Uint8Array ? value : new Uint8Array(value as ArrayBuffer));
      }),
      get: vi.fn(async () => null),
      delete: vi.fn(async (key) => { storedObjects.delete(key); })
    };
    const upload = await adminCall({
      method: 'POST', path: '/jobs/AIC-A1/upload-corrected-dataset', body: correctedUploadBody
    });
    expect(upload.status).toBe(200);
    expect(upload.body).toMatchObject({
      success: true,
      analysisStatus: 'COMPLETED',
      newVersion: {
        parentVersionId: 'DV-A1',
        correctionReason: 'INCORRECT_CATEGORY_MAPPING',
        fileName: correctedUploadBody.fileName,
        uploadedBy: 'System Administrator',
        processingStatus: 'PROCESSED'
      }
    });
    expect(storedObjects.size).toBe(1);
    expect([...Array.from(storedObjects.values())[0]]).toEqual([...correctedFileBytes]);
    expect(harness.sqlite.prepare('SELECT COUNT(*) AS count FROM ProcurementTransaction WHERE source_document_id = ?')
      .get(upload.body.newVersion.versionId).count).toBe(1);
    expect(harness.sqlite.prepare('SELECT COUNT(*) AS count FROM AssessmentAnalysisRun WHERE assessment_id = ? AND data_version_id = ?')
      .get('AIC-A1', upload.body.newVersion.versionId).count).toBe(1);
    expect(harness.sqlite.prepare('SELECT event_type, entity_id FROM OrchestrationAuditEvent WHERE assessment_id = ?')
      .all('AIC-A1')).toContainEqual({ event_type: 'DATASET_CORRECTED', entity_id: upload.body.newVersion.versionId });
    const details = await adminCall({ path: '/jobs/AIC-A1' });
    const versions = details.body.data.versions as Array<Record<string, unknown>>;
    expect(versions[versions.length - 1]).toMatchObject({
      versionId: upload.body.newVersion.versionId,
      parentVersionId: 'DV-A1',
      correctionReason: 'INCORRECT_CATEGORY_MAPPING'
    });
  });

  it('returns a service error when the dataset upload does not return a version ID', async () => {
    harness.environment.OBJECTS = {
      put: vi.fn(async () => undefined), get: vi.fn(async () => null), delete: vi.fn(async () => undefined)
    };
    vi.spyOn(assessmentDataVersionD1, 'uploadAssessmentDataVersion')
      .mockResolvedValueOnce({ data: { success: true } } as never);

    const result = await adminCall({
      method: 'POST', path: '/jobs/AIC-A1/upload-corrected-dataset', body: correctedUploadBody
    });

    expect(result.status).toBe(503);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.correctedDatasetVersionMissing);
  });

  it('returns a descriptive fallback when reanalysis returns a failure without a message', async () => {
    harness.environment.OBJECTS = {
      put: vi.fn(async () => undefined), get: vi.fn(async () => null), delete: vi.fn(async () => undefined)
    };
    vi.spyOn(assessmentAnalysisD1, 'runAssessmentAnalysisFromD1')
      .mockResolvedValueOnce({ status: 500, data: { success: false } } as never);

    const result = await adminCall({
      method: 'POST', path: '/jobs/AIC-A1/upload-corrected-dataset', body: correctedUploadBody
    });

    expect(result.status).toBe(202);
    expect(result.body).toMatchObject({ success: true, analysisStatus: 'FAILED' });
    expect(result.body.message).toContain(ORCHESTRATION_MESSAGES.analysisCouldNotRun);
  });

  it('uses the previously loaded job if it disappears after the corrected upload', async () => {
    harness.environment.OBJECTS = {
      put: vi.fn(async () => undefined), get: vi.fn(async () => null), delete: vi.fn(async () => undefined)
    };
    vi.spyOn(assessmentAnalysisD1, 'runAssessmentAnalysisFromD1')
      .mockResolvedValueOnce({ data: { success: true } } as never);
    const findJobRow = orchestrationStore.findJobRow;
    vi.spyOn(orchestrationStore, 'findJobRow')
      .mockImplementationOnce((database, assessmentId, tenantId) => findJobRow(database, assessmentId, tenantId))
      .mockResolvedValueOnce(null);

    const result = await adminCall({
      method: 'POST', path: '/jobs/AIC-A1/upload-corrected-dataset', body: correctedUploadBody
    });

    expect(result.status).toBe(200);
    expect(result.body.success).toBe(true);
  });

  it('validates corrected dataset content and reports missing R2 configuration', async () => {
    const invalid = await adminCall({ method: 'POST', path: '/jobs/AIC-A1/upload-corrected-dataset', body: {} });
    expect(invalid.status).toBe(400);
    expect(invalid.body.errorCategory).toBe('VALIDATION_ERROR');
    expect(harness.environment.OBJECTS).toBeUndefined();

    const noStorage = await adminCall({
      method: 'POST', path: '/jobs/AIC-A1/upload-corrected-dataset', body: correctedUploadBody
    });
    expect(noStorage.status).toBe(503);
    expect(noStorage.body.message).toBe(ORCHESTRATION_MESSAGES.datasetStorageNotConfigured);

    harness.environment.OBJECTS = {
      put: vi.fn(), get: vi.fn(async () => null), delete: vi.fn(async () => undefined)
    };
    const badChecksum = await adminCall({
      method: 'POST',
      path: '/jobs/AIC-A1/upload-corrected-dataset',
      body: { ...correctedUploadBody, checksum: '0'.repeat(64) }
    });
    expect(badChecksum.status).toBe(400);
    expect(harness.environment.OBJECTS.put).not.toHaveBeenCalled();
  });

  it('keeps a corrected version pending when the file has no transaction rows', async () => {
    const storedObjects = new Map<string, Uint8Array>();
    harness.environment.OBJECTS = {
      put: vi.fn(async (key, value) => {
        storedObjects.set(key, value instanceof Uint8Array ? value : new Uint8Array(value as ArrayBuffer));
      }),
      get: vi.fn(async () => null),
      delete: vi.fn(async (key) => { storedObjects.delete(key); })
    };
    const result = await adminCall({
      method: 'POST',
      path: '/jobs/AIC-A1/upload-corrected-dataset',
      body: correctedUploadFor('PO Number,Supplier Name,Description,Quantity,Net Price,Currency')
    });
    expect(result.status).toBe(202);
    expect(result.body).toMatchObject({ success: true, analysisStatus: 'PENDING', newVersion: { processingStatus: 'PENDING' } });
    expect(result.body.message).toContain('has no imported D1 transaction');
    expect(storedObjects.size).toBe(1);
  });

  it('preserves the uploaded version and reports a failed Module 1 retry with the request id', async () => {
    harness.environment.OBJECTS = {
      put: vi.fn(async () => undefined), get: vi.fn(async () => null), delete: vi.fn(async () => undefined)
    };
    raceHook = (sql) => {
      if (sql.includes('INSERT INTO AssessmentAnalysisRun')) throw new Error('analysis storage unavailable');
    };
    const result = await adminCall({
      method: 'POST', path: '/jobs/AIC-A1/upload-corrected-dataset', body: correctedUploadBody, requestId: 'correction-req-9'
    });
    expect(result.status).toBe(202);
    expect(result.body).toMatchObject({ success: true, analysisStatus: 'FAILED' });
    expect(result.body.message).toContain('Module 1 could not finish');
    expect(harness.sqlite.prepare('SELECT COUNT(*) AS count FROM AssessmentDataVersion WHERE assessment_id = ?')
      .get('AIC-A1').count).toBe(2);
  });

  it('denies the admin-only corrected dataset upload endpoint to customers', async () => {
    const result = await customerCall({ method: 'POST', path: '/jobs/AIC-A1/upload-corrected-dataset', body: {} });
    expect(result.status).toBe(403);
  });
});

describe('R2-backed source dataset download', () => {
  const objectKey = 'assessments/AIC-A1/DV-A1/source.csv';
  const fileContents = 'supplier,spend\nSupplier One,10\n';

  const seedStoredDataset = (overrides: {
    filePath?: string | null;
    objectKey?: string;
    filename?: string;
    contentType?: string;
    sizeBytes?: number;
    status?: string;
  } = {}): void => {
    const key = overrides.objectKey ?? objectKey;
    const path = overrides.filePath === undefined ? key : overrides.filePath;
    harness.sqlite.prepare('UPDATE AssessmentDataVersion SET file_path = ? WHERE data_version_id = ?')
      .run(path, 'DV-A1');
    if (path === null) return;
    harness.sqlite.prepare(`INSERT INTO ObjectMetadata (
      object_key, tenant_id, assessment_id, filename, content_type, size_bytes, sha256, bucket, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(
        key, 'TNT-TEST', 'AIC-A1', overrides.filename ?? 'spend data.csv',
        overrides.contentType ?? 'text/csv', overrides.sizeBytes ?? new TextEncoder().encode(fileContents).byteLength,
        'sha256-test', 'test-bucket', overrides.status ?? 'AVAILABLE'
      );
  };

  const installObjectStore = (object: { body: ReadableStream; httpMetadata?: { contentType?: string }; httpEtag?: string } | null) => {
    const get = vi.fn(async () => object);
    harness.environment.OBJECTS = {
      put: vi.fn(async () => undefined),
      get,
      delete: vi.fn(async () => undefined)
    };
    return get;
  };

  it('streams the D1 catalogued R2 object with download, cache, CORS, and request headers', async () => {
    seedStoredDataset();
    const get = installObjectStore({
      body: new Response(fileContents).body!,
      httpMetadata: { contentType: 'text/plain' },
      httpEtag: '"dataset-etag"'
    });
    const result = await adminCall({ path: '/jobs/AIC-A1/download-dataset/DV-A1', origin: 'https://app.example' });

    expect(result.status).toBe(200);
    expect(await result.response.text()).toBe(fileContents);
    expect(get).toHaveBeenCalledWith(objectKey);
    expect(result.headers.get('Content-Type')).toBe('text/csv');
    expect(result.headers.get('Content-Disposition')).toBe("attachment; filename*=UTF-8''spend%20data.csv");
    expect(result.headers.get('Content-Length')).toBe(String(new TextEncoder().encode(fileContents).byteLength));
    expect(result.headers.get('Cache-Control')).toBe('private, no-store');
    expect(result.headers.get('ETag')).toBe('"dataset-etag"');
    expect(result.headers.get('Access-Control-Allow-Origin')).toBe('https://app.example');
    expect(result.headers.get('X-Request-Id')).toMatch(/^req-/);
  });

  it('returns 404 when the requested data version does not belong to the job', async () => {
    const result = await adminCall({ path: '/jobs/AIC-A1/download-dataset/DV-MISSING' });

    expect(result.status).toBe(404);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.datasetVersionNotFound('DV-MISSING'));
  });

  it('returns 404 when the D1 file catalog is missing the uploaded object metadata', async () => {
    harness.sqlite.prepare('UPDATE AssessmentDataVersion SET file_path = ? WHERE data_version_id = ?')
      .run(objectKey, 'DV-A1');
    const get = installObjectStore(null);
    const result = await adminCall({ path: '/jobs/AIC-A1/download-dataset/DV-A1' });

    expect(result.status).toBe(404);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.datasetFileUnavailable('DV-A1'));
    expect(get).not.toHaveBeenCalled();
  });

  it('returns 404 when the D1 catalog marks the uploaded object unavailable', async () => {
    seedStoredDataset({ status: 'DELETED' });
    const get = installObjectStore(null);
    const result = await adminCall({ path: '/jobs/AIC-A1/download-dataset/DV-A1' });

    expect(result.status).toBe(404);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.datasetFileUnavailable('DV-A1'));
    expect(get).not.toHaveBeenCalled();
  });

  it('returns 503 with setup guidance when the R2 binding is absent', async () => {
    seedStoredDataset();
    const result = await adminCall({ path: '/jobs/AIC-A1/download-dataset/DV-A1' });

    expect(result.status).toBe(503);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.datasetStorageNotConfigured);
  });

  it('returns 404 when R2 no longer has the object recorded in D1', async () => {
    seedStoredDataset();
    const get = installObjectStore(null);
    const result = await adminCall({ path: '/jobs/AIC-A1/download-dataset/DV-A1' });

    expect(result.status).toBe(404);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.datasetFileUnavailable('DV-A1'));
    expect(get).toHaveBeenCalledWith(objectKey);
  });

  it('uses safe metadata fallbacks when optional catalog and R2 response headers are absent', async () => {
    seedStoredDataset({ filename: '', contentType: '', sizeBytes: 0 });
    installObjectStore({ body: new Response(fileContents).body!, httpMetadata: { contentType: 'text/plain' } });
    const result = await adminCall({ path: '/jobs/AIC-A1/download-dataset/DV-A1' });

    expect(result.status).toBe(200);
    expect(result.headers.get('Content-Type')).toBe('text/plain');
    expect(result.headers.get('Content-Disposition')).toBe("attachment; filename*=UTF-8''Spend.xlsx");
    expect(result.headers.get('Content-Length')).toBeNull();
    expect(result.headers.get('ETag')).toBeNull();
  });

  it('uses the binary content type when both D1 and R2 omit a content type', async () => {
    seedStoredDataset({ contentType: '' });
    installObjectStore({ body: new Response(fileContents).body! });

    const result = await adminCall({ path: '/jobs/AIC-A1/download-dataset/DV-A1' });

    expect(result.status).toBe(200);
    expect(result.headers.get('Content-Type')).toBe('application/octet-stream');
  });
});

describe('execution without batch support', () => {
  it('rejects a multi-row report generation before persisting the report or audit event', async () => {
    harness.close();
    harness = createHarness({ withBatch: false, beforeStatement });
    seedStandardFixtures(harness.sqlite);
    adminToken = await tokenFor(ADMIN_ID);
    customerToken = await tokenFor(CUSTOMER_A_ID);
    const result = await generateReport();
    expect(result.status).toBe(503);
    expect(result.body.message).toBe(ORCHESTRATION_MESSAGES.atomicWriteUnavailable);
    expect(harness.sqlite.prepare('SELECT COUNT(*) AS count FROM OrchestrationReportVersion').get()).toEqual({ count: 0 });
    expect(harness.sqlite.prepare('SELECT COUNT(*) AS count FROM OrchestrationAuditEvent').get()).toEqual({ count: 0 });
  });

  it('checks batch support before changing a report state through the approval compare-and-set', async () => {
    const report = await generateReport();
    const reportId = report.body.report.reportVersionId as string;
    await confirmChecklist();
    const auditsBefore = harness.sqlite.prepare('SELECT COUNT(*) AS count FROM OrchestrationAuditEvent').get();
    delete harness.database.batch;

    const result = await adminCall({
      method: 'POST',
      path: '/jobs/AIC-A1/approve-and-submit',
      body: { reportVersionId: reportId }
    });

    expect(result.status).toBe(503);
    expect(harness.sqlite.prepare('SELECT workflow_state FROM OrchestrationReportVersion WHERE report_version_id = ?')
      .get(reportId)).toEqual({ workflow_state: 'ADMIN_REVIEW' });
    expect(harness.sqlite.prepare('SELECT COUNT(*) AS count FROM OrchestrationNotification').get()).toEqual({ count: 0 });
    expect(harness.sqlite.prepare('SELECT COUNT(*) AS count FROM OrchestrationAuditEvent').get()).toEqual(auditsBefore);
  });
});

describe('dispatch from the Worker entry point', () => {
  it('ignores paths outside the orchestration prefix', async () => {
    const url = new URL('https://edge.example/api/orchestrationjobs');
    const result = await handleOrchestrationRoute(new Request(url), harness.environment, url);
    expect(result).toBeNull();
  });

  it('serves requests with the default runtime and a generated request id', async () => {
    const url = new URL('https://edge.example/api/orchestration/jobs');
    const request = new Request(url, { headers: { Authorization: `Bearer ${adminToken}` } });
    const response = await handleOrchestrationRoute(request, harness.environment, url);
    expect(response?.status).toBe(200);
    expect(response?.headers.get('X-Request-Id')).toMatch(/^req-/);
    const body = (await response?.json()) as { data: unknown[] };
    expect(body.data).toHaveLength(8);
  });
});
