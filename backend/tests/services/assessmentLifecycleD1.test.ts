import { describe, expect, it } from 'vitest';
import { handleAssessmentRoute } from '../../src/workerD1Assessment';
import { createWorkerDatabase } from '../helpers/workerCoreFixtures';

const seedAssessment = (fixture: ReturnType<typeof createWorkerDatabase>, options: Record<string, unknown> = {}): void => {
  const assessmentId = String(options.assessmentId || 'A-LIFECYCLE');
  const runId = options.activeRunId === null ? '' : String(options.activeRunId || 'RUN-LIFECYCLE');
  fixture.db.prepare(`INSERT INTO AssessmentRecord (
    assessment_id, customer_id, customer_name, industry, assessment_owner, status, is_test_data,
    assessment_period_start, assessment_period_end
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    assessmentId, 'C-LIFECYCLE', 'Lifecycle Client', 'Manufacturing', 'analyst@example.test',
    String(options.status || 'ANALYST_REVIEW'), Number(options.isTestData || 0), '2025-04-01', '2026-03-31'
  );
  if (!options.missingVersion) {
    fixture.db.prepare(`INSERT INTO AssessmentDataVersion (
      data_version_id, assessment_id, version_number, file_name, file_size, checksum, uploaded_by, record_count
    ) VALUES (?, ?, 1, ?, 16, ?, ?, 1)`).run(
      'DV-LIFECYCLE', assessmentId, 'source.csv', 'dataset-checksum', 'analyst@example.test'
    );
  }
  if (runId && !options.missingRun) {
    fixture.db.prepare(`INSERT INTO AssessmentAnalysisRun (
      analysis_run_id, assessment_id, data_version_id, status, total_spend_cr, validated_spend_cr,
      potential_savings_cr, savings_pct, all_gates_passed, is_approved, is_superseded
    ) VALUES (?, ?, ?, ?, 10, 10, 2, 20, ?, ?, ?)`)
      .run(runId, assessmentId, 'DV-LIFECYCLE', String(options.runStatus || 'COMPLETED'),
        Number(options.gatesPassed ?? 1), Number(options.runApproved || 0), Number(options.runSuperseded || 0));
  }
  const snapshot = {
    assessmentId,
    status: String(options.status || 'ANALYST_REVIEW'),
    ...(runId ? { activeAnalysisRunId: runId } : {})
  };
  fixture.db.prepare(`INSERT INTO AssessmentStoreEntry (
    entry_type, assessment_id, entry_id, payload_json, source_checksum
  ) VALUES ('assessment', ?, ?, ?, 'fixture')`).run(assessmentId, assessmentId, JSON.stringify(snapshot));
};

const invoke = async (
  fixture: ReturnType<typeof createWorkerDatabase>,
  action: string,
  options: { method?: string; body?: unknown; headers?: Record<string, string>; assessmentId?: string } = {}
) => {
  const assessmentId = options.assessmentId || 'A-LIFECYCLE';
  const path = `/${assessmentId}/${action}`;
  const headers = { ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }), ...options.headers };
  const request = new Request(`https://consulting.edge/api/assessment${path}`, {
    method: options.method || 'POST',
    headers,
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) })
  });
  return handleAssessmentRoute(fixture.d1, path, request, new URL(request.url));
};

const expectStatus = async (
  action: string,
  expected: number,
  seedOptions: Record<string, unknown> = {},
  requestOptions: Parameters<typeof invoke>[2] = {}
): Promise<void> => {
  const fixture = createWorkerDatabase();
  seedAssessment(fixture, seedOptions);
  try {
    const result = await invoke(fixture, action, requestOptions);
    expect(result.status).toBe(expected);
    expect((result.data as { success?: boolean }).success).toBe(false);
  } finally {
    fixture.close();
  }
};

describe('D1 assessment lifecycle actions', () => {
  it('approves a passed analysis, persists a D1 package manifest, delivers, accepts, and closes', async () => {
    const fixture = createWorkerDatabase();
    seedAssessment(fixture);
    try {
      const approval = await invoke(fixture, 'approve', { body: { approvalComment: 'Reviewed and approved' } });
      expect(approval.data).toMatchObject({ status: 'APPROVED', approvedBy: 'analyst@procucev.com' });
      expect(fixture.db.prepare('SELECT is_approved FROM AssessmentAnalysisRun WHERE analysis_run_id = ?')
        .get('RUN-LIFECYCLE').is_approved).toBe(1);

      const packaged = await invoke(fixture, 'delivery-package', { body: {} });
      expect((packaged.data as any).items).toHaveLength(10);
      expect((packaged.data as any).checksums.vgtDataset).toBe('dataset-checksum');
      const packagedAgain = await invoke(fixture, 'delivery-package', { method: 'GET' });
      expect((packagedAgain.data as any).assessmentPeriod).toBe('2025-04-01 – 2026-03-31');
      expect(fixture.db.prepare("SELECT COUNT(*) AS count FROM AssessmentStoreEntry WHERE entry_type = 'delivery_package'")
        .get().count).toBe(1);

      const delivered = await invoke(fixture, 'deliver', {
        body: { recipientEmail: 'buyer@example.test', deliveryChannel: 'PORTAL', notes: 'Secure release' },
        headers: { 'x-user-email': 'admin@example.test', 'x-user-role': 'INTERNAL_ADMIN' }
      });
      expect(delivered.data).toMatchObject({
        status: 'DELIVERED', deliveredBy: 'admin@example.test', deliveredToEmail: 'buyer@example.test',
        deliveryChannel: 'PORTAL'
      });

      const accepted = await invoke(fixture, 'accept', { body: { acceptanceComment: 'Reviewed', acceptedBy: 'buyer@example.test' } });
      expect(accepted.data).toMatchObject({
        status: 'ACCEPTED', isReportAccepted: true, allModulesCompleted: true
      });
      const closed = await invoke(fixture, 'close', { body: {} });
      expect((closed.data as any).status).toBe('CLOSED');
      expect(fixture.db.prepare('SELECT COUNT(*) AS count FROM AssessmentAuditLog WHERE assessment_id = ?')
        .get('A-LIFECYCLE').count).toBe(6);
    } finally {
      fixture.close();
    }
  });

  it('supports the legacy delivery request body and uses action-specific default actor identities', async () => {
    const fixture = createWorkerDatabase();
    seedAssessment(fixture, { status: 'APPROVED', runApproved: 1 });
    try {
      const delivered = await invoke(fixture, 'deliver', { body: { deliveredToEmail: 'buyer@example.test', deliveryNotes: 'Email release' } });
      expect(delivered.data).toMatchObject({
        deliveredBy: 'admin@procucev.com', deliveredToEmail: 'buyer@example.test', deliveryChannel: 'EMAIL'
      });
      const accepted = await invoke(fixture, 'accept', { body: {} });
      expect((accepted.data as any).acceptedBy).toBe('customer@procucev.com');
    } finally {
      fixture.close();
    }
  });

  it('rejects invalid and unauthorized approvals and enforces active run gates and data-version scope', async () => {
    await expectStatus('approve', 400, {}, { body: { approvalComment: 'no' } });
    await expectStatus('approve', 403, {}, {
      body: { approvalComment: 'Reviewed and approved' },
      headers: { 'x-user-role': 'CUSTOMER' }
    });
    await expectStatus('approve', 400, { activeRunId: null }, { body: { approvalComment: 'Reviewed and approved' } });
    await expectStatus('approve', 404, { missingRun: true }, { body: { approvalComment: 'Reviewed and approved' } });
    await expectStatus('approve', 400, { runSuperseded: 1 }, { body: { approvalComment: 'Reviewed and approved' } });
    await expectStatus('approve', 400, { gatesPassed: 0 }, { body: { approvalComment: 'Reviewed and approved' } });
    await expectStatus('approve', 400, {}, {
      body: { approvalComment: 'Reviewed and approved', dataVersionId: 'DV-OTHER' }
    });
    const fixture = createWorkerDatabase();
    seedAssessment(fixture);
    try {
      const approved = await invoke(fixture, 'approve', {
        body: { approvalComment: 'Reviewed and approved', dataVersionId: 'DV-LIFECYCLE' },
        headers: { 'x-user-role': 'ANALYST', 'x-user-email': 'reviewer@example.test' }
      });
      expect((approved.data as any).approvedBy).toBe('reviewer@example.test');
    } finally {
      fixture.close();
    }
  });

  it('rejects package generation unless actor, assessment, active run, approval, and source version are valid', async () => {
    await expectStatus('delivery-package', 403, { status: 'APPROVED', runApproved: 1 }, {
      body: {}, headers: { 'x-user-role': 'CUSTOMER' }
    });
    await expectStatus('delivery-package', 400, { status: 'ANALYST_REVIEW', runApproved: 1 }, { body: {} });
    await expectStatus('delivery-package', 400, { status: 'APPROVED', activeRunId: null }, { body: {} });
    await expectStatus('delivery-package', 404, { status: 'APPROVED', missingRun: true }, { body: {} });
    await expectStatus('delivery-package', 400, { status: 'APPROVED', runApproved: 0 }, { body: {} });
    await expectStatus('delivery-package', 400, { status: 'APPROVED', runApproved: 1, runSuperseded: 1 }, { body: {} });
    await expectStatus('delivery-package', 404, { status: 'APPROVED', runApproved: 1, missingVersion: true }, { body: {} });
  });

  it('validates delivery recipients and prevents delivery before approval or without test-data acknowledgement', async () => {
    await expectStatus('deliver', 400, { status: 'APPROVED' }, { body: {} });
    await expectStatus('deliver', 404, {}, { body: { recipientEmail: 'buyer@example.test' }, assessmentId: 'UNKNOWN' });
    await expectStatus('deliver', 400, { status: 'APPROVED', isTestData: 1 }, {
      body: { recipientEmail: 'buyer@example.test' }
    });
    await expectStatus('deliver', 400, { status: 'ANALYST_REVIEW' }, {
      body: { recipientEmail: 'buyer@example.test' }
    });
    const fixture = createWorkerDatabase();
    seedAssessment(fixture, { status: 'APPROVED', isTestData: 1 });
    try {
      const delivered = await invoke(fixture, 'deliver', {
        body: { recipientEmail: 'buyer@example.test', isTestDelivery: true }
      });
      expect((delivered.data as any).status).toBe('DELIVERED');
    } finally {
      fixture.close();
    }
  });

  it('requires an approved or delivered assessment with a completed active run for acceptance', async () => {
    await expectStatus('accept', 400, {}, { body: { acceptedBy: 'not-an-email' } });
    await expectStatus('accept', 404, {}, { body: {}, assessmentId: 'UNKNOWN' });
    await expectStatus('accept', 400, { status: 'ANALYST_REVIEW' }, { body: {} });
    await expectStatus('accept', 400, { status: 'APPROVED', activeRunId: null }, { body: {} });
    await expectStatus('accept', 404, { status: 'APPROVED', missingRun: true }, { body: {} });
    await expectStatus('accept', 400, { status: 'DELIVERED', runStatus: 'FAILED' }, { body: {} });
  });

  it('returns not found when closing an unknown assessment', async () => {
    await expectStatus('close', 404, {}, { body: {}, assessmentId: 'UNKNOWN' });
  });
});
